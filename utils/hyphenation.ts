/**
 * German hyphenation utility
 * Inserts soft hyphens (\u00AD) at valid German syllable boundaries
 */

// Common German prefixes that can be separated
const PREFIXES = [
  'über', 'unter', 'hinter', 'zwischen', 'durch', 'wider',
  'ge', 'be', 'ver', 'zer', 'ent', 'emp', 'er', 'miss', 'un',
  'vor', 'nach', 'aus', 'ein', 'auf', 'ab', 'an', 'bei',
  'mit', 'zu', 'hin', 'her', 'um', 'herum', 'hinaus', 'heraus',
];

// Common German suffixes that can be separated  
const SUFFIXES = [
  'schaft', 'heit', 'keit', 'ung', 'lich', 'isch', 'chen', 'lein',
  'bar', 'sam', 'haft', 'los', 'voll', 'reich', 'arm', 'wert',
  'weise', 'artig', 'mäßig', 'tum', 'nis', 'sal', 'sel',
  'tion', 'sion', 'ieren', 'ismus', 'ist', 'ität',
];

// Vowels in German (including umlauts)
const VOWELS = 'aeiouäöüyAEIOUÄÖÜY';

// Consonant clusters that should not be split
const INSEPARABLE_CLUSTERS = [
  'sch', 'ch', 'ck', 'ph', 'th', 'qu', 'pf', 'st', 'sp',
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
  'kl', 'kn', 'kr', 'pl', 'pr', 'tr', 'schl', 'schn',
  'schm', 'schr', 'schw', 'spr', 'str',
];

const SOFT_HYPHEN = '\u00AD';

function isVowel(char: string): boolean {
  return VOWELS.includes(char);
}

function isConsonant(char: string): boolean {
  return /[a-zäöüß]/i.test(char) && !isVowel(char);
}

function findSyllableBoundaries(word: string): number[] {
  const boundaries: number[] = [];
  const lowerWord = word.toLowerCase();
  
  if (word.length < 4) return boundaries;

  // Check for prefixes
  let prefixEnd = 0;
  for (const prefix of PREFIXES.sort((a, b) => b.length - a.length)) {
    if (lowerWord.startsWith(prefix) && word.length > prefix.length + 2) {
      // Make sure there's a vowel after the prefix
      const afterPrefix = lowerWord.slice(prefix.length);
      if (afterPrefix.length > 0 && (isVowel(afterPrefix[0]) || isConsonant(afterPrefix[0]))) {
        prefixEnd = prefix.length;
        boundaries.push(prefixEnd);
        break;
      }
    }
  }

  // Check for suffixes
  let suffixStart = word.length;
  for (const suffix of SUFFIXES.sort((a, b) => b.length - a.length)) {
    if (lowerWord.endsWith(suffix) && word.length > suffix.length + 2) {
      const beforeSuffix = lowerWord.slice(0, -suffix.length);
      if (beforeSuffix.length > 0) {
        suffixStart = word.length - suffix.length;
        break;
      }
    }
  }

  // Find syllable boundaries in the middle portion
  const start = prefixEnd;
  const end = suffixStart;
  
  for (let i = start + 1; i < end - 1; i++) {
    // Skip if already a boundary
    if (boundaries.includes(i)) continue;
    
    const prev = lowerWord[i - 1];
    const curr = lowerWord[i];
    const next = lowerWord[i + 1];
    
    // Rule: Split between vowel and consonant before another vowel (V-CV pattern)
    // e.g., "A-schen" not "As-chen"
    if (isVowel(prev) && isConsonant(curr) && next && isVowel(next)) {
      // Check if curr starts an inseparable cluster
      const cluster = lowerWord.slice(i, i + 4);
      let clusterLen = 1;
      for (const ic of INSEPARABLE_CLUSTERS.sort((a, b) => b.length - a.length)) {
        if (cluster.startsWith(ic)) {
          clusterLen = ic.length;
          break;
        }
      }
      
      // Split before the consonant/cluster
      if (!boundaries.includes(i)) {
        boundaries.push(i);
      }
    }
    
    // Rule: Split between two consonants if they're different (except inseparable clusters)
    // e.g., "Put-tel" 
    else if (isConsonant(prev) && isConsonant(curr) && prev !== curr) {
      // Check if prev+curr forms an inseparable cluster
      const testCluster = lowerWord.slice(i - 1, i + 2);
      let isCluster = false;
      for (const ic of INSEPARABLE_CLUSTERS) {
        if (testCluster.includes(ic)) {
          isCluster = true;
          break;
        }
      }
      
      if (!isCluster && !boundaries.includes(i)) {
        // Only add if there's a vowel before and after this position
        const beforeHasVowel = lowerWord.slice(0, i).split('').some(c => isVowel(c));
        const afterHasVowel = lowerWord.slice(i).split('').some(c => isVowel(c));
        if (beforeHasVowel && afterHasVowel) {
          boundaries.push(i);
        }
      }
    }
    
    // Rule: Double consonants can be split
    else if (isConsonant(prev) && curr === prev && prev !== 's') {
      if (!boundaries.includes(i)) {
        boundaries.push(i);
      }
    }
  }

  // Add suffix boundary if not already included
  if (suffixStart < word.length && !boundaries.includes(suffixStart)) {
    // Ensure there's content before the suffix
    if (suffixStart > 1) {
      boundaries.push(suffixStart);
    }
  }

  return boundaries.sort((a, b) => a - b);
}

/**
 * Hyphenates a German word by inserting soft hyphens at syllable boundaries
 * @param word The word to hyphenate
 * @returns The word with soft hyphens inserted
 */
export function hyphenateWord(word: string): string {
  // Don't hyphenate short words
  if (word.length < 5) return word;
  
  // Skip if already contains hyphens or special chars
  if (word.includes('-') || word.includes(SOFT_HYPHEN)) return word;
  
  // Only hyphenate alphabetic words
  if (!/^[a-zA-ZäöüÄÖÜß]+$/.test(word)) return word;

  const boundaries = findSyllableBoundaries(word);
  
  if (boundaries.length === 0) return word;

  // Insert soft hyphens at boundaries (from end to start to preserve indices)
  let result = word;
  for (let i = boundaries.length - 1; i >= 0; i--) {
    const pos = boundaries[i];
    // Ensure minimum syllable length of 2 characters
    if (pos >= 2 && pos <= result.length - 2) {
      result = result.slice(0, pos) + SOFT_HYPHEN + result.slice(pos);
    }
  }

  return result;
}

/**
 * Hyphenates all words in a text
 * @param text The text to hyphenate
 * @returns The text with soft hyphens inserted in long words
 */
export function hyphenateText(text: string): string {
  return text.split(/(\s+)/).map(part => {
    if (/^\s+$/.test(part)) return part;
    return hyphenateWord(part);
  }).join('');
}

/**
 * CSS styles for proper German hyphenation on web
 */
export const webHyphenationStyle = {
  hyphens: 'auto' as const,
  WebkitHyphens: 'auto' as const,
  MozHyphens: 'auto' as const,
  msHyphens: 'auto' as const,
  wordBreak: 'break-word' as const,
  overflowWrap: 'break-word' as const,
};

