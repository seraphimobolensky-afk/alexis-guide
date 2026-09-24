/**
 * Offline grocery auto-grouping: a plain keyword lookup, no AI or network.
 *
 * Matching rules (see `categorizeGrocery`):
 * - Input is normalised: lowercased, accents stripped, punctuation removed.
 * - A keyword matches whole words, tolerating simple plurals ("bananas",
 *   "tomatoes", "berries"). Multi-word keywords ("ice cream") match as a phrase.
 * - Keywords of 4+ letters also match as the end of a longer word, which
 *   catches German/Dutch compounds ("Vollmilch" → milch, "Roggenbrot" → brot).
 *   Short keywords never do, so "ham" can't match "shampoo" and "oil" can't
 *   match "toilet".
 * - When several keywords match, the longest wins: "ice cream" beats "cream",
 *   "peanut butter" beats "butter", "toilet paper" beats "paper".
 */

export const GROCERY_CATEGORIES = [
  'Produce',
  'Dairy & eggs',
  'Meat & fish',
  'Bakery',
  'Pantry & dry goods',
  'Frozen',
  'Snacks & sweets',
  'Drinks',
  'Household & cleaning',
  'Other',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

export function isGroceryCategory(value: unknown): value is GroceryCategory {
  return typeof value === 'string' && (GROCERY_CATEGORIES as readonly string[]).includes(value)
}

const KEYWORDS: Record<Exclude<GroceryCategory, 'Other'>, string[]> = {
  Produce: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'grapefruit', 'pear', 'peach', 'nectarine', 'plum',
    'apricot', 'cherry', 'strawberry', 'raspberry', 'blueberry', 'blackberry', 'berry', 'melon', 'watermelon',
    'pineapple', 'mango', 'kiwi', 'avocado', 'fig', 'date', 'pomegranate', 'passion fruit', 'fruit', 'clementine',
    'mandarin', 'tomato', 'potato', 'sweet potato', 'onion', 'red onion', 'spring onion', 'shallot', 'garlic',
    'ginger', 'carrot', 'celery', 'cucumber', 'courgette', 'zucchini', 'aubergine', 'eggplant', 'pepper',
    'bell pepper', 'chilli', 'chili', 'jalapeno', 'lettuce', 'salad', 'rocket', 'arugula', 'spinach', 'kale',
    'cabbage', 'broccoli', 'cauliflower', 'brussels sprout', 'asparagus', 'leek', 'mushroom', 'corn on the cob',
    'sweetcorn', 'pea', 'green bean', 'bean sprout', 'beetroot', 'radish', 'parsnip', 'squash', 'butternut',
    'pumpkin', 'herb', 'basil', 'parsley', 'coriander', 'cilantro', 'mint', 'dill', 'rosemary', 'thyme', 'chive',
    'vegetable', 'veg', 'tofu',
    // German / Dutch
    'apfel', 'appel', 'banane', 'kartoffel', 'aardappel', 'tomate', 'zwiebel', 'ui', 'knoblauch', 'knoflook',
    'karotte', 'mohre', 'wortel', 'gurke', 'komkommer', 'salat', 'sla', 'obst', 'fruit', 'gemuse', 'groente',
  ],
  'Dairy & eggs': [
    'milk', 'oat milk', 'almond milk', 'soy milk', 'cheese', 'cheddar', 'mozzarella', 'parmesan', 'feta', 'brie',
    'halloumi', 'cream cheese', 'cottage cheese', 'ricotta', 'mascarpone', 'butter', 'margarine', 'yoghurt',
    'yogurt', 'skyr', 'kefir', 'cream', 'sour cream', 'creme fraiche', 'double cream', 'single cream', 'custard',
    'egg', 'eggs',
    // German / Dutch
    'milch', 'melk', 'kase', 'kaas', 'joghurt', 'quark', 'kwark', 'sahne', 'room', 'ei', 'eier', 'eieren', 'boter',
  ],
  'Meat & fish': [
    'chicken', 'chicken breast', 'chicken thigh', 'beef', 'mince', 'minced beef', 'steak', 'pork', 'bacon', 'ham',
    'sausage', 'chorizo', 'salami', 'prosciutto', 'pepperoni', 'lamb', 'turkey', 'duck', 'meatball', 'burger',
    'fish', 'salmon', 'tuna steak', 'cod', 'haddock', 'prawn', 'shrimp', 'mussel', 'sea bass', 'mackerel',
    'sardine', 'meat',
    // German / Dutch
    'hahnchen', 'huhn', 'kip', 'rind', 'rindfleisch', 'rundvlees', 'hackfleisch', 'gehakt', 'schwein', 'varkensvlees',
    'wurst', 'worst', 'schinken', 'fleisch', 'vlees', 'lachs', 'zalm', 'vis', 'fisch',
  ],
  Bakery: [
    'bread', 'loaf', 'baguette', 'sourdough', 'roll', 'bread roll', 'bun', 'bagel', 'croissant', 'pain au chocolat',
    'wrap', 'tortilla', 'pitta', 'pita', 'naan', 'crumpet', 'muffin', 'english muffin', 'brioche', 'cake', 'pastry',
    'doughnut', 'donut',
    // German / Dutch
    'brot', 'brood', 'brotchen', 'broodje', 'semmel', 'gebak', 'kuchen',
  ],
  'Pantry & dry goods': [
    'pasta', 'spaghetti', 'penne', 'fusilli', 'lasagne', 'noodle', 'rice', 'couscous', 'quinoa', 'oat', 'porridge',
    'cereal', 'granola', 'muesli', 'flour', 'sugar', 'salt', 'pepper grinder', 'black pepper', 'spice', 'paprika',
    'cumin', 'cinnamon', 'curry powder', 'oregano', 'stock', 'stock cube', 'bouillon', 'oil', 'olive oil', 'vinegar',
    'soy sauce', 'sauce', 'pesto', 'ketchup', 'mayo', 'mayonnaise', 'mustard', 'tomato paste', 'passata',
    'chopped tomatoes', 'tinned tomatoes', 'canned', 'tinned', 'bean', 'baked beans', 'chickpea', 'lentil',
    'tuna', 'honey', 'jam', 'peanut butter', 'nutella', 'syrup', 'maple syrup', 'baking powder', 'yeast',
    'vanilla', 'nut', 'almond', 'walnut', 'cashew', 'seed', 'raisin', 'dried fruit', 'crackers', 'breadcrumb',
    'coconut milk', 'curry paste',
    // German / Dutch
    'nudel', 'reis', 'rijst', 'mehl', 'meel', 'zucker', 'suiker', 'zout', 'essig', 'azijn', 'senf', 'mosterd',
  ],
  Frozen: [
    'frozen', 'ice cream', 'ice lolly', 'sorbet', 'gelato', 'frozen pizza', 'pizza', 'frozen peas', 'fish fingers',
    'chips', 'oven chips', 'fries', 'frozen berries', 'frozen veg', 'ice', 'ice cubes',
    // German / Dutch
    'tiefkuhl', 'eis', 'diepvries', 'ijs',
  ],
  'Snacks & sweets': [
    'crisps', 'chocolate', 'chocolate bar', 'sweets', 'candy', 'gummy', 'haribo', 'biscuit', 'cookie', 'popcorn',
    'pretzel', 'nachos', 'tortilla chips', 'dip', 'hummus', 'guacamole', 'salsa', 'cereal bar', 'protein bar',
    'snack', 'licorice', 'liquorice', 'mints', 'chewing gum', 'gum',
    // German / Dutch
    'schokolade', 'chocolade', 'keks', 'koekje', 'snoep', 'chips paprika',
  ],
  Drinks: [
    'water', 'sparkling water', 'juice', 'orange juice', 'apple juice', 'smoothie', 'coffee', 'coffee beans',
    'capsule', 'coffee pods', 'nespresso', 'tea', 'tea bags', 'herbal tea', 'cola', 'coke', 'lemonade', 'soda',
    'squash drink', 'energy drink', 'red bull', 'beer', 'lager', 'cider', 'wine', 'red wine', 'white wine',
    'prosecco', 'champagne', 'gin', 'vodka', 'rum', 'whisky', 'whiskey', 'tonic', 'drink',
    // German / Dutch
    'wasser', 'sap', 'saft', 'kaffee', 'koffie', 'thee', 'bier', 'wein', 'wijn',
  ],
  'Household & cleaning': [
    'toilet paper', 'toilet roll', 'loo roll', 'kitchen roll', 'paper towel', 'tissue', 'napkin', 'bin bag',
    'bin liner', 'rubbish bag', 'washing up liquid', 'dish soap', 'dishwasher tablet', 'dishwasher tabs',
    'sponge', 'cloth', 'microfibre', 'detergent', 'laundry', 'washing powder', 'fabric softener', 'bleach',
    'cleaner', 'spray', 'descaler', 'limescale', 'foil', 'cling film', 'baking paper', 'zip bag', 'freezer bag',
    'battery', 'light bulb', 'candle', 'shampoo', 'conditioner', 'shower gel', 'body wash', 'soap', 'hand soap',
    'toothpaste', 'toothbrush', 'floss', 'mouthwash', 'deodorant', 'razor', 'shaving foam', 'cotton pad',
    'cotton bud', 'plaster', 'paracetamol', 'ibuprofen', 'sunscreen', 'moisturiser', 'lotion', 'tampon', 'pad',
    // German / Dutch
    'klopapier', 'toilettenpapier', 'wc papier', 'wc-papier', 'spulmittel', 'waschmittel', 'wasmiddel',
    'afwasmiddel', 'zahnpasta', 'tandpasta', 'seife', 'zeep',
  ],
}

