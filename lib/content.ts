export type FrequencyTag = 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Bi-monthly' | 'As needed' | 'Before vacuuming'

export interface CleaningTask {
  key: string
  icon: string
  title: string
  frequency: FrequencyTag
  tip: string
}

export interface Material {
  type: string
  function: string
}

export interface Appliance {
  key: string
  name: string
  necessity: number
  notes: string
}

export interface Recipe {
  key: string
  title: string
  emoji: string
  ingredients: string[]
  steps: string[]
}

export interface TipItem {
  text: string
}

// ─── Section 1: Cleaning Schedule ────────────────────────────────────────────
export const cleaningTasks: CleaningTask[] = [
  {
    key: 'vacuum',
    icon: '💨',
    title: 'Vacuuming',
    frequency: 'Weekly',
    tip: 'Move furniture first. Use attachments for corners — leftover dust makes it dusty again faster.',
  },
  {
    key: 'laundry',
    icon: '🫧',
    title: 'Laundry',
    frequency: 'Weekly',
    tip: 'Separate darks & whites. Jeans: cold only, as rarely as possible to keep colour & structure.',
  },
  {
    key: 'bedsheets',
    icon: '🛏️',
    title: 'Bedsheets',
    frequency: 'Bi-weekly',
    tip: "You won't notice the smell yourself — just wash them. 40–60°. Flip the mattress every now and then.",
  },
  {
    key: 'towels',
    icon: '💧',
    title: 'Towels',
    frequency: 'Weekly',
    tip: 'Wash HOT — 90° if smelly, 60° otherwise. Includes kitchen, bath, and all other towels.',
  },
  {
    key: 'sink',
    icon: '🚿',
    title: 'Sinks & shower',
    frequency: 'Weekly',
    tip: 'Pro tip: rub parchment paper on metal taps to make them hydrophobic — drops slide right off.',
  },
  {
    key: 'toilet',
    icon: '🪣',
    title: 'Toilet bowl',
    frequency: 'Weekly',
    tip: 'Run cleaner around the inside rim, let sit a minute, then scrub with the brush. Flush while scrubbing.',
  },
  {
    key: 'fridge',
    icon: '❄️',
    title: 'Fridge',
    frequency: 'Bi-monthly',
    tip: 'Best done before a new grocery haul. Put a cup of baking soda inside to absorb smells.',
  },
  {
    key: 'extractor',
    icon: '🌬️',
    title: 'Kitchen extractor',
    frequency: 'Monthly',
    tip: 'Replace the white mesh filter inside. Wipe down with degreaser spray every now and then.',
  },
  {
    key: 'mirrors',
    icon: '🪞',
    title: 'Mirrors & glass',
    frequency: 'As needed',
    tip: 'Use a microfibre towel and wipe vertically to avoid streaks.',
  },
  {
    key: 'dust',
    icon: '🪄',
    title: 'Dust off surfaces',
    frequency: 'Before vacuuming',
    tip: 'Always dust BEFORE you vacuum — otherwise you push dust back onto the floor.',
  },
  {
    key: 'kettle',
    icon: '☕',
    title: 'Kettle & coffee',
    frequency: 'Monthly',
    tip: 'Equal parts white vinegar + water, or 1 tbsp citric acid in water. Boil, soak 20 min, rinse well.',
  },
]

// ─── Section 2: Cleaning Materials ───────────────────────────────────────────
export const cleaningMaterials: Material[] = [
  { type: 'All-purpose cleaner spray', function: 'Good for surfaces: tables, walls, kitchen counters.' },
  { type: 'Degreaser spray', function: 'Kitchen, stove, shower. Spray, let sit 1–2 mins, then scrub.' },
  { type: 'Anti-calc spray (anti-kalk)', function: 'Shower, sink, metal appliances — gets rid of water stains.' },
  { type: 'Cream cleaner (yellow bottle, red cap)', function: 'Best thing ever for metal appliances. Put on sponge, scrub, wipe down. Very aggressive — use gloves.' },
  { type: 'Toilet cleaner', function: 'The duck-neck bottle. Brand doesn\'t matter — just pick a smell you like.' },
  { type: 'Toilet brush', function: 'Replace it every now and then. You know why.' },
  { type: 'Kitchen paper', function: 'Cheapest will do.' },
  { type: 'Sponges', function: 'Two types: one for dishes (anti-scratch, non-stick safe), one for cleaning.' },
  { type: 'Cleaning gloves', function: 'Especially useful for cream cleaner and toilet cleaning.' },
  { type: 'Swiffer', function: 'Favourite for dusting. Replace the pad when it gets crumpled and grey.' },
  { type: 'Mop (Swiffer wet)', function: 'Mop every second time you vacuum.' },
  { type: 'Microfibre towels', function: 'Great for cleaning — no fibres left behind.' },
  { type: 'Linen towels', function: 'Best for drying dishes — no streaks.' },
]

