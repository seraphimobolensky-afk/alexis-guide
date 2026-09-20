import type { Cadence } from './habits'

export interface Bullet {
  text: string
  children?: Bullet[]
}

export interface CleaningTask {
  key: string
  icon: string
  title: string
  frequency: string
  /**
   * Which "done within window" rule applies (see lib/habits.ts) — not part
   * of the original PDF content, added so habit tracking has something to
   * key off. Several of these are approximations: the source text gives
   * frequencies like "bi-monthly" or "every month or two" that don't map
   * exactly onto the four windows this app supports (weekly/biweekly/
   * monthly/as_needed), so those were rounded to the closest one (monthly).
   */
  cadence: Cadence
  bullets: Bullet[]
}

export interface Material {
  type: string
  bullets: Bullet[]
}

export interface Appliance {
  key: string
  name: string
  use: string
  necessity: string
  bullets: Bullet[]
}

export interface Recipe {
  key: string
  title: string
  emoji: string
  intro?: string
  ingredients: Bullet[]
  steps: Bullet[]
}

export interface Letter {
  paragraphs: string[]
  listTitle: string
  list: Bullet[]
}

export interface ClosingNote {
  paragraphs: string[]
}

// ─── Welcome letter ("Dear Alexis...") ───────────────────────────────────────
export const welcomeLetter: Letter = {
  paragraphs: [
    'Dear Alexis,',
    "As promised on your 18th birthday, here is my present for when you move out of our parents' household.",
    "In this guide I have combined the knowledge I have gathered over the last 3 years of living by myself and with a roommate. Some of the things will seem really obvious to you, but I still included them just in case they weren't as obvious.",
    "The point of this gift is to help guide you through the big change of living with our parents and housekeepers, to living by yourself, having to clean, cook, plan for groceries, while still wanting to live a life outside of your home. So, it's really to help you get adjusted, and make sure you always have a place to look at when you need some reassurance of how to do things correctly, now that you live alone.",
  ],
  listTitle: 'Sections:',
  list: [
    { text: 'Cleaning schedules' },
    { text: "Cleaning materials needed in a young man's apartment" },
    { text: 'Appliances' },
    { text: 'How to plan your groceries' },
    { text: 'Some easy recipes that I have learned to love' },
    { text: 'roommate(s)' },
    { text: 'Life balance' },
  ],
}

// ─── Closing note ("Final note") ─────────────────────────────────────────────
export const closingNote: ClosingNote = {
  paragraphs: [
    "I'm super excited for you to start your study and a new life in London!! I'm 100% sure you're gonna have a great time and that you'll succeed in every aspect of your study there. To make things easier, this guide gives you a bit of an outline for how to handle difficult times, and especially, for not getting into difficult times in the first place!",
    "You're gonna do great!!!!! Much love,",
    'Sera',
  ],
}

// ─── Section 1: Cleaning schedules ───────────────────────────────────────────
export const cleaningIntro: string[] = [
  "Starting off with something that will make sure your room doesn't scare away the ladies when they enter, and keeps you healthy.",
  "When I first started living alone, I did not realize how much there actually is to keep clean and what little things will start looking dirty real quick, if you don't keep an eye out for it. Mind you, I still struggle sometimes with my cleaning routine but the earlier you start to understand it, the easier you will find it to keep on schedule.",
]

