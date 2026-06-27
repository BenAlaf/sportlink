/** Small text helpers shared across screens. */

/** Pick "a" or "an" for a word based on its leading sound (vowel → "an"). */
export function indefiniteArticle(word: string): string {
  return /^[aeiou]/i.test(word.trim()) ? 'an' : 'a';
}