/** Lowercase, strip accents/umlauts, drop punctuation, collapse spaces. */
export function normalizeGroceryName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Plural-tolerant singular guesses for one word ("berries" → berry, "tomatoes" → tomato). */
function singularForms(word: string): string[] {
  const forms = [word]
  if (word.endsWith('ies') && word.length > 4) forms.push(word.slice(0, -3) + 'y')
  if (word.endsWith('es') && word.length > 3) forms.push(word.slice(0, -2))
  if (word.endsWith('s') && word.length > 3) forms.push(word.slice(0, -1))
  return forms
}

function wordMatches(inputWord: string, keywordWord: string, allowSuffix: boolean): boolean {
  return singularForms(inputWord).some(
    form => form === keywordWord || (allowSuffix && form.length > keywordWord.length && form.endsWith(keywordWord))
  )
}

function phraseMatches(inputWords: string[], keyword: string): boolean {
  const kw = keyword.split(' ')
  const allowSuffix = kw.length === 1 && kw[0].length >= 4
  for (let start = 0; start + kw.length <= inputWords.length; start++) {
    if (kw.every((k, i) => wordMatches(inputWords[start + i], k, allowSuffix))) return true
  }
  return false
}

// Flattened once, longest keyword first, so the first hit is the most specific.
const KEYWORD_INDEX: { keyword: string; category: GroceryCategory }[] = Object.entries(KEYWORDS)
  .flatMap(([category, words]) => words.map(word => ({ keyword: normalizeGroceryName(word), category: category as GroceryCategory })))
  .sort((a, b) => b.keyword.length - a.keyword.length)

