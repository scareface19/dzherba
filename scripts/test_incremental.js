const fs = require('fs');
const plants = JSON.parse(fs.readFileSync('d:/DzHerba/data/plants.json', 'utf8'));

// Test incremental search for various prefixes in FR, AR, EN, Latin
const queries = ['th', 'thy', 'thym', 'ch', 'chi', 'chih', 'زع', 'زعت', 'زعتر', 'شي', 'شيح', 'bo', 'bor', 'borage', 'sa', 'sag', 'sage', 'sau', 'sauge'];

function normalizeSearchText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/['’`\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const q of queries) {
  const normQ = normalizeSearchText(q);
  const matches = plants.filter(p => {
    const sc = normalizeSearchText(p.scientific_name);
    const vern = normalizeSearchText(p.vernacular_raw);
    const fam = normalizeSearchText(p.taxonomy?.family);
    return sc.includes(normQ) || vern.includes(normQ) || fam.includes(normQ);
  });
  console.log(`Query: "${q}" (${normQ}) -> ${matches.length} matches (first: ${matches[0]?.scientific_name})`);
}
