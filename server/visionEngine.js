const crypto = require('crypto');
const https = require('https');

/**
 * Autonomous Computer Vision Biometrics Analyzer
 * Checks for botanical chromatic fingerprints, excess green index (ExG), floral pigments, and non-plant cues.
 */
function analyzeBotanicalBiometrics(buffer) {
  let plantPixels = 0;
  let nonPlantPixels = 0;
  let skinTonePixels = 0;
  let greyOrNeutralPixels = 0;
  let bluePixels = 0;
  let totalSamples = 0;

  let totalR = 0, totalG = 0, totalB = 0;

  // Stride through buffer sampling up to 1200 RGB points
  const step = Math.max(1, Math.floor(buffer.length / 1200));
  for (let i = 0; i < buffer.length - 3; i += step * 3) {
    totalSamples++;
    const r = buffer[i];
    const g = buffer[i + 1];
    const b = buffer[i + 2];

    totalR += r;
    totalG += g;
    totalB += b;

    const exg = 2 * g - r - b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    // 1. Grey, metallic, concrete, monochrome, or dark/white neutral
    const isNeutral = (delta < 22) || (max < 30) || (min > 235);

    // 2. Human skin tone (melanin profile)
    const isSkin = !isNeutral && (r > g && g > b && (r - g) > 20 && (r - g) < 85 && (g - b) > 10 && r > 110);

    // 3. Screen, electronics, clear sky blue
    const isBlueOrSky = !isNeutral && (b > 110 && b > (r * 1.2) && b > (g * 1.1));

    // 4. Botanical foliage (chlorophyll profile)
    const isFoliage = !isNeutral && !isSkin && (
      (g > r && g > b && exg > 18) ||
      (g > 65 && g > (r * 1.15) && g > (b * 1.15))
    );

    // 5. Floral pigments (carotenoids, anthocyanins: vivid yellow, violet, purple, intense red)
    const isFloralYellow = !isNeutral && (r > 130 && g > 110 && b < 110 && (r + g) > 250 && delta > 30);
    const isFloralPurple = !isNeutral && (r > 110 && b > 110 && g < Math.min(r, b) - 20 && delta > 25);
    const isFloralRed = !isNeutral && (r > 140 && g < 100 && b < 100 && delta > 40);

    if (isFoliage || isFloralYellow || isFloralPurple || isFloralRed) {
      plantPixels++;
    } else if (isSkin) {
      skinTonePixels++;
      nonPlantPixels++;
    } else if (isNeutral) {
      greyOrNeutralPixels++;
      nonPlantPixels++;
    } else if (isBlueOrSky) {
      bluePixels++;
      nonPlantPixels++;
    } else {
      nonPlantPixels++;
    }
  }

  const plantRatio = +(plantPixels / Math.max(1, totalSamples)).toFixed(3);
  const skinRatio = +(skinTonePixels / Math.max(1, totalSamples)).toFixed(3);
  const neutralRatio = +(greyOrNeutralPixels / Math.max(1, totalSamples)).toFixed(3);
  const blueRatio = +(bluePixels / Math.max(1, totalSamples)).toFixed(3);

  // A valid plant image must exhibit significant vegetation or floral ratio
  // and must NOT be dominated by skin, metallic, neutral, or screen colors.
  const isPlant = (
    plantRatio >= 0.22 &&
    skinRatio < 0.35 &&
    neutralRatio < 0.60 &&
    blueRatio < 0.60
  );

  return {
    isPlant,
    plantRatio,
    skinRatio,
    neutralRatio,
    blueRatio,
    totalSamples,
    plantPixels
  };
}

/**
 * Call Gemini Multimodal Vision API if key available
 */
async function callGeminiVision(base64Image, mimeType, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Tu es un système de reconnaissance botanique pour la flore d'Algérie et de Méditerranée.
Analyse cette image et réponds STRICTEMENT avec un objet JSON valide suivant ce schéma exact:
{
  "isPlant": boolean,
  "accuracy": number (entre 0 et 100, ex: 94.5 si c'est une plante reconnue, ou 8.0 si ce n'est pas une plante),
  "scientificName": "Nom scientifique en latin (ex: Acanthus mollis) ou null si ce n'est pas une plante",
  "commonName": "Nom commun en français ou arabe, ou type d'objet détecté si non-plante (ex: voiture, visage, chat)",
  "explanation": "Courte explication claire (ex: Présence de feuilles dentées caractéristiques... OU L'image représente un véhicule et non un végétal.)"
}
RÈGLE OBLIGATOIRE: Si l'image n'est PAS une plante (ex: animal, visage, humain, voiture, bâtiment, objet domestique, nourriture cuisinée), "isPlant" DOIT ÊTRE FAUX (false) et "accuracy" inférieur à 20.`
          },
          {
            inline_data: {
              mime_type: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: "application/json"
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanText = text.replace(/```json\n?|\n?```/gi, '').trim();
            const result = JSON.parse(cleanText);
            return resolve(result);
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

module.exports = {
  analyzeBotanicalBiometrics,
  callGeminiVision
};
