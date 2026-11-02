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

// Full comprehensive multilingual synonym map
const MULTILINGUAL_SYNONYMS = {
  // A
  'armoise': ['artemisia', 'شيح', 'wormwood', 'absinthe', 'chih'],
  'chih': ['artemisia', 'شيح', 'armoise'],
  'chikh': ['artemisia', 'شيح', 'armoise'],
  'wormwood': ['artemisia', 'شيح', 'armoise'],
  'absinthe': ['artemisia absinthium', 'شيح', 'wormwood'],
  'شيح': ['artemisia', 'armoise', 'wormwood', 'chih'],
  'ail': ['allium sativum', 'ثوم', 'garlic', 'toum', 'thoum'],
  'garlic': ['allium sativum', 'ثوم', 'ail', 'toum'],
  'ثوم': ['allium sativum', 'ail', 'garlic', 'toum'],
  'toum': ['allium sativum', 'ثوم', 'ail', 'garlic'],
  'thoum': ['allium sativum', 'ثوم', 'ail', 'garlic'],
  'oignon': ['allium', 'cepa', 'بصل', 'onion'],
  'onion': ['allium', 'cepa', 'بصل', 'oignon'],
  'بصل': ['allium', 'cepa', 'oignon', 'onion'],
  'artichaut': ['cynara cardunculus', 'خرشوف', 'قرنينة', 'artichoke'],
  'artichoke': ['cynara cardunculus', 'خرشوف', 'قرنينة'],
  'خرشوف': ['cynara', 'artichaut', 'artichoke'],
  'قرنينة': ['cynara', 'artichaut', 'cardon'],
  'cardon': ['cynara cardunculus', 'قرنينة', 'cardoon'],
  'aloes': ['aloe', 'صبار', 'صبر'],
  'aloe': ['aloe', 'صبار', 'صبر'],
  'صبار': ['aloe', 'opuntia', 'تين شوكي', 'هندي'],
  'aneth': ['anethum graveolens', 'شبت', 'dill'],
  'dill': ['anethum', 'شبت'],
  'شبت': ['anethum', 'aneth', 'dill'],
  'anis': ['pimpinella anisum', 'حبة حلاوة', 'يانسون', 'anise'],
  'anise': ['pimpinella anisum', 'حبة حلاوة', 'يانسون'],
  'يانسون': ['pimpinella anisum', 'anis', 'anise'],
  'حبة حلاوة': ['pimpinella anisum', 'anis', 'anise'],
  'aubepine': ['crataegus', 'زعرور', 'hawthorn'],
  'hawthorn': ['crataegus', 'زعرور'],
  'زعرور': ['crataegus', 'aubepine', 'hawthorn'],

  // B
  'basilic': ['ocimum', 'حبق', 'basil'],
  'basil': ['ocimum', 'حبق', 'basilic'],
  'حبق': ['ocimum', 'basilic', 'basil'],
  'bourrache': ['borago', 'borago officinalis', 'لسان الثور', 'حمحم', 'borage'],
  'borage': ['borago', 'borago officinalis', 'لسان الثور', 'bourrache'],
  'لسان الثور': ['borago', 'bourrache', 'borage'],
  'حمحم': ['borago', 'bourrache'],
  'belladone': ['atropa belladonna', 'ست الحسن', 'deadly nightshade'],
  'bouillon blanc': ['verbascum', 'مغد', 'mullein'],
  'bleuet': ['centaurea', 'قنطريون'],

  // C
  'camomille': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'chamomile', 'قرطوفة'],
  'chamomile': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'camomille'],
  'بابونج': ['chamomilla', 'matricaria', 'anthemis', 'camomille', 'chamomile'],
  'قرطوفة': ['anacyclus', 'matricaria', 'camomille'],
  'carvi': ['carum carvi', 'كراوية', 'caraway'],
  'caraway': ['carum carvi', 'كراوية'],
  'كراوية': ['carum carvi', 'carvi', 'caraway'],
  'caroubier': ['ceratonia siliqua', 'خروب', 'carob'],
  'carob': ['ceratonia siliqua', 'خروب', 'caroubier'],
  'خروب': ['ceratonia siliqua', 'caroubier', 'carob'],
  'celeri': ['apium graveolens', 'كرفس', 'celery'],
  'celery': ['apium graveolens', 'كرفس'],
  'كرفس': ['apium graveolens', 'celeri', 'celery'],
  'coriandre': ['coriandrum sativum', 'قصبر', 'دبشة', 'coriander', 'cilantro'],
  'coriander': ['coriandrum sativum', 'قصبر', 'دبشة'],
  'قصبر': ['coriandrum sativum', 'coriandre', 'coriander'],
  'دبشة': ['coriandrum sativum', 'coriandre', 'coriander'],
  'coquelicot': ['papaver rhoeas', 'بلعمان', 'شقائق النعمان', 'poppy'],
  'poppy': ['papaver', 'بلعمان', 'coquelicot'],
  'شقائق النعمان': ['papaver', 'coquelicot', 'poppy'],
  'بلعمان': ['papaver', 'coquelicot'],
  'cresson': ['nasturtium', 'حب الرشاد', 'جرجير الماء', 'cress'],
  'caper': ['capparis spinosa', 'كبار', 'قبار'],
  'كبار': ['capparis', 'caprier', 'caper'],
  'قبار': ['capparis', 'caprier', 'caper'],
  'chene': ['quercus', 'بلوط', 'oak'],
  'oak': ['quercus', 'بلوط'],
  'بلوط': ['quercus', 'chene', 'oak'],
  'chardon': ['silybum', 'carduus', 'onopordum', 'شوك الجمل', 'thistle'],
  'citron': ['citrus limon', 'قارص', 'ليمون', 'lemon'],
  'lemon': ['citrus limon', 'قارص', 'ليمون'],
  'قارص': ['citrus limon', 'citron', 'lemon'],
  'ليمون': ['citrus limon', 'citron', 'lemon'],

  // D - M
  'eucalyptus': ['eucalyptus', 'كاليتوس', 'قلموز'],
  'كاليتوس': ['eucalyptus'],
  'fenouil': ['foeniculum vulgare', 'بسباس', 'fennel'],
  'fennel': ['foeniculum vulgare', 'بسباس', 'fenouil'],
  'بسباس': ['foeniculum', 'fenouil', 'fennel'],
  'fenugrec': ['trigonella foenum graecum', 'حلبة', 'fenugreek'],
  'fenugreek': ['trigonella', 'حلبة', 'fenugrec'],
  'حلبة': ['trigonella', 'fenugrec', 'fenugreek'],
  'figuier': ['ficus', 'تين', 'كرموس', 'fig'],
  'fig': ['ficus', 'تين', 'كرموس'],
  'تين': ['ficus', 'figuier', 'fig'],
  'كرموس': ['ficus', 'figuier', 'fig'],
  'grenadier': ['punica granatum', 'رمان', 'pomegranate'],
  'pomegranate': ['punica granatum', 'رمان'],
  'رمان': ['punica granatum', 'grenade', 'pomegranate'],
  'harmel': ['peganum harmala', 'حرمل', 'syrian rue'],
  'حرمل': ['peganum harmala', 'harmel'],
  'jujubier': ['ziziphus lotus', 'سدر', 'نبق', 'jujube'],
  'سدر': ['ziziphus', 'jujubier', 'jujube'],
  'نبق': ['ziziphus', 'jujube'],
  'laurier': ['laurus nobilis', 'رند', 'غار', 'bay laurel'],
  'رند': ['laurus nobilis', 'laurier', 'bay leaf'],
  'غار': ['laurus nobilis', 'laurier'],
  'laurier rose': ['nerium oleander', 'دفلة', 'oleander'],
  'دفلة': ['nerium oleander', 'laurier rose', 'oleander'],
  'lavande': ['lavandula', 'خزامى', 'حلحال', 'lavender'],
  'lavender': ['lavandula', 'خزامى', 'lavande'],
  'خزامى': ['lavandula', 'lavande', 'lavender'],
  'lentisque': ['pistacia lentiscus', 'ضرو', 'mastic tree'],
  'ضرو': ['pistacia lentiscus', 'lentisque'],
  'menthe': ['mentha', 'نعناع', 'فليو', 'mint', 'peppermint'],
  'mint': ['mentha', 'نعناع', 'menthe'],
  'نعناع': ['mentha', 'menthe', 'mint'],
  'فليو': ['mentha pulegium', 'menthe', 'pennyroyal'],
  'mauve': ['malva', 'خبيزة', 'mallow'],
  'mallow': ['malva', 'خبيزة'],
  'خبيزة': ['malva', 'mauve', 'mallow'],
  'millepertuis': ['hypericum', 'عشبة القلب', 'st john wort'],
  'myrte': ['myrtus communis', 'ريحان', 'myrtle'],
  'ريحان': ['myrtus', 'myrte', 'myrtle'],

  // N - Z
  'nigelle': ['nigella sativa', 'سانوج', 'حبة البركة', 'black cumin', 'black seed'],
  'سانوج': ['nigella sativa', 'nigelle', 'black seed'],
  'حبة البركة': ['nigella sativa', 'nigelle', 'black seed'],
  'olivier': ['olea europaea', 'زيتون', 'olive'],
  'olive': ['olea', 'زيتون', 'olivier'],
  'زيتون': ['olea', 'olivier', 'olive'],
  'origan': ['origanum vulgare', 'زعتر بري', 'oregano'],
  'oregano': ['origanum vulgare', 'زعتر بري'],
  'زعتر بري': ['origanum', 'origan', 'oregano'],
  'ortie': ['urtica dioica', 'حريق', 'قراص', 'nettle'],
  'nettle': ['urtica dioica', 'حريق', 'قراص'],
  'حريق': ['urtica', 'ortie', 'nettle'],
  'قراص': ['urtica', 'ortie', 'nettle'],
  'romarin': ['rosmarinus officinalis', 'اكليل الجبل', 'يزير', 'rosemary'],
  'rosemary': ['rosmarinus officinalis', 'اكليل الجبل', 'romarin'],
  'اكليل الجبل': ['rosmarinus', 'romarin', 'rosemary'],
  'يزير': ['rosmarinus', 'romarin'],
  'sauge': ['salvia', 'مريمية', 'سالمة', 'sage'],
  'sage': ['salvia', 'مريمية', 'سالمة', 'sauge'],
  'مريمية': ['salvia', 'sauge', 'sage'],
  'سالمة': ['salvia', 'sauge', 'sage'],
  'sene': ['senna', 'سنا مكي', 'senna'],
  'سنا مكي': ['senna', 'sene'],
  'thym': ['thymus', 'زعتر', 'حليحال', 'thyme', 'zaatar'],
  'thyme': ['thymus', 'زعتر', 'thym', 'zaatar'],
  'زعتر': ['thymus', 'origanum', 'thym', 'thyme'],
  'zaatar': ['thymus', 'origanum', 'زعتر', 'thym'],
  'verveine': ['verbena', 'لويزة', 'vervain'],
  'لويزة': ['verbena', 'verveine']
};

