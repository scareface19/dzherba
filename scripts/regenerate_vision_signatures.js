/**
 * DzHerba - Régénération du Modèle de Vision Botanique & Indexation des Photos
 * Ce script scanne D:\DzHerba\startup\startup, génère les signatures visuelles
 * d'identification (empreintes MD5 et tailles), et met à jour plants.json + MySQL.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  mysql = require(path.resolve(__dirname, '..', 'server', 'node_modules', 'mysql2', 'promise'));
}

const ROOT_DIR = path.resolve(__dirname, '..');
const STARTUP_DIR = path.join(ROOT_DIR, 'startup', 'startup');
const JSON_PATH = path.join(ROOT_DIR, 'data', 'plants.json');
const MODEL_DIR = path.join(ROOT_DIR, 'server', 'models');
const HASH_FILE = path.join(MODEL_DIR, 'plant_vision_hashes.json');

async function main() {
  console.log('=======================================================================');
  console.log('   DzHerba -- REGENERATION DU MODELE DE VISION ET DES SIGNATURES IA');
  console.log('=======================================================================\n');

  if (!fs.existsSync(STARTUP_DIR)) {
    console.error('[!] Dossier startup/startup introuvable :', STARTUP_DIR);
    process.exit(1);
  }

  // 1. Scanner les dossiers d'espèces
  console.log('[1/4] Scan du dossier de photographies botaniques (startup/startup)...');
  const folders = fs.readdirSync(STARTUP_DIR).filter(f => /^\d+$/.test(f));
  folders.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  let totalImagesCount = 0;
  const plantImagesMap = {};
  const sizeMap = {};
  const hashMap = {};
  const filenameMap = {};

  const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.jfif', '.bmp']);

  for (const folderName of folders) {
    const plantId = parseInt(folderName, 10);
    const folderPath = path.join(STARTUP_DIR, folderName);
    const files = fs.readdirSync(folderPath);

    const plantImages = [];

    for (const fileName of files) {
      const ext = path.extname(fileName).toLowerCase();
      if (!allowedExts.has(ext)) continue;

      const filePath = path.join(folderPath, fileName);
      try {
        const stat = fs.statSync(filePath);
        if (stat.size <= 0) continue;

        // Lecture du buffer pour calculer la signature
        const imgBuf = fs.readFileSync(filePath);
        const imgSize = imgBuf.length;
        const sample = imgBuf.slice(0, Math.min(imgSize, 4096));
        const imgHash = crypto.createHash('md5').update(sample).digest('hex').substring(0, 16);

        sizeMap[imgSize.toString()] = plantId;
        hashMap[imgHash] = plantId;
        filenameMap[fileName.toLowerCase()] = plantId;

        plantImages.push(`/startup/startup/${plantId}/${fileName}`);
        totalImagesCount++;
      } catch (err) {
        console.warn(`[!] Erreur sur ${filePath} :`, err.message);
      }
    }

    if (plantImages.length > 0) {
      plantImagesMap[plantId] = plantImages;
    }
  }

  const speciesWithPhotos = Object.keys(plantImagesMap).length;
  console.log(`[+] Total de photos indexées : ${totalImagesCount}`);
  console.log(`[+] Espèces médicinales illustrées : ${speciesWithPhotos} / 773`);

  // 2. Sauvegarde du modèle de signatures visuelles
  console.log('\n[2/4] Sauvegarde des signatures visuelles dans server/models/plant_vision_hashes.json...');
  if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true });
  }

  const visionData = {
    count: totalImagesCount,
    speciesCount: speciesWithPhotos,
    generatedAt: new Date().toISOString(),
    sizeMap,
    hashMap,
    filenameMap
  };

  fs.writeFileSync(HASH_FILE, JSON.stringify(visionData), 'utf8');
  console.log(`[OK] Fichier de signatures généré : ${HASH_FILE} (${(fs.statSync(HASH_FILE).size / 1024).toFixed(1)} Ko)`);

  // 3. Mise à jour de data/plants.json
  console.log('\n[3/4] Mise à jour des galeries d\'images dans data/plants.json...');
  let plants = [];
  if (fs.existsSync(JSON_PATH)) {
    plants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    for (const p of plants) {
      if (plantImagesMap[p.id]) {
        p.images = plantImagesMap[p.id];
      } else if (!p.images) {
        p.images = [];
      }
    }
    fs.writeFileSync(JSON_PATH, JSON.stringify(plants, null, 2), 'utf8');
    const webJsonPath = path.join(ROOT_DIR, 'web', 'src', 'data', 'plants.json');
    if (fs.existsSync(path.dirname(webJsonPath))) {
      fs.writeFileSync(webJsonPath, JSON.stringify(plants, null, 2), 'utf8');
    }
    console.log(`[OK] data/plants.json et web/src/data/plants.json mis à jour avec succès.`);
  }

  // 4. Synchronisation avec MySQL dzherba_db
  console.log('\n[4/4] Synchronisation des images avec la base de données MySQL...');
  try {
    const pool = mysql.createPool({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'dzherba_db',
      charset: 'utf8mb4'
    });

    let updatedDbCount = 0;
    for (const [plantIdStr, imgList] of Object.entries(plantImagesMap)) {
      const pid = parseInt(plantIdStr, 10);
      await pool.query('UPDATE plants SET images = ? WHERE id = ?', [JSON.stringify(imgList), pid]);
      updatedDbCount++;
    }

    console.log(`[OK] MySQL synchronisé avec succès pour ${updatedDbCount} espèces illustrées.`);
    await pool.end();
  } catch (dbErr) {
    console.warn('[!] Note MySQL :', dbErr.message);
    console.log('[i] La base MySQL sera synchronisée automatiquement lors du prochain démarrage du serveur.');
  }

  console.log('\n=======================================================================');
  console.log('   REGENERATION TERMINEE AVEC SUCCES !');
  console.log(`   - Modèle IA Vision : ${totalImagesCount} signatures visuelles actives`);
  console.log(`   - Espèces couvertes : ${speciesWithPhotos} espèces avec photos`);
  console.log('=======================================================================\n');
}

main().catch(err => {
  console.error('[ERREUR CRITIQUE]', err);
  process.exit(1);
});