// ─── Section 3: Appliances ───────────────────────────────────────────────────
export const appliances: Appliance[] = [
  { key: 'swiffer', name: 'Swiffer mop', necessity: 5, notes: 'Cheap, easy, does the job. Just buy it.' },
  { key: 'fridge', name: 'Fridge', necessity: 5, notes: 'You know.' },
  { key: 'coffee', name: 'Coffee machine', necessity: 5, notes: 'Skip the mocha machine. French press for flavour, Nespresso for ease (get capsules from the grocery store — cheaper). Wait for a deal on Facebook Marketplace.' },
  { key: 'airfryer', name: 'Air fryer', necessity: 4, notes: 'Great if you don\'t have an oven. Wait for Black Friday.' },
  { key: 'storage', name: 'IKEA food storage boxes', necessity: 4, notes: 'Glass ones — they don\'t stain and are easy to clean. 3–5 boxes in different sizes.' },
  { key: 'bowl', name: 'Big bowl', necessity: 4, notes: 'Salads, mixing, anything. Very underrated.' },
  { key: 'extension', name: 'Extension cord (5 outlets)', necessity: 4, notes: 'Black one blends in better. Makes life much easier.' },
  { key: 'ziplock', name: 'Ziplock bags', necessity: 4, notes: 'Use them for everything — cooking, freezing, marinating. Buy in big packs.' },
  { key: 'boards', name: 'Wooden cutting boards', necessity: 5, notes: 'No plastic — microplastics. Solid wood, 2–3 different sizes.' },
  { key: 'rice', name: 'Rice cooker', necessity: 3, notes: 'Makes rice simple. €20–30 is plenty. Get basmati or jasmine rice.' },
  { key: 'knife', name: 'Knife sharpener', necessity: 3, notes: '€5–20. Worth every cent — dull knives are genuinely dangerous.' },
  { key: 'candles', name: 'Scented candles', necessity: 3, notes: 'Skip the grocery store ones. Find something more special — good ones don\'t have to be expensive.' },
  { key: 'milkfrother', name: 'Milk frother', necessity: 1, notes: "Don't bother — breaks too quickly. Learned this the hard way." },
  { key: 'smartbulbs', name: 'Smart light bulbs', necessity: 1, notes: 'Nice to have. Get them all from the same brand for easy coordination.' },
]

// ─── Section 4: Grocery Tips ─────────────────────────────────────────────────
export const groceryTips: string[] = [
  'Use the Reminders app — create a list with type "Groceries" and it auto-sorts items into sections (produce, dairy, etc.).',
  'Plan what you want to buy before you go.',
  'Find the cheapest grocery store near you.',
  "Join every grocery store's loyalty programme — download their apps and check weekly discounts.",
  'Go once or twice a week for a big haul, depending on fridge space.',
  'Buy in bulk what you can: rice (4kg pack), eggs (20 instead of 6), etc.',
  'Always grab 1–2 types of fruit: fuji apples, bananas, berries (great for health), kiwis (eat with the skin).',
  'Keep tomatoes and cucumber on hand — they work for breakfast, lunch and dinner.',
  'Pick a specific breakfast and stick to it. Routine in the morning = easier mornings. Pack protein: eggs, overnight oats, or Greek yoghurt.',
  'Have a rotation of easy lunches and dinners. Makes grocery runs automatic rather than deliberate.',
  'Meal-prepping is cheapest over time. MOB app has great recipes — around €1.50/month.',
]