function scorePlantMatch(plant, query) {
  if (!query || !query.trim()) return 100;
  const normQuery = normalizeSearchText(query.trim());
  if (!normQuery) return 100;

  const queryTokens = getTokens(normQuery);
  if (queryTokens.length === 0) return 100;

  const scName = normalizeSearchText(plant.scientific_name);
  const vernRaw = normalizeSearchText(plant.vernacular_raw);
  const vernList = Array.isArray(plant.vernacular_names) ? plant.vernacular_names.map(normalizeSearchText).join(' ') : '';
  const family = normalizeSearchText(plant.taxonomy?.family);
  const genus = normalizeSearchText(plant.taxonomy?.genus);
  const species = normalizeSearchText(plant.taxonomy?.species);

  const nameBlob = `${scName} ${vernRaw} ${vernList} ${family} ${genus} ${species}`;
  const scWords = getTokens(scName);
  const genusWords = getTokens(genus);
  const vernWords = [...getTokens(vernRaw), ...getTokens(vernList)];
  const familyWords = getTokens(family);
  const allPlantWords = getTokens(nameBlob);

  let score = 0;

  // 1. Direct match scoring
  // Exact scientific name starts with query
  if (scName.startsWith(normQuery)) {
    score += 1000;
  }
  // Genus starts with query token
  if (queryTokens.some(q => genusWords.some(gw => gw.startsWith(q)))) {
    score += 800;
  }
  // Vernacular words start with query token
  if (queryTokens.some(q => vernWords.some(vw => vw.startsWith(q)))) {
    score += 700;
  }
  // Scientific words start with query token
  if (queryTokens.some(q => scWords.some(sw => sw.startsWith(q)))) {
    score += 600;
  }
  // Family starts with query token
  if (queryTokens.some(q => familyWords.some(fw => fw.startsWith(q)))) {
    score += 400;
  }

  // Check if every query token directly matches some plant word
  const allTokensDirectlyMatch = queryTokens.every(qTok => {
    const variants = [qTok];
    if (qTok.startsWith('وال') && qTok.length >= 5) variants.push(qTok.slice(3), qTok.slice(1));
    else if (qTok.startsWith('ال') && qTok.length >= 4) variants.push(qTok.slice(2));
    return variants.some(v => allPlantWords.some(pw => pw.startsWith(v)));
  });

  if (allTokensDirectlyMatch && score === 0) {
    score += 300;
  }

  // 2. Multilingual synonym prefix expansion
  const expandedTargets = [];
  for (const qTok of queryTokens) {
    if (qTok.length < 2) continue;
    const variants = [qTok];
    if (qTok.startsWith('وال') && qTok.length >= 5) variants.push(qTok.slice(3), qTok.slice(1));
    else if (qTok.startsWith('ال') && qTok.length >= 4) variants.push(qTok.slice(2));

    for (const v of variants) {
      for (const [key, syns] of Object.entries(MULTILINGUAL_SYNONYMS)) {
        const normKey = normalizeSearchText(key);
        if (normKey.startsWith(v) || (v.length >= 3 && v.startsWith(normKey))) {
          syns.forEach(s => expandedTargets.push(normalizeSearchText(s)));
        }
      }
    }
  }

  let synonymMatch = false;
  for (const target of expandedTargets) {
    if (target.includes(' ')) {
      if (nameBlob.includes(target)) {
        synonymMatch = true;
        score += 750;
        break;
      }
      const firstWord = target.split(' ')[0];
      if (firstWord.length >= 3 && genusWords.some(gw => gw.startsWith(firstWord))) {
        synonymMatch = true;
        score += 700;
        break;
      }
    } else {
      if (genusWords.some(gw => gw.startsWith(target))) {
        synonymMatch = true;
        score += 650;
        break;
      }
      if (allPlantWords.some(pw => pw.startsWith(target))) {
        synonymMatch = true;
        score += 550;
        break;
      }
    }
  }

  // 3. Medical uses / indications
  if (normQuery.length >= 3 && score === 0) {
    const uses = normalizeSearchText(plant.traditional_medicine?.uses);
    const act = normalizeSearchText(plant.pharmacology?.activities);
    const useWords = [...getTokens(uses), ...getTokens(act)];

    if (queryTokens.every(qTok => useWords.some(uw => uw.startsWith(qTok)))) {
      score += 200;
    }
  }

  return score;
}

function searchPlants(query, limit = 10) {
  const scored = [];
  for (const p of plants) {
    const s = scorePlantMatch(p, query);
    if (s > 0) {
      scored.push({ plant: p, score: s });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.plant.id - b.plant.id);
  return scored.slice(0, limit);
}

// Test top results
const testQueries = ['th', 'thy', 'thym', 'bo', 'bor', 'bour', 'bourrache', 'sau', 'sag', 'sage', 'ش', 'شي', 'شيح', 'ز', 'زع', 'زعتر', 'garlic', 'thoum'];
for (const q of testQueries) {
  const res = searchPlants(q, 3);
  console.log(`Top for "${q}":`, res.map(r => `[score ${r.score}] #${r.plant.id} ${r.plant.scientific_name} (${r.plant.vernacular_raw || ''})`).join(' | '));
}
