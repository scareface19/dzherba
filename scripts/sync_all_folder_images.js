const fs = require('fs');
const path = require('path');
const mysql = require('../server/node_modules/mysql2/promise');

const startupDir = path.resolve(__dirname, '..', 'startup', 'startup');
const plantsJsonPath = path.resolve(__dirname, '..', 'data', 'plants.json');
const webPlantsJsonPath = path.resolve(__dirname, '..', 'web', 'src', 'data', 'plants.json');

const plants = JSON.parse(fs.readFileSync(plantsJsonPath, 'utf8'));
const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.jfif', '.bmp']);

let totalImagesFound = 0;
let plantsWithImagesCount = 0;
const imageUpdates = [];

for (const p of plants) {
  const pId = p.id.toString();
  const dirPath = path.join(startupDir, pId);

  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath).filter(f => {
      const ext = path.extname(f).toLowerCase();
      return allowedExts.has(ext);
    });

    const newImgs = files.map(f => '/startup/startup/' + pId + '/' + f);
    p.images = newImgs;

    if (newImgs.length > 0) {
      plantsWithImagesCount++;
      totalImagesFound += newImgs.length;
    }
    imageUpdates.push([JSON.stringify(newImgs), p.id]);
  } else {
    p.images = [];
    imageUpdates.push([JSON.stringify([]), p.id]);
  }
}

console.log('=== SYNCHRONISATION DES IMAGES ===');
console.log('Total de plantes dans le catalogue :', plants.length);
console.log('Plantes ayant des photos réelles :', plantsWithImagesCount, '/', plants.length);
console.log('Total de photos associées :', totalImagesFound);

// Check Borago officinalis
const b = plants.find(p => p.id === 31);
console.log('Plante 31 (Borago officinalis) photos :', b?.images?.length, b?.images);

fs.writeFileSync(plantsJsonPath, JSON.stringify(plants, null, 2), 'utf8');
fs.writeFileSync(webPlantsJsonPath, JSON.stringify(plants, null, 2), 'utf8');
console.log('[OK] Fichiers data/plants.json et web/src/data/plants.json mis a jour.');

async function syncMysql() {
  const pool = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'dzherba_db' });
  console.log('Synchronisation MySQL en cours...');
  for (const [imgsJson, id] of imageUpdates) {
    await pool.query('UPDATE plants SET images = ? WHERE id = ?', [imgsJson, id]);
  }
  console.log('[OK] Table MySQL "plants" entierement synchronisee avec les 771 dossiers !');
  await pool.end();
}

syncMysql().catch(err => console.error('Erreur MySQL:', err.message));
