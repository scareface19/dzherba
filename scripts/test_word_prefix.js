const fs = require('fs');
const plants = JSON.parse(fs.readFileSync('d:/DzHerba/data/plants.json', 'utf8'));
const { MULTILINGUAL_SYNONYMS, normalizeSearchText } = require('d:/DzHerba/server/multilingualSearch');

function getTokensFromText(text) {
  if (!text) return [];
  return normalizeSearchText(text).split(/[\s,\.;:_\-\(\)\[\]\/\\«»"'\+]+/).filter(Boolean);
}

function wordStartsWithAny(words, term) {
  if (!words || words.length === 0 || !term) return false;
  return words.some(w => w.startsWith(term));
}

function matchPlantWordPrefix(plant, query) {
  if (!query || !query.trim()) return true;
  const normQ = normalizeSearchText(query.trim());
  if (!normQ) return true;

  // Extract all searchable plant words
  const plantWords = [
    ...getTokensFromText(plant.scientific_name),
    ...getTokensFromText(plant.vernacular_raw),
    ...(Array.isArray(plant.vernacular_names) ? plant.vernacular_names.flatMap(getTokensFromText) : []),
    ...getTokensFromText(plant.taxonomy?.family),
    ...getTokensFromText(plant.taxonomy?.genus),
    ...getTokensFromText(plant.taxonomy?.species)
  ];

  // 1. Direct word-prefix match on user query tokens
  const queryTokens = getTokensFromText(normQ);
  const directMatch = queryTokens.every(qToken => wordStartsWithAny(plantWords, qToken));
  if (directMatch) return true;

  // 2. Multilingual synonym prefix expansion
  // For each query token, check if any synonym key starts with this token (or token starts with key)
  const expandedSynonyms = new Set();
  for (const qToken of queryTokens) {
    if (qToken.length < 2) continue;
    // Strip Arabic prefixes (ال, وال, بال)
    const cleanTokens = [qToken];
    if (qToken.startsWith('وال') && qToken.length >= 5) cleanTokens.push(qToken.slice(3), qToken.slice(1));
    else if (qToken.startsWith('ال') && qToken.length >= 4) cleanTokens.push(qToken.slice(2));

    for (const cTok of cleanTokens) {
      for (const [key, synList] of Object.entries(MULTILINGUAL_SYNONYMS)) {
        const normKey = normalizeSearchText(key);
        if (normKey.startsWith(cTok) || cTok.startsWith(normKey)) {
          synList.forEach(s => getTokensFromText(s).forEach(st => expandedSynonyms.add(st)));
        }
      }
    }
  }

  // Check if any expanded synonym matches the plant words
  for (const syn of expandedSynonyms) {
    if (wordStartsWithAny(plantWords, syn)) return true;
  }

  // 3. Optional: match on uses / indications if query is longer (>= 3 chars)
  if (normQ.length >= 3) {
    const uses = normalizeSearchText(plant.traditional_medicine?.uses || '');
    const act = normalizeSearchText(plant.pharmacology?.activities || '');
    if (uses.includes(normQ) || act.includes(normQ)) return true;
  }

  return false;
}

const testTerms = [
  'th', 'thy', 'thym', 'thyme', 'thymus',
  'ch', 'chi', 'chih', 'armoise', 'wormwood',
  'sau', 'sauge', 'sag', 'sage', 'salvia',
  'bo', 'bor', 'borage', 'bourrache', 'borago',
  'men', 'menthe', 'mint', 'mentha',
  'ail', 'garlic', 'thoum',
  'زع', 'زعت', 'زعتر', 'الزعتر',
  'شي', 'شيح', 'الشيح',
  'حر', 'حرم', 'حرمل', 'الحرمل',
  'ضر', 'ضرو', 'الضرو',
  'diab', 'diabete', 'toux'
];

for (const t of testTerms) {
  const matches = plants.filter(p => matchPlantWordPrefix(p, t));
  const sample = matches.slice(0, 3).map(m => m.scientific_name).join(', ');
  console.log(`Query: "${t.padEnd(10)}" -> ${matches.length} matches | Samples: ${sample}`);
}