export const cleaningTasks: CleaningTask[] = [
  {
    key: 'vacuum',
    icon: '💨',
    title: 'Vacuum',
    frequency: 'Once a week',
    cadence: 'weekly',
    bullets: [
      { text: 'Move the furniture! Make sure the floor is as empty as possible' },
      { text: 'Get into the nooks and crannies with the attachments that vacuums usually have' },
      { text: 'The more dust you leave behind in the corners, the quicker your apartment gets dusty again. Makes sense' },
    ],
  },
  {
    key: 'laundry',
    icon: '🫧',
    title: 'Clothes laundry',
    frequency: "I do it once a week (when I don't have socks left)",
    cadence: 'weekly',
    bullets: [
      {
        text: 'A few things to note:',
        children: [
          { text: 'Separate darks and whites to make sure your whites stay crisp' },
          {
            text: 'Separate by temperature too',
            children: [
              { text: 'Wool usually cold (20 degrees)' },
              { text: 'Anything else can go hotter' },
              { text: 'Intense stains-> use Vanish and hotter temperature' },
              { text: 'Smells -> wash hotter (60-90)' },
              { text: 'Pants & sweaters inside-out' },
              { text: 'Jeans only wash cold and as rarely as possible to keep the color & structure' },
            ],
          },
          { text: "Don't necessarily need different detergent for color & whites, but does make a small difference" },
          { text: "Don't need fabric softener as it holds smells in your clothes" },
          { text: "Fold clothes immediately after dryer, then there's less creases" },
        ],
      },
    ],
  },
  {
    key: 'bedsheets',
    icon: '🛏️',
    title: 'Bedsheets laundry',
    frequency: 'Once a week, maximum after 2 weeks',
    cadence: 'weekly',
    bullets: [
      { text: "You might not notice the smell of your bed yourself, easy to think it's still clean" },
      { text: "Wash 40-60 degrees (hotter when it's been a while)" },
      { text: 'Flip mattress every now and then' },
      { text: 'Vacuum mattress every now and then too!' },
      { text: "If there's space in the machine for your clothes & bedsheets, you can wash them together" },
      { text: 'Pillows can also be washed! But not every type. Make sure to check the label on it before thinking of washing it' },
    ],
  },
  {
    key: 'towels',
    icon: '💧',
    title: 'Towels laundry',
    frequency: 'Once a week',
    cadence: 'weekly',
    bullets: [
      {
        text: 'WASH HOT',
        children: [
          { text: 'When towels don\'t dry properly, they start smelling very soon. Washing it at normal temperatures will NOT get rid of the smell' },
          { text: '90 degrees if it smells, 60 degrees otherwise' },
          { text: 'This includes all types of towels (kitchen, bath, lumpe, etc.)' },
        ],
      },
    ],
  },
  {
    key: 'sink',
    icon: '🚿',
    title: 'Sinks & shower',
    frequency: 'Around once a week in bathroom, daily wipe-down in kitchen',
    cadence: 'weekly',
    bullets: [
      { text: 'Check cleaning materials section for which soap to use for metals' },
      {
        text: 'When drops dry on taps, they are harder to clean off',
        children: [
          { text: 'The more frequently you clean it, the easier they come off' },
        ],
      },
      { text: "Pro tip: scrub parchment paper on metal appliances like sinks or showers, makes it hydrophobic from the wax so drops don't stick much -> less cleaning" },
      { text: 'Check cleaning materials section for which soap to use for shower' },
      {
        text: 'Clean shower bi-weekly or monthly (kinda nasty work)',
        children: [
          { text: "You'd think that using shower gel and shampoo in the shower would clean your shower by itself (it doesn't)" },
          { text: 'Shower water has your body and hair oils that stick to the floor and walls' },
          { text: 'After some layers, this gets yellow/pinkish' },
          { text: 'Scrub that bitch down every now and then, the more often, the easier it is to clean' },
        ],
      },
    ],
  },
  {
    key: 'toilet',
    icon: '🪣',
    title: 'Toilet bowl',
    frequency: 'Once a week/bi-weekly',
    cadence: 'biweekly',
    bullets: [
      { text: 'Use the specific toilet cleaner, usually has kind of a weird spout, shaped a bit like a duck' },
      { text: 'Run the cleaner around the inside of the rim of the toilet bowl (ceramic part, not where you sit) (where the water comes from)' },
      {
        text: 'Make sure you really make the full round, let it sit for a minute and then start scrubbing with toilet brush',
        children: [
          { text: 'Scrub extra hard at the bottom' },
        ],
      },
      { text: 'Once scrubbing is done, flush while still scrubbing' },
    ],
  },
  {
    key: 'fridge',
    icon: '❄️',
    title: 'Fridge',
    frequency: 'Bi-monthly',
    cadence: 'monthly',
    bullets: [
      { text: 'Check cleaning materials section for what to use' },
      { text: 'Pretty annoying but easy to do' },
      { text: 'Best done before you get a new round of groceries' },
      { text: 'Take out the glass and wipe it down, clean walls every now and then too' },
      { text: 'If your fridge has a smell, put a cup filled with some baking soda into the fridge. This soaks up smells' },
    ],
  },
  {
    key: 'extractor',
    icon: '🌬️',
    title: 'Kitchen extractor filter',
    frequency: 'Every month or two',
    cadence: 'monthly',
    bullets: [
      { text: 'Depending on the type, some of them have a white mesh material inside which you need to replace every now and then to make sure it still does its job' },
      { text: 'Wipe down with degreaser every now and then' },
    ],
  },
  {
    key: 'mirrors',
    icon: '🪞',
    title: 'Mirrors/glass',
    frequency: "Whenever there's need",
    cadence: 'as_needed',
    bullets: [
      { text: 'Use a micro-fibre towel to not have streaks when cleaning' },
      { text: 'Wipe vertically to reduce streaks even more' },
    ],
  },
  {
    key: 'dust',
    icon: '🪄',
    title: 'Dust-off mirrors/top of shelves',
    frequency: 'Every time before you vacuum',
    cadence: 'weekly',
    bullets: [
      { text: "If you do it after vacuuming, you'll probably push some of the dust back onto the floor" },
      { text: 'Use SWIFFER, super easy to use, satisfying ASFFF' },
    ],
  },
  {
    key: 'kettle',
    icon: '☕',
    title: 'Kettle & coffee machines',
    frequency: 'Once a month/bi-monthly',
    cadence: 'monthly',
    bullets: [
      { text: 'Fill it with a mixture of equal parts white vinegar and water, or 1 tablespoon of citric acid mixed in water.' },
      { text: 'Boil the mixture, let it soak for 20–30 minutes to dissolve the scale, then rinse thoroughly and boil fresh water to remove any lingering taste' },
    ],
  },
]

// ─── Section 2: Cleaning materials ───────────────────────────────────────────
export const materialsIntro: string[] = [
  'Below is a table that summarizes all the cleaning materials that I have found to be very useful over the years, for a range of different cleaning tasks. Brands don\'t really matter that much, just buy whatever looks good to you. I often go for the grocery-store brands for price reasons.',
  'Most of these you can just buy in grocery stores but they might have better prices in B&M Bargains (or Action but you don\'t have that in London)',
]

