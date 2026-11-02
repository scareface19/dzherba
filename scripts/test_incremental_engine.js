const fs = require('fs');
const plants = JSON.parse(fs.readFileSync('d:/DzHerba/data/plants.json', 'utf8'));

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

function getTokens(text) {
  if (!text) return [];
  return normalizeSearchText(text).split(/[\s,\.;:_\-\(\)\[\]\/\\«»"'\+]+/).filter(Boolean);
}

const MULTILINGUAL_SYNONYMS = {
  // French / Arabic / English / Latin
  'armoise': ['artemisia', 'شيح', 'wormwood', 'absinthe', 'chih'],
  'chih': ['artemisia', 'شيح', 'armoise'],
  'chikh': ['artemisia', 'شيح', 'armoise'],
  'wormwood': ['artemisia', 'شيح', 'armoise'],
  'شيح': ['artemisia', 'armoise', 'wormwood', 'chih'],

  'ail': ['allium sativum', 'ثوم', 'garlic', 'toum', 'thoum'],
  'garlic': ['allium sativum', 'ثوم', 'ail', 'toum'],
  'ثوم': ['allium sativum', 'ail', 'garlic'],
  'toum': ['allium sativum', 'ثوم', 'ail', 'garlic'],
  'thoum': ['allium sativum', 'ثوم', 'ail', 'garlic'],

  'bourrache': ['borago', 'borago officinalis', 'لسان الثور', 'حمحم', 'borage'],
  'borage': ['borago', 'borago officinalis', 'لسان الثور', 'bourrache'],
  'لسان الثور': ['borago', 'bourrache', 'borage'],
  'حمحم': ['borago', 'bourrache'],

  'sauge': ['salvia', 'مريمية', 'سالمة', 'sage'],
  'sage': ['salvia', 'مريمية', 'سالمة', 'sauge'],
  'مريمية': ['salvia', 'sauge', 'sage'],
  'سالمة': ['salvia', 'sauge', 'sage'],

  'thym': ['thymus', 'زعتر', 'حليحال', 'thyme', 'zaatar'],
  'thyme': ['thymus', 'زعتر', 'thym', 'zaatar'],
  'زعتر': ['thymus', 'origanum', 'thym', 'thyme'],
  'zaatar': ['thymus', 'origanum', 'زعتر', 'thym'],

  'menthe': ['mentha', 'نعناع', 'فليو', 'mint', 'peppermint'],
  'mint': ['mentha', 'نعناع', 'menthe'],
  'نعناع': ['mentha', 'menthe', 'mint'],
  'فليو': ['mentha pulegium', 'menthe', 'pennyroyal'],

  'romarin': ['rosmarinus officinalis', 'اكليل الجبل', 'يزير', 'rosemary'],
  'rosemary': ['rosmarinus officinalis', 'اكليل الجبل', 'romarin'],
  'اكليل الجبل': ['rosmarinus', 'romarin', 'rosemary'],
  'يزير': ['rosmarinus', 'romarin'],

  'lavande': ['lavandula', 'خزامى', 'حلحال', 'lavender'],
  'lavender': ['lavandula', 'خزامى', 'lavande'],
  'خزامى': ['lavandula', 'lavande', 'lavender'],

  'camomille': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'chamomile', 'قرطوفة'],
  'chamomile': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'camomille'],
  'بابونج': ['chamomilla', 'matricaria', 'camomille', 'chamomile'],

  'harmel': ['peganum harmala', 'حرمل', 'syrian rue'],
  'حرمل': ['peganum harmala', 'harmel'],

  'lentisque': ['pistacia lentiscus', 'ضرو', 'mastic tree'],
  'ضرو': ['pistacia lentiscus', 'lentisque'],

  'fenouil': ['foeniculum vulgare', 'بسباس', 'fennel'],
  'fennel': ['foeniculum vulgare', 'بسباس', 'fenouil'],
  'بسباس': ['foeniculum', 'fenouil', 'fennel'],

  'fenugrec': ['trigonella foenum graecum', 'حلبة', 'fenugreek'],
  'fenugreek': ['trigonella', 'حلبة', 'fenugrec'],
  'حلبة': ['trigonella', 'fenugrec', 'fenugreek'],

  'nigelle': ['nigella sativa', 'سانوج', 'حبة البركة', 'black cumin', 'black seed'],
  'سانوج': ['nigella sativa', 'nigelle', 'black seed'],
  'حبة البركة': ['nigella sativa', 'nigelle', 'black seed'],

  'olivier': ['olea europaea', 'زيتون', 'olive'],
  'olive': ['olea', 'زيتون', 'olivier'],
  'زيتون': ['olea', 'olivier', 'olive'],

  'caroubier': ['ceratonia siliqua', 'خروب', 'carob'],
  'carob': ['ceratonia siliqua', 'خروب', 'caroubier'],
  'خروب': ['ceratonia siliqua', 'caroubier', 'carob']
};

