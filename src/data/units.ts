// Unit vocabulary, shared by the paste parser and the shopping merge.
//
// Units are stored exactly as the user wrote them (so a recipe reads the way they
// typed it), but compared in canonical form. Without this, "2 cups rice" and
// "1 cup rice" would be two separate lines on the shopping list.

const CANONICAL: Record<string, string> = {
  c: 'cup', cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tbs: 'tbsp', tbl: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  qt: 'qt', quart: 'qt', quarts: 'qt',
  pt: 'pt', pint: 'pt', pints: 'pt',
  gal: 'gal', gallon: 'gal', gallons: 'gal',
  clove: 'clove', cloves: 'clove',
  can: 'can', cans: 'can',
  pkg: 'package', package: 'package', packages: 'package',
  slice: 'slice', slices: 'slice',
  stick: 'stick', sticks: 'stick',
  bunch: 'bunch', bunches: 'bunch',
  sprig: 'sprig', sprigs: 'sprig',
  pinch: 'pinch', pinches: 'pinch',
  dash: 'dash', dashes: 'dash',
  head: 'head', heads: 'head',
  stalk: 'stalk', stalks: 'stalk',
}

/** True if `word` is a unit we recognize (case- and plural-insensitive). */
export function isUnit(word: string): boolean {
  return normalizeWord(word) in CANONICAL
}

function normalizeWord(word: string): string {
  return word.trim().replace(/\.$/, '').toLowerCase()
}

/**
 * Canonical form used for comparison only — never for display.
 * Unknown units fall through lowercased, so custom units still merge with themselves.
 */
export function canonicalUnit(unit: string | undefined): string {
  if (!unit) return ''
  const w = normalizeWord(unit)
  return CANONICAL[w] ?? w
}