export const cleaningMaterials: Material[] = [
  {
    type: 'All-purpose cleaner spray',
    bullets: [{ text: 'Good for surfaces: tables, walls, kitchen even' }],
  },
  {
    type: 'De-greaser spray',
    bullets: [
      { text: 'Good for kitchen, stove, shower.' },
      { text: 'Works best if you spray it, and let sit for a minute or two (generalizable to most cleaning sprays)' },
      { text: 'Spray -> scrub with sponge ->' },
    ],
  },
  {
    type: 'De-calcifier spray (anti-kalk)',
    bullets: [
      { text: 'Good for shower, kitchen sink, metal appliances if you want to get rid of water droplets' },
      { text: 'I mostly used this for the glass I had in my shower in De Pijp for the water stains' },
    ],
  },
  {
    type: 'Cream cleaner (usually yellow bottle with red cap)',
    bullets: [
      { text: 'Best thing ever for metal appliances' },
      { text: 'Put a little bit of it on a sponge and scrub' },
      { text: 'Gives a nice, new shine to the metal parts in sinks, showers, gas stoves, etc.' },
      { text: "It's very aggressive so best used with a sponge" },
      { text: 'Wipe down after with a moist towel and then with a dry one' },
    ],
  },
  {
    type: 'Toilet cleaner',
    bullets: [
      { text: 'This one is important, the bottle is shaped like a duck neck and head.' },
      { text: "Brand again doesn't matter but you can choose the smell" },
    ],
  },
  {
    type: 'Toilet Brush',
    bullets: [{ text: "Nasty stuff, you're gonna want to replace this every now and then" }],
  },
  {
    type: 'Kitchen paper',
    bullets: [{ text: 'Nothing expensive, cheapest will do' }],
  },
  {
    type: 'Sponges',
    bullets: [
      {
        text: 'I usually have two types laying around:',
        children: [
          {
            text: 'the one in the kitchen for dishes',
            children: [
              { text: 'Make sure this one is anti-scratch and can be used on non-stick pans' },
            ],
          },
          {
            text: 'One for cleaning',
            children: [
              { text: 'Can be the same type as kitchen one, or one that is a bit more sturdy' },
            ],
          },
        ],
      },
    ],
  },
  {
    type: 'Cleaning gloves',
    bullets: [{ text: "I never got these out of stubbornness, but especially for using the cream cleaner or for cleaning the toilet, it's useful" }],
  },
  {
    type: 'Swiffer',
    bullets: [{ text: 'Favorite thing for dusting off, replace the towel part when it starts to get more crumpled up and dirty' }],
  },
  {
    type: 'Glass cleaner (optional)',
    bullets: [{ text: 'Good for not having any streaks on the glass, but you can also use anti-kalk spray for glass, almost same effect it seems' }],
  },
  {
    type: 'Mop (Swisher is easiest and uses least space)',
    bullets: [
      { text: 'Easy to use, cheap but probably have to order it or go to a supply store' },
      { text: 'Mop every second time you vacuum' },
    ],
  },
  {
    type: 'Micro-fibre towels',
    bullets: [{ text: "Good for cleaning since they don't leave textile fibres behind" }],
  },
  {
    type: 'Linen towels',
    bullets: [{ text: "Good for drying dishes since they also don't leave fibres and streaks behind" }],
  },
]

