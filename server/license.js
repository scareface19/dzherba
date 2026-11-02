const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRIAL_DURATION_DAYS = 15;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
const SECRET_SALT = 'DZHERBA_BOTANICAL_SALT_SECURE_2026';

// Paths to check for license
const appDataDir = path.join(process.env.APPDATA || process.env.LOCALAPPDATA || path.join(__dirname, '..'), 'DzHerba');
const primaryLicenseFile = path.join(appDataDir, '.dzherba_license.dat');
const fallbackLicenseFile = path.join(__dirname, '..', '.dzherba_license.dat');

// Valid official master keys
const MASTER_KEYS = [
  'DZHERBA-2026-COMMERCIAL-PRO',
  'DZHERBA-FULL-MASTER-773',
  'DZHERBA-UNIV-CAMPUS-2026'
];

function generateChecksum(data) {
  return crypto.createHmac('sha256', SECRET_SALT)
    .update(`${data.firstRunTimestamp}:${data.activated}:${data.licenseKey || ''}:${data.lastSeenTimestamp}`)
    .digest('hex');
}

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {}
  }
}

function loadLicense() {
  let fileToRead = null;
  if (fs.existsSync(primaryLicenseFile)) {
    fileToRead = primaryLicenseFile;
  } else if (fs.existsSync(fallbackLicenseFile)) {
    fileToRead = fallbackLicenseFile;
  }

  const now = Date.now();

  if (fileToRead) {
    try {
      const raw = fs.readFileSync(fileToRead, 'utf8');
      const data = JSON.parse(raw);
      
      // Detect backwards clock tampering
      if (data.lastSeenTimestamp && now < data.lastSeenTimestamp - 3600000) {
        console.warn('⚠️ Décalage d horloge système détecté');
      } else {
        data.lastSeenTimestamp = Math.max(data.lastSeenTimestamp || 0, now);
      }

      saveLicense(data);
      return data;
    } catch (e) {
      console.warn('Could not read license file, reinitializing:', e.message);
    }
  }

  // First run: Initialize 15-day trial
  const newLicense = {
    firstRunTimestamp: now,
    lastSeenTimestamp: now,
    trialDays: TRIAL_DURATION_DAYS,
    activated: false,
    licenseKey: null,
    activatedAt: null,
    checksum: ''
  };
  newLicense.checksum = generateChecksum(newLicense);
  saveLicense(newLicense);
  return newLicense;
}

function saveLicense(data) {
  data.checksum = generateChecksum(data);
  const json = JSON.stringify(data, null, 2);
  try {
    ensureDirExists(primaryLicenseFile);
    fs.writeFileSync(primaryLicenseFile, json, 'utf8');
  } catch (e) {}
  try {
    ensureDirExists(fallbackLicenseFile);
    fs.writeFileSync(fallbackLicenseFile, json, 'utf8');
  } catch (e) {}
}

function getLicenseStatus() {
  const license = loadLicense();
  const now = Date.now();

  if (license.activated) {
    return {
      status: 'activated',
      isExpired: false,
      trialActive: false,
      isActivated: true,
      licenseKey: license.licenseKey,
      daysRemaining: 99999,
      totalTrialDays: TRIAL_DURATION_DAYS,
      message: 'Licence Commerciale DzHerba Activée'
    };
  }

  const elapsedMs = Math.max(0, now - license.firstRunTimestamp);
  const remainingMs = Math.max(0, TRIAL_DURATION_MS - elapsedMs);
  const daysRemaining = Math.max(0, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));
  const isExpired = elapsedMs >= TRIAL_DURATION_MS;

  return {
    status: isExpired ? 'expired' : 'trial',
    isExpired,
    trialActive: !isExpired,
    isActivated: false,
    daysRemaining,
    firstRunDate: new Date(license.firstRunTimestamp).toISOString(),
    expiresAt: new Date(license.firstRunTimestamp + TRIAL_DURATION_MS).toISOString(),
    totalTrialDays: TRIAL_DURATION_DAYS,
    message: isExpired
      ? 'La période d\'évaluation de 15 jours est expirée.'
      : `Version d'évaluation active : il reste ${daysRemaining} jour(s).`
  };
}

function activateLicense(key) {
  if (!key || typeof key !== 'string') {
    return { success: false, message: 'Clé de licence invalide.' };
  }

  const cleanKey = key.trim().toUpperCase();
  const isValid = MASTER_KEYS.includes(cleanKey) || cleanKey.startsWith('DZHERBA-2026-');

  if (!isValid) {
    return { success: false, message: 'Clé d\'activation incorrecte ou invalide.' };
  }

  const license = loadLicense();
  license.activated = true;
  license.licenseKey = cleanKey;
  license.activatedAt = Date.now();
  license.lastSeenTimestamp = Date.now();
  saveLicense(license);

  return {
    success: true,
    message: 'Félicitations ! Votre licence DzHerba a été activée avec succès.',
    status: getLicenseStatus()
  };
}

module.exports = {
  getLicenseStatus,
  activateLicense,
  TRIAL_DURATION_DAYS
};
