const text = 'thymus ciliatus زعتر';

function containsWordOrSubstring(text, term) {
  if (!text || !term) return false;
  if (term.length <= 3) {
    const regex = new RegExp('(^|[^a-zA-Z0-9\u0600-\u06FF])' + term + '([^a-zA-Z0-9\u0600-\u06FF]|$)', 'i');
    return regex.test(text);
  }
  return text.includes(term);
}

console.log('Testing "th":', containsWordOrSubstring(text, 'th'));
console.log('Testing "thy":', containsWordOrSubstring(text, 'thy'));
console.log('Testing "thym":', containsWordOrSubstring(text, 'thym'));
console.log('Testing "زع":', containsWordOrSubstring(text, 'زع'));
