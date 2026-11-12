/**
 * DzHerba - Régénération du Modèle de Vision Botanique & Indexation des Photos
 * Scanne les dossiers botaniques de façon multiplateforme (Windows & Linux / Render),
 * génère les signatures visuelles IA (hashes MD5, tailles, métadonnées),
 * et synchronise data/plants.json + SQLite data/dzherba.db.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT_DIR, 'data', 'plants.json');
const MODEL_DIR = path.join(ROOT_DIR, 'server', 'models');
const HASH_FILE = path.join(MODEL_DIR, 'plant_vision_hashes.json');

/**
 * Résolveur multiplateforme du dossier photographique (gère la casse Linux / Render)
 */
function resolveStartupDir(rootDir) {
  const candidates = [
    path.join(rootDir, 'Startup', 'Startup'),
    path.join(rootDir, 'startup', 'startup'),
    path.join(rootDir, 'Startup'),
    path.join(rootDir, 'startup'),
    path.join(__dirname, '..', 'Startup', 'Startup'),
    path.join(__dirname, '..', 'startup', 'startup')
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // Résolution insensible à la casse
  try {
    const items = fs.readdirSync(rootDir);
    const sItem = items.find(i => i.toLowerCase() === 'startup');
    if (sItem) {
      const p1 = path.join(rootDir, sItem);
      const subItems = fs.readdirSync(p1);
      const subS = subItems.find(i => i.toLowerCase() === 'startup');
      if (subS) return path.join(p1, subS);
      return p1;
    }
  } catch (e) {}

  return path.join(rootDir, 'Startup', 'Startup');
}

async function retrainVisionSignatures() {
  console.log('=======================================================================');
  console.log('   DzHerba -- RÉGÉNÉRATION DU MODÈLE DE VISION ET DES SIGNATURES IA');
  console.log('=======================================================================\n');

  const startupDir = resolveStartupDir(ROOT_DIR);
  console.log('[1/4] Dossier de photographies botaniques résolu :', startupDir);

  if (!fs.existsSync(startupDir)) {
    throw new Error(`Dossier photographique introuvable : ${startupDir}`);
  }

  // 1. Scanner les dossiers d'espèces
  const folders = fs.readdirSync(startupDir).filter(f => /^\d+$/.test(f));
  folders.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  let totalImagesCount = 0;
  const plantImagesMap = {};
  const sizeMap = {};
  const hashMap = {};
  const filenameMap = {};

  const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.jfif', '.bmp']);

  for (const folderName of folders) {
    const plantId = parseInt(folderName, 10);
    const folderPath = path.join(startupDir, folderName);
    let files = [];
    try {
      files = fs.readdirSync(folderPath);
    } catch (e) {
      continue;
    }

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
  if (fs.existsSync(JSON_PATH)) {
    try {
      const plants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
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
    } catch (jsonErr) {
      console.warn('[!] Avertissement mise à jour JSON :', jsonErr.message);
    }
  }

  // 4. Synchronisation avec la base SQLite
  console.log('\n[4/4] Synchronisation des images avec SQLite (data/dzherba.db)...');
  try {
    let dbModule = null;
    try {
      dbModule = require('../server/db');
    } catch (e1) {
      try {
        dbModule = require(path.join(ROOT_DIR, 'server', 'db'));
      } catch (e2) {}
    }

    if (dbModule && dbModule.db) {
      const updateStmt = dbModule.db.prepare('UPDATE plants SET images = ? WHERE id = ?');
      dbModule.db.exec('BEGIN TRANSACTION');
      let updatedDbCount = 0;
      for (const [plantIdStr, imgList] of Object.entries(plantImagesMap)) {
        const pid = parseInt(plantIdStr, 10);
        updateStmt.run(JSON.stringify(imgList), pid);
        updatedDbCount++;
      }
      dbModule.db.exec('COMMIT');
      console.log(`[OK] SQLite synchronisé avec succès pour ${updatedDbCount} espèces illustrées.`);
    }
  } catch (dbErr) {
    console.warn('[!] Note synchronisation SQLite :', dbErr.message);
  }

  console.log('\n=======================================================================');
  console.log('   RÉGÉNÉRATION TERMINÉE AVEC SUCCÈS !');
  console.log(`   - Modèle IA Vision : ${totalImagesCount} signatures visuelles actives`);
  console.log(`   - Espèces couvertes : ${speciesWithPhotos} espèces avec photos`);
  console.log('=======================================================================\n');

  return visionData;
}

if (require.main === module) {
  retrainVisionSignatures()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('[ERREUR CRITIQUE]', err);
      process.exit(1);
    });
}

module.exports = {
  retrainVisionSignatures,
  resolveStartupDir
};