// ─── Section 3: Appliances ────────────────────────────────────────────────────
export const appliances: Appliance[] = [
  {
    key: 'swisher',
    name: 'Swisher',
    use: 'mopping',
    necessity: '5',
    bullets: [{ text: "Necessary because it's cheap, easy to use, does the job" }],
  },
  {
    key: 'smartbulbs',
    name: 'Smart light-bulbs',
    use: 'Elevate your living area',
    necessity: '1',
    bullets: [
      { text: 'Make sure you get them all from the same brand for easier coordination' },
      { text: 'Not necessary but nice to have' },
    ],
  },
  {
    key: 'airfryer',
    name: 'Airfryer',
    use: 'Cooking, baking, steaming, frying',
    necessity: '3-5',
    bullets: [
      { text: '10/10 experience, nice to have for sure' },
      { text: "Is it strictly necessary? No, but can contribute nicely if you don't have an oven. If you have an oven, you don't need an airfryer" },
      { text: 'Wait for Black Friday before buying for better prices' },
    ],
  },
  {
    key: 'fridge',
    name: 'Fridge',
    use: 'You know',
    necessity: '5',
    bullets: [{ text: 'Yes ofc' }],
  },
  {
    key: 'coffee',
    name: 'Coffee machine',
    use: 'coffee',
    necessity: '5',
    bullets: [
      { text: 'This is a tricky one.' },
      { text: "DON'T get a mocha machine (shit tastes nasty)" },
      {
        text: 'Price-wise, get a french press',
        children: [
          { text: 'Nice because you can choose which beans you want, what it should take like' },
          { text: 'Very easy to use if you have a scale' },
          { text: 'Can make cold brew coffee too, good flavor' },
        ],
      },
      {
        text: 'Taste-wise',
        children: [
          { text: 'Filter coffee' },
          { text: 'No need for a machine, just get the funnel and the paper' },
          {
            text: 'Same benefits as french-press but elevated flavor',
            children: [
              { text: 'Can taste the different notes more' },
            ],
          },
        ],
      },
      {
        text: 'Ease-of use',
        children: [
          { text: 'Nespresso machine' },
          { text: 'Can get cheaper capsules than Nespresso ones in the grocery store' },
          { text: 'Price of coffee minus machine is around the same as other options' },
          { text: 'Wait until you find a good deal on Facebook marketplace/groupchats before buying one' },
        ],
      },
    ],
  },
  {
    key: 'milkfrother',
    name: 'Milk frother',
    use: 'Milk coffees',
    necessity: '1',
    bullets: [{ text: "You don't need this. I've made this mistake and it breaks so quickly" }],
  },
  {
    key: 'icetrays',
    name: 'Ice trays',
    use: '',
    necessity: '3',
    bullets: [
      { text: "Very nice to have, I'd get the silicone ones (you can find them cheap on Amazon)" },
      { text: "Make sure the cubes aren't too small because then you'll need a bunch of them per glass" },
    ],
  },
  {
    key: 'rice',
    name: 'Rice cooker',
    use: 'rice',
    necessity: '3',
    bullets: [
      { text: 'Good to have, makes making rice much more simple' },
      { text: 'Cheap (20-30 euros is good enough)' },
      { text: 'Get basmati or jasmine rice' },
    ],
  },
  {
    key: 'boards',
    name: 'Wooden boards',
    use: 'cutting',
    necessity: '5',
    bullets: [
      { text: "Don't get plastic ones because of the microplastics" },
      { text: 'Best is when the wood is one solid piece, get 2-3 different sizes' },
    ],
  },
  {
    key: 'knife',
    name: 'Knife-sharpener',
    use: 'Sharpen knife, enhance cooking experience',
    necessity: '3',
    bullets: [
      { text: 'Cheap and effective (5-20 euros)' },
      { text: 'Worth paying 20' },
      { text: "Imagine cutting a tomato with a dull knife (doesn't work well, does it?)" },
    ],
  },
  {
    key: 'storage',
    name: 'IKEA food storage boxes with lid',
    use: 'Meal-prep, keep leftovers',
    necessity: '4-5',
    bullets: [
      { text: "The more glass, the better because they don't stain and are easy to clean" },
      { text: 'Different sizes are an advantage, but depends on what you need it for.' },
      { text: "I have 3 of them, don't need more than 5 I'd say" },
    ],
  },
  {
    key: 'bigbowl',
    name: 'Big bowl',
    use: 'Salads, mixing, etc',
    necessity: '4',
    bullets: [{ text: 'Good to have, has many uses' }],
  },
  {
    key: 'bowls',
    name: 'Bowls',
    use: 'For eating',
    necessity: '5',
    bullets: [{ text: 'Underrated, I prefer them over plates' }],
  },
  {
    key: 'extension',
    name: 'Extension cords',
    use: 'Freedom for charging phone, using appliances',
    necessity: '4-5',
    bullets: [{ text: "Get one with 5 outlets on it, I'd say get a black one just because I feel like they camouflage better." }],
  },
  {
    key: 'tv',
    name: 'TV',
    use: '',
    necessity: '2',
    bullets: [{ text: 'Nice to have but not necessary' }],
  },
  {
    key: 'ziplock',
    name: 'Ziplock bags',
    use: 'Cooking, freezing, marinating',
    necessity: '5',
    bullets: [
      { text: 'Super useful to have' },
      { text: 'You can use them for anything and you can buy them in big packs' },
    ],
  },
  {
    key: 'candles',
    name: 'Scented candles',
    use: 'Keep your room nice',
    necessity: '3-4',
    bullets: [
      { text: 'Always good to have one at least' },
      { text: "Don't get them in the grocery store, but rather somewhere more special." },
      { text: 'Can find good ones for cheap' },
    ],
  },
  {
    key: 'ironing',
    name: 'Ironing board & iron',
    use: 'clothes',
    necessity: '3',
    bullets: [
      { text: 'I thought it was necessary to iron clothes after every wash (no one does it)' },
      { text: 'Nice to have but not necessary at all, except maybe for a job interview' },
    ],
  },
  {
    key: 'monitor',
    name: 'Cheap monitor on your desk',
    use: 'working/studying',
    necessity: '3',
    bullets: [
      { text: 'Depends on your study, and tasks but can be really nice to have' },
      { text: 'Have always thought about having one too' },
      { text: 'You live close to the library where they might have them for use as well.' },
    ],
  },
  {
    key: 'beardtrimmer',
    name: 'Beard trimmer',
    use: 'Keeping yourself fresh',
    necessity: '3',
    bullets: [
      { text: 'If you get lazy to shave all the time, this is good.' },
      { text: 'Before buying, do research for how closely it can shave' },
    ],
  },
  {
    key: 'razor',
    name: 'Safety razor',
    use: 'shaving',
    necessity: '3',
    bullets: [
      { text: 'Better for your skin and hairs than the normal Gillette ones' },
      { text: 'Easy to cut yourself so be careful, only makes sense when you reach a certain stage of beard growth I feel like' },
    ],
  },
]

// ─── Section 4: Planning groceries ───────────────────────────────────────────
export const groceriesIntro: string[] = [
  "This is my least favorite part. I can't believe I'm gonna have to be doing this my whole life. Sucks hard icl.",
  'However, there are some tips that can make it a lot easier for you to keep an overview of what to buy and when to buy it.',
]

