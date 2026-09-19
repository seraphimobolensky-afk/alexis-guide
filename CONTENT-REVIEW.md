# Content Review — Phase 2 (Transcription)

**Purpose:** verify that nothing in the app's content was invented, lost, shortened, or reworded beyond the fixes explicitly allowed (spelling, grammar, capitalisation of headings/proper nouns, cleaning up broken PDF-extraction characters, and turning two-column tables into structured data).

**Method:** the source PDF (`../A guide to living alone.pdf`) was extracted with PyMuPDF (`pdftotext` isn't installed on this machine and there's no Homebrew to add it; PyMuPDF is a self-contained library that gives the same reading-order text output, plus per-line x-position and font data, which I used to reconstruct the bullet hierarchy — including which lines are new bullets versus wrapped continuations of the previous line). The PDF was confirmed to contain no images or diagrams — it's text-only, so nothing was missed to a non-text element.

Below, every section shows the **source text** (cleaned of PDF-extraction artifacts — stray zero-width spaces after every `●`/`○`/letter bullet, glyph, and mid-word soft hyphens — but otherwise word-for-word) side by side with **what's in the app now**. Where they differ, it's listed in that section's change log with a one-word reason.

---

## Welcome letter (new — key `welcome`, label "Start here")

**Source (PDF page 1, opening letter):**
> Dear Alexis,
>
> As promised on your 18th birthday, here is my present for when you move out of our parents' household.
>
> In this guide I have combined the knowledge I have gathered over the last 3 years of living by myself and with a roommate. Some of the things will seem really obvious to you, but I still included them just in case they weren't as obvious.
>
> The point of this gift is to help guide you through the big change of living with our parents and housekeepers, to living by yourself, having to clean, cook, plan for groceries, while still wanting to live a life outside of your home. So, it's really to help you get adjusted, and make sure you always have a place to look at when you need some reassurance of how to do things correctly, now that you live alone.
>
> SECTIONS:
> 1. Cleaning schedules
> 2. Cleaning materials needed in a young man's apartment
> 3. Appliances
> 4. How to plan your groceries
> 5. Some easy recipes that I have learned to love
> 6. roommate(s)
> 7. Life balance

**In the app now:** identical, verbatim (`lib/content.ts` → `welcomeLetter`). No changes.

**Note:** this letter, and the closing note below, did not exist anywhere in the app before this phase — the app jumped straight to "Cleaning schedules." Added as instructed, as the new first nav entry.

---

## Section 1: Cleaning schedules

**Source intro (page 1):**
> Starting off with something that will make sure your room doesn't scare away the ladies when they enter, and keeps you healthy.
>
> When I first started living alone, I did not realize how much there actually is to keep clean and what little things will start looking dirty real quick, if you don't keep an eye out for it. Mind you, I still struggle sometimes with my cleaning routine but the earlier **to** you start to understand it, the easier you will find it to keep on schedule.

**App now:** same, except "the earlier **to** you start" → "the earlier you start" (**grammar** — stray extra word).

**Source table (11 rows) vs. app (`cleaningTasks`):** every row, frequency phrase, and bullet transcribed in full below. Previously the app had these as one short paraphrased `tip` sentence per task (e.g. Sinks & shower was compressed to a single made-up sentence); it's now the complete nested bullet list from the table, and the `frequency` field holds her exact phrase instead of a normalized category like "Weekly."