// ─── Section 5: Recipes ──────────────────────────────────────────────────────
export const recipes: Recipe[] = [
  {
    key: 'bacon-pasta',
    title: 'Bacon pasta',
    emoji: '🍝',
    ingredients: [
      '200–500g pre-cut smoked bacon pieces',
      'Rigatoni or penne',
      'Heavy cream or crème fraîche',
      'Tomato paste',
      'Pepper & herbs',
      'Parmesan or pecorino',
      'Optional: splash of white wine',
    ],
    steps: [
      'Start boiling water for the pasta.',
      'Heat a pan and fry the bacon in its own fat.',
      'Cook the pasta.',
      'Add pepper, tomato paste (and wine if using). Mix well on medium heat.',
      'Add crème fraîche and stir.',
      'Scoop some pasta water foam into the sauce to bind it.',
      'Add cheese, drain pasta, mix everything together.',
    ],
  },
  {
    key: 'tuna-salad',
    title: 'Tuna salad bowl',
    emoji: '🥗',
    ingredients: [
      '1 can of tuna (water or olive oil)',
      'Cucumber',
      'Tomatoes',
      'Red onion or shallots',
      'Rice',
      'Soy sauce, rice vinegar, sesame oil',
      'Brown sugar or teriyaki sauce',
      'Chilli flakes',
    ],
    steps: [
      'Smash the cucumber with the back of your knife before dicing — makes it juicier and better at absorbing flavour.',
      'Mix diced cucumber with soy sauce and let it sit.',
      'Cook the rice.',
      'Dice tomatoes and onion.',
      'Add dressing ingredients (vinegar, sesame oil, sugar) to the cucumber bowl.',
      'Add tomato and onion. Mix.',
      'Serve rice in a bowl, add salad on top.',
    ],
  },
  {
    key: 'bolognese',
    title: 'Bolognese',
    emoji: '🫕',
    ingredients: [
      '500g ground beef',
      '2 cans peeled tomatoes',
      '1 onion',
      'Broth cube',
      'Rigatoni',
      'Butter or olive oil',
      'A little sugar',
      'Parmesan or pecorino',
      'Optional: carrots, fresh tomatoes, wine',
    ],
    steps: [
      'Halve the onion — slice one half, leave the other whole.',
      'Fry onion in butter or olive oil.',
      'Turn up heat and add all the ground beef. Let it char slightly.',
      'Add carrot. Shock with broth or wine.',
      'Add peeled tomato cans. Boil on medium heat with a little sugar.',
      'Every now and then add beef broth and let it reduce again — this deepens the flavour.',
      'Finish with a chunk of butter for creaminess. Add pasta water for consistency.',
      'The longer it boils, the better it tastes. Cook pasta separately. Enjoy.',
    ],
  },
  {
    key: 'tortilla-burgers',
    title: 'Tortilla burgers',
    emoji: '🌮',
    ingredients: [
      '250g ground beef per person',
      'Burrito seasoning packet',
      'Burger cheese slices',
      'Tortillas (pan-sized)',
      'Onion',
      'Lettuce, tomatoes',
      'Chipotle sauce',
      'Optional: guacamole or avocado',
    ],
    steps: [
      'Caramelise onions: chop, olive oil/butter, low heat, stir for 10 minutes.',
      'Mix ground beef with seasoning in a bowl.',
      'Put a cheese slice on a tortilla, spread the seasoned beef on top (fork works best).',
      'Place tortilla face-down on a hot pan. Fry ~5 minutes.',
      'Flip, add another cheese slice on top of the beef, cover with a lid.',
      'After a few minutes, take off and add your toppings: caramelised onions, lettuce, tomato, chipotle sauce.',
    ],
  },
  {
    key: 'scrambled-eggs',
    title: 'Scrambled eggs',
    emoji: '🍳',
    ingredients: [
      '3–5 eggs',
      'Butter (generous)',
      'Crème fraîche',
      'Optional: tomatoes, parmesan, onion/garlic powder',
    ],
    steps: [
      'Melt a good chunk of butter in a pan on LOW heat.',
      'Take the pan off the heat. Crack eggs in, mix with spatula until consistent.',
      'Return to heat. Stir every now and then.',
      'When almost done, add 1–2 tbsp crème fraîche. Stir until melted in.',
      'Best served on toast with cream cheese, salt and smoked paprika.',
    ],
  },
  {
    key: 'overnight-oats',
    title: 'Overnight oats',
    emoji: '🫙',
    ingredients: [
      '~100g oats',
      'Milk (enough to cover oats + 1cm extra)',
      'Greek yoghurt',
      'Frozen berries',
      'Optional: peanut butter, chia seeds, honey, granola, jam, kiwi',
    ],
    steps: [
      'Pour oats into a bowl or jar.',
      'Add milk to cover oats with about 1cm above.',
      'Add frozen berries.',
      'Leave in the fridge overnight.',
      'In the morning, add Greek yoghurt and any toppings you want.',
    ],
  },
]