function matchPlant(plant, query) {
  if (!query || !query.trim()) return true;
  const normQuery = normalizeSearchText(query.trim());
  if (!normQuery) return true;

  const queryTokens = getTokens(normQuery);
  if (queryTokens.length === 0) return true;

  // 1. Plant name & taxonomy tokens
  const scName = normalizeSearchText(plant.scientific_name);
  const vernRaw = normalizeSearchText(plant.vernacular_raw);
  const vernList = Array.isArray(plant.vernacular_names) ? plant.vernacular_names.map(normalizeSearchText).join(' ') : '';
  const family = normalizeSearchText(plant.taxonomy?.family);
  const genus = normalizeSearchText(plant.taxonomy?.genus);
  const species = normalizeSearchText(plant.taxonomy?.species);

  const nameBlob = `${scName} ${vernRaw} ${vernList} ${family} ${genus} ${species}`;
  const plantWords = getTokens(nameBlob);

  // Check direct word-prefix match: does every token in query match a word in the plant?
  const isDirectMatch = queryTokens.every(qTok => {
    // Strip Arabic prefix if present
    const variants = [qTok];
    if (qTok.startsWith('وال') && qTok.length >= 5) variants.push(qTok.slice(3), qTok.slice(1));
    else if (qTok.startsWith('ال') && qTok.length >= 4) variants.push(qTok.slice(2));

    return variants.some(v => plantWords.some(pw => pw.startsWith(v)));
  });

  if (isDirectMatch) return true;

  // 2. Multilingual synonym expansion (when user types prefix or word of a synonym)
  const expandedTargets = [];
  for (const qTok of queryTokens) {
    if (qTok.length < 2) continue;
    const variants = [qTok];
    if (qTok.startsWith('وال') && qTok.length >= 5) variants.push(qTok.slice(3), qTok.slice(1));
    else if (qTok.startsWith('ال') && qTok.length >= 4) variants.push(qTok.slice(2));

    for (const v of variants) {
      for (const [key, syns] of Object.entries(MULTILINGUAL_SYNONYMS)) {
        const normKey = normalizeSearchText(key);
        // Prefix matching on synonym keys: e.g. "sau" matches "sauge", "bor" matches "borage", "ch" matches "chih"
        if (normKey.startsWith(v) || (v.length >= 3 && v.startsWith(normKey))) {
          syns.forEach(s => expandedTargets.push(normalizeSearchText(s)));
        }
      }
    }
  }

  // Check if any expanded synonym matches the plant
  for (const target of expandedTargets) {
    // If target has multiple words (e.g. 'borago officinalis' or 'artemisia absinthium')
    if (target.includes(' ')) {
      if (nameBlob.includes(target)) return true;
      // Match first word (genus)
      const firstWord = target.split(' ')[0];
      if (firstWord.length >= 3 && plantWords.some(pw => pw.startsWith(firstWord))) return true;
    } else {
      if (plantWords.some(pw => pw.startsWith(target))) return true;
    }
  }

  // 3. Indications and medical uses (word-prefix match to avoid 'sag' in 'dosage')
  if (normQuery.length >= 3) {
    const uses = normalizeSearchText(plant.traditional_medicine?.uses);
    const act = normalizeSearchText(plant.pharmacology?.activities);
    const useWords = [...getTokens(uses), ...getTokens(act)];

    const matchesUse = queryTokens.every(qTok => useWords.some(uw => uw.startsWith(qTok)));
    if (matchesUse) return true;
  }

  return false;
}

const tests = [
  // Incremental French
  { q: 't', note: 'Letter t' },
  { q: 'th', note: 'Prefix th (thym)' },
  { q: 'thy', note: 'Prefix thy' },
  { q: 'thym', note: 'Thym' },
  { q: 'sau', note: 'Prefix sau (sauge)' },
  { q: 'saug', note: 'Prefix saug' },
  { q: 'sauge', note: 'Sauge' },
  { q: 'bo', note: 'Prefix bo (bourrache)' },
  { q: 'bor', note: 'Prefix bor' },
  { q: 'bour', note: 'Prefix bour' },
  { q: 'bourrache', note: 'Bourrache' },

  // Incremental English
  { q: 'sa', note: 'Prefix sa (sage)' },
  { q: 'sag', note: 'Prefix sag (sage)' },
  { q: 'sage', note: 'Sage' },
  { q: 'borage', note: 'Borage' },
  { q: 'gar', note: 'Prefix gar (garlic)' },
  { q: 'garlic', note: 'Garlic' },
  { q: 'worm', note: 'Prefix worm (wormwood)' },
  { q: 'wormwood', note: 'Wormwood' },

  // Incremental Arabic
  { q: 'ش', note: 'Arabic sh (شيح)' },
  { q: 'شي', note: 'Arabic shi' },
  { q: 'شيح', note: 'Chih / Artemisia' },
  { q: 'الشيح', note: 'Al-Chih with article' },
  { q: 'ز', note: 'Arabic z (زعتر)' },
  { q: 'زع', note: 'Arabic za' },
  { q: 'زعت', note: 'Arabic zaa' },
  { q: 'زعتر', note: 'Zaatar' },
  { q: 'الزعتر', note: 'Al-Zaatar with article' },
  { q: 'ثو', note: 'Prefix thou (ثوم)' },
  { q: 'ثوم', note: 'Garlic (ثوم)' },
  { q: 'الثوم', note: 'Al-Thoum' },
  { q: 'لسان الثور', note: 'Borago (لسان الثور)' },

  // Latin Scientific
  { q: 'art', note: 'Artemisia' },
  { q: 'artemisia', note: 'Artemisia genus' },
  { q: 'artemisia herba', note: 'Species' },
  { q: 'borago', note: 'Borago genus' }
];

console.log('='.repeat(80));
console.log('INCREMENTAL MULTILINGUAL SEARCH ENGINE BENCHMARK');
console.log('='.repeat(80));

for (const t of tests) {
  const t0 = Date.now();
  const results = plants.filter(p => matchPlant(p, t.q));
  const dt = Date.now() - t0;
  const sample = results.slice(0, 3).map(r => `${r.id}: ${r.scientific_name}`).join(' | ');
  console.log(`[${dt}ms] Query: "${t.q.padEnd(16)}" (${t.note.padEnd(25)}) -> ${results.length.toString().padStart(3)} results. [${sample}]`);
}
