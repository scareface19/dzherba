import { jsPDF } from 'jspdf';
import type { Plant, Language } from '../types';

/**
 * Checks if a string contains Arabic Unicode characters
 */
function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

/**
 * Sanitizes Latin/Western text to ensure no non-WinAnsi character (> 255) is sent to jsPDF.
 * When a character > 255 (like Greek α, β, superscript ², math ±, smart quotes) is passed to jsPDF
 * with standard 8-bit fonts (Helvetica), jsPDF converts the entire string to UTF-16BE with null bytes,
 * causing every letter to be followed by a space ("a n t i - p s o r i a t i c ..."), doubling its width
 * and overflowing the page margins!
 */
export function sanitizeForPdf(text: string): string {
  if (!text) return '';
  return text
    // Greek letters common in pharmacology & botany
    .replace(/[\u03B1\u0391]/g, 'alpha')
    .replace(/[\u03B2\u0392]/g, 'beta')
    .replace(/[\u03B3\u0393]/g, 'gamma')
    .replace(/[\u03B4\u0394]/g, 'delta')
    .replace(/[\u03BA\u039A]/g, 'kappa')
    .replace(/[\u03BB\u039B]/g, 'lambda')
    .replace(/[\u03BC\u039C]/g, 'mu')
    // Superscripts and subscripts
    .replace(/[\u00B2\u2082]/g, '2')
    .replace(/[\u00B3\u2083]/g, '3')
    .replace(/[\u00B9\u2081]/g, '1')
    .replace(/[\u2070\u2080]/g, '0')
    // Math and symbols
    .replace(/[\u00B1]/g, '+/-')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u00D7]/g, 'x')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u00B5]/g, 'u')
    // Punctuation, dashes, quotes
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '-')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    // Replace any remaining non-WinAnsi characters (> 255)
    .replace(/[^\x00-\xFF]/g, (char) => {
      const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return /^[\x00-\xFF]$/.test(normalized) ? normalized : ' ';
    });
}

/**
 * Renders Arabic text to a high-DPI HTML5 Canvas and exports a crisp PNG Data URL.
 * Solves the native jsPDF limitation with standard fonts lacking Arabic shaping & glyphs.
 */