/**
 * Pick a category for an item name. `overrides` maps a normalised name to the
 * category the user manually chose for it before — that always wins.
 */
export function categorizeGrocery(name: string, overrides?: Record<string, string>): GroceryCategory {
  const normalized = normalizeGroceryName(name)
  const override = overrides?.[normalized]
  if (isGroceryCategory(override)) return override

  const words = normalized.split(' ').filter(Boolean)
  if (words.length === 0) return 'Other'
  return KEYWORD_INDEX.find(({ keyword }) => phraseMatches(words, keyword))?.category ?? 'Other'
}

const UNIT = '(?:kg|g|gr|mg|l|ml|cl|lb|lbs|oz|x|pcs?|packs?|packets?|bottles?|cans?|tins?|jars?|bags?|boxes|box|dozen)'

/**
 * Loose "quantity + name" parsing. Handles a number (with optional unit) at the
 * start or end, or anything in brackets at the end: "2 kg rice", "2x milk",
 * "3 apples", "eggs x20", "milk 2l", "rice (2kg)".
 * Anything it doesn't recognise is just the name, with no quantity.
 */
export function parseGroceryInput(raw: string): { name: string; quantity: string | null } {
  const text = raw.trim().replace(/\s+/g, ' ')
  const bracketed = text.match(/^(.+?)\s*\(([^()]+)\)$/)
  if (bracketed) return { name: bracketed[1].trim(), quantity: bracketed[2].trim() }

  const leading = text.match(new RegExp(`^(\\d+(?:[.,]\\d+)?\\s*${UNIT}?)\\s+(.+)$`, 'i'))
  if (leading) return { name: leading[2].trim(), quantity: leading[1].replace(/\s+/g, ' ').trim() }

  const trailing = text.match(new RegExp(`^(.+?)\\s+(x\\s*\\d+|\\d+(?:[.,]\\d+)?\\s*${UNIT}?)$`, 'i'))
  if (trailing) return { name: trailing[1].trim(), quantity: trailing[2].replace(/\s+/g, '').trim() }

  return { name: text, quantity: null }
}