export const groceryTips: Bullet[] = [
  { text: 'Use the Reminders app, make a new list, choose list type -> groceries', children: [
    { text: 'Automatically sorts whatever item you put in into specific sections (produce, dairy, etc.)' },
  ]},
  { text: 'Plan what you want to buy, before you go' },
  { text: 'Find the cheapest grocery store in your area' },
  { text: "Join all grocery stores' loyalty programs (similar to Migros Cumulus)", children: [
    { text: 'Download their apps' },
    { text: 'Check the apps for what the weekly discounts are' },
    { text: 'Can help you plan what to eat this week as well' },
  ]},
  { text: 'Depending on fridge space, go once to twice a week for a big grocery haul' },
  { text: 'Buy in bulk what you can. For example:', children: [
    { text: 'Rice (4kg pack is much cheaper per portion)' },
    { text: 'Eggs (20 pack instead of 6 pack)' },
  ]},
  { text: 'Always plan on getting 1-2 types of fruit too.', children: [
    { text: 'I usually go for Fuji apples and bananas' },
    { text: 'Berries are super good for your health, they have a lot of micro-nutrients' },
    { text: 'Kiwis are healthiest if you eat them with the skin' },
  ]},
  { text: 'Have tomatoes and cucumber on hand always', children: [
    { text: 'Can use them for anything; breakfast, lunch or dinner' },
  ]},
  { text: 'Have a specific breakfast that you eat every day. Once you get the routine, it makes your mornings easier', children: [
    { text: 'Make sure it packs protein' },
    { text: 'I usually alternate between having any type of eggs, overnight oats or Greek yoghurt breakfasts' },
    { text: 'Stay away from just bread with jam as it messes up your energy levels for the day' },
  ]},
  { text: 'Having a rotation of lunches and dinners that are easy to make and pack protein helps making groceries a more routine task than a deliberate thinking task.' },
  { text: 'Meal-prepping is cheapest over time!', children: [
    { text: 'MOB is an app that has a lot of meal-prepping recipes on it, costs like 1.5 euro per month, might be worth it for you too' },
  ]},
]

