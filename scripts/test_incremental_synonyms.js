const fs = require('fs');
const plants = JSON.parse(fs.readFileSync('d:/DzHerba/data/plants.json', 'utf8'));
const { MULTILINGUAL_SYNONYMS, normalizeSearchText } = require('d:/DzHerba/server/multilingualSearch');

function expandSearchQueryIncremental(query) {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return [];

  const rawTokens = normQuery.split(/\s+/).filter(Boolean);
  const targets = new Set();
  targets.add(normQuery);

  const tokens = [];
  rawTokens.forEach(t => {
    const cleanT = t.replace(/[؟?!\.,;:،«»"'\(\)\[\]\{\}]/g, '').trim();
    if (cleanT) {
      tokens.push(cleanT);
      targets.add(cleanT);

      // Préfixes arabes
      if (cleanT.startsWith('وال') && cleanT.length >= 5) {
        tokens.push(cleanT.slice(3), cleanT.slice(1));
        targets.add(cleanT.slice(3));
        targets.add(cleanT.slice(1));
      } else if (cleanT.startsWith('ال') && cleanT.length >= 4) {
        tokens.push(cleanT.slice(2));
        targets.add(cleanT.slice(2));
      } else if (cleanT.startsWith('و') && cleanT.length >= 4) {
        tokens.push(cleanT.slice(1));
        targets.add(cleanT.slice(1));
      }
    }
  });

  // SYNONYM EXPANSION WITH PREFIX MATCHING FOR INCREMENTAL SEARCH!
  for (const [key, synonyms] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const normKey = normalizeSearchText(key);
    // Exact match OR prefix match (if query has >= 2 chars)
    const isPrefix = normQuery.length >= 2 && normKey.startsWith(normQuery);
    const hasTokenPrefix = tokens.some(tok => tok.length >= 2 && (normKey.startsWith(tok) || tok.startsWith(normKey)));

    if (normQuery === normKey || isPrefix || hasTokenPrefix || normKey.includes(normQuery)) {
      targets.add(normKey);
      synonyms.forEach(s => targets.add(normalizeSearchText(s)));
    }
  }

  return Array.from(targets).filter(Boolean);
}

function matchPlantIncremental(plant, query) {
  if (!query || !query.trim()) return true;
  const expanded = expandSearchQueryIncremental(query);
  if (expanded.length === 0) return true;

  const scName = normalizeSearchText(plant.scientific_name);
  const vernRaw = normalizeSearchText(plant.vernacular_raw);
  const vernList = Array.isArray(plant.vernacular_names) ? normalizeSearchText(plant.vernacular_names.join(' ')) : '';
  const family = normalizeSearchText(plant.taxonomy?.family);
  const genus = normalizeSearchText(plant.taxonomy?.genus);
  const species = normalizeSearchText(plant.taxonomy?.species);

  const nameBlob = `${scName} ${vernRaw} ${vernList} ${family} ${genus} ${species}`;

  for (const term of expanded) {
    if (term.length < 2) continue;
    if (nameBlob.includes(term)) {
      return true;
    }
  }

  // Also check uses / pharmacology for symptom search (e.g. "diabète", "toux", "سعال")
  const normQ = normalizeSearchText(query);
  if (normQ.length >= 3) {
    const uses = normalizeSearchText(plant.traditional_medicine?.uses);
    const act = normalizeSearchText(plant.pharmacology?.activities);
    if ((uses + ' ' + act).includes(normQ)) {
      return true;
    }
  }

  return false;
}

const testTerms = [
  'ch', 'chi', 'chih', 'armoise', 'wormwood',
  'sau', 'sauge', 'sag', 'sage', 'salvia',
  'bor', 'borage', 'bourrache', 'borago',
  'thy', 'thym', 'thyme', 'thymus',
  'men', 'menthe', 'mint', 'mentha',
  'ail', 'garlic', 'thoum',
  'زع', 'زعت', 'زعتر', 'الزعتر',
  'شي', 'شيح', 'الشيح',
  'حر', 'حرم', 'حرمل', 'الحرمل',
  'ضر', 'ضرو', 'الضرو'
];

for (const t of testTerms) {
  const matches = plants.filter(p => matchPlantIncremental(p, t));
  console.log(`Query: "${t.padEnd(10)}" -> ${matches.length} matches | Example: ${matches[0]?.scientific_name || 'NONE'}`);
}
