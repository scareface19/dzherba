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

// Check if any word in text starts with prefix
function hasWordStartingWith(text, prefix) {
  if (!text || !prefix) return false;
  const words = text.split(/[\s,\.;:_\-\(\)\[\]\/\\«»"'\+]+/).filter(Boolean);
  return words.some(w => w.startsWith(prefix));
}

// Tests
console.log('--- Word-prefix tests ---');
console.log('thymus startsWith th:', hasWordStartingWith('thymus vulgaris', 'th'));
console.log('thymus startsWith thy:', hasWordStartingWith('thymus vulgaris', 'thy'));
console.log('thymus startsWith thym:', hasWordStartingWith('thymus vulgaris', 'thym'));
console.log('borago startsWith bo:', hasWordStartingWith('borago officinalis', 'bo'));
console.log('borago startsWith bor:', hasWordStartingWith('borago officinalis', 'bor'));
console.log('dosage startsWith sag:', hasWordStartingWith('respectez le dosage quotidien', 'sag'));
console.log('failure startsWith ail:', hasWordStartingWith('heart failure prevention', 'ail'));
console.log('ail startsWith ail:', hasWordStartingWith('ail blanc cultivé', 'ail'));
console.log('شيح startsWith شي:', hasWordStartingWith('شيح حليحال شيحة', 'شي'));
console.log('زعتر startsWith زع:', hasWordStartingWith('زعتر بري وزيتون', 'زع'));