// ─── Section 5: Easy recipes that I like ─────────────────────────────────────
export const recipes: Recipe[] = [
  {
    key: 'bacon-pasta',
    title: 'Bacon pasta (fan favorite)',
    emoji: '🍝',
    ingredients: [
      { text: 'Pre-cut smoked bacon pieces (200-500g)' },
      { text: 'Rigatoni or penne' },
      { text: 'Heavy cream or creme fraiche' },
      { text: 'Tomato paste' },
      { text: 'Pepper & some herbs if you want' },
      { text: 'Parmesan or pecorino' },
      { text: 'Optional: white wine' },
    ],
    steps: [
      { text: 'You can simultaneously make the pasta and the sauce, so start with heating up the water' },
      { text: "While that's warming up, heat up your pan and throw the bacon pieces into it when it's hot" },
      { text: 'Put the pasta to boil' },
      { text: 'Let that sizzle in its own fat, for a bit, then add pepper and tomato paste', children: [
        { text: 'If you want to use wine, pour in a bit right before adding pepper and paste' },
      ]},
      { text: "Add some more tomato paste and spices and mix until it's all equally colored, medium heat" },
      { text: 'Once the pasta is close to being done, add a good amount of creme fraiche or cream and stir' },
      { text: 'Collect the white foam on top of pasta water with a spoon and add some into the sauce to bind it together' },
      { text: 'Right before pouring out the pasta water, add some cheese into the sauce' },
      { text: 'Drain the pasta and mix it all together' },
      { text: 'Enjoy that' },
    ],
  },
  {
    key: 'tuna-salad',
    title: 'Tuna salad',
    emoji: '🥗',
    intro: 'Sounds nasty, I know, but trust me. Tastes good and has high protein',
    ingredients: [
      { text: 'Can of tuna (either in water or olive oil)' },
      { text: 'Cucumber' },
      { text: 'Tomatoes' },
      { text: 'Red onion or shallots' },
      { text: 'Rice' },
      { text: 'Soy sauce' },
      { text: 'Rice vinegar or balsamic vinegar' },
      { text: 'Brown sugar/teriyaki sauce' },
      { text: 'Sesame oil' },
      { text: 'Spices (chili flakes)' },
    ],
    steps: [
      { text: 'Dice the cucumber and already mix it with soy sauce', children: [
        { text: 'Pro tip: before cutting the cucumber, smash it with the back of your knife. This makes it more juicy and takes up flavor better' },
        { text: 'Also letting it sit in soy sauce for a bit gives it a nice crunchy texture' },
      ]},
      { text: 'Make the rice' },
      { text: 'Dice tomatoes and onion' },
      { text: 'In the cucumber bowl, add the rest of the dressing ingredients' },
      { text: 'Then add the tomato and onion too' },
      { text: 'Put the rice in a bowl and add the salad on top' },
      { text: 'Add salt or anything else that you feel is missing' },
    ],
  },
  {
    key: 'bolognese',
    title: 'Bolognese',
    emoji: '🫕',
    intro: 'This is great to know how to make, there are different ways of making it, but the most important step is letting it reduce multiple times. This sauce is great for meal-prepping, so if you have a big pan, make a lot of this at once and then freeze or refrigerate the leftovers.',
    ingredients: [
      { text: 'Ground beef' },
      { text: 'Broth cube' },
      { text: 'Peeled tomatoes cans (around 2 cans per 500g beef)' },
      { text: 'Onion' },
      { text: 'Rigatoni pasta' },
      { text: 'Pecorino or parmesan' },
      { text: 'Butter or olive oil' },
      { text: 'Little bit of sugar' },
      { text: 'Optional: carrots and fresh tomatoes' },
    ],
    steps: [
      { text: 'Cut half the onion into strips, the other half you can leave whole' },
      { text: 'Let the onions fry for a bit in butter or olive oil' },
      { text: 'Turn up the heat, and add all the ground beef', children: [
        { text: 'Not too hot, but you want it to char a bit if possible' },
        { text: 'Make sure each piece is getting heat' },
      ]},
      { text: 'Add carrot' },
      { text: 'Shock with broth/wine' },
      { text: 'Add the peeled tomato cans into it and let it broil on medium heat' },
      { text: 'Add a little bit of sugar' },
      { text: 'Every now and then, add some beef broth and let it boil down again. This makes the flavor profile more deep' },
      { text: 'After letting it reduce multiple times, add a chunk of butter into the mixture', children: [
        { text: 'This makes the sauce more creamy' },
      ]},
      { text: 'Add some pasta water too for the consistency' },
      { text: 'Tip: the longer it boils, the better it tastes' },
      { text: 'Make the pasta too on the side' },
      { text: 'Enjoy' },
    ],
  },
  {
    key: 'tortilla-burgers',
    title: 'Tortilla burgers (banger)',
    emoji: '🌮',
    intro: "This one I just discovered and it's so good",
    ingredients: [
      { text: 'Ground beef (250g per person)' },
      { text: 'Burrito seasoning packet' },
      { text: 'Burger cheese slices' },
      { text: 'Tortillas that fit into your pan' },
      { text: 'onion' },
      { text: 'Lettuce' },
      { text: 'Tomatoes' },
      { text: 'Any sauces you might want' },
      { text: 'Guacamole or avocado is also a good addition' },
    ],
    steps: [
      { text: 'Caramelize some onions', children: [
        { text: 'The way to do it is to chop them up, add them to a pan or pot with olive oil or butter and stir on low heat for around 10 mins' },
      ]},
      { text: 'Into a bowl, add the ground beef and sprinkle a good amount of the seasoning on it' },
      { text: 'Mix it up with a fork or your hands' },
      { text: 'Take a tortilla, put a slice of cheese on it and then spread the spiced ground beef on it', children: [
        { text: 'Easiest way is to do this with a fork' },
        { text: 'You want to make sure the beef is basically attached to the tortilla' },
      ]},
      { text: 'Put the tortilla on a hot pan face-down and let it fry for around 5 mins, then flip it' },
      { text: 'Once flipped, add another cheese onto the beef and put a lid on it' },
      { text: 'A few minutes later you can take it off the pan and add whatever additional stuff you want on it' },
      { text: 'I like it with the caramelized onions, lettuce, maybe some tomato slices and chipotle sauce' },
    ],
  },
  {
    key: 'scrambled-eggs',
    title: 'Scrambled eggs',
    emoji: '🍳',
    intro: 'These are the ones I always make. It makes sure you get your protein in the morning and tastes phenomenal.',
    ingredients: [
      { text: '3-5 eggs' },
      { text: 'Butter' },
      { text: 'Creme fraiche' },
      { text: 'Optional additions:', children: [
        { text: 'Tomatoes' },
        { text: 'Parmesan' },
        { text: 'onion/garlic powder' },
      ]},
    ],
    steps: [
      { text: 'Turn the pan on low heat and let a good chunk of butter melt in there' },
      { text: 'Take the pan off the heat and crack your eggs into it' },
      { text: 'Take a spatula and mix it all up until consistent' },
      { text: 'Put the pan back on the heat and stir every now and then' },
      { text: 'When the eggs are almost cooked, add 1-2 full tablespoons of creme fraiche and let it melt into the mixture while you stir' },
      { text: 'Best enjoyed with a toast and cream cheese, with salt and smoked paprika powder on it' },
    ],
  },
  {
    key: 'boiled-eggs-toast',
    title: 'Boiled eggs on toast',
    emoji: '🍞',
    intro: 'Just started making this sometimes, great breakfast but more time intensive than scrambled.',
    ingredients: [
      { text: '2-3 eggs' },
      { text: 'Water' },
      { text: 'Cucumber' },
      { text: 'Cream cheese' },
      { text: 'Cherry tomatoes' },
      { text: "Balsamic vinegar but the type that's not very fluid" },
    ],
    steps: [
      { text: 'Bring water to a boil and add the eggs into it for around 6 minutes' },
      { text: 'Take the eggs out and put them into a bowl of cold/ice water' },
      { text: 'Make sure the water stays cold and let them sit in there for around 10 mins', children: [
        { text: 'This step makes sure they are easier to peel' },
      ]},
      { text: 'Peel the eggs' },
      { text: 'Spread cream cheese and cucumber slices on your toast' },
      { text: 'Slice the eggs onto the toast' },
      { text: 'Garnish with cherry tomato slices, salt and the balsamic vinegar sauce thing' },
      { text: "Rate it 1-10 (it's a 10)" },
    ],
  },
  {
    key: 'overnight-oats',
    title: 'Overnight oats',
    emoji: '🫙',
    intro: 'This you can also make in bigger batches, or make it in the evening for the next day. The great thing about this is that you can add whatever you want in the morning to spice it up.',
    ingredients: [
      { text: 'Oats' },
      { text: 'Milk' },
      { text: 'Greek yoghurt' },
      { text: '(frozen) berries', children: [
        { text: 'Cheaper if frozen while still containing all nutrients' },
      ]},
      { text: 'Optional:', children: [
        { text: 'Peanut butter' },
        { text: 'Chia seeds' },
        { text: 'Any other types of seeds' },
        { text: 'Jam' },
        { text: 'Honey' },
        { text: 'Kiwis' },
        { text: 'Granola' },
        { text: 'etc.' },
      ]},
    ],
    steps: [
      { text: 'Pour around 100g oats into a bowl' },
      { text: 'Pour enough milk into it to cover the oats and leave around 1cm extra milk on top of the oats' },
      { text: 'Add your frozen berries already' },
      { text: 'Let that sit in the fridge overnight' },
      { text: 'In the morning, add Greek yoghurt, and any other options you wanted to add such as peanut butter or chia seeds' },
      { text: 'Enjoy!' },
    ],
  },
]