// ─── Section 6: Roommate Tips ────────────────────────────────────────────────
export const roommateTips: string[] = [
  'Voice concerns early. The longer you wait, the harder it gets to say something.',
  'Make a small rulebook at the very beginning. Feels a bit mum-ish, but trust me — it\'s worth it.',
  'Set up a public cleaning schedule together (whiteboard in the hallway works well).',
  'Separate fridge shelves from day one.',
  'Keep your patience. When you live with multiple people, at least one will leave messes. Learn to let it go when it\'s not worth the fight.',
  "Don't be bossy. You all make mistakes. If you become good friends (which you hopefully will), you can tell each other things that bother you — just do it like a friend, not a landlord.",
  "Don't sleep with your housemates. Unless you're really sure. But even then — imagine things go south and you still have to live together for a year.",
  'Organise activities: BBQs, park days, movie nights, communal dinners. This builds real friendship and gives you a support network for the tough days.',
]

// ─── Section 7: Life Balance ─────────────────────────────────────────────────
export const lifeBalanceTips: string[] = [
  'Build a routine. Routines are genuinely good for your brain and serotonin levels — specific times for work, cleaning, social stuff, and rest.',
  'Find time for yourself. When you don\'t take that time, it gets harder to focus, have fun, and keep your routine.',
  'Take this guide as recommendations, not rules. Go step by step. Not vacuumed in 10 days? All chill.',
  'Talk to people. Whether in lectures, cafés, or at a bar — turn to the person next to you. You already have this skill.',
  "Don't take things personally. If someone doesn't reciprocate, it's almost never about you. You're liked by a lot of people — there's a reason for that.",
  "Don't hesitate to mix friend groups. Invite people you barely know to hang out with your friends. That's how real networks are built.",
  'Text Ilkhom. He knows you\'re in London, he likes you, he knows me well. Good person to have around when you need some familiarity.',
  'Be active. You\'ve always loved sports — keep it up. It directly raises your energy, happiness, and social life (calisthenics park, gym, football).',
  'Pick up new hobbies. Great way to meet people.',
  'Call the parents regularly. Time flies in uni — especially at the beginning.',
  'Track your finances. Make a spreadsheet with your expenses to see where your money goes.',
  'Get a job — but only after the first semester, once you know how much free time you have.',
]

// ─── Section 8: Uni Tips ─────────────────────────────────────────────────────
export const uniTips: string[] = [
  'Find out how you\'re graded: essays, multiple-choice, presentations? What\'s the criteria? Is there attendance? What gets you extra points?',
  'Every person learns differently. Find your niche — flashcards, summaries, practice questions. Figure out what works for you.',
  'Ask people in the year above about their experience: what are exams like, are there past papers, which summary sites are useful?',
  'Use AI to help you study. Upload notes, ask it to make practice exams. Don\'t overuse it — you\'re smart, keep your thinking sharp.',
  'Study with other people. Helps you understand things better, keeps you motivated, and makes exam season less lonely.',
]

// ─── Nav sections config ──────────────────────────────────────────────────────
export const sections = [
  { key: 'cleaning',   label: 'Cleaning',     icon: '🫧', hasChecklist: true  },
  { key: 'materials',  label: 'Materials',    icon: '🧴', hasChecklist: false },
  { key: 'appliances', label: 'Appliances',   icon: '🍳', hasChecklist: false },
  { key: 'groceries',  label: 'Groceries',    icon: '🛒', hasChecklist: false },
  { key: 'recipes',    label: 'Recipes',      icon: '👨‍🍳', hasChecklist: false },
  { key: 'roommates',  label: 'Roommates',    icon: '🏠', hasChecklist: false },
  { key: 'life',       label: 'Life balance', icon: '❤️', hasChecklist: false },
  { key: 'uni',        label: 'Uni tips',     icon: '🎓', hasChecklist: false },
]
