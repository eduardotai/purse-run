# Purse Run — Slice 1 Design

Date: 2026-09-22
Status: approved in conversation, waiting on a read of this file
Working title: Purse Run. The public name is outside this slice. The page title is Purse Run.

This slice is one local PvE run against an AI rival, played in the browser. The player shops, the fight resolves itself, and the run ends when the player's hearts hit 0. Accounts, leaderboards, progression, the visual pass, sponsoring, and Steam are specified here only as contracts. They are not built in this slice.

## Done bar

`npm test` passes, including the balance gate. A person can play a run, refresh, resume, abandon, and replay the stored actions from the seed. The page shows hearts, gold, wins, both boards, the shop, the seed, and the fight log. The layout is usable at 1280×800.

## The run

The player and the rival each have a board, a gold purse, and fighters that persist for the whole run. Only the player has hearts. The player starts at 5 hearts, 0 wins, 0 gold, and an empty board. The rival starts at 0 gold and an empty board. The run ends when the player's hearts hit 0. The score is the win count.

Fighters who are still alive after a fight keep their current health and their gained attack. Nothing heals between fights. Fighters at 0 health have already left the board. A wipe means that side shops the next turn with an empty board and whatever gold it saved.

### Turn

1. Seat limit is 3 while wins are 0 or 1, 4 while wins are 2 or 3, and 5 when wins are 4 or more. The same limit applies to both boards.
2. Each purse becomes `min(15, gold + 10)`.
3. The rival draws its own four offers from the same slot table, buys, and maybe rerolls. Those offers are not shown. Unbought rival offers are discarded.
4. The player's shop is drawn from the same slot table. The rival's board stays visible until the player presses Fight.
5. The player buys, sells, reorders, swaps skill slots, and rerolls, in any order.
6. The player presses Fight. Combat uses no randomness.
7. The outcome updates wins and hearts. Gold left unspent stays in its purse.

Win: the player has a living fighter and the rival does not. That adds 1 win and costs no hearts. Loss: the rival has a living fighter and the player does not. That costs 1 heart for each rival fighter still standing. Mutual: both boards are empty, or the 100-skill cap tripped. That adds no win and costs 1 heart. Hearts stop at 0. A loss that would drop past 0 ends the run at 0.

The shop after the 2nd win has 4 seats. The shop after the 4th win has 5.

## Gold and the shop

A fighter costs 3. A skill costs 3. A reroll costs 2. Selling a fighter or a skill returns 1. After every gold change, that purse is clamped to 0–15. Selling a fighter also removes the skills that were on it. Those skills do not return their own gold.

The shop has 4 slots. Buying a card leaves that slot empty. A reroll spends 2 and refills all 4 slots. Cards left behind are gone when the player rerolls or presses Fight. There is no freeze.

The player may reroll whenever they have at least 2 gold. The rival rerolls only under its own policy below.

Each copy is its own card. Nothing merges two copies. A fighter holds up to 2 skills, and the two skills must be different card ids. A skill buy fills the first empty skill slot. If the fighter already has that skill, or both slots are full, the buy is refused. The player swaps the two slots to choose which fires first.

The board is a compact list. Index 0 is the front. A bought fighter enters at the back. Reorder moves one fighter from one index to another and shifts the rest. There are no holes.

### What the four slots are

Both shops use this table. Resolve the slot's type, then its rarity, then its card. Wins 0 and 1 are common and do not roll a d6, so filling a slot consumes one number, the index. Wins 2 or more roll the d6 and then the index, two numbers. If that rarity bag is empty, walk down to the next lower rarity that has a card of that type, then roll the index against the bag you landed on. The starter roster does not walk down. Every card in the landed bag has an equal chance, with replacement. The same card can fill two slots.

| Wins | Slot order | d6 |
| --- | --- | --- |
| 0–1 | Fighter, Fighter, Fighter, Skill | Common, no roll |
| 2–3 | Fighter, Fighter, Skill, Skill | 5–6 uncommon, otherwise common |
| 4–5 | Fighter, Skill, Skill, Skill | 6 rare, 4–5 uncommon, otherwise common |
| 6 or more | Fighter, Skill, Skill, Skill | 5–6 rare, 3–4 uncommon, otherwise common |