// ─── Section 6: Roommates ─────────────────────────────────────────────────────
export const roommatesIntro: string[] = [
  "This section is especially important for you because you will be living and sharing rooms with multiple roommates. I've only lived with one roommate, but with the amount of dirt that mf left behind, it felt like 4. So here's some tips to make sure you don't need to crash out on the phone to our parents every weekend like I did.",
]

export const roommateTips: Bullet[] = [
  { text: 'From the start, voice your concerns', children: [
    { text: "The longer you wait to mention something, the harder it's gonna feel to say something" },
  ]},
  { text: "Make a little rule-book at the very beginning with your roommates. It's gonna feel like you're the mom of the group but trust me it's gonna be important to have it" },
  { text: 'Make a public cleaning schedule together', children: [
    { text: 'Like on a whiteboard in the hallway for example' },
    { text: 'This way you can see when and who last cleaned the shower for example' },
  ]},
  { text: 'Separate shelves in the fridges of course' },
  { text: 'Keep your patience', children: [
    { text: "You're living with multiple people. Chances are that at least one of them is gonna be dirty and leave messes behind. Learn to just ignore it when you see it. Getting mad about it but not doing anything about it will only lead you to get more mad." },
  ]},
  { text: "Don't be bossy", children: [
    { text: "You're all students, you are all learning and you all make mistakes" },
    { text: "Some things that you do will piss off others too, that's important to keep in mind" },
    { text: "From what I know, you're hopefully gonna become good friends with your housemates. In friendships you are also allowed to tell each other things that rub you the wrong way." },
  ]},
  { text: "Don't sleep with your housemates!", children: [
    { text: "Except if she's really bad, then do it I guess but lead with precaution" },
    { text: 'Imagine things go wrong between you two and then you still have to live together for almost a year' },
    { text: 'Outsource your booty from somewhere else, or at least from a different floor hahaha' },
  ]},
  { text: 'Organize activities with your housemates', children: [
    { text: 'Bbqs, park days, movie nights, communal dinners' },
    { text: 'This helps make your friendships deeper, appreciate each other more and gives you a social network to rely on when times are tough' },
    { text: "There will be times when you feel lonely, but if you live with fun people, that's gonna help" },
  ]},
]

// ─── Section 7: Life balance ──────────────────────────────────────────────────
export const lifeIntro: string[] = [
  "This is the most important part. In my experience, living abroad and by yourself can lead to extremely fun, but also potentially lonely times. I've added some tips below that will help you balance all the new things you'll be responsible for, while staying happy.",
]

