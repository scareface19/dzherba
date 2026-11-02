/**
 * DzHerba Database Module
 * Uses native SQLite (Node 22+ node:sqlite) for 100% offline, cloud-portable zero-config persistence.
 * Compatible with the mysql2 `const [rows] = await db.query(sql, params)` interface.
 */

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'dzherba.db');
console.log(`[DzHerba SQLite] Database file: ${dbPath}`);

const db = new DatabaseSync(dbPath);

// Enable WAL mode & foreign keys for optimal performance and safety
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {}

/**
 * Initialize all tables for the DzHerba platform
 */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'free',
      organization TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plants (
      id INTEGER PRIMARY KEY,
      scientific_name TEXT NOT NULL,
      family TEXT,
      order_name TEXT,
      genus TEXT,
      species TEXT,
      vernacular_raw TEXT,
      vernacular_names TEXT,
      habitat_description TEXT,
      flowering_harvesting TEXT,
      regions TEXT,
      parts_used TEXT,
      dosage TEXT,
      uses TEXT,
      phytochemical_profile TEXT,
      activities TEXT,
      experimental_data TEXT,
      clinical_data TEXT,
      toxicity TEXT,
      contraindications TEXT,
      drug_interactions TEXT,
      plant_interactions TEXT,
      references_text TEXT,
      images TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      user_email TEXT,
      organization TEXT,
      plan TEXT,
      status TEXT DEFAULT 'active',
      amount_dzd INTEGER NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      query_text TEXT,
      plant_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      plant_id INTEGER NOT NULL,
      personal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, plant_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS field_observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      plant_name TEXT NOT NULL,
      wilaya TEXT NOT NULL,
      locality TEXT,
      observation_date TEXT,
      photo_url TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default users if empty
  try {
    const userCount = db.prepare('SELECT COUNT(*) AS cnt FROM users').get();
    if (userCount.cnt === 0) {
      const demoUsers = [
        ['USR-ADMIN', 'Dr. Reda Mansouri (Admin Master)', 'admin@dzherba.dz', 'admin123', 'admin', 'Direction Technique & Scientifique DzHerba'],
        ['USR-RES-01', 'Pr. Amina Benali', 'chercheur@univ-alger.dz', 'chercheur123', 'researcher', 'Faculté de Pharmacie - Université Alger 1'],
        ['USR-UNIV-02', 'Département de Biologie & Pharmacie', 'campus@univ-setif.dz', 'campus123', 'institution', 'Université Ferhat Abbas Sétif 1'],
        ['USR-STU-04', 'Yacine Amrani (Étudiant Biologie)', 'etudiant@univ-alger.dz', 'etudiant123', 'student', 'Faculté des Sciences Biologiques - USTHB'],
        ['USR-CIT-03', 'Sofiane Cherif', 'citoyen@dzherba.dz', 'citoyen123', 'free', 'Grand Public & Herboristerie']
      ];
      const stmt = db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role, organization) VALUES (?, ?, ?, ?, ?, ?)');
      for (const u of demoUsers) {
        stmt.run(...u);
      }
      console.log('✅ [DzHerba SQLite] Default demo users seeded.');
    }
  } catch (err) {
    console.warn('[DzHerba SQLite] Seed users error:', err.message);
  }

  // Populate medicinal plants from JSON if needed
  try {
    const plantCount = db.prepare('SELECT COUNT(*) AS total FROM plants').get();
    if (plantCount.total < 773) {
      const candidates = [
        path.join(__dirname, '..', 'data', 'plants.json'),
        path.join(__dirname, 'data', 'plants.json'),
        path.join(process.cwd(), 'data', 'plants.json')
      ];
      const jsonPath = candidates.find(p => fs.existsSync(p));
      if (jsonPath) {
        console.log(`[DzHerba SQLite] Seeding ${plantCount.total < 1 ? 'all 773' : 'missing'} medicinal plants...`);
        const plants = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const insertStmt = db.prepare(`
          INSERT OR REPLACE INTO plants (
            id, scientific_name, family, order_name, genus, species,
            vernacular_raw, vernacular_names, habitat_description, flowering_harvesting,
            regions, parts_used, dosage, uses, phytochemical_profile, activities,
            experimental_data, clinical_data, toxicity, contraindications,
            drug_interactions, plant_interactions, references_text, images
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.exec('BEGIN TRANSACTION');
        for (const p of plants) {
          // Normalize image paths to relative
          const sanitizedImages = (p.images || []).map(img => 
            typeof img === 'string' ? img.replace(/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i, '') : img
          );

          insertStmt.run(
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
            JSON.stringify(sanitizedImages)
          );
        }
        db.exec('COMMIT');
        console.log(`✅ [DzHerba SQLite] Successfully indexed all 773 medicinal plants.`);
      }
    } else {
      console.log(`✅ [DzHerba SQLite] Verified plants database: ${plantCount.total} species ready.`);
    }
  } catch (err) {
    console.warn('[DzHerba SQLite] Seed plants error:', err.message);
  }
}

initSchema();

/**
 * Universal query method mimicking mysql2 `const [rows] = await db.query(sql, params)`
 */
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      let cleanSql = sql.trim();

      // Transform MySQL-specific syntax to standard SQLite
      if (/^insert\s+ignore/i.test(cleanSql)) {
        cleanSql = cleanSql.replace(/^insert\s+ignore/i, 'INSERT OR IGNORE');
      }

      // Flatten params if passed as single array wrap: [[val1, val2]]
      let flatParams = params;
      if (Array.isArray(params) && params.length === 1 && Array.isArray(params[0])) {
        flatParams = params[0];
      }

      const isSelectOrPragma = /^(SELECT|PRAGMA)/i.test(cleanSql);

      const stmt = db.prepare(cleanSql);

      if (isSelectOrPragma) {
        const rows = flatParams && flatParams.length > 0 ? stmt.all(...flatParams) : stmt.all();
        // Return in mysql2 format [rows, fields]
        resolve([rows, []]);
      } else {
        const result = flatParams && flatParams.length > 0 ? stmt.run(...flatParams) : stmt.run();
        const mysqlCompatibleResult = {
          insertId: Number(result.lastInsertRowid || 0),
          affectedRows: result.changes || 0,
          changedRows: result.changes || 0
        };
        resolve([mysqlCompatibleResult, []]);
      }
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  db,
  query
};
