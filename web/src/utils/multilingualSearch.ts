/**
 * DzHerba - Multilingual Incremental Botanical Search Engine (Français / Arabe / Anglais / Latin)
 * Recherche incrémentielle ultra-rapide au fil de la frappe (as-you-type) :
 * - Normalisation Unicode (NFD, suppression accents français, diacritiques arabes tashkeel)
 * - Normalisation des variantes arabes (أ، إ، آ -> ا | ة -> ه | ى -> ي)
 * - Gestion intelligente des préfixes arabes d'article défini (ال، وال، بال، فال، كال...)
 * - Dictionnaire de synonymes vernaculaires multilingues Flore d'Algérie
 * - Correspondance par préfixe de mot (word-prefix matching : "th" -> "thymus", "sau" -> "salvia"/"sauge", "bor" -> "borago", "شي" -> "شيح")
 * - Système de score et de pertinence (Relevance Ranking)
 */

export function normalizeSearchText(text?: string | null): string {
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

export function extractTokens(text?: string | null): string[] {
  if (!text) return [];
  return normalizeSearchText(text)
    .split(/[\s,\.;:_\-\(\)\[\]\/\\«»"'\+\?!،؟]+/)
    .filter(Boolean);
}

// Dictionnaire exhaustif de synonymes multilingues pour la Flore d'Algérie
export const MULTILINGUAL_SYNONYMS: Record<string, string[]> = {
  // --- A ---
  'armoise': ['artemisia', 'شيح', 'wormwood', 'absinthe', 'chih', 'تقفت', 'ديغوفت'],
  'armoises': ['artemisia', 'شيح'],
  'wormwood': ['artemisia', 'شيح', 'armoise'],
  'absinthe': ['artemisia absinthium', 'شيحة قورقاني', 'شجرة مريم', 'شيح'],
  'chih': ['artemisia', 'شيح', 'armoise'],
  'chikh': ['artemisia', 'شيح', 'armoise'],
  'شيح': ['artemisia', 'armoise', 'wormwood', 'chih'],
  'ail': ['allium sativum', 'ثوم', 'garlic', 'toum', 'thoum'],
  'garlic': ['allium sativum', 'ثوم', 'ail', 'toum'],
  'ثوم': ['allium sativum', 'ail', 'garlic', 'toum'],
  'toum': ['allium sativum', 'ثوم', 'ail', 'garlic'],
  'thoum': ['allium sativum', 'ثوم', 'ail', 'garlic'],
  'oignon': ['allium', 'cepa', 'بصل', 'onion'],
  'onion': ['allium', 'cepa', 'بصل', 'oignon'],
  'بصل': ['allium', 'cepa', 'oignon', 'onion'],
  'poireau': ['allium porrum', 'كرات', 'leek'],
  'leek': ['allium porrum', 'كرات'],
  'كرات': ['allium porrum', 'poireau', 'leek'],
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
  'acanthe': ['acanthus mollis', 'باخباخ', 'كابونيا', 'bear breech'],
  'achillee': ['achillea', 'قيصوم', 'yarrow'],
  'yarrow': ['achillea', 'قيصوم'],
  'قيصوم': ['achillea', 'yarrow', 'achillee'],

  // --- B ---
  'basilic': ['ocimum', 'حبق', 'basil'],
  'basil': ['ocimum', 'حبق', 'basilic'],
  'حبق': ['ocimum', 'basilic', 'basil'],
  'bourrache': ['borago', 'borago officinalis', 'لسان الثور', 'حمحم', 'borage'],
  'borage': ['borago', 'borago officinalis', 'لسان الثور', 'bourrache'],
  'لسان الثور': ['borago', 'bourrache', 'borage'],
  'حمحم': ['borago', 'bourrache', 'borage'],
  'belladone': ['atropa belladonna', 'ست الحسن', 'deadly nightshade'],
  'bouillon blanc': ['verbascum', 'مغد', 'mullein'],
  'bleuet': ['centaurea', 'قنطريون'],

  // --- C ---
  'camomille': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'chamomile', 'قرطوفة'],
  'chamomile': ['chamomilla', 'matricaria', 'anthemis', 'بابونج', 'camomille'],
  'بابونج': ['chamomilla', 'matricaria', 'anthemis', 'camomille', 'chamomile'],
  'قرطوفة': ['anacyclus', 'matricaria', 'camomille'],
  'carvi': ['carum carvi', 'كراوية', 'caraway'],
  'caraway': ['carum carvi', 'كراوية'],
  'كراوية': ['carum carvi', 'carvi', 'caraway'],
  'caroubier': ['ceratonia siliqua', 'خروب', 'carob'],
  'caroube': ['ceratonia siliqua', 'خروب', 'carob'],
  'carob': ['ceratonia siliqua', 'خروب'],
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
  'cresson': ['nasturtium', 'lepidium', 'حب الرشاد', 'جرجير الماء', 'cress'],
  'cress': ['nasturtium', 'lepidium', 'حب الرشاد'],
  'حب الرشاد': ['lepidium', 'cresson', 'cress'],
  'caprier': ['capparis spinosa', 'كبار', 'قبار', 'caper'],
  'caper': ['capparis spinosa', 'كبار', 'قبار'],
  'كبار': ['capparis', 'caprier', 'caper'],
  'قبار': ['capparis', 'caprier', 'caper'],
  'chene': ['quercus', 'بلوط', 'oak'],
  'oak': ['quercus', 'بلوط'],
  'بلوط': ['quercus', 'chene', 'oak'],
  'chardon': ['silybum', 'carduus', 'onopordum', 'شوك الجمل', 'thistle', 'شكاعة'],
  'thistle': ['silybum', 'carduus', 'onopordum', 'شوك الجمل'],
  'شوك الجمل': ['silybum', 'carduus', 'onopordum', 'chardon', 'thistle'],
  'chardon marie': ['silybum marianum', 'شوك مريم', 'milk thistle'],
  'citron': ['citrus limon', 'قارص', 'ليمون', 'lemon'],
  'citronnier': ['citrus limon', 'قارص', 'ليمون', 'lemon'],
  'lemon': ['citrus limon', 'قارص', 'ليمون'],
  'قارص': ['citrus limon', 'citron', 'lemon'],
  'ليمون': ['citrus limon', 'citron', 'lemon'],
  'orange': ['citrus aurantium', 'برتقal', 'نارنج'],
  'cypres': ['cupressus', 'سرو', 'cypress'],
  'سرو': ['cupressus', 'cypres'],

  // --- D & E ---
  'digitale': ['digitalis', 'اصبع العذراء', 'foxglove'],
  'drou': ['pistacia lentiscus', 'ضرو'],
  'eucalyptus': ['eucalyptus', 'كاليتوس', 'قلموز'],
  'كاليتوس': ['eucalyptus'],
  'euphorbe': ['euphorbia', 'لبينة', 'فربيون', 'spurge'],
  'لبينة': ['euphorbia', 'euphorbe'],

  // --- F & G ---
  'fenouil': ['foeniculum vulgare', 'بسباس', 'fennel'],
  'fennel': ['foeniculum vulgare', 'بسباس'],
  'بسباس': ['foeniculum vulgare', 'fenouil', 'fennel'],
  'fenugrec': ['trigonella foenum-graecum', 'حلبة', 'fenugreek'],
  'fenugreek': ['trigonella foenum-graecum', 'حلبة'],
  'حلبة': ['trigonella', 'fenugrec', 'fenugreek'],
  'figuier': ['ficus', 'تين', 'كرموس', 'fig'],
  'fig': ['ficus', 'تين', 'كرموس'],
  'تين': ['ficus', 'figuier', 'fig'],
  'كرموس': ['ficus', 'figuier', 'fig'],
  'fougere': ['adiantum', 'pteridium', 'سرخس', 'fern'],
  'genievre': ['juniperus', 'عرعار', 'عرعر', 'juniper'],
  'genevrier': ['juniperus', 'عرعار', 'عرعر', 'juniper'],
  'عرعار': ['juniperus', 'genevrier', 'juniper'],
  'عرعر': ['juniperus', 'genevrier', 'juniper'],
  'grenadier': ['punica granatum', 'رمان', 'pomegranate'],
  'grenade': ['punica granatum', 'رمان', 'pomegranate'],
  'pomegranate': ['punica granatum', 'رمان'],
  'رمان': ['punica granatum', 'grenade', 'pomegranate'],

  // --- H & J ---
  'harmel': ['peganum harmala', 'حرمل', 'syrian rue'],
  'حرمل': ['peganum harmala', 'harmel', 'syrian rue'],
  'jujubier': ['ziziphus lotus', 'سدر', 'نبق', 'jujube'],
  'jujube': ['ziziphus lotus', 'سدر', 'نبق'],
  'سدر': ['ziziphus', 'jujubier', 'jujube'],
  'نبق': ['ziziphus', 'jujube'],
  'jasmin': ['jasminum', 'ياسمين', 'jasmine'],

  // --- L ---
  'laurier': ['laurus nobilis', 'رند', 'غار', 'bay laurel'],
  'bay leaf': ['laurus nobilis', 'رند'],
  'رند': ['laurus nobilis', 'laurier', 'bay leaf'],
  'غار': ['laurus nobilis', 'laurier'],
  'laurier rose': ['nerium oleander', 'دفلة', 'oleander'],
  'دفلة': ['nerium oleander', 'laurier rose', 'oleander'],
  'lavande': ['lavandula', 'خزامى', 'حلحال', 'lavender'],
  'lavender': ['lavandula', 'خزامى', 'حلحال'],
  'خزامى': ['lavandula', 'lavande', 'lavender'],
  'حلحال': ['lavandula stoechas', 'thymus', 'lavande'],
  'lentisque': ['pistacia lentiscus', 'ضرو', 'mastic tree'],
  'mastic tree': ['pistacia lentiscus', 'ضرو'],
  'ضرو': ['pistacia lentiscus', 'lentisque'],
  'lin': ['linum usitatissimum', 'كتان', 'flax'],
  'كتان': ['linum', 'lin', 'flax'],

  // --- M ---
  'menthe': ['mentha', 'نعناع', 'فليو', 'mint', 'peppermint'],
  'mint': ['mentha', 'نعناع', 'فليو'],
  'peppermint': ['mentha piperita', 'نعناع فلفلي'],
  'نعناع': ['mentha', 'menthe', 'mint'],
  'فليو': ['mentha pulegium', 'menthe pouliot', 'pennyroyal'],
  'mauve': ['malva', 'خبيزة', 'mallow'],
  'mallow': ['malva', 'خبيزة'],
  'خبيزة': ['malva', 'mauve', 'mallow'],
  'melisse': ['melissa officinalis', 'ترنجان', 'حشيشة النحل', 'lemon balm'],
  'ترنجان': ['melissa', 'melisse', 'lemon balm'],
  'marjolaine': ['origanum majorana', 'مردقوش', 'marjoram'],
  'مردقوش': ['origanum majorana', 'marjolaine', 'marjoram'],
  'marrube': ['marrubium vulgare', 'مريوت', 'horehound'],
  'مريوت': ['marrubium vulgare', 'marrube', 'horehound'],
  'millepertuis': ['hypericum perforatum', 'عشبة القلب', 'st john wort'],
  'عشبة القلب': ['hypericum', 'millepertuis'],
  'myrte': ['myrtus communis', 'ريحان', 'myrtle'],
  'ريحان': ['myrtus communis', 'myrte', 'myrtle'],

  // --- N & O ---
  'nigelle': ['nigella sativa', 'سانوج', 'حبة البركة', 'black cumin', 'black seed'],
  'black seed': ['nigella sativa', 'سانوج', 'حبة البركة'],
  'سانوج': ['nigella sativa', 'nigelle', 'black seed'],
  'حبة البركة': ['nigella sativa', 'nigelle', 'black seed'],
  'olivier': ['olea', 'زيتون', 'olive'],
  'olive': ['olea', 'زيتون'],
  'زيتون': ['olea', 'olivier', 'olive'],
  'origan': ['origanum vulgare', 'زعتر بري', ' حبق الشيوخ', 'oregano'],
  'oregano': ['origanum vulgare', 'زعتر بري'],
  'زعتر بري': ['origanum', 'origan', 'oregano'],
  'ortie': ['urtica dioica', 'حريق', 'قراص', 'nettle'],
  'nettle': ['urtica dioica', 'حريق', 'قراص'],
  'حريق': ['urtica', 'ortie', 'nettle'],
  'قراص': ['urtica', 'ortie', 'nettle'],
  'oseille': ['rumex', 'حماض', 'sorrel'],
  'حماض': ['rumex', 'oseille'],
  'قارصة': ['oxalis pes-caprae', 'حميضة'],
  'حميضة': ['oxalis pes-caprae', 'قارصة'],

  // --- P & R ---
  'pissenlit': ['taraxacum', 'طرخشقون', 'أسنان الأسد', 'dandelion'],
  'طرخشقون': ['taraxacum', 'pissenlit'],
  'pourpier': ['portulaca oleracea', 'رجلة', 'purslane'],
  'رجلة': ['portulaca oleracea', 'pourpier'],
  'reglisse': ['glycyrrhiza glabra', 'عرق السوس', 'licorice'],
  'عرق السوس': ['glycyrrhiza glabra', 'reglisse'],
  'romarin': ['rosmarinus officinalis', 'اكليل الجبل', 'يزير', 'rosemary'],
  'rosemary': ['rosmarinus officinalis', 'اكليل الجبل', 'يزير', 'romarin'],
  'اكليل الجبل': ['rosmarinus officinalis', 'romarin', 'rosemary'],
  'يزير': ['rosmarinus officinalis', 'romarin'],
  'rue': ['ruta graveolens', 'فيجل', 'سذاب'],
  'فيجل': ['ruta', 'rue'],
  'roquette': ['eruca vesicaria', 'جرجير', 'rocket', 'arugula'],
  'جرجير': ['eruca vesicaria', 'roquette'],
  'rose': ['rosa', 'ورد'],
  'ورد': ['rosa', 'rose'],

  // --- S & T ---
  'sauge': ['salvia', 'مريمية', 'سالمة', 'sage'],
  'sage': ['salvia', 'مريمية', 'سالمة', 'sauge'],
  'مريمية': ['salvia', 'sauge', 'sage'],
  'سالمة': ['salvia', 'sauge', 'sage'],
  'sene': ['senna', 'سنا مكي', 'cassia'],
  'سنا مكي': ['senna', 'sene'],
  'souci': ['calendula officinalis', 'أقحوان', 'marigold'],
  'اقحوان': ['calendula', 'souci'],
  'thym': ['thymus', 'زعتر', 'حليحال', 'thyme', 'zaatar'],
  'thyme': ['thymus', 'زعتر', 'thym', 'zaatar'],
  'زعتر': ['thymus', 'origanum', 'thym', 'thyme'],
  'zaatar': ['thymus', 'origanum', 'زعتر', 'thym'],
  'حليحال': ['thymus', 'lavandula', 'زعتر'],
  'tomate': ['solanum lycopersicum', 'طماطم', 'tomato'],
  'طماطم': ['solanum lycopersicum', 'tomate'],

  // --- V & Z ---
  'valeriane': ['valeriana', 'ناردين', 'valerian'],
  'ناردين': ['valeriana', 'valeriane'],
  'verveine': ['verbena', 'aloysia', 'لويزة', 'vervain'],
  'vervain': ['verbena', 'لويزة'],
  'لويزة': ['verbena', 'aloysia', 'verveine'],
  'vigne': ['vitis vinifera', 'عنب', 'دالية', 'grapevine'],
  'عنب': ['vitis', 'vigne'],
  'violette': ['viola', 'بنفسج', 'violet'],
  'بنفسج': ['viola', 'violette'],
  'ajuga': ['ajuga iva', 'شندقورة', 'جعدة'],
  'شندقورة': ['ajuga iva'],
  'جعدة': ['teucrium polium', 'ajuga iva'],
  'teucrium': ['جعدة', 'خياطة']
};

/**
 * Calcule les variantes d'un jeton (désarticulation des préfixes arabes)
 */
function getTokenVariants(token: string): string[] {
  const list = [token];
  if (token.startsWith('وال') && token.length >= 5) {
    list.push(token.slice(3), token.slice(1));
  } else if (token.startsWith('بال') && token.length >= 5) {
    list.push(token.slice(3));
  } else if (token.startsWith('فال') && token.length >= 5) {
    list.push(token.slice(3));
  } else if (token.startsWith('كال') && token.length >= 5) {
    list.push(token.slice(3));
  } else if (token.startsWith('ال') && token.length >= 4) {
    list.push(token.slice(2));
  } else if (token.startsWith('و') && token.length >= 4) {
    list.push(token.slice(1));
  }
  return list;
}

/**
 * Développe les termes d'une requête avec ses synonymes multilingues
 */
export function expandSearchQuery(query: string): string[] {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return [];

  const rawTokens = extractTokens(normQuery);
  const targets = new Set<string>();
  targets.add(normQuery);

  for (const t of rawTokens) {
    const variants = getTokenVariants(t);
    variants.forEach(v => targets.add(v));

    if (t.length >= 2) {
      for (const v of variants) {
        for (const [key, synList] of Object.entries(MULTILINGUAL_SYNONYMS)) {
          const normKey = normalizeSearchText(key);
          if (normKey.startsWith(v) || (v.length >= 3 && v.startsWith(normKey))) {
            synList.forEach(s => targets.add(normalizeSearchText(s)));
          }
        }
      }
    }
  }

  return Array.from(targets).filter(Boolean);
}

/**
 * Calcule un score de pertinence pour une plante donnée face à une requête de recherche.
 * Score > 0 signifie que la plante correspond.
 */
export function scorePlantMatch(plant: any, searchQuery: string): number {
  if (!searchQuery || !searchQuery.trim()) return 100;
  const normQuery = normalizeSearchText(searchQuery.trim());
  if (!normQuery) return 100;

  const queryTokens = extractTokens(normQuery);
  if (queryTokens.length === 0) return 100;

  const scName = normalizeSearchText(plant.scientific_name);
  const vernRaw = normalizeSearchText(plant.vernacular_raw);
  const vernList = Array.isArray(plant.vernacular_names)
    ? plant.vernacular_names.map(normalizeSearchText).join(' ')
    : '';
  const family = normalizeSearchText(plant.taxonomy?.family);
  const genus = normalizeSearchText(plant.taxonomy?.genus);
  const species = normalizeSearchText(plant.taxonomy?.species);

  const nameBlob = `${scName} ${vernRaw} ${vernList} ${family} ${genus} ${species}`;
  const scWords = extractTokens(scName);
  const genusWords = extractTokens(genus);
  const vernWords = [...extractTokens(vernRaw), ...extractTokens(vernList)];
  const familyWords = extractTokens(family);
  const allPlantWords = extractTokens(nameBlob);

  let score = 0;

  // 1. Correspondance directe sur les noms
  // Nom scientifique commence exactement par la requête
  if (scName.startsWith(normQuery)) {
    score += 1000;
  }
  // Le genre commence par un des jetons de la requête
  if (queryTokens.some(q => genusWords.some(gw => gw.startsWith(q)))) {
    score += 800;
  }
  // Les noms vernaculaires (arabe/français/anglais) commencent par un des jetons
  if (queryTokens.some(q => {
    const vars = getTokenVariants(q);
    return vars.some(v => vernWords.some(vw => vw.startsWith(v)));
  })) {
    score += 700;
  }
  // Un mot du nom scientifique commence par un jeton
  if (queryTokens.some(q => scWords.some(sw => sw.startsWith(q)))) {
    score += 600;
  }
  // La famille botanique commence par un jeton
  if (queryTokens.some(q => familyWords.some(fw => fw.startsWith(q)))) {
    score += 400;
  }

  // Vérifier si TOUS les jetons de la requête correspondent à au moins un mot de la plante
  const allTokensDirectlyMatch = queryTokens.every(qTok => {
    const variants = getTokenVariants(qTok);
    return variants.some(v => allPlantWords.some(pw => pw.startsWith(v)));
  });

  if (allTokensDirectlyMatch && score === 0) {
    score += 300;
  }

  // 2. Expansion des synonymes multilingues (préfixe incrémental sur les clés)
  const expandedTargets: string[] = [];
  for (const qTok of queryTokens) {
    if (qTok.length < 2) continue;
    const variants = getTokenVariants(qTok);

    for (const v of variants) {
      for (const [key, syns] of Object.entries(MULTILINGUAL_SYNONYMS)) {
        const normKey = normalizeSearchText(key);
        // Préfixe incrémental : "sau" matche "sauge", "bor" matche "bourrache", "ch" matche "chih"
        if (normKey.startsWith(v) || (v.length >= 3 && v.startsWith(normKey))) {
          syns.forEach(s => expandedTargets.push(normalizeSearchText(s)));
        }
      }
    }
  }

  for (const target of expandedTargets) {
    if (target.includes(' ')) {
      if (nameBlob.includes(target)) {
        score += 750;
        break;
      }
      const firstWord = target.split(' ')[0];
      if (firstWord.length >= 3 && genusWords.some(gw => gw.startsWith(firstWord))) {
        score += 700;
        break;
      }
    } else {
      if (genusWords.some(gw => gw.startsWith(target))) {
        score += 650;
        break;
      }
      if (allPlantWords.some(pw => pw.startsWith(target))) {
        score += 550;
        break;
      }
    }
  }

  // 3. Indications médicales et usages traditionnels (word-prefix pour éviter les faux positifs)
  if (normQuery.length >= 3 && score === 0) {
    const uses = normalizeSearchText(plant.traditional_medicine?.uses);
    const act = normalizeSearchText(plant.pharmacology?.activities);
    const useWords = [...extractTokens(uses), ...extractTokens(act)];

    if (queryTokens.every(qTok => useWords.some(uw => uw.startsWith(qTok)))) {
      score += 200;
    }
  }

  return score;
}

/**
 * Fonction de test booléen pour les filtres existants (ex. Catalog ou AdminDashboard)
 */
export function matchPlantMultilingual(plant: any, searchQuery: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  return scorePlantMatch(plant, searchQuery) > 0;
}

/**
 * Recherche et tri par pertinence multilingue avec limite optionnelle
 */
export function searchPlantsMultilingual(plants: any[], query: string, limit?: number): any[] {
  if (!query || !query.trim()) {
    return limit ? plants.slice(0, limit) : plants;
  }

  const scored: { plant: any; score: number }[] = [];
  for (const p of plants) {
    const s = scorePlantMatch(p, query);
    if (s > 0) {
      scored.push({ plant: p, score: s });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.plant.id - b.plant.id);
  const results = scored.map(item => item.plant);
  return limit ? results.slice(0, limit) : results;
}