export const lifeBalanceTips: Bullet[] = [
  { text: 'Figure out a routine', children: [
    { text: "Routines are really good for people's brains and serotonin levels." },
    { text: 'Having a routine can alleviate some stresses as well. You have specific work times, specific days for groceries, cleaning and laundry, specific times for spending time with friends, and specific times for when you just wanna chill.' },
  ]},
  { text: 'Find time for yourself', children: [
    { text: 'Your days will be full of fun, and not so fun activities. If you want to keep a clear mind, make sure you also have some time for yourself, to read, watch a movie, or call with some friends around the world.' },
    { text: "I always found this nice to have because it grounded me a bit. When I don't take enough time for myself, I find it harder to focus, have fun and even just keep my routine." },
  ]},
  { text: 'Take this guide as recommendations, not as rules.', children: [
    { text: 'The amount of information in this guide can be overwhelming when you first look at it, which I fully understand.' },
    { text: "Go step-by-step. This guide is meant for you to primarily be able to look at when you feel uncertainty with how to go about certain things for example cleaning, groceries, social life. Just because I said it's good to vacuum once a week, doesn't mean you're a dirty ass guy because you haven't vacuumed in 10 days. All chill." },
  ]},
  { text: 'Talk to people, be proactive', children: [
    { text: "Whether you're sitting in a lecture, tutorial, cafeteria, cafe, bar, don't hesitate to turn to the person next to you and chat to them a bit. This is a skill that you already possess, but that can always be developed further." },
    { text: 'Get their Instagram, number or Snapchat I guess, if you like them.' },
    { text: "If they don't really reciprocate your chat, that's ok. Maybe they're really introverted or they are having a bad day. Almost every time, it has nothing to do with you." },
  ]},
  { text: "Don't take things personal, take an out-perspective, rather than an in-perspective", children: [
    { text: 'This point is kind of connected to my previous point about talking to people' },
    { text: "It's something I really had to learn over and over. From moving around so much at young ages, I had always felt the need to have to adjust myself, in order to please, or be liked by others. That's really not necessary. If you like a person, chances are they like you too, whether romantically or platonically." },
    { text: "Don't forget how liked you are by the people around you; family, friends, teachers, Pfadi, etc. There's a reason for that. You're You!" },
    { text: "As I said, if someone doesn't reciprocate, it's got something to do with them, not with you. If someone treats you badly, same thing." },
    { text: "Of course, it's still good to be self-aware, but too much of anything is never good" },
  ]},
  { text: "Don't hesitate to combine different groups of people with each other that don't know each other before", children: [
    { text: "That's how networks are built" },
    { text: "Host parties, invite people you don't really know to hangouts with your friends" },
  ]},
  { text: 'Text Ilkhom', children: [
    { text: "Ilkhom knows you're gonna be studying in London next year, and has always liked you" },
    { text: "If you're looking for some familiarity in your life and/or a good time, he's the guy to go to" },
    { text: 'He knows me well, which means he knows you a bit as well.' },
  ]},
  { text: 'Be active', children: [
    { text: "You've always loved sports so I don't have to tell you this twice" },
    { text: 'Being more physically active raises life quality significantly, makes you more happy, energetic and outgoing.' },
    { text: "In times where I've felt anxious or self-conscious, I picked up sports more again and almost immediately felt better" },
    { text: "It's also a great way to meet new people", children: [
      { text: 'Whether in football practice, calisthenics parks, or the gym' },
    ]},
  ]},
  { text: 'Pick up new hobbies', children: [
    { text: 'This one kind of goes hand in hand with being active, great way to meet people.' },
  ]},
  { text: 'Call regularly with the parents', children: [
    { text: 'Time flies in uni, especially in the beginning' },
    { text: "They're here to listen to you about whatever goes on in your mind and can give you support" },
    { text: 'You can choose yourself how often you call with them, I usually do it once a week for a catchup chat' },
  ]},
  { text: 'Keep track of your finances', children: [
    { text: 'This is something Papi will also tell you' },
    { text: 'Make a spreadsheet with your expenses to see how much you spend on what' },
  ]},
  { text: 'If time allows it, get a job', children: [
    { text: "Definitely do the first semester without a job to see how it is. If you realize you've got quite some time left every week, you also have time for a job" },
    { text: "Our parents give us money for surviving + a bit of fun, but if you want to go out a lot, buy new clothes, etc. you'll need a job" },
  ]},
]

// ─── Academic tips ────────────────────────────────────────────────────────────
export const uniIntro: string[] = [
  'Uni life and high-school life are similar to some extent but also very different.',
]

export const uniTips: Bullet[] = [
  { text: 'Find out how you are graded', children: [
    { text: 'Essays? Multiple-choice exams? Presentations?' },
    { text: 'Do you need to learn by heart or do you need to be able to synthesize topics?' },
    { text: 'What is the criteria for each course?' },
    { text: 'How can you get extra points?' },
    { text: 'What is the attendance policy?' },
    { text: 'All these factors lead to understanding your course better and knowing how to study' },
  ]},
  { text: 'Every person has a different way of learning. Some people learn best with flashcards, others by summarizing texts.', children: [
    { text: 'Find your study niche, how do you most effectively study?' },
  ]},
  { text: 'Ask people in years above you about their experience. What are the exams like, are there past papers, what websites for summaries etc.', children: [
    { text: 'This could take a while before you meet someone in a year above, but it will be helpful' },
  ]},
  { text: 'Use AI to help you', children: [
    { text: 'Understand how AI can contribute to your studying.' },
    { text: 'The way I did it is upload all my notes for courses and then give specific instructions for making practice exams if there were no past papers.' },
    { text: "Don't overuse it. You're a smart guy, you don't wanna lose your thinking capacity." },
  ]},
  { text: 'Study with other people', children: [
    { text: 'Can help you understand things better' },
    { text: 'Can give you motivation to keep going' },
    { text: 'And can make you feel less lonely during study periods before exams.' },
  ]},
]

// ─── Nav sections config ──────────────────────────────────────────────────────
export const sections = [
  { key: 'welcome',    label: 'Start here',   icon: '💌', hasChecklist: false },
  { key: 'cleaning',   label: 'Cleaning',     icon: '🫧', hasChecklist: true  },
  { key: 'materials',  label: 'Materials',    icon: '🧴', hasChecklist: false },
  { key: 'appliances', label: 'Appliances',   icon: '🍳', hasChecklist: false },
  { key: 'groceries',  label: 'Groceries',    icon: '🛒', hasChecklist: false },
  { key: 'recipes',    label: 'Recipes',      icon: '👨‍🍳', hasChecklist: false },
  { key: 'roommates',  label: 'Roommates',    icon: '🏠', hasChecklist: false },
  { key: 'life',       label: 'Life balance', icon: '❤️', hasChecklist: false },
  { key: 'uni',        label: 'Uni tips',     icon: '🎓', hasChecklist: false },
]