function renderArabicToImage(
  text: string,
  maxWidthMm: number,
  fontSizePt: number = 9,
  color: string = '#111827',
  isBold: boolean = false,
  align: 'right' | 'left' = 'left'
): { dataUrl: string; widthMm: number; heightMm: number } | null {
  if (!text || !text.trim()) return null;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 3x High-DPI scale for razor-sharp typography on print and zoom
    const scale = 3;
    const pxSize = Math.round(fontSizePt * 1.333 * scale);
    const fontWeight = isBold ? '700' : '500';
    const fontFamily = "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
    ctx.font = `${fontWeight} ${pxSize}px ${fontFamily}`;

    const maxCanvasWidth = Math.round((maxWidthMm / 25.4) * 96 * scale);

    // Split text into words and wrap to avoid margin overflow
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxCanvasWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    if (lines.length === 0) return null;

    // Measure exact max line width
    let maxLineWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
      if (w > maxLineWidth) maxLineWidth = w;
    }

    const lineHeight = Math.round(pxSize * 1.45);
    const padX = Math.round(4 * scale);
    const padY = Math.round(3 * scale);

    const canvasWidth = Math.min(Math.max(maxLineWidth + padX * 2, 60), maxCanvasWidth);
    const canvasHeight = Math.max(lines.length * lineHeight + padY * 2, lineHeight);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Re-apply styles after canvas dimension reset
    ctx.font = `${fontWeight} ${pxSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.direction = 'rtl';
    ctx.textAlign = align === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'middle';

    let y = padY + lineHeight / 2;
    for (const line of lines) {
      if (line) {
        const x = align === 'right' ? canvasWidth - padX : padX;
        ctx.fillText(line, x, y);
      }
      y += lineHeight;
    }

    const dataUrl = canvas.toDataURL('image/png');
    const widthMm = (canvasWidth / (96 * scale)) * 25.4;
    const heightMm = (canvasHeight / (96 * scale)) * 25.4;

    return { dataUrl, widthMm, heightMm };
  } catch (err) {
    console.warn('Canvas Arabic render error:', err);
    return null;
  }
}

/**
 * Loads an image from URL and returns a Base64 data URL.
 * Fails gracefully within a short timeout if unavailable or blocked by CORS.
 */
async function loadImageAsBase64(url: string, timeoutMs: number = 1800): Promise<string | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      } catch (err) {
        console.warn('Canvas export error:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    };
    img.src = url;
  });
}

/**
 * Generates an official, strictly bounded scientific monograph PDF for a Plant and opens it in a new browser tab.
 * Perfectly renders Arabic names with native ligatures and ensures zero margin overflow.
 */
export async function exportPlantToPdf(plant: Plant, lang: Language = 'fr'): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Strict Geometry & Safe Zones (in mm)
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178 mm
  const headerHeight = 18;
  const marginTop = headerHeight + 8; // 26 mm
  const footerLineY = pageHeight - 12; // 285 mm
  const maxY = footerLineY - 8; // 277 mm (guaranteed safe buffer above footer)

  let currentY = marginTop;

  // DzHerba Brand Colors
  const primaryColor: [number, number, number] = [45, 74, 65];      // #2D4A41 (Deep Forest Green)
  const secondaryColor: [number, number, number] = [66, 107, 95];   // #426B5F (Emerald Green)
  const accentColor: [number, number, number] = [205, 152, 80];     // #CD9850 (Golden Amber)
  const darkTextColor: [number, number, number] = [17, 24, 39];     // Charcoal
  const mutedTextColor: [number, number, number] = [100, 116, 139]; // Slate muted
  const lightBgColor: [number, number, number] = [245, 243, 243];   // Soft Sand

  const labels = {
    fr: {
      title: "MONOGRAPHIE BOTANIQUE & PHARMACOLOGIQUE",
      source: "DzHerba • Encyclopédie Officielle de la Flore Médicinale d'Algérie",
      taxonomy: "CLASSIFICATION TAXONOMIQUE",
      family: "Famille",
      order: "Ordre",
      genus: "Genre",
      species: "Espèce",
      vernacular: "Noms vernaculaires & locaux (Algérie)",
      habitat: "DISTRIBUTION & HABITAT EN ALGÉRIE",
      biotope: "Biotope & Écologie",
      flowering: "Floraison & Période de Récolte",
      regions: "Wilayas & Régions recensées",
      traditional: "MÉDECINE TRADITIONNELLE & USAGES THÉRAPEUTIQUES",
      uses: "Indications & Usages empiriques",
      parts: "Parties végétales utilisées",
      dosage: "Posologie & Formes galéniques",
      pharmacology: "PHARMACOLOGIE & PROFIL PHYTOCHIMIQUE",
      activities: "Activités & Propriétés pharmacologiques",
      compounds: "Constituants bioactifs & Métabolites secondaires",
      safety: "SÉCURITÉ, TOXICOLOGIE & PRÉCAUTIONS",
      toxicity: "Profil de Toxicité",
      contraindications: "Contre-indications majeures",
      interactions: "Interactions médicamenteuses",
      references: "RÉFÉRENCES SCIENTIFIQUES & BIBLIOGRAPHIE",
      footer: "Document certifié DzHerba • Données floristiques et pharmacologiques algériennes",
      page: "Page",
      of: "sur",
    },
    ar: {
      title: "MONOGRAPHIE BOTANIQUE & PHARMACOLOGIQUE (DZHERBA)",
      source: "DzHerba • المرجع الوطني للنباتات الطبية والعطرية الجزائرية",
      taxonomy: "CLASSIFICATION TAXONOMIQUE / التصنيف العلمي",
      family: "Famille (العائلة)",
      order: "Ordre (الرتبة)",
      genus: "Genre (الجنس)",
      species: "Espèce (النوع)",
      vernacular: "Noms vernaculaires (الأسماء الشعبية)",
      habitat: "DISTRIBUTION & HABITAT / الموطن والانتشار",
      biotope: "Biotope & Climat (البيئة والمناخ)",
      flowering: "Floraison & Récolte (الإزهار والجني)",
      regions: "Wilayas recensées (الولايات)",
      traditional: "MÉDECINE TRADITIONNELLE / الطب الشعبي",
      uses: "Indications (الاستعمالات العلاجية)",
      parts: "Parties utilisées (الأجزاء المستعملة)",
      dosage: "Posologie (الجرعات والتحضير)",
      pharmacology: "PHARMACOLOGIE / علم الأدوية والمركبات",
      activities: "Activités démontrées (الأنشطة الدوائية)",
      compounds: "Profil phytochimique (المركبات الفعالة)",
      safety: "SÉCURITÉ & TOXICOLOGIE / الأمان وموانع الاستعمال",
      toxicity: "Toxicité (درجة الأمان والسمية)",
      contraindications: "Contre-indications (موانع الاستعمال)",
      interactions: "Interactions (التداخلات الدوائية)",
      references: "RÉFÉRENCES & BIBLIOGRAPHIE / المراجع العلمية",
      footer: "DzHerba • قاعدة البيانات الوطنية للنباتات الطبية الجزائرية",
      page: "Page",
      of: "sur",
    },
    en: {
      title: "BOTANICAL & PHARMACOLOGICAL MONOGRAPH",
      source: "DzHerba • Digital Encyclopedia of Algerian Medicinal Flora",
      taxonomy: "TAXONOMIC CLASSIFICATION",
      family: "Family",
      order: "Order",
      genus: "Genus",
      species: "Species",
      vernacular: "Vernacular & Local Names (Algeria)",
      habitat: "DISTRIBUTION & HABITAT IN ALGERIA",
      biotope: "Biotope & Ecology",
      flowering: "Flowering & Harvest Seasons",
      regions: "Documented Wilayas & Regions",
      traditional: "TRADITIONAL MEDICINE & THERAPEUTIC USES",
      uses: "Empirical Uses & Indications",
      parts: "Plant Parts Used",
      dosage: "Dosage & Formulations",
      pharmacology: "PHARMACOLOGY & PHYTOCHEMICAL PROFILE",
      activities: "Pharmacological Activities",
      compounds: "Bioactive Constituents & Secondary Metabolites",
      safety: "SAFETY, TOXICITY & PRECAUTIONS",
      toxicity: "Toxicity Profile",
      contraindications: "Major Contraindications",
      interactions: "Drug-Plant Interactions",
      references: "SCIENTIFIC REFERENCES & BIBLIOGRAPHY",
      footer: "Certified DzHerba Document • Algerian Flora Pharmacopoeia Database",
      page: "Page",
      of: "of",
    }
  };

  const l = labels[lang] || labels.fr;

  // Header banner for each page (strictly contained within headerHeight)
  const drawPageHeader = () => {
    // Top primary banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // DzHerba Brand Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('DzHerba', marginX, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...accentColor); // Gold
    doc.text('FLORE MÉDICINALE D\'ALGÉRIE', marginX + 22, 11);

    // Specimen ID & Date on Right margin
    const today = new Date().toLocaleDateString(lang === 'ar' ? 'fr-FR' : lang === 'en' ? 'en-US' : 'fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`Spécimen #${plant.id} • ${today}`, pageWidth - marginX, 11, { align: 'right' });

    // Gold accent separator bar
    doc.setFillColor(...accentColor);
    doc.rect(0, headerHeight, pageWidth, 1.2, 'F');
  };

  // Footer for each page (strictly positioned at bottom margin)
  const drawPageFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(225, 211, 190);
    doc.setLineWidth(0.35);
    doc.line(marginX, footerLineY, pageWidth - marginX, footerLineY);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(...mutedTextColor);
    doc.text(l.footer, marginX, footerLineY + 5);

    const pageStr = `${l.page} ${pageNum} ${l.of} ${totalPages}`;
    doc.text(pageStr, pageWidth - marginX, footerLineY + 5, { align: 'right' });
  };

  // Safe new page trigger: adds page, draws header, and resets currentY
  const addNewPage = () => {
    doc.addPage();
    drawPageHeader();
    currentY = marginTop;
  };

  // Line-by-line streaming printer: guarantees NO text ever exceeds maxY
  const printLines = (
    lines: string[],
    x: number,
    lineHeight: number,
    fontSize: number,
    color: [number, number, number],
    fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'
  ) => {
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);

    for (let i = 0; i < lines.length; i++) {
      if (currentY + lineHeight > maxY) {
        addNewPage();
        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);
        doc.setTextColor(...color);
      }
      doc.text(sanitizeForPdf(lines[i]), x, currentY);
      currentY += lineHeight;
    }
  };

  // Renders Arabic paragraph blocks using Canvas into PDF without margin overflow
  const printArabicBlock = (
    text: string,
    x: number,
    availableWidth: number,
    fontSizePt: number = 8.5,
    color: string = '#111827',
    isBold: boolean = false
  ) => {
    const paragraphs = text.split('\n').filter(p => p.trim());
    if (paragraphs.length === 0) {
      paragraphs.push(text);
    }

    for (const para of paragraphs) {
      const img = renderArabicToImage(para, availableWidth, fontSizePt, color, isBold, 'left');
      if (!img) continue;

      if (currentY + img.heightMm > maxY) {
        addNewPage();
      }
      doc.addImage(img.dataUrl, 'PNG', x, currentY, img.widthMm, img.heightMm);
      currentY += img.heightMm + 1.8;
    }
  };

  // Draw Section Header Block with strict boundary check
  const drawSectionHeader = (title: string) => {
    if (currentY + 18 > maxY) {
      addNewPage();
    }

    doc.setFillColor(...secondaryColor);
    doc.roundedRect(marginX, currentY, contentWidth, 6.5, 1.2, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text(sanitizeForPdf(title), marginX + 3.5, currentY + 4.5);
    currentY += 9.5;
  };

  // Draw Field Row with support for Arabic text shaping
  const drawField = (label: string, value?: string, indent: boolean = false) => {
    if (!value || !value.trim()) return;
    const cleanValue = value.trim();
    const x = indent ? marginX + 4 : marginX;
    const availableWidth = indent ? contentWidth - 8 : contentWidth;

    // Check if there is room for label
    if (currentY + 12 > maxY) {
      addNewPage();
    }

    // Label in bold
    const cleanLabel = sanitizeForPdf(`${label} :`);
    const labelLines = doc.splitTextToSize(cleanLabel, availableWidth);
    printLines(labelLines, x, 4.0, 8.2, primaryColor, 'bold');

    // If value contains Arabic text, render with native Cairo shaping to avoid mojibake
    if (containsArabic(cleanValue)) {
      printArabicBlock(cleanValue, x, availableWidth, 8.5, '#111827', false);
      currentY += 1.5;
      return;
    }

    // Standard Latin Value lines (strictly sanitized to prevent UTF-16 character spacing bugs)
    const sanitizedValue = sanitizeForPdf(cleanValue);
    const valueLines = doc.splitTextToSize(sanitizedValue, availableWidth);
    printLines(valueLines, x, 3.9, 8.0, darkTextColor, 'normal');

    currentY += 2.2; // breathing space
  };

  // --- INITIALIZE PAGE 1 ---
  drawPageHeader();
  currentY = marginTop;

  // Attempt to load plant photo if available
  let plantPhotoBase64: string | null = null;
  if (plant.images && plant.images.length > 0) {
    try {
      plantPhotoBase64 = await loadImageAsBase64(plant.images[0]);
    } catch (e) {
      console.warn('Image fetch timeout or failed for PDF:', e);
    }
  }

  // --- TOP HERO SPECIMEN BOX (Strict Bounds + Arabic Name Support) ---
  const imgSize = 32; // 32mm x 32mm
  const hasPhoto = Boolean(plantPhotoBase64);
  const textWidth = hasPhoto ? contentWidth - imgSize - 8 : contentWidth - 8;

  // Prepare text lines strictly bounded by textWidth
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(14);
  const nameLines = doc.splitTextToSize(sanitizeForPdf(plant.scientific_name || 'Spécimen Botanique'), textWidth);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const badgeText = sanitizeForPdf(`${plant.taxonomy.family || 'Astéracées'} • ${plant.taxonomy.order || 'Ordre non spécifié'}`.toUpperCase());
  const badgeLines = doc.splitTextToSize(badgeText, textWidth);

  const taxonText = sanitizeForPdf(`Genre : ${plant.taxonomy.genus || '-'} | Espèce : ${plant.taxonomy.species || '-'} | Réf Spécimen : #${plant.id}`);
  const taxonLines = doc.splitTextToSize(taxonText, textWidth);

  // Render Arabic Vernacular Image if Arabic is present
  let arabicHeroImg: { dataUrl: string; widthMm: number; heightMm: number } | null = null;
  let vernBlockHeight = 0;

  if (plant.vernacular_raw && plant.vernacular_raw.trim()) {
    if (containsArabic(plant.vernacular_raw)) {
      arabicHeroImg = renderArabicToImage(plant.vernacular_raw.trim(), textWidth, 10, '#CD9850', true, 'left');
      vernBlockHeight = 3.8 + (arabicHeroImg ? arabicHeroImg.heightMm + 1 : 4);
    } else {
      const vernLines = doc.splitTextToSize(`Noms locaux : ${plant.vernacular_raw}`, textWidth);
      vernBlockHeight = vernLines.length * 3.8 + 1;
    }
  }

  // Calculate dynamic card height to guarantee no overflow
  const textBlockHeight = 
    4 + // top padding
    nameLines.length * 5.2 +
    badgeLines.length * 3.8 +
    vernBlockHeight +
    taxonLines.length * 3.5 +
    4; // bottom padding

  const heroCardHeight = hasPhoto ? Math.max(imgSize + 8, textBlockHeight) : textBlockHeight;

  // Render hero card background strictly within margins
  doc.setFillColor(...lightBgColor);
  doc.setDrawColor(225, 211, 190);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, contentWidth, heroCardHeight, 2.5, 2.5, 'FD');

  // Render text inside hero card
  let cardCursorY = currentY + 5;

  // 1. Scientific Name
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  for (const line of nameLines) {
    doc.text(line, marginX + 4, cardCursorY);
    cardCursorY += 5.2;
  }

  // 2. Taxonomy Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentColor);
  for (const line of badgeLines) {
    doc.text(line, marginX + 4, cardCursorY);
    cardCursorY += 3.8;
  }

  // 3. Vernacular Names (with authentic Arabic calligraphy)
  if (plant.vernacular_raw && plant.vernacular_raw.trim()) {
    cardCursorY += 0.8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkTextColor);
    doc.text('Noms locaux (Algérie) :', marginX + 4, cardCursorY);
    cardCursorY += 3.8;

    if (arabicHeroImg) {
      doc.addImage(arabicHeroImg.dataUrl, 'PNG', marginX + 4, cardCursorY - 1, arabicHeroImg.widthMm, arabicHeroImg.heightMm);
      cardCursorY += arabicHeroImg.heightMm + 1;
    } else {
      const vernLines = doc.splitTextToSize(plant.vernacular_raw, textWidth);
      for (const line of vernLines) {
        doc.text(line, marginX + 4, cardCursorY);
        cardCursorY += 3.8;
      }
    }
  }

  // 4. Taxon description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...mutedTextColor);
  for (const line of taxonLines) {
    doc.text(line, marginX + 4, cardCursorY);
    cardCursorY += 3.5;
  }

  // 5. Embedded photo thumbnail (strictly bounded on the right)
  if (plantPhotoBase64) {
    try {
      const imgX = marginX + contentWidth - imgSize - 4;
      const imgY = currentY + 4;
      doc.addImage(plantPhotoBase64, 'JPEG', imgX, imgY, imgSize, imgSize);
      doc.setDrawColor(...accentColor);
      doc.setLineWidth(0.5);
      doc.roundedRect(imgX, imgY, imgSize, imgSize, 1, 1, 'D');
    } catch (err) {
      console.warn('Failed to embed thumbnail in jsPDF:', err);
    }
  }

  currentY += heroCardHeight + 5;

  // --- SECTION 1: CLASSIFICATION TAXONOMIQUE ---
  drawSectionHeader(l.taxonomy);
  const taxoText = `• Règne : ${plant.taxonomy.kingdom || 'Plantae'}   • Ordre : ${plant.taxonomy.order || 'N/A'}   • Famille : ${plant.taxonomy.family || 'N/A'}   • Genre : ${plant.taxonomy.genus || 'N/A'}   • Espèce : ${plant.taxonomy.species || 'N/A'}`;
  drawField('Détails taxinomiques', taxoText);
  if (plant.vernacular_raw) {
    drawField(l.vernacular, plant.vernacular_raw);
  }

  // --- SECTION 2: DISTRIBUTION GÉOGRAPHIQUE & HABITAT EN ALGÉRIE ---
  drawSectionHeader(l.habitat);
  drawField(l.biotope, plant.distribution?.habitat_description);
  drawField(l.flowering, plant.distribution?.flowering_harvesting);
  if (plant.distribution?.regions && plant.distribution.regions.length > 0) {
    drawField(l.regions, plant.distribution.regions.join(' • '));
  }

  // --- SECTION 3: MÉDECINE TRADITIONNELLE & PHARMACOPÉE POPULAIRE ---
  drawSectionHeader(l.traditional);
  drawField(l.uses, plant.traditional_medicine?.uses);
  drawField(l.parts, plant.traditional_medicine?.parts_used);
  drawField(l.dosage, plant.traditional_medicine?.dosage);

  // --- SECTION 4: PHARMACOLOGIE & PROFIL PHYTOCHIMIQUE ---
  drawSectionHeader(l.pharmacology);
  drawField(l.activities, plant.pharmacology?.activities);
  drawField(l.compounds, plant.pharmacology?.phytochemical_profile);

  // --- SECTION 5: SÉCURITÉ, TOXICOLOGIE & PRÉCAUTIONS ---
  drawSectionHeader(l.safety);
  drawField(l.toxicity, plant.safety_profile?.toxicity);
  drawField(l.contraindications, plant.safety_profile?.contraindications);
  drawField(l.interactions, plant.safety_profile?.drug_interactions);
  if (plant.safety_profile?.plant_interactions) {
    drawField('Interactions avec d\'autres plantes', plant.safety_profile.plant_interactions);
  }

  // --- SECTION 6: DONNÉES SCIENTIFIQUES & RÉFÉRENCES ---
  if (plant.scientific_data?.experimental || plant.scientific_data?.clinical || plant.references) {
    drawSectionHeader(l.references);
    drawField('Données expérimentales', plant.scientific_data?.experimental);
    drawField('Données & Essais cliniques', plant.scientific_data?.clinical);
    drawField('Bibliographie & Flores de référence', plant.references);
  }

  // --- RENDER FOOTERS ACROSS ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(i, totalPages);
  }

  // Generate Blob and Open in New Tab
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const newTab = window.open(blobUrl, '_blank');

  // Fallback if popup blocker prevented direct window.open
  if (!newTab) {
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.target = '_blank';
    downloadLink.download = `Monographie_${plant.scientific_name.replace(/[^a-zA-Z0-9_-]/g, '_')}_DzHerba.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