## Roster

Stable ids are the rules. Display text on the slice 1 page uses these same labels. Flavor names can replace the labels later without changing ids.

Fighter combat stats are printed stats plus gains. Health starts at the printed health. Attack for a player fighter is printed attack plus gained attack. Attack for a rival fighter is printed attack plus gained attack plus `floor(wins / 2)`. The win bonus is recomputed from the current win count. It is not stored, and it does not stack from turn to turn. Shop offers show printed stats only. The rival's buy comparison uses printed attack plus printed health, not the win bonus and not gained stats.

Common fighters sum to 6. Uncommon sum to 8. Rare sum to 10.

| Id | Bag | Attack | Health |
| --- | --- | --- | --- |
| c24 | Common | 2 | 4 |
| c42 | Common | 4 | 2 |
| c15 | Common | 1 | 5 |
| c33 | Common | 3 | 3 |
| u44 | Uncommon | 4 | 4 |
| u35 | Uncommon | 3 | 5 |
| r55 | Rare | 5 | 5 |
| r46 | Rare | 4 | 6 |

Skill N is 1 for common, 2 for uncommon, and 3 for rare. `all-friends` and `all-enemies` are legal only on a common skill whose trigger is Start or On attack. Faint and When hurt always name one fighter. `all-friends` includes the fighter who fired the skill.

| Id | When | Target | Effect |
| --- | --- | --- | --- |
| jab | On attack | enemy front | deal 1 |
| brace | Start | self | gain 1 health |
| bark | Friend ahead attacks | friend ahead | gain 1 attack |
| spark | Start | all enemies | deal 1 |
| cheer | Start | all friends | gain 1 attack |
| pin | On attack | last living enemy | deal 1 |
| spike | On attack | enemy front | deal 2 |
| mend | When hurt | self | gain 2 health |
| guard | Friend ahead attacks | friend ahead | gain 2 health |
| hex | Start | enemy front | deal 2 |
| lance | On attack | last living enemy | deal 3 |
| banner | Start | friend ahead | gain 3 attack |

The engine accepts any skill in the grammar, so tests can place a Faint skill that the shop never sells. The shop sells only the rows above.

A future card is a new row. It ships only when `npm test` passes, including the balance gate. A gate failure is fixed by editing rows inside these bands and rails. If no such edit passes, stop and ask before changing hearts, gold, prices, seat timing, or the win bonus.

## Rival policy

The rival has its own purse and its own persistent board. It never sells, never reorders, and never reads trigger text. At the start of its shop it may reroll at most 3 times.

1. While it has an empty seat and can afford a fighter in the shop, it buys the offer with the highest printed attack plus printed health. A tie takes the leftmost offer. The fighter enters at the back, which is the only empty seat, and takes the next instance id. Player buys do the same.
2. While it can afford a skill that one of its fighters can legally hold, it buys the skill with the highest N. A tie takes the leftmost offer. The skill goes on the frontmost fighter who can hold it, in that fighter's first empty slot.
3. If this pass bought nothing, the rival has at least 5 gold, and it has rerolled fewer than 3 times this turn, it rerolls and returns to step 1.
4. It stops.

On turn 1 this always buys the three fighter offers, leaves the skill, ends at 1 gold, and does not reroll. All four common fighters tie on printed attack plus health, so leftmost wins. This is true for every seed.

## Fight

The same two boards always produce the same log. Skipping playback on the page does not change the result. The win bonus is already inside the rival's attack. Combat does not add it again.

A skill is a trigger, a target, an effect, and a positive whole number N. Triggers: Start, On attack, When hurt, Friend ahead attacks, Faint. Targets: self, the friend directly ahead, the friend directly behind, the enemy front, the last living enemy, all friends, all enemies. Effects: deal N damage, gain N attack, gain N health. The engine runs nothing else.

Slot 0 fires before slot 1. A null slot is skipped. A skill fires only when its target is on the board at the moment it would fire. A skill that does not fire does not count toward the cap.

Current health can go below 0 while a chain is resolving. Gain health adds N to current health. There is no max health.

