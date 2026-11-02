/**
 * DzHerba - Synchroniser data/plants.json vers MySQL dzherba_db
 */
const path = require('path');
const fs = require('fs');

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = require(path.resolve(__dirname, '..', '..', 'server', 'node_modules', 'mysql2', 'promise'));
}

const JSON_PATH = path.resolve(__dirname, '..', '..', 'data', 'plants.json');

async function sync() {
  console.log('[*] Synchronisation de data/plants.json vers MySQL dzherba_db...');
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error('[!] Fichier introuvable:', JSON_PATH);
    process.exit(1);
  }
  
  const plants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`[+] ${plants.length} plantes lues depuis le fichier JSON.`);

  const pool = mysql.createPool({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'dzherba_db',
    charset: 'utf8mb4'
  });

  const sql = `
    REPLACE INTO plants (
      id, scientific_name, family, order_name, genus, species,
      vernacular_raw, vernacular_names, habitat_description, flowering_harvesting,
      regions, parts_used, dosage, uses, phytochemical_profile,
      activities, experimental_data, clinical_data, toxicity,
      contraindications, drug_interactions, plant_interactions, references_text,
      images
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

  const [result] = await pool.query(sql, [values]);
  console.log(`[OK] MySQL synchronisé avec succès ! Lignes affectées : ${result.affectedRows}`);
  
  const [[cnt]] = await pool.query('SELECT COUNT(*) as total FROM plants');
  console.log(`[+] Total d'espèces vérifiées en base MySQL : ${cnt.total}`);
  
  await pool.end();
}

sync().catch(err => {
  console.error('[ERREUR]', err.message);
  process.exit(1);
});
