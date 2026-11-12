/**
 * DzHerba - Moteur RAG & Assistant IA Botanique Professionnel 2.0
 * Architecture Hybride :
 *  - Multilingue (Français, Arabe littéraire & Darija algérienne, Anglais)
 *  - Moteur de Mémoire & Contexte (Multi-tour)
 *  - Grounded RAG sur les 773 espèces médicinales de la flore algérienne
 *  - Branche A : LLM Grand Modèle Professionnel (Google Gemini 1.5/2.0 Flash, OpenAI GPT-4o-mini, Groq Llama 3.3 70B)
 *  - Branche B : Moteur Botanique NLP Enrichi (100% Hors-Ligne & Autonome)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { expandSearchQuery, normalizeSearchText } = require('./multilingualSearch');

const JSON_PATH = path.resolve(__dirname, '..', 'data', 'plants.json');

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux',
  'es', 'est', 'sont', 'suis', 'qui', 'que', 'quoi', 'comment', 'pourquoi', 'quand',
  'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'ce', 'cet', 'cette', 'ces',
  'je', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur',
  'ne', 'pas', 'pour', 'avec', 'par', 'sur', 'dans', 'tout', 'tous', 'toute', 'toutes',
  'bonjour', 'salut', 'salam', 'merci', 'stp', 'svp', 'hello', 'hi',
  'is', 'are', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
  'what', 'who', 'how', 'why', 'when', 'you', 'your', 'me', 'my',
  'من', 'في', 'على', 'إلى', 'مع', 'ما', 'هو', 'هي', 'هل', 'كيف', 'أين', 'لماذا'
]);

class BotanicalRagEngine {
  constructor() {
    this.plants = [];
    this.plantsIndex = new Map();
    this.loadCorpus();
  }

  loadCorpus() {
    try {
      if (fs.existsSync(JSON_PATH)) {
        this.plants = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        console.log(`[DzHerba RAG] Corpus de ${this.plants.length} plantes médicinales chargé en mémoire.`);
      }
    } catch (e) {
      console.warn('[DzHerba RAG] Erreur lors du chargement de plants.json :', e.message);
    }
  }

  detectLanguage(query) {
    if (!query) return 'fr';
    // Détection de caractères arabes
    const arabicRegex = /[\u0600-\u06FF]/g;
    const arabicMatches = query.match(arabicRegex);
    if (arabicMatches && arabicMatches.length >= 2) {
      return 'ar';
    }

    // Détection de mots anglais fréquents (stopwords & vocabulaire médical)
    const enClues = [
      'what', 'which', 'how', 'why', 'who', 'is', 'are', 'the', 'for', 'with', 'and', 'from',
      'plant', 'plants', 'herb', 'herbs', 'cure', 'disease', 'safe', 'toxic', 'dosage', 'algeria',
      'leaves', 'roots', 'side effects', 'pregnant', 'uses', 'contraindications', 'stomach', 'ache', 'fever'
    ];
    const words = query.toLowerCase().split(/\W+/).filter(Boolean);
    const enMatches = words.filter(w => enClues.includes(w)).length;
    if (enMatches >= 2) return 'en';

    return 'fr';
  }

  searchGroundedPlants(query, history = [], limit = 4) {
    if (!query && (!history || history.length === 0)) return [];
    if (this.plants.length === 0) return [];

    // Combine current query with recent user queries from history for conversational context
    const recentQueries = [query];
    if (Array.isArray(history)) {
      const pastUserMessages = history
        .filter(m => m && (m.role === 'user' || m.sender === 'user'))
        .slice(-2)
        .map(m => m.text || m.content || '');
      recentQueries.push(...pastUserMessages);
    }
    const fullQueryContext = recentQueries.join(' ');

    const normQuery = normalizeSearchText(fullQueryContext);
    const expandedTerms = expandSearchQuery(fullQueryContext).filter(t => !STOP_WORDS.has(t) && t.length >= 3);
    const queryTokens = normQuery.split(/\s+/).filter(t => t.length >= 3 && !STOP_WORDS.has(t));

    const scoredPlants = [];

    // Mots-clés thérapeutiques fréquents pour pondération
    const conditionKeywords = {
      estomac: ['estomac', 'digestif', 'diarrhee', 'colique', 'ballonnement', 'gastrique', 'باطني', 'معدة', 'هضم', 'قولون', 'اسهال', 'gastrointestinal', 'stomach'],
      toux: ['toux', 'bronchite', 'respiratoire', 'poumon', 'gorge', 'سعال', 'صدر', 'رئة', 'تنفس', 'كحة', 'cough', 'respiratory'],
      diabete: ['diabete', 'glycemie', 'sucre', 'سكر', 'سكري', 'antidiabetic', 'diabetes', 'hypoglycemic'],
      hypertension: ['tension', 'hypertension', 'cardiaque', 'coeur', 'ضغط', 'قلب', 'blood pressure', 'hypertensive'],
      peau: ['peau', 'plaie', 'brulure', 'cicatrisation', 'eczema', 'psoriasis', 'جلد', 'حروق', 'جروح', 'بشرة', 'skin', 'wound'],
      articulations: ['rhumatisme', 'articulation', 'douleur', 'arthrite', 'مفاصل', 'روماتيزم', 'الم', 'rheumatism', 'joint'],
      sommeil: ['sommeil', 'insomnie', 'anxiete', 'calmant', 'stress', 'اروق', 'نوم', 'مهدئ', 'قلق', 'sleep', 'sedative', 'anxiety'],
      reins: ['rein', 'urinaire', 'diuretique', 'calcul', 'كلى', 'مسالك', 'بول', 'حصى', 'kidney', 'urinary', 'diuretic'],
      foie: ['foie', 'hepatoprotecteur', 'ictere', 'كبد', 'صفراء', 'liver', 'hepatic']
    };

    for (const p of this.plants) {
      let score = 0;
      const sci = normalizeSearchText(p.scientific_name || '');
      const vern = normalizeSearchText(p.vernacular_raw || '');
      const uses = normalizeSearchText(p.traditional_medicine?.uses || '');
      const parts = normalizeSearchText(p.traditional_medicine?.parts_used || '');
      const activities = normalizeSearchText(p.pharmacology?.activities || '');
      const phyto = normalizeSearchText(p.pharmacology?.phytochemical_profile || '');
      const tox = normalizeSearchText(p.safety_profile?.toxicity || '');
      const regions = normalizeSearchText((p.distribution?.regions || []).join(' ') + ' ' + (p.distribution?.habitat_description || ''));

      // 1. Correspondance exacte sur le nom de la plante (prioritaire)
      for (const term of expandedTerms) {
        if (term.length >= 3) {
          if (sci.includes(term)) score += 65;
          if (vern.includes(term)) score += 55;
        }
      }

      // 2. Correspondance sur les pathologies et usages
      for (const token of queryTokens) {
        if (token.length >= 3) {
          if (sci.includes(token)) score += 40;
          if (vern.includes(token)) score += 35;
          if (uses.includes(token)) score += 20;
          if (activities.includes(token)) score += 18;
          if (phyto.includes(token)) score += 12;
          if (parts.includes(token)) score += 10;
          if (regions.includes(token)) score += 10;
          if (tox.includes(token)) score += 10;
        }
      }

      // 3. Synergie thématique
      for (const [, words] of Object.entries(conditionKeywords)) {
        const queryHasTopic = words.some(w => normQuery.includes(w));
        if (queryHasTopic) {
          const plantHasTopic = words.some(w => uses.includes(w) || activities.includes(w));
          if (plantHasTopic) {
            score += 25;
          }
        }
      }

      if (score > 0) {
        if (p.images && p.images.length > 0) score += 5;
        if (p.traditional_medicine?.uses && p.traditional_medicine.uses.length > 50) score += 5;
        scoredPlants.push({ plant: p, score });
      }
    }

    scoredPlants.sort((a, b) => b.score - a.score);
    return scoredPlants.slice(0, limit).map(item => item.plant);
  }

  formatPlantSnippet(p, lang) {
    const sci = p.scientific_name || 'Espèce non précisée';
    const vern = p.vernacular_raw ? ` (${p.vernacular_raw})` : '';
    const fam = p.taxonomy?.family || 'Famille inconnue';
    const uses = p.traditional_medicine?.uses || 'Usage traditionnel documenté.';
    const parts = p.traditional_medicine?.parts_used || 'Feuilles, sommités fleuries ou racines';
    const dosage = p.traditional_medicine?.dosage || 'En infusion ou décoction modérée (1 à 2 tasses/jour)';
    const tox = p.safety_profile?.toxicity || p.safety_profile?.contraindications || 'Données de sécurité standard.';
    const regions = p.distribution?.habitat_description || (p.distribution?.regions || []).join(', ') || 'Présente dans plusieurs écosystèmes d\'Algérie.';

    if (lang === 'ar') {
      return `### 🌿 **${sci}** ${vern}
* **الفصيلة النباتية** : ${fam}
* **الاستعمالات الطبية والفوائد** : ${uses}
* **الأجزاء المستعملة وطريقة التحضير** : ${parts} | ${dosage}
* **السلامة والمحاذير** : ${tox}
* **البيئة والانتشار في الجزائر** : ${regions}`;
    } else if (lang === 'en') {
      return `### 🌿 **${sci}** ${vern}
* **Family**: ${fam}
* **Medicinal Uses**: ${uses}
* **Parts Used & Preparation**: ${parts} | ${dosage}
* **Safety & Warnings**: ${tox}
* **Distribution in Algeria**: ${regions}`;
    } else {
      return `### 🌿 **${sci}** ${vern}
* **Famille botanique** : ${fam}
* **Vertus & Usages thérapeutiques** : ${uses}
* **Parties utilisées & Préparation** : ${parts} | ${dosage}
* **Précautions d'emploi & Sécurité** : ${tox}
* **Habitat & Présence en Algérie** : ${regions}`;
    }
  }

  buildSystemPrompt(plants, lang) {
    const plantSnippets = plants && plants.length > 0
      ? plants.map(p => this.formatPlantSnippet(p, lang)).join('\n\n---\n\n')
      : 'Aucune fiche botanique spécifique requise pour cette question générale.';

    const langName = lang === 'ar' ? 'Arabe' : lang === 'en' ? 'Anglais' : 'Français';

    return `Tu es Dr. DzHerba AI, le médecin phytothérapeute et chercheur en ethnobotanique d'élite de la plateforme DzHerba (Algérie).
Tu es un expert reconnu de la pharmacopée traditionnelle et moderne d'Algérie et du Maghreb, couvrant les 773 espèces médicinales répertoriées.

DIRECTIVES D'EXCELLENCE :
1. Langue : Réponds avec élégance, clarté et précision en ${langName}. Si l'utilisateur parle en Darija algérienne ou en Arabe, réponds-lui naturellement en Arabe avec les termes vernaculaires algériens (ex: الشيح، الزعتر، المريوت، الحرميل، الضرو، الفليو...).
2. Ton : Professionnel, scientifique, bienveillant, digne d'un professeur en pharmacologie clinique.
3. Données de référence DzHerba extraites du catalogue officiel :
${plantSnippets}
4. Règles conversationnelles et RAG :
 - Si la question concerne des plantes, utilise prioritairement les données officielles DzHerba ci-dessus.
 - Si la question est générale (salutations, méthodologie d'infusion vs décoction, chimie végétale, conseils d'hygiène), réponds de façon complète et pédagogique grâce à tes profondes connaissances botaniques sans jamais bloquer ni dire "je ne sais pas".
 - Retiens le fil de la discussion avec l'utilisateur (mémoire multi-tour).
5. Sécurité : Mentionne TOUJOURS avec rigueur les contre-indications majeures (femmes enceintes, allaitement, enfants, insuffisance rénale/hépatique, interactions avec anticoagulants ou antidiabétiques).
6. Formatage : Utilise un Markdown soigné avec titres, puces, gras pour les noms scientifiques et vernaculaires.`;
  }

  // -------------------------------------------------------------
  // BRANCHE B : Moteur Botanique NLP Enrichi (100% Hors-Ligne)
  // -------------------------------------------------------------
  generateEnrichedOfflineResponse(query, history = [], plants = [], lang = 'fr') {
    const qNorm = normalizeSearchText(query);

    // 1. Détection de salutations ou question d'identité
    const greetings = ['bonjour', 'salut', 'coucou', 'bonsoir', 'salam', 'hello', 'hi', 'مرحبا', 'سلام', 'صباح الخير', 'مساء الخير', 'qui es tu', 'qui est tu', 'من انت', 'ما هو اسمك'];
    const isGreeting = greetings.some(g => qNorm.includes(g));

    if (isGreeting && (!plants || plants.length === 0 || query.trim().length <= 30)) {
      if (lang === 'ar') {
        return {
          response: `وعليكم السلام ورحمة الله وبركاته ! مرحباً بك في **DzHerba AI** 🌿
أنا مساعدك الذكي المتخصص في **طب الأعشاب والفلورا الطبية للجزائر**.

يمكنني مساعدتك في :
• **التعرف على فوائد واستعمالات 773 نبتة جزائرية** (مثل الشيح، الزعتر، الضرو، الحرميل، المريوت...).
• **طرق التحضير الصيدلانية** (المغلي، المنقوع، التقطير، الضمادات).
• **دواعي ومحاذير الاستعمال والسلامة الدوائية** خاصة لأصحاب الأمراض المزمنة.

ما هو السؤال أو النبتة التي تود البحث عنها اليوم ؟`,
          plants: [],
          language: 'ar',
          engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
        };
      } else if (lang === 'en') {
        return {
          response: `Hello and welcome to **DzHerba AI** 🌿
I am your specialized intelligence assistant dedicated to the **773 medicinal plant species of Algeria**.

How I can help you today:
• **Pharmacological uses & ethnobotanical virtues** of Algerian plants (Wormwood, Thyme, Lentisc, Rue, Sage, etc.).
• **Preparation methods**: infusions, decoctions, macerations, and poultices.
• **Safety profiles & drug interactions**: dosages, pregnancy contraindications, and toxicity profiles.

Feel free to ask any question regarding plants, symptoms, or remedies!`,
          plants: [],
          language: 'en',
          engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
        };
      } else {
        return {
          response: `Bonjour et bienvenue sur **DzHerba AI** 🌿
Je suis votre assistant scientifique d'élite spécialisé dans les **773 plantes médicinales de la flore algérienne**.

Je suis à votre disposition pour :
• **Explorer les vertus et applications thérapeutiques** des espèces locales (*Chih, Zaatar, Mriout, Lentisque/Dharw, Harmel, Baboudj...*).
• **Maîtriser les méthodes galéniques** (*infusion, décoction, macération, cataplasme*).
• **Valider la sécurité et les contre-indications** (*grossesse, enfants, interactions médicamenteuses*).

Quelle plante ou indication thérapeutique souhaitez-vous explorer aujourd'hui ?`,
          plants: [],
          language: 'fr',
          engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
        };
      }
    }

    // 2. Détection de questions méthodologiques (Infusion vs Décoction vs Macération)
    if (qNorm.includes('infusion') || qNorm.includes('decoction') || qNorm.includes('maceration') || qNorm.includes('tisane') || qNorm.includes('منقوع') || qNorm.includes('مغلي')) {
      if (lang === 'ar') {
        return {
          response: `### ☕ **دليل طرق التحضير الصيدلاني للأعشاب الطبية (DzHerba)**

1. **المنقوع (Infusion) :**
   * **للأجزاء الرقيقة** : الأوراق، الأزهار، والأعشاب العطرية (مثل النعناع، الزعتر، البابونج).
   * **الطريقة** : يُسكب الماء المغلي فوق النبتة وتُغطى فوراً لمنع تطاير الزيوت الأساسية لمدة 5 إلى 10 دقائق ثم تُصفى.

2. **المغلي (Décoction) :**
   * **للأجزاء الصلبة والصلصية** : الجذور، اللحاء، والأخشاب (مثل جذور السوس، بذور الكروياء، لحاء البلوط).
   * **الطريقة** : تُغلى النبتة في الماء البارد وتُترك تغلي على نار هادئة لمدة 10 إلى 20 دقيقة لاستخلاص المركبات العميقة.

3. **النقع البارد (Macération) :**
   * **للنباتات الحساسة للحرارة** : تُترك النبتة في ماء بارد أو زيت لعدة ساعات إلى أيام لاستخلاص العناصر النشطة دون تدميرها.

⚠️ **قاعدة ذهبية** : غطِّ دائماً الكوب أو الوعاء أثناء التحضير للحفاظ على الزيوت العطرية والمكونات الفعالة.`,
          plants: [],
          language: 'ar',
          engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
        };
      } else {
        return {
          response: `### ☕ **Guide Pratique des Méthodes d'Extraction Végétale (DzHerba)**

La méthode d'extraction détermine l'efficacité et la biodisponibilité des principes actifs de la plante :

1. **L'Infusion (Pour parties tendres)** :
   - **Organes concernés** : Fleurs, feuilles délicates, sommités fleuries (*ex : Thym/Zaatar, Camomille, Menthe/Fliyou*).
   - **Mode opératoire** : Versez de l'eau frémissante (non bouillante, env. 85-90°C) sur les plantes, **couvrez immédiatement** pour piéger les huiles essentielles volatiles, laissez infuser 5 à 10 minutes, puis filtrez.

2. **La Décoction (Pour parties dures)** :
   - **Organes concernés** : Racines, écorces, graines coriaces, baies (*ex : Réglisse, Écorce de Grenadier, Graines de Fenugrec*).
   - **Mode opératoire** : Placez les plantes dans l'eau froide, portez à ébullition et maintenez un frémissement à couvert pendant 10 à 20 minutes, puis filtrez.

3. **La Macération (À froid)** :
   - **Organes concernés** : Espèces thermosensibles ou mucilagineuses (*ex : Guimauve, Graines de Lin*).
   - **Mode opératoire** : Les plantes reposent dans de l'eau froide, de l'huile ou de l'alcool pendant plusieurs heures ou jours.

⚠️ **Conseil d'expert** : Ne réchauffez jamais une infusion au micro-ondes car cela dégrade les flavonoïdes et polyphénols antioxydants.`,
          plants: [],
          language: 'fr',
          engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
        };
      }
    }

    // 3. Si des plantes ont été trouvées, formater une réponse clinique détaillée
    if (plants && plants.length > 0) {
      const snippets = plants.map(p => this.formatPlantSnippet(p, lang)).join('\n\n---\n\n');
      let intro = '';
      let footer = '';

      if (lang === 'ar') {
        intro = `🌱 **بناءً على السجل الوطني للنباتات الطبية الجزائرية (DzHerba)، إليك أهم الأنواع الموثقة علمياً لاستفسارك :**\n\n`;
        footer = `\n\n⚠️ **تنبيه السلامة الدوائية :**
الأعشاب الطبية تحتوي على جزيئات كيميائية نشطة بيولوجياً. يُرجى دائماً احترام المقادير، واستشارة الطبيب أو الصيدلي في حال وجود حمل، رضاعة، أو أمراض مزمنة (السكري، الضغط، تخثر الدم).`;
      } else if (lang === 'en') {
        intro = `🌱 **Based on the Algerian Medicinal Flora database (DzHerba), here are the most documented species regarding your query:**\n\n`;
        footer = `\n\n⚠️ **Pharmacological Safety Advisory:**
Medicinal plants contain potent bioactive constituents. Always adhere to recommended dosages and consult a healthcare provider during pregnancy, nursing, or concurrent chronic medication.`;
      } else {
        intro = `🌱 **D'après le corpus scientifique de la flore médicinale d'Algérie (DzHerba), voici les espèces documentées pour votre demande :**\n\n`;
        footer = `\n\n⚠️ **Recommandation Déontologique & Sécurité :**
Les plantes médicinales contiennent des principes actifs puissants. Respectez toujours les dosages préconisés et prenez conseil auprès d'un professionnel de santé, particulièrement en cas de **grossesse, allaitement, ou traitement médical régulier (anticoagulants, antidiabétiques)**.`;
      }

      return {
        response: intro + snippets + footer,
        plants,
        language: lang,
        engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
      };
    }

    // 4. Fallback si aucune plante n'a directement matché
    if (lang === 'ar') {
      return {
        response: `مرحباً بك في **DzHerba AI**.
لم أعثر على مطابقة مباشرة مع السؤال : *"${query}"*.

💡 **أمثلة واستفسارات مقترحة :**
• اسأل عن نبات بالدارجة أو اللاتينية : *الشيح (Artemisia)، الزعتر (Thymus)، الحرميل (Peganum harmala)، الضرو (Pistacia lentiscus)*.
• اسأل عن أعراض أو أمراض : *علاج السعال، آلام المفاصل، مهدئ للمعدة، تنشيط الكبد*.
• اسأل عن السلامة : *أعشاب ممنوعة للحامل، سمية الدفلة*.`,
        plants: [],
        language: 'ar',
        engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
      };
    } else {
      return {
        response: `Bonjour ! Je suis **l'Assistant IA de DzHerba**, spécialisé dans la flore médicinale d'Algérie.
Je n'ai pas trouvé de correspondance botanique exacte pour : *« ${query} »*.

💡 **Conseils pour votre recherche :**
• Nommez une plante en français, latin ou arabe (*ex : Chih, Thym/Zaatar, Marjolaine, Marroubier/Mriout, Harmel, Lentisque/Dharw*).
• Décrivez une pathologie (*ex : « Quelles plantes pour calmer la toux ? », « Plantes pour les maux d'estomac », « Remède pour cicatriser »*).
• Posez une question de pharmacovigilance (*ex : « Contre-indications de la sauge », « Toxicité du laurier rose »*).`,
        plants: [],
        language: 'fr',
        engine: 'DzHerba Expert NLP (100% Hors-Ligne)'
      };
    }
  }

  // -------------------------------------------------------------
  // BRANCHE A : LLM Distants Professionnels (Gemini, Groq, OpenAI)
  // -------------------------------------------------------------

  async callGeminiAPI(query, history = [], plants = [], lang = 'fr', apiKey, customModel) {
    const model = customModel || 'gemini-1.5-flash';
    const systemPrompt = this.buildSystemPrompt(plants, lang);

    // Build multi-turn conversation
    const contents = [];

    // History turns
    if (Array.isArray(history) && history.length > 0) {
      for (const msg of history.slice(-6)) {
        const text = msg.text || msg.content || '';
        if (!text) continue;
        const role = (msg.role === 'assistant' || msg.sender === 'assistant') ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    // Current user query
    contents.push({
      role: 'user',
      parts: [{ text: query }]
    });

    const payload = JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'Gemini API Error'));
            }
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout communication Google Gemini'));
      });
      req.write(payload);
      req.end();
    });
  }

  async callGroqAPI(query, history = [], plants = [], lang = 'fr', apiKey, customModel) {
    const model = customModel || 'llama-3.3-70b-versatile';
    const systemPrompt = this.buildSystemPrompt(plants, lang);

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        const text = msg.text || msg.content || '';
        if (!text) continue;
        const role = (msg.role === 'assistant' || msg.sender === 'assistant') ? 'assistant' : 'user';
        messages.push({ role, content: text });
      }
    }

    messages.push({ role: 'user', content: query });

    const payload = JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 2048
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'Groq API Error'));
            }
            const text = parsed.choices?.[0]?.message?.content;
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout communication Groq'));
      });
      req.write(payload);
      req.end();
    });
  }

  async callOpenAIAPI(query, history = [], plants = [], lang = 'fr', apiKey, customModel) {
    const model = customModel || 'gpt-4o-mini';
    const systemPrompt = this.buildSystemPrompt(plants, lang);

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        const text = msg.text || msg.content || '';
        if (!text) continue;
        const role = (msg.role === 'assistant' || msg.sender === 'assistant') ? 'assistant' : 'user';
        messages.push({ role, content: text });
      }
    }

    messages.push({ role: 'user', content: query });

    const payload = JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 2048
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              return reject(new Error(parsed.error.message || 'OpenAI API Error'));
            }
            const text = parsed.choices?.[0]?.message?.content;
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout communication OpenAI'));
      });
      req.write(payload);
      req.end();
    });
  }

  // -------------------------------------------------------------
  // ORCHESTRATION CENTRALE (HYBRIDE RAG 2.0)
  // -------------------------------------------------------------
  async answerQuestion(query, history = [], options = {}) {
    const lang = options.language || this.detectLanguage(query);
    const limit = options.limit || 3;
    const matchedPlants = this.searchGroundedPlants(query, history, limit);

    // Clés API prioritaires : soit passée par la requête utilisateur (options.apiKey), soit variable d'environnement
    const clientProvider = (options.provider || '').toLowerCase();
    const clientApiKey = (options.apiKey || '').trim();
    const customModel = options.model;

    const envGeminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const envOpenAIKey = process.env.OPENAI_API_KEY;
    const envGroqKey = process.env.GROQ_API_KEY;

    // 1. Branche A - Groq
    if ((clientProvider === 'groq' && clientApiKey) || (!clientApiKey && clientProvider === 'groq' && envGroqKey)) {
      try {
        const key = clientApiKey || envGroqKey;
        const answer = await this.callGroqAPI(query, history, matchedPlants, lang, key, customModel);
        if (answer) {
          return {
            response: answer,
            plants: matchedPlants,
            language: lang,
            engine: `Groq (${customModel || 'Llama 3.3 70B'})`
          };
        }
      } catch (err) {
        console.warn('[DzHerba RAG] Erreur Groq, repli sur local :', err.message);
      }
    }

    // 2. Branche A - Google Gemini (Par défaut si clé Gemini disponible ou fournie)
    const geminiKey = (clientProvider === 'gemini' && clientApiKey) || (clientApiKey && clientApiKey.startsWith('AIza')) || envGeminiKey;
    if (geminiKey && clientProvider !== 'openai' && clientProvider !== 'groq' && clientProvider !== 'local') {
      try {
        const answer = await this.callGeminiAPI(query, history, matchedPlants, lang, geminiKey, customModel);
        if (answer) {
          return {
            response: answer,
            plants: matchedPlants,
            language: lang,
            engine: `Google Gemini (${customModel || '1.5 Flash'})`
          };
        }
      } catch (err) {
        console.warn('[DzHerba RAG] Erreur Gemini, repli sur local :', err.message);
      }
    }

    // 3. Branche A - OpenAI
    const openAIKey = (clientProvider === 'openai' && clientApiKey) || (clientApiKey && clientApiKey.startsWith('sk-')) || envOpenAIKey;
    if (openAIKey && clientProvider !== 'local') {
      try {
        const answer = await this.callOpenAIAPI(query, history, matchedPlants, lang, openAIKey, customModel);
        if (answer) {
          return {
            response: answer,
            plants: matchedPlants,
            language: lang,
            engine: `OpenAI (${customModel || 'GPT-4o-mini'})`
          };
        }
      } catch (err) {
        console.warn('[DzHerba RAG] Erreur OpenAI, repli sur local :', err.message);
      }
    }

    // 4. Branche B : Moteur Botanique NLP Enrichi (100% Hors-Ligne & Autonome)
    return this.generateEnrichedOfflineResponse(query, history, matchedPlants, lang);
  }
}

module.exports = new BotanicalRagEngine();