A whole-side effect snapshots its targets, front to back, when the skill starts. Someone who has already left is skipped. A gain applies immediately and does not cause When hurt. Damage applies to one snapshotted target at a time. When hurt fires only when the damage number is greater than 0. For that target, run When hurt in slot order. Each of those skills finishes, including damage it causes, before the next skill starts. After that fighter's When hurt skills finish, if their health is still 0 or below, their Faint skills run and they leave the board, even if a Faint skill raised their health. They leave before the next skill starts. Mend saves a fighter who landed on exactly 0 and was then healed above 0, because the death check comes after When hurt.

The cap counts skills that actually fire. When 100 have fired, no further skill starts. The fight ends immediately as a mutual result, before the rest of that strike, even if someone is still alive.

### Before strikes

The player's fighters fire Start, front to back, slot order, each skill fully resolving before the next. Then the rival's fighters do the same. Deaths during Start finish before the first strike.

### Each strike

Repeat while both sides have a living fighter and the cap has not tripped.

1. Lock both fronts.
2. The player's front fires On attack. The fighter directly behind them, when there is one, fires Friend ahead attacks. Then the rival's front and the fighter directly behind that front do the same. Each skill fully resolves before the next.
3. If both locked fighters are still alive, they hit each other for their current attack. A buff from step 2 counts. Both damages are applied before either When hurt from those two hits. If either locked fighter is already dead, the trade does not happen.
4. Queue When hurt for each locked fighter who took damage greater than 0, the player's fighter first. If that fighter has already left the board when the queue reaches them, their When hurt does not run. Nested damage inside a When hurt that does run uses the normal immediate-faint rule.
5. Anyone still at 0 health or below fires Faint, the player's side front to back, then the rival's. They leave, and the line closes up.

### Outcome

- The player has a living fighter and the rival does not: win.
- The rival has a living fighter and the player does not: loss. Hearts lost equal the number of rival fighters still standing.
- Both boards are empty, or the cap tripped: mutual. Hearts lost equal 1.

### Canonical example

The player's front has 4 attack and slot 0 is On attack, gain 2 attack. The rival's front has 5 health and 3 attack. Slot 0 raises the player to 6. Both locked fighters are alive, so the trade is 6 into the rival and 3 into the player. The rival faints.

## Randomness

One seeded stream serves the whole run. Combat does not draw from it. The stream advances only while a shop slot is being filled, during a draw or a reroll, by the one or two numbers described above. The rival completes every draw and reroll for the turn before the player's shop is drawn. Rival buys are not stored. Replay derives them from the seed and the earlier player actions.

The seed is any non-empty string. Hash its UTF-8 bytes with FNV-1a 32-bit: offset basis `2166136261`, prime `16777619`, `hash = (hash xor byte) * prime` in uint32. That hash seeds mulberry32:

```
t = state + 0x6D2B79F5   (state becomes t, uint32)
t = imul(t xor (t >>> 15), t | 1)
t = t xor (t + imul(t xor (t >>> 7), t | 61))
unit = (t xor (t >>> 14)) as uint32 / 4294967296
```

A d6 is `floor(unit * 6) + 1`. A uniform index is `floor(unit * length)`.

Play again creates an 8-character lowercase hex seed from `crypto.getRandomValues`. Tests pass an explicit seed.

## Program

One TypeScript package. Node 22 or newer. Vite serves the page. Vitest runs `npm test`. Three folders:

| Part | Depends on | Does |
| --- | --- | --- |
| `src/rules` | nothing in `web` or `sim` | Cards, RNG, shop, rival policy, fight, run actions |
| `src/sim` | `rules` | Plays the two policies and evaluates the gate |
| `src/web` | `rules` | Draws state, sends clicks, saves JSON |

`web` does not decide combat, gold, or shops. Rules commit the fight log first. The page renders that log. Skip shows the same result.

A click is buy-fighter, buy-skill, sell-fighter, sell-skill, reorder, swap-skills, reroll, fight, abandon, or new-run. An illegal click returns one of `not-enough-gold`, `no-open-seat`, `skill-not-legal`, `empty-slot`, `wrong-card`, or `bad-index`, and leaves state, RNG, and the action log untouched. `wrong-card` is a buy aimed at an offer of the other kind.

### State