| Row | Source label | Source frequency | Change |
|---|---|---|---|
| 1 | Vacuum | Once a week | none |
| 2 | Clothes laundry | I do it once a week (when I don't have socks left) | none |
| 3 | **b**edsheets laundry | Once a week, maximum after 2 weeks | title → "Bedsheets laundry" (**capitalisation**) |
| 4 | Towels laundry | Once a week | none |
| 5 | Sinks & shower | Around once a week in bathroom, daily wipe-down in kitchen | none |
| 6 | Toilet bowl | Once a week/bi-weekly | none |
| 7 | Fridge | **b**i-monthly | frequency → "Bi-monthly" (**capitalisation**) |
| 8 | Kitchen extractor filter | Every month or two | none |
| 9 | Mirrors/glass | Whenever there's need | none |
| 10 | Dust-off mirrors/top of shelves | Every time before you vacuum | none |
| 11 | Kettle & coffee machines | Once a month/bi-monthly | none |

All bullets for every row (including the 3-level-deep laundry breakdown — "A few things to note" → "Separate by temperature too" → "Wool usually cold (20 degrees)" etc.) are transcribed in full in `lib/content.ts`; nothing was trimmed. Two rows (Kitchen extractor filter, Kettle & coffee machines) had no `●` bullets in the source, just two plain sentences in the cell — I split each into two list items along the sentence boundary so they render consistently with the rest (**formatting** — turning the table cell into structured data, wording unchanged).

Kept exactly as written (voice, not errors): "Scrub that bitch down every now and then," "satisfying ASFFF," "lumpe" (page 3 — likely Swiss-German for rags, not a typo).

---

## Section 2: Cleaning materials

**Source intro (page 4):**
> Below is a table that summarizes all the cleaning materials that I have found to be very useful over the years, for a range of different cleaning tasks. Brands don't really matter that much, just buy whatever looks good to you. I often go for the grocery-store brands for price reasons.
>
> Most of these you can just buy in grocery stores but they might have better prices in B&M Bargains (or **action** but you don't have that in London)

**App now:** same, except "or **action**" → "or **Action**" (**capitalisation** — it's the discount store chain, a proper noun).

**Source table — 14 rows.** The app previously had only 13 and was missing **"Glass cleaner (optional)"** entirely — restored, in its original position (between Swiffer and Mop). Other fixes:
- "Mop (Swisher is easiest...)" second bullet "**m**op every second time you vacuum" → "**M**op every second time..." (**capitalisation**)
- "De-greaser spray" cell ran four fragments together ending in a dangling comma and an unfinished arrow ("shower," / "...two minutes" / "(generalizable...)" / "Spray -> scrub with sponge ->"); split into three list items along the natural sentence breaks and replaced the dangling comma with a period (**formatting**/**grammar**). The trailing "Spray -> scrub with sponge ->" is kept exactly as written, including the unfinished arrow — that's how it ends in the source.

The "Sponges" row's nested breakdown ("I usually have two types laying around:" → "the one in the kitchen for dishes" → "Make sure this one is anti-scratch...") is preserved exactly, reaching 3 levels deep.

---

## Section 3: Appliances

**Source:** no intro paragraph — the heading "Appliances" goes straight into the table. The app's old invented subtitle ("What to actually buy — and what can wait...") has been removed rather than kept, since there's nothing in the PDF to transcribe there.

**This is the section with the most restored content.** The source table has **21 rows** and **3 columns** (Product / use / Necessity, with explanatory notes packed into the necessity column). The app previously had 14 rows, no `use` column at all, and had merged "Big bowl" and "Bowls" into one entry. Restored:

- **7 missing appliances added back:** Ice trays, TV, Ironing board & iron, Cheap monitor on your desk, Beard trimmer, Safety razor, and Bowls (split back out from Big bowl — they're two separate rows in the source with different necessity ratings, 4 vs. 5).
- **The `use` column, dropped entirely before, is now on every row** (new `use` field on `Appliance`).
- **The Coffee machine row's real structure restored.** The source necessity-column text for Coffee machine isn't one paragraph — it's an intro sentence, then three mini-sections ("Price-wise, get a french press" / "Taste-wise" / "Ease-of-use"), each with its own sub-bullets, one of which nests a further sub-bullet ("Same benefits as french-press but elevated flavor" → "Can taste the different notes more"). The app previously collapsed all of this into one paraphrased sentence ("French press for flavour, Nespresso for ease..."). It's now the full nested tree, unchanged in wording.

Spelling/capitalisation fixes across the table:
- "if **yo** have a scale" → "if **you** have a scale" (**spelling**)
- "**black friday**" → "**Black Friday**" (**capitalisation**)
- "**facebook** marketplace/groupchats" → "**Facebook** marketplace/groupchats" (**capitalisation**)
- "cheap on **amazon**" → "cheap on **Amazon**" (**capitalisation**)
- "**i** prefer them over plates" → "**I** prefer them over plates" (**capitalisation**)
- "Extension **chords**" → "Extension **cords**" (**spelling** — chords are musical, cords are cables)
- "somewhere more special**,**" (dangling comma) → "somewhere more special**.**" (**grammar**)
- "normal **gilette** ones" → "normal **Gillette** ones" (**spelling**/**capitalisation** — brand name)
- Name "**knife-sharpener**" → "**Knife-sharpener**" (**capitalisation**)
- Row title kept as "**Swisher**" (not corrected to "Swiffer") — the source uses "Swisher" consistently in two separate places (this table and the materials-table mop row) and "Swiffer" consistently in two other separate places (materials-table dusting row, cleaning-task instruction), so this reads as her intentionally naming two different products rather than a slip. Flagging it here in case it *is* a typo — please confirm either way.

`necessity` changed from a single number to a string, because the source gives ranges for several rows ("3-5," "4-5," "3-4") that a single number can't represent without inventing precision that isn't there.

---

## Section 4: Planning groceries

**Source intro (page 10):**
> This is my least favorite part. I can't believe I'm gonna have to be doing this my whole life. Sucks hard icl.
>
> However, there are some tips that can make it a lot easier for you to keep an overview of what to buy and when to buy it.

**App now:** identical, "icl" kept as written (her slang, not an error).

**Source list — 11 items, several with sub-bullets.** Transcribed in full. Fixes:
- "**reminders** app" → "**Reminders** app" (**capitalisation** — the iOS app's actual name)
- "Migros **cumulus**" → "Migros **Cumulus**" (**capitalisation** — proper noun)
- "**fuji** apples" → "**Fuji** apples" (**capitalisation**)
- "any type of eggs, overnight oats or **greek** yoghurt" → "**Greek** yoghurt" (**capitalisation**)

---

## Section 5: Easy recipes that I like

**Source:** page heading is "Easy recipes that I like" — the app's on-page title was "Recipes"; changed to match the source heading exactly. (The sidebar nav label stays the short "Recipes" — that's a nav-label design choice, unaffected by this phase; Phase 4 owns nav restructuring.) No section-level intro paragraph in the source, so no invented subtitle was added.

**Source has 7 recipes; the app had 6.** "**Boiled eggs on toast**" was missing entirely — added, in its original position (between Scrambled eggs and Overnight oats), fully transcribed including its 1-10 self-rating joke ("Rate it 1-10 (it's a 10)").

Every recipe's ingredients and steps — including every lettered sub-step (e.g. Bacon pasta step 4's wine note, Tuna salad's cucumber pro-tip, Bolognese's 13-step reduction process, Tortilla burger's onion-caramelising sub-step) — are transcribed in full; previously these were paraphrased and shortened (e.g. Bolognese's 13 steps had been compressed to 8 sentences that dropped several of her actual instructions).

Fixes:
- "**put** the pasta to boil" → "**Put** the pasta to boil" (**capitalisation**)
- "add pepper and tomato paste... add some more tomato paste and **species**" → "**spices**" (**spelling**)
- "makes it more juicy and **take up** flavors better" → "**takes up** flavor better" (**grammar** — subject-verb agreement)
- "you want it to **charr** a bit" → "**char**" (**spelling**)

---

## Section 6: Roommates

**Source intro (page 15):**
> This section is especially important for you because you will be living and sharing rooms with multiple roommates. I've only lived with one roommate, but with the amount of dirt that **mf** left behind, it felt like 4. So here's some tips to make sure you don't need to crash out on the phone to our parents every weekend like I did.

**App now:** identical, "mf" kept exactly as written.

**Source list — 8 items, all sub-bullets transcribed.** Fixes:
- "**or a least** from a different floor" → "**or at least** from a different floor" (**spelling**)
- "gives you **social network** to rely on" → "gives you **a social network** to rely on" (**grammar** — missing article)

Kept exactly as written: "Don't sleep with your housemates! Except if she's really bad, then do it I guess but lead with precaution," "Outsource your booty from somewhere else... hahaha" — her jokes, unedited.

---

## Section 7: Life balance

**Source intro (page 16):**
> This is the most important part. In my experience, living abroad and by yourself can lead to extremely fun, but also potentially lonely times. I've added some tips below that will help you balance all the new things you'll be responsible for, while staying happy.

**App now:** identical.

**Source list — 12 items**, reaching 3 levels deep at item 8 ("Be active" → "It's also a great way to meet new people" → "Whether in football practice, calisthenics parks, or the gym"). All transcribed in full — previously each of these 12 items (several with 3-5 sub-points) had been compressed to a single sentence each. Fixes:
- "Text **ilkhom**" → "Text **Ilkhom**" (**capitalisation** — his name)
- "family, friends, teachers, **pfadi**, etc." → "**Pfadi**" (**capitalisation** — proper noun, Swiss youth organisation)
- "Get their **instagram**, number or **snapchat**" → "**Instagram**... **Snapchat**" (**capitalisation**)

Kept exactly as written: "you're a dirty ass guy," "All chill," "Papi will also tell you" — her voice throughout.

---

## Academic tips (bonus, not one of the 7 numbered sections)

**Source:** styled as a bold sub-heading ("Academic tips"), not a numbered `Section N:` heading like the other seven — it's presented as an appendix after Life Balance, before the closing letter. The app's on-page title was "Uni tips"; changed to the literal source heading "Academic tips." Since there's no source-given section number, the eyebrow tag is now "Bonus" rather than the previously invented "Section 8." (Sidebar nav label stays "Uni tips" — unaffected by this phase.)

**Source intro:**
> Uni life and high-school life **is** similar to some extent but also very different.

**App now:** "**is** similar" → "**are** similar" (**grammar** — subject-verb agreement; compound subject).

**Source list — 5 items**, transcribed in full including item 1's sub-point "f" (a trailing summary line with no bullet text of its own in the source — "All these factors lead to understanding your course better and knowing how to study" — kept as that item's content rather than dropped).

---

## Final note (closing letter — now at the bottom of the Uni page)

**Source (page 19):**
> I'm super excited for you to start your study and a new life in London!! I'm 100% sure you're gonna have a great time and that you'll succeed in every aspect of your study there. To make things easier, this guide gives you a bit of an outline for how to handle difficult times, and especially, for not getting into difficult times in the first place!
>
> You're gonna do great!!!!! Much love,
>
> Sera

**In the app now:** identical, verbatim, including all the exclamation marks. Placed at the bottom of the "Academic tips" (Uni) page, since that's the last page in both the app's own nav order and the PDF's own reading order before this closing note.

---

## Master change log

| # | Location | Before | After | Reason |
|---|---|---|---|---|
| 1 | Cleaning intro | "the earlier to you start" | "the earlier you start" | grammar |
| 2 | Materials intro | "(or action but...)" | "(or Action but...)" | capitalisation |
| 3 | Cleaning task title | "bedsheets laundry" | "Bedsheets laundry" | capitalisation |
| 4 | Cleaning task frequency | "bi-monthly" | "Bi-monthly" | capitalisation |
| 5 | Materials: De-greaser spray | 4 run-on fragments, dangling comma | split into 3 items, comma → period | formatting/grammar |
| 6 | Materials: Mop row | "mop every second time" | "Mop every second time" | capitalisation |
| 7 | Materials table | — | "Glass cleaner (optional)" row added back | completeness |
| 8 | Appliances: coffee machine | "if yo have a scale" | "if you have a scale" | spelling |
| 9 | Appliances: airfryer | "black friday" | "Black Friday" | capitalisation |
| 10 | Appliances: coffee machine | "facebook marketplace" | "Facebook marketplace" | capitalisation |
| 11 | Appliances: ice trays | "cheap on amazon" | "cheap on Amazon" | capitalisation |
| 12 | Appliances: bowls | "i prefer them" | "I prefer them" | capitalisation |
| 13 | Appliances: extension | "Extension chords" | "Extension cords" | spelling |
| 14 | Appliances: candles | "somewhere more special," | "somewhere more special." | grammar |
| 15 | Appliances: razor | "gilette" | "Gillette" | spelling/capitalisation |
| 16 | Appliances: knife | "knife-sharpener" | "Knife-sharpener" | capitalisation |
| 17 | Appliances table | 14 rows | 21 rows (6 missing appliances + Bowls split from Big bowl restored) | completeness |
| 18 | Appliances table | no `use` column | `use` column added to every row | completeness |
| 19 | Appliances: coffee machine | one paraphrased sentence | full nested Price-wise/Taste-wise/Ease-of-use breakdown restored | completeness |
| 20 | Groceries | "reminders app" | "Reminders app" | capitalisation |
| 21 | Groceries | "Migros cumulus" | "Migros Cumulus" | capitalisation |
| 22 | Groceries | "fuji apples" | "Fuji apples" | capitalisation |
| 23 | Groceries + Overnight oats recipe | "greek yoghurt" (both occurrences) | "Greek yoghurt" | capitalisation |
| 24 | Recipes: bacon pasta | "put the pasta to boil" | "Put the pasta to boil" | capitalisation |
| 25 | Recipes: bacon pasta | "species" | "spices" | spelling |
| 26 | Recipes: tuna salad | "take up flavors better" | "takes up flavor better" | grammar |
| 27 | Recipes: bolognese | "charr" | "char" | spelling |
| 28 | Recipes | 6 recipes | 7 recipes ("Boiled eggs on toast" restored) | completeness |
| 29 | Roommates | "or a least" | "or at least" | spelling |
| 30 | Roommates | "gives you social network" | "gives you a social network" | grammar |
| 31 | Life balance | "Text ilkhom" | "Text Ilkhom" | capitalisation |
| 32 | Life balance | "pfadi" | "Pfadi" | capitalisation |
| 33 | Life balance | "instagram" / "snapchat" | "Instagram" / "Snapchat" | capitalisation |
| 34 | Uni intro | "life is similar" | "life are similar" | grammar |
| 35 | All sections | stray zero-width-space characters after every `●`/`○`/lettered bullet marker | stripped | formatting |
| 36 | Recipes page title | "Recipes" | "Easy recipes that I like" | formatting (matches actual source heading) |
| 37 | Uni page title & eyebrow | "Uni tips" / "Section 8" | "Academic tips" / "Bonus" | formatting (matches source; "Section 8" was invented, source never numbers this one) |
| 38 | All section subtitles | invented marketing-style one-liners | verbatim PDF intro paragraphs (or removed where the PDF has no intro — Appliances, Recipes) | completeness/fidelity |
| 39 | App structure | no opening letter or closing note | both added (Welcome page + bottom of Uni page) | completeness |
| 40 | Cleaning tasks | `frequency` normalized to one of 6 categories (e.g. "Weekly") | `frequency` is now her exact phrase per task | completeness/fidelity |

---

## Anything in the PDF I could not place

Nothing. Every paragraph, list item, and table row in the 19-page PDF is represented somewhere in the app (opening letter, 7 numbered sections, Academic tips, closing note).

One internal inconsistency in the source itself, flagged rather than silently resolved: the Bolognese recipe's steps mention "shock with broth/**wine**" as an option, but wine isn't listed in that recipe's own ingredients list (only "Optional: carrots and fresh tomatoes" is listed as optional). This looks like an oversight in the original document — I did not add wine to the ingredients list, since that would be inventing content that isn't there.

## Anything in the app that has no source in the PDF

- The `key`, `icon`, and `emoji` values (e.g. 💨 for Vacuum, 🍝 for Bacon pasta) — these are the app's own UI decoration and were already there before this phase; the PDF has no icons or emoji.
- The sidebar's short nav labels ("Recipes," "Uni tips") versus the longer on-page headings now used ("Easy recipes that I like," "Academic tips") — a deliberate, structural navigation-label choice, not new written content. Sidebar/nav restructuring is explicitly Phase 4's job.
- The "Bonus" eyebrow tag on the Academic tips page, and "Start here" on the Welcome page — small structural UI labels needed for navigation, not substantive content.
