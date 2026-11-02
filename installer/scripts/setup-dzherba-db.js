/**
 * DzHerba - Script d'initialisation automatique de la base MySQL locale
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = require(path.join(ROOT_DIR, 'server', 'node_modules', 'mysql2', 'promise'));
}

async function testConnection(config) {
  try {
    const conn = await mysql.createConnection(config);
    await conn.ping();
    return conn;
  } catch (err) {
    return null;
  }
}

async function main() {
  console.log('=======================================================================');
  console.log('   DzHerba -- INITIALISATION DE LA BASE DE DONNEES MYSQL (dzherba_db)');
  console.log('=======================================================================\n');

  // Try standard local root passwords with retry
  const rootPasswords = ['', 'root', '123456', 'admin', 'mysql'];
  let rootConn = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const pwd of rootPasswords) {
      rootConn = await testConnection({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: pwd,
        multipleStatements: true
      });
      if (rootConn) break;
    }
    if (rootConn) break;
    await new Promise(r => setTimeout(r, 1000));
  }

  // If still not connected, start the embedded portable MySQL if present
  if (!rootConn) {
    const embeddedMysqld = path.join(ROOT_DIR, 'mysql', 'bin', 'mysqld.exe');
    const myIni = path.join(ROOT_DIR, 'mysql', 'my.ini');
    if (fs.existsSync(embeddedMysqld)) {
      console.log('[...] Démarrage automatique du serveur MySQL embarqué...');
      const { spawn } = require('child_process');
      const child = spawn(embeddedMysqld, [`--defaults-file=${myIni}`, '--standalone'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      // Wait up to 15s for port 3306 to become ready
      for (let attempt = 1; attempt <= 10; attempt++) {
        await new Promise(r => setTimeout(r, 1500));
        rootConn = await testConnection({
          host: '127.0.0.1',
          port: 3306,
          user: 'root',
          password: '',
          multipleStatements: true
        });
        if (rootConn) {
          console.log('[OK] Serveur MySQL embarqué démarré et prêt sur le port 3306 !');
          break;
        }
      }
    }
  }

  if (!rootConn) {
    console.log('[INFO] Aucun serveur MySQL actif détecté.');
    console.log('L\'application DzHerba basculera en mode hors-ligne transparent avec corpus local.');
    process.exit(0);
  }

  console.log('[OK] Connexion au serveur MySQL local réussie.');

  try {
    // 1. Create database
    await rootConn.query(`
      CREATE DATABASE IF NOT EXISTS dzherba_db 
      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    console.log('[OK] Base de données dzherba_db vérifiée / créée.');

    await rootConn.changeUser({ database: 'dzherba_db' });

    // 2. Create tables
    await rootConn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'researcher', 'institution', 'free') DEFAULT 'free',
        organization VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS plants (
        id INT PRIMARY KEY,
        scientific_name VARCHAR(255) NOT NULL,
        family VARCHAR(100),
        order_name VARCHAR(100),
        genus VARCHAR(100),
        species VARCHAR(100),
        vernacular_raw TEXT,
        vernacular_names JSON,
        habitat_description TEXT,
        flowering_harvesting TEXT,
        regions JSON,
        parts_used TEXT,
        dosage TEXT,
        uses TEXT,
        phytochemical_profile MEDIUMTEXT,
        activities MEDIUMTEXT,
        experimental_data MEDIUMTEXT,
        clinical_data MEDIUMTEXT,
        toxicity TEXT,
        contraindications TEXT,
        drug_interactions TEXT,
        plant_interactions TEXT,
        references_text TEXT,
        images JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FULLTEXT KEY ft_plant_search (scientific_name, vernacular_raw, family, uses)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        organization VARCHAR(255),
        plan VARCHAR(50),
        status ENUM('active', 'expired', 'pending', 'cancelled') DEFAULT 'active',
        amount_dzd INT NOT NULL,
        payment_method VARCHAR(50),
        transaction_ref VARCHAR(100),
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS user_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        type ENUM('search', 'view', 'scan', 'assistant') NOT NULL,
        title VARCHAR(255) NOT NULL,
        query_text TEXT,
        plant_id INT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_type (user_id, type),
        INDEX idx_created (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS field_observations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255),
        plant_name VARCHAR(255) NOT NULL,
        wilaya VARCHAR(100) NOT NULL,
        location_notes TEXT,
        medicinal_observation TEXT,
        status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_entity VARCHAR(100) NOT NULL,
        target_id VARCHAR(100),
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[OK] Schéma relationnel vérifié avec succès.');

    // 3. Populate or complete plants table if fewer than 773 species
    const [[countResult]] = await rootConn.query('SELECT COUNT(*) AS total FROM plants');
    if (countResult.total < 773) {
      const plantsJsonPath = path.join(ROOT_DIR, 'data', 'plants.json');
      if (fs.existsSync(plantsJsonPath)) {
        console.log(`[...] Importation du corpus complet des 773 plantes médicinales (actuel: ${countResult.total})...`);
        const raw = fs.readFileSync(plantsJsonPath, 'utf8');
        const plants = JSON.parse(raw);

        const sql = `
          REPLACE INTO plants (
            id, scientific_name, family, order_name, genus, species,
            vernacular_raw, vernacular_names, habitat_description, flowering_harvesting,
            regions, parts_used, dosage, uses, phytochemical_profile, activities,
            experimental_data, clinical_data, toxicity, contraindications,
            drug_interactions, plant_interactions, references_text, images
          ) VALUES ?
        `;

        const values = plants.map(p => [
          p.id,
          p.scientific_name || '',
          p.taxonomy?.family || '',
          p.taxonomy?.order || '',
          p.taxonomy?.genus || (p.scientific_name || '').split(' ')[0] || '',
          p.taxonomy?.species || (p.scientific_name || '').split(' ')[1] || '',
          p.vernacular_raw || '',
          JSON.stringify(p.vernacular_names || []),
          p.distribution?.habitat_description || '',
          p.distribution?.flowering_harvesting || '',
          JSON.stringify(p.distribution?.regions || []),
          p.traditional_medicine?.parts_used || '',
          p.traditional_medicine?.dosage || '',
          p.traditional_medicine?.uses || '',
          p.pharmacology?.phytochemical_profile || '',
          p.pharmacology?.activities || '',
          p.scientific_data?.experimental || '',
          p.scientific_data?.clinical || '',
          p.safety_profile?.toxicity || '',
          p.safety_profile?.contraindications || '',
          p.safety_profile?.drug_interactions || '',
          p.safety_profile?.plant_interactions || '',
          p.references || '',
          JSON.stringify(p.images || [])
        ]);

        await rootConn.query(sql, [values]);
        console.log(`[OK] ${values.length} espèces végétales insérées dans MySQL avec succès !`);
      }
    } else {
      console.log(`[OK] La table plants contient déjà ${countResult.total} espèces.`);
    }

    // Normaliser les URLs de photos dans la base de données
    try {
      await rootConn.query(`UPDATE plants SET images = REPLACE(images, 'http://127.0.0.1:5000', '') WHERE images LIKE '%http://127.0.0.1:5000%'`);
      await rootConn.query(`UPDATE plants SET images = REPLACE(images, 'http://localhost:5000', '') WHERE images LIKE '%http://localhost:5000%'`);
      console.log('[OK] Chemins des photographies normalisés en chemins relatifs.');
    } catch (e) {}

    await rootConn.end();
    console.log('\n[SUCCES] Base de données DzHerba prête et opérationnelle !');
  } catch (err) {
    console.error('[ERREUR]', err.message);
    if (rootConn) await rootConn.end();
  }
}

main();