```ts
type Run = {
  version: 1
  seed: string
  rngState: number
  wins: number
  hearts: number
  gold: number
  enemyGold: number
  player: Fighter[]
  enemy: Fighter[]
  shop: (Offer | null)[]  // length 4
  phase: "shop" | "result"
  actions: Action[]
  lastLog: FightEvent[]
  endReason: null | "hearts" | "abandon"
  nextInstance: number  // starts at 1
}

type Fighter = {
  instance: number
  card: FighterId
  gainedAttack: number
  health: number
  skills: [SkillId | null, SkillId | null]
}
```

`actions` entries are `{ type: "buy-fighter", slot }`, `{ type: "buy-skill", slot, fighter }`, `{ type: "sell-fighter", fighter }`, `{ type: "sell-skill", fighter, skillSlot }`, `{ type: "reorder", from, to }`, `{ type: "swap-skills", fighter }`, `{ type: "reroll" }`, `{ type: "fight" }`, or `{ type: "abandon" }`. Indexes are the indexes at the time of the click.

Fight events are the canonical log: `{ type: "skill", instance, skill, amount, target }`, `{ type: "strike", attacker, defender, amount }`, `{ type: "faint", instance }`, `{ type: "cap" }`, `{ type: "end", outcome: "win" | "loss" | "mutual" }`. `target` is an instance id, a list of instance ids, or null when the skill gained a stat on a fighter who is already named by `instance`. The page shows one sentence per event, including the fighter instance, the skill id when there is one, and the number.

## Persistence

The page saves after turn start, after every successful click, and after the fight. Two localStorage keys: `purse-run.current` and `purse-run.results`. Both carry `version: 1`. A refresh during `shop` or `result` restores that phase. If `current` cannot be parsed, the page starts a fresh run and keeps `results` when that list still parses. If `results` cannot be parsed, the list starts empty.

Abandon is available during `shop`. It ends the run, sets `endReason` to `abandon`, and appends a result with the wins already earned. `turns` is the number of completed fights. Fight resolution still owns a fight that has started. Abandon does not rewrite a resolved fight.

New run clears `current`, generates a seed, and starts at turn 1.

The result is appended once, inside the transition from `shop` to `result`. Restoring a saved result does not append it again. `id` is `crypto.randomUUID()`.

A finished result has this shape:

```ts
type RunResult = {
  version: 1
  id: string
  seed: string
  actions: Action[]
  practice: true
  opponent: "ai"
  mode: "pve"
  wins: number
  turns: number
  endReason: "hearts" | "abandon"
  finalPlayer: Fighter[]
  finalEnemy: Fighter[]
  lastLog: FightEvent[]
}
```

Replay creates a run from the seed, which performs turn 1's income, rival shop, and player draw. It then applies actions in order. After a fight, if hearts are still above 0, replay performs the next turn start before the following actions. Abandon ends the replay. The wins, the heart total after each fight, the final boards, and the last log must match the saved result. Resume of `current` uses the stored `rngState` and does not replay from scratch.

## Tests

`npm test` covers all of the following.

1. Fight fixtures. The canonical example ends with the player's front at 6 attack, the rival's front fainted, and a strike of 6 and a strike of 3 in the log. Mend on a fighter at 2 health who takes 2 damage leaves them alive at 2. A Faint skill that gains health still removes that fighter. Two 3-attack, 3-health fighters with no skills produce a mutual result and cost 1 heart. A When hurt skill that deals 1 damage to its owner reaches the cap, and the outcome is mutual even though the loop had a living fighter.
2. Shop and run rules. Reroll from 2 gold spends the 2 and refills four slots. A purse at 12 that gains 10 lands on 15. A sell at 15 stays at 15. Seat count is 4 on the shop after the 2nd win and 5 after the 4th. Refused buys leave gold, the board, RNG, and the action log untouched. Surviving fighters keep their damaged health into the next shop.
3. The same seed and the same actions produce the same shops, boards, and last log.
4. Every seed's turn 1 rival buys the three fighters, leaves the skill, ends at 1 gold, and does not reroll.
5. Balance gate, below.

### Balance gate

Seeds are the strings `sim-0` through `sim-1999`. Two policies play every seed.

Mirror uses the rival policy for the player's buys. Skill-first runs the skill loop before the fighter loop, so it takes every legal skill it can afford before it buys a fighter, then uses the same reroll rule. An empty board has no legal skill, so Skill-first buys fighters on that pass. Neither policy reads triggers or the opposing board.

