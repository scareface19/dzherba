/**
 * DzHerba - Moteur RAG & Assistant IA Botanique Souple
 * Grounded sur les 773 espèces médicinales de la flore algérienne.
 * Supporte le mode local 100% hors-ligne et les LLMs distants (Gemini, OpenAI, Ollama).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { expandSearchQuery, normalizeSearchText } = require('./multilingualSearch');

const JSON_PATH = path.resolve(__dirname, '..', 'data', 'plants.json');

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
    if (arabicMatches && arabicMatches.length >= 3) {
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

  searchGroundedPlants(query, limit = 4) {
    if (!query || this.plants.length === 0) return [];

    const normQuery = normalizeSearchText(query);
    const expandedTerms = expandSearchQuery(query);
    const queryTokens = normQuery.split(/\s+/).filter(t => t.length >= 2);

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
      const family = normalizeSearchText(p.taxonomy?.family || '');
      const uses = normalizeSearchText(p.traditional_medicine?.uses || '');
      const parts = normalizeSearchText(p.traditional_medicine?.parts_used || '');
      const activities = normalizeSearchText(p.pharmacology?.activities || '');
      const phyto = normalizeSearchText(p.pharmacology?.phytochemical_profile || '');
      const tox = normalizeSearchText(p.safety_profile?.toxicity || '');
      const regions = normalizeSearchText((p.distribution?.regions || []).join(' ') + ' ' + (p.distribution?.habitat_description || ''));

      // 1. Correspondance exacte sur le nom de la plante
      for (const term of expandedTerms) {
        if (term.length >= 3) {
          if (sci.includes(term)) score += 60;
          if (vern.includes(term)) score += 50;
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
      for (const [topic, words] of Object.entries(conditionKeywords)) {
        const queryHasTopic = words.some(w => normQuery.includes(w));
        if (queryHasTopic) {
          const plantHasTopic = words.some(w => uses.includes(w) || activities.includes(w));
          if (plantHasTopic) {
            score += 25;
          }
        }
      }

      if (score > 0) {
        // Bonus si la plante dispose d'une photo et d'une monographie complète
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
    const regions = p.distribution?.habitat_description || 'Présente dans plusieurs écosystèmes d\'Algérie.';

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

  generateDeterministicResponse(query, plants, lang) {
    if (!plants || plants.length === 0) {
      if (lang === 'ar') {
        return {
          response: `مرحباً بك في **المساعد الذكي لفهرس النباتات الطبية الجزائرية (DzHerba)**.
لم أعثر على مطابقة مباشرة لسؤالك: *"${query}"*.

💡 **نصائح للبحث :**
• يمكنك السؤال باسم العشبة بالدارجة أو العربية (مثل: **الشيح، الزعتر، المريوت، الحرميل، الضرو، القريص**).
• أو بالاسم العلمي اللاتيني (مثل: *Artemisia herba-alba*, *Thymus algeriensis*).
• أو بذكر العَرَض أو المرض (مثل: *مغص المعدة، السعال، داء السكري، آلام المفاصل، الحروق*).`,
          plants: [],
          language: 'ar'
        };
      } else if (lang === 'en') {
        return {
          response: `Welcome to **DzHerba Botanical AI Assistant**.
I couldn't find an exact match for: *"${query}"*.

💡 **Search tips:**
• Ask for specific Algerian plants by common name (*e.g., Wormwood, Thyme, Rosemary, Rue, Horehound*).
• Or search by condition (*e.g., digestive issues, cough, skin wounds, diabetes, rheumatism*).
• Or use botanical binomial Latin names (*e.g., Artemisia herba-alba, Marrubium vulgare*).`,
          plants: [],
          language: 'en'
        };
      } else {
        return {
          response: `Bonjour ! Je suis **l'Assistant IA de DzHerba**, spécialisé dans la flore médicinale d'Algérie.
Je n'ai pas trouvé de correspondance exacte pour votre requête : *« ${query} »*.

💡 **Conseils pour votre question :**
• Vous pouvez nommer une plante en arabe ou français (*ex : Chih, Zaatar, Marjolaine, Marroubier/Mriout, Harmel, Lentisque/Dharw*).
• Vous pouvez chercher par symptôme (*ex : « Quoi prendre pour calmer la toux ? », « Plantes pour les maux d'estomac », « Remède pour cicatriser »*).
• Vous pouvez poser une question de sécurité (*ex : « Contre-indications de la sauge », « Plantes toxiques »*).`,
          plants: [],
          language: 'fr'
        };
      }
    }

    // Formulation avec plantes trouvées
    const snippets = plants.map(p => this.formatPlantSnippet(p, lang)).join('\n\n---\n\n');

    let intro = '';
    let footer = '';

    if (lang === 'ar') {
      intro = `🌱 **بناءً على قاعدة بيانات الفلورا الطبية الجزائرية (DzHerba)، إليك أهم النباتات الموثقة علمياً وتراثياً بخصوص استفسارك :**\n\n`;
      footer = `\n\n⚠️ **تنبيه السلامة الدوائية والطبية :**
الأعشاب الطبية مركبات كيميائية فعالة. يرجى دائماً الالتزام بالجرعات المعتدلة، والحذر التام في حالات **الحمل، الإرضاع، أو تناول أدوية مزمنة (كمضادات التخثر أو أدوية السكري)**. استشر طبيباً أو صيدلانياً قبل أي استعمال مكثف.`;
    } else if (lang === 'en') {
      intro = `🌱 **Based on the Algerian Medicinal Flora database (DzHerba), here are the most documented species regarding your question:**\n\n`;
      footer = `\n\n⚠️ **Pharmacological Safety Advisory:**
Medicinal plants contain potent bioactive phytochemicals. Always exercise caution, particularly during **pregnancy, lactation, or concurrent medical treatment (anticoagulants, antidiabetics)**. Consult a healthcare specialist prior to therapeutic use.`;
    } else {
      intro = `🌱 **D'après le corpus scientifique de la flore médicinale d'Algérie (DzHerba), voici les espèces documentées pour votre demande :**\n\n`;
      footer = `\n\n⚠️ **Recommandation Déontologique & Sécurité :**
Les plantes médicinales contiennent des principes actifs puissants. Respectez toujours les dosages préconisés et prenez conseil auprès d'un professionnel de santé, particulièrement en cas de **grossesse, allaitement, ou traitement médical régulier (anticoagulants, antidiabétiques)**.`;
    }

    return {
      response: intro + snippets + footer,
      plants,
      language: lang
    };
  }

  async answerQuestion(query, history = [], options = {}) {
    const lang = options.language || this.detectLanguage(query);
    const limit = options.limit || 3;
    const matchedPlants = this.searchGroundedPlants(query, limit);

    // Vérifier si une clé d'API LLM distante est disponible (options explicites ou variables d'environnement)
    const geminiKey = options.geminiKey || (options.provider === 'gemini' ? options.apiKey : null) || options.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = options.openaiKey || (options.provider === 'openai' ? options.apiKey : null) || process.env.OPENAI_API_KEY;

    if (geminiKey && matchedPlants.length > 0) {
      try {
        const geminiAnswer = await this.callGeminiAPI(query, matchedPlants, lang, geminiKey);
        if (geminiAnswer) {
          return {
            response: geminiAnswer,
            plants: matchedPlants,
            language: lang,
            engine: 'Gemini 1.5 Flash (Grounded RAG)'
          };
        }
      } catch (err) {
        console.warn('[DzHerba RAG] Erreur Gemini, fallback local instantané :', err.message);
      }
    }

    if (openaiKey && matchedPlants.length > 0) {
      try {
        const openaiAnswer = await this.callOpenAIAPI(query, matchedPlants, lang, openaiKey);
        if (openaiAnswer) {
          return {
            response: openaiAnswer,
            plants: matchedPlants,
            language: lang,
            engine: 'OpenAI GPT-4o-mini (Grounded RAG)'
          };
        }
      } catch (err) {
        console.warn('[DzHerba RAG] Erreur OpenAI, fallback local instantané :', err.message);
      }
    }

    // Génération locale déterministe enrichie (0 ms, 100% offline et autonome)
    const localRes = this.generateDeterministicResponse(query, matchedPlants, lang);
    localRes.engine = 'DzHerba Botanical RAG (Local Expert)';
    return localRes;
  }

  async callGeminiAPI(query, plants, lang, apiKey) {
    const context = plants.map(p => this.formatPlantSnippet(p, lang)).join('\n\n');
    const systemPrompt = `Tu es l'assistant d'élite en pharmacopée et flore médicinale d'Algérie pour la plateforme DzHerba.
Réponds à l'utilisateur de manière chaleureuse, précise et pédagogique dans la langue de sa question (${lang === 'ar' ? 'Arabe' : lang === 'en' ? 'Anglais' : 'Français'}).
Appuie-toi EXCLUSIVEMENT sur les données botaniques suivantes extraites de la base officielle DzHerba :
${context}

Structure ta réponse avec clarté :
1. Réponse directe et conseils
2. Fiches synthétiques des plantes concernées (nom latin, nom vernaculaire algérien, posologie, parties utilisées)
3. Mises en garde et sécurité.`;

    const payload = JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nQuestion de l'utilisateur : ${query}` }]
        }
      ]
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  async callOpenAIAPI(query, plants, lang, apiKey) {
    const context = plants.map(p => this.formatPlantSnippet(p, lang)).join('\n\n');
    const systemPrompt = `Tu es l'assistant d'élite en flore médicinale d'Algérie pour la plateforme DzHerba.
Réponds à la question de l'utilisateur avec précision et bienveillance dans sa langue (${lang === 'ar' ? 'Arabe' : lang === 'en' ? 'Anglais' : 'Français'}).
Base-toi sur les espèces algériennes suivantes extraites de DzHerba :
${context}`;

    const payload = JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.5
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
        timeout: 8000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = parsed.choices?.[0]?.message?.content;
            resolve(text || null);
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}

module.exports = new BotanicalRagEngine();
