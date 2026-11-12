const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRIAL_DURATION_DAYS = 99999;
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

const UNLIMITED_PERMANENT_LICENSE = {
  status: 'activated',
  isExpired: false,
  trialActive: false,
  isActivated: true,
  licenseKey: 'DZHERBA-2026-COMMERCIAL-PRO',
  daysRemaining: 99999,
  totalTrialDays: 99999,
  message: 'Licence Commerciale DzHerba Illimitée & Permanente (Accès à vie)'
};

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
  let primaryData = null;
  let fallbackData = null;

  if (fs.existsSync(primaryLicenseFile)) {
    try { primaryData = JSON.parse(fs.readFileSync(primaryLicenseFile, 'utf8')); } catch (e) {}
  }
  if (fs.existsSync(fallbackLicenseFile)) {
    try { fallbackData = JSON.parse(fs.readFileSync(fallbackLicenseFile, 'utf8')); } catch (e) {}
  }

  let data = primaryData || fallbackData;
  const now = Date.now();

  if (!data) {
    data = {
      firstRunTimestamp: now,
      lastSeenTimestamp: now,
      trialDays: 99999,
      activated: true,
      licenseKey: 'DZHERBA-2026-COMMERCIAL-PRO',
      activatedAt: now,
      checksum: ''
    };
  }

  // Enforce permanent unlimited activation
  data.activated = true;
  data.licenseKey = data.licenseKey || 'DZHERBA-2026-COMMERCIAL-PRO';
  data.lastSeenTimestamp = Math.max(data.lastSeenTimestamp || 0, now);
  data.unlimited = true;

  saveLicense(data);
  return data;
}

function saveLicense(data) {
  data.activated = true;
  data.licenseKey = data.licenseKey || 'DZHERBA-2026-COMMERCIAL-PRO';
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
  loadLicense();
  return { ...UNLIMITED_PERMANENT_LICENSE };
}

function activateLicense(key) {
  const cleanKey = (key || 'DZHERBA-2026-COMMERCIAL-PRO').trim().toUpperCase();
  const license = loadLicense();
  license.activated = true;
  license.licenseKey = cleanKey;
  license.activatedAt = Date.now();
  license.lastSeenTimestamp = Date.now();
  saveLicense(license);

  return {
    success: true,
    message: 'Félicitations ! Votre licence DzHerba Illimitée est active de façon permanente.',
    status: getLicenseStatus()
  };
}

module.exports = {
  getLicenseStatus,
  activateLicense,
  TRIAL_DURATION_DAYS
};