Mirror's mean final wins across the 2000 runs must be from 3 through 9 inclusive.

A Skill-first run counts toward the card sample when its win count becomes 6. The board is the player's board immediately after the fight that caused that win. A card is present when that fighter id or that skill id is on the board, counted once per run. If fewer than 50 runs reach 6 wins, the gate fails. Otherwise the gate fails when Cheer is on strictly more than 60% of those boards, when Spark is on strictly more than 60%, or when any single card is on strictly more than 75%.

Any fight in any policy that emits a cap event fails the gate.

## Later contracts

These are binding for later slices. Slice 1 does not implement them. Slice 1's `resolve(player, enemy)` and the stored seed plus actions are the seams they use.

### Rewards

The squad ends with the run. A later reward is granted from `RunResult`. It does not put fighters back on the board or change gold inside a finished fight.

### PvE board

Sorted by wins only. A player's entry is their best submitted run. Players with the same wins share that place. The earlier submission is listed first under a tie. Slice 1 stores local results and posts nothing.

### PvP points

The PvP board is sorted by current points. One fight against one served opponent is one game. A player has no public rank until 5 PvP games are finished. Hidden points start at 1000 and move during those 5 games. Players with fewer than 5 finished games are omitted from the board.

A result is 1 for a win, 0.5 for a mutual result (including the cap), and 0 for a loss. Expected result is `1 / (1 + 10 ^ ((their points - your points) / 400))`. The change is `roundHalfAwayFromZero(K * (result - expected))`. Halves round away from zero, so 5.5 becomes 6 and −5.5 becomes −6. Other values round to the nearest whole point. K is 40 when finished games before this fight are below 5, and 24 otherwise. Points are clamped at 0 after the change.

With K at 24, the approved samples are:

| You | Opponent | Result | Change |
| --- | --- | --- | --- |
| 1000 | 1200 | win | +18 |
| 1000 | 1200 | loss | −6 |
| 1000 | 800 | win | +6 |
| 1000 | 800 | loss | −18 |
| 1000 | 1000 | win | +12 |
| 1000 | 1000 | loss | −12 |

Ranks after the 5th game:

| Rank | Points |
| --- | --- |
| I | 0–899 |
| II | 900–1099 |
| III | 1100–1299 |
| IV | 1300–1499 |
| V | 1500 and above |

### PvP matchmaking

The opponent is a saved board at the same win count. Search a human within 50 points, then within 100, then within 200. Then take the placement player, still inside their first 5 games, whose hidden points are closest. Then take a labeled bot. The later slice provides at least one bot ghost for each win count from 0 through 8, each rated 1000. The same point formula applies to a bot. Above win 8, if no human was found, no opponent is served. Points change only when an opponent was served. The latest board per player per win count is the ghost. Once that opponent is on screen, leaving the fight counts as a loss and as one of the 5 games.

A later server replays the seed and actions against the served board before it accepts PvP points or PvE wins.

### Steam

Steam ships an Electron app that wraps this same page and these same rules. `steamworks.js` is the integration used for that shell. The website stays the light client. The Steam build plays a PvE run from local files with no connection. Posting a score waits until the build is online. The page is already required to work at 1280×800. Steam Direct is a $100 fee, paid when that store page is opened. Development before that fee uses Steam's public test app 480.

### Sponsoring

Sponsoring is outside this design. The rules state has no price and no sponsor field.

## Build order

1. This slice. Rules, sim, and the plain page.
2. A visual pass on that page, still playable at 1280×800.
3. Progression and rewards, granted from `RunResult`.
4. Accounts and the two boards. PvE submissions first, then PvP ghosts and points.
5. The Electron shell for Steam.

## Clarifications pinned while writing this file

These were not separate chat answers. They are the single reading of the approved rules.

- Both boards persist between fights. Current health and gained attack stay. Only the player has hearts.
- Rival attack is printed attack, plus gained attack, plus one for every two wins, recomputed from the current win count.
- The purse cap applies after income and after a sale.
- PvP bots, in that later slice, are rated 1000.
- The card gate fails when fewer than 50 Skill-first runs reach 6 wins.
