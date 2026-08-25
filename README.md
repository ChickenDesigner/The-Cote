# 🕊 The Cote

A pigeon-breeding genetics game in the spirit of Lioden, built on the real
sex-linked genetics of *Columba livia*. Everything runs in the browser with no
build step and no install.

**To play:** double-click `index.html`.
If your browser refuses to keep a save on `file://`, run `Start The Cote.cmd`
instead and play at <http://localhost:8765/>.

---

## What's in the box

```
index.html                  the game
css/style.css
js/names.js                 500 cock names + 500 hen names + 19 rare specials
js/genetics.js              the genetics engine
js/sprites.js               genotype-driven pixel pigeon renderer
js/state.js                 save data, timers, economy, breeding
js/ui.js                    every screen and modal
assets/pigeons/             drop your GIFs here (see its README.txt)
GENETICS.md                 the research this is built on, with sources
RESEARCH-stencil.md         notes on toy/frill stencil (not implemented yet)
serve.ps1                   tiny static file server, no dependencies
```

---

## Genetics implemented

Ten loci, resolved through a proper epistasis chain. Full write-up with
sources in [GENETICS.md](GENETICS.md).

| Locus | Chromosome | Alleles (dominant → recessive) |
|---|---|---|
| Base colour | **Z (sex-linked)** | `BA` ash-red › `B+` blue/black › `b` brown |
| Dilution | **Z (sex-linked)** | `D+` intense › `dP` pale › `d` dilute |
| Spread | autosomal | `S` › `s+` |
| Wing pattern | autosomal | `CT` T-check › `C` check › `c+` bar › `cb` barless |
| Recessive red | autosomal | `e+` › `e` |
| Stencil bronze | autosomal | `Ts1` › `ts1+` |
| Stencil lightener | autosomal | `Ts2` › `ts2+` (incomplete dominant) |
| Stencil whitener | autosomal | `Ts3+` › `ts3` |
| Recessive white | autosomal | `z+` › `zwh` |
| Eye colour | autosomal | `Tr+` orange › `tr` pearl |

### The sex-linkage rules the game actually enforces

Pigeons are **ZW**: cocks are ZZ, hens are ZW.

* **A hen cannot carry a hidden sex-linked colour.** What she shows is all she has.
* **A cock can**, so `Ash-Red, carries Brown` is a real and common genotype.
* **Every daughter takes her sex-linked genes from her father alone.**
* **A hen passes hers only to her sons.**

The breeding screen shows sons and daughters in separate columns for exactly
this reason — with a sex-linked gene in play, the two columns genuinely differ.
Odds are enumerated over every gamete combination, not simulated, so the
percentages are exact.

### Recessive white

Recessive white (`zwh//zwh`, an **autosomal** gene despite the `z` symbol) is
epistatic to everything. A white bird's info page tells you what it *would*
have looked like, and carriers show nothing at all — which makes white the
best way to smuggle a rare colour through a pedigree.

### Toy stencil

A **three-factor complex**, not a single gene, and the only thing in the model
that reads the pattern locus back out from underneath spread:

* `Ts1` — dominant bronze. On its own it only bronzes the markings.
* `Ts2` — **incomplete dominant**. Two copies allow full white; one copy stops at cream.
* `ts3` — recessive whitener. `ts3//ts3` is what turns the pattern white, but only with the other two present.

So there are three visible tiers — **bronze → partial → full white** — and the
full effect needs `Ts1` with `Ts2//Ts2` and `ts3//ts3` together. That makes it a
real breeding project rather than a single lucky hatch.

It **prints through spread and recessive red**, which normally bury the pattern
entirely. A black bird with white bars is genetically *blue bar + spread + toy
stencil*. Barless birds show nothing — there are no markings to stencil.

The stencil is drawn as a **separate overlay layer on top of the existing
sprite**, so no base artwork changes and the sprite filename is untouched. Any
GIF you supply keeps its own look with the stencil painted over it.

### Eye colour

Three iris colours from **two** places in the genome, which is why the game
handles them the way it does:

* **Orange** — wild type.
* **Pearl** — `tr//tr`, autosomal recessive at the `Tr` locus. The real cause is
  a nonsense mutation (W49X) in *SLC2A11B* that stops pteridine synthesis, so
  only the white guanine crystals are left. Carriers show nothing; two carriers
  throw 25% pearl.
* **Bull** — not a `Tr` allele at all. It rides along with recessive white via
  *EDNRB2*, so any `zwh//zwh` bird shows a bull eye whatever it carries at `Tr`.
  The `Tr` genotype is still there and still inherited.

---

## How to play

**Loft** — five perches to start (Loft Expansion adds five at a time), two of them filled with a randomised pair.
**Right-click any pigeon** to open its page: full genotype with a plain-English
reading of each locus, what it carries, plus four actions —

* **✏️ Rename** — the pencil beside the name. Enter saves, Esc cancels.
* **Genealogy** — three generations at a time; click a parent or grandparent to re-root the tree on them and follow that line further back
* **Breeding** — opens the pairing screen with this bird already slotted
* **Sell** — frees the perch and pays you **60 coins**
* **Rehome** — frees the perch for nothing

Renaming updates the bird **everywhere** — loft card, pedigree tree, breeding
slots, the nest panel, and the loft diary. Diary entries store a bird id rather
than a name, so a line written months ago reads with the current name: rename a
cock and *"Clifford and Julia settle onto a clutch"* becomes *"Sir Pecksalot and
Julia settle onto a clutch"*. Names are capped at 20 characters, and the ★ rare
badge follows the name, appearing only if you rename a bird to one of the 19
specials.

Birds stay on file forever after they leave the loft, so a sold or rehomed
pigeon still appears in its descendants' pedigrees.

**Explore** — the Coast or the City, each with its own allele pool. The coast
runs to bars, barless, dilutes and whites; the city runs to checks, T-patterns
and ash-red. Walk forward and you find nothing, a few coins, or a pigeon
staring at you. Catching is a coin flip.

* walk: −3 energy · coin find: −5 · catch attempt: −12
* energy regenerates **10% every 15 minutes**, and it keeps ticking while the
  game is closed. So do breeding timers and squab growth.

**Farm** — six growing spots, and the steady way to make money. Buy seed from the
**Farm & Supply Store** beneath the plots, open your inventory, click **Use** on a
seed, then click a spot to sow it.
Each crop passes through **Seedling → Sprout → Adult**, changing at the halfway
point and again when it finishes. Once a plant is Adult, click the **scythe** in
the tool rail and then click the plant to cut and sell the grain in one go.

| Crop | Seed | Grows in | Sells for | Profit |
|---|---|---|---|---|
| 🌽 Corn | 10 | 30s | 20 | +10 |
| 🌾 Millet | 15 | 1m | 30 | +15 |
| 🌻 Sunflower | 20 | 2m | 40 | +20 |

Corn turns the fastest profit per minute; sunflowers pay most per plot, so which
one wins depends on how often you check back. Growth is timestamp-based like
everything else, so crops keep ripening while the game is closed.

Every crop has a **5% chance of coming up Super**, worth **double** at harvest —
rolled when you sow, revealed when it reaches Adult. Fertilizer is worked into
**all six plots at once**, and **each plot then carries its own 10 fertilized
growings**. A plot only spends one when you actually sow in it, so a spot you
leave alone keeps every growing it was given:

| Fertilizer | Price | Super chance |
|---|---|---|
| 🪱 Compost | 50 | 10% |
| 🌿 Pigeon Guano | 100 | 15% |
| ⚗️ Nitrate Blend | 150 | 20% |

Work all ten out of plots 1-5 and plot 6 still has its full ten waiting. Each
plot shows its own remaining count as a badge, and the tool rail totals them up.
The Farm & Supply Store panel collapses out of the way, and remembers whether you
left it open.

The scythe stays in your hand until you toggle it off or press `Esc`, so you can
clear a whole bed in a few clicks. Clicking an Adult plant without the scythe
just reminds you to pick it up; clicking one that is not ready tells you how long
is left.

**Shop**

Seed and fertilizer are **not** here — they live in the Farm & Supply Store.

| Item | Price | |
|---|---|---|
| Sex Changer | 50 | flips a bird between cock and hen |
| Pigeon Feed | 60 | one bag, 4 uses |
| Cooldown Remover | 200 | clears a hen's breeding cooldown |
| Energy Refill | 250 | explore energy back to full |
| Growth Serum | 300 | a squab becomes an adult instantly |
| Loft Expansion | 100, then +150 each | five more perches per purchase, up to 30 |
| Total Reshuffle | 1000 | rerolls every locus on one bird; keeps its name and sex |

**Sex Changer** keeps the bird looking identical but rebuilds its sex-linked
genes to fit the new sex, because ZZ and ZW hold different numbers of alleles:

* **Cock → hen** — the W replaces one Z, so only the allele he was *showing*
  survives. Anything he carried hidden at the base-colour or dilution locus is
  gone, since a hen cannot carry sex-linked genes at all.
* **Hen → cock** — her single Z is copied into the slot the W held, so she comes
  out homozygous and breeds true at both sex-linked loci.

Autosomal carries (spread, pattern, recessive red, recessive white) are
untouched either way, and any breeding cooldown is cleared. It is refused on a
bird currently sitting on a clutch. Names do not change with sex.

Total Reshuffle draws from a deliberately flat allele pool — rare alleles come
up far more often than they do in the wild, which is what the 1000 coins buy.
It keeps the bird's name, sex and pedigree links; everything genetic is new.

**Inventory** — opens over any screen, gold shown in the corner. Click **Use**
on a pigeon-targeted item and it sticks to your cursor; **right-click a pigeon**
to apply it. `Esc` drops it.

**Breeding** — pick a cock and a hen, read the exact odds, then breed. A clutch
is one or two squabs, so you need **two free perches** before the hen will lay;
without them the pairing is refused and tells you so. 30 minutes in the nest
(skippable), 60 minutes to grow up. The hen
takes a 2-hour cooldown afterwards; the cock is free immediately.

Keys: `I` inventory · `Esc` close / drop held item.

---

## The art

The game rasterises a pixel pigeon from each bird's genotype, so every one of
the possible colour, dilution, spread and pattern combinations has art — brown,
khaki, pale lavender, recessive yellow and the rest included. The **🎨 Gallery**
button in the nav opens `gallery.html`, which shows all 53 variants at once.

Squabs are the exception: **every chick uses the same down sprite** regardless of
genotype, so nothing about a bird's colour shows until it fledges. That art is
also embedded in `sprites.js`, so it renders even with no assets folder.

Eye colour is deliberately **not** part of a sprite's filename — otherwise every
GIF would need an orange and a pearl version. A supplied GIF keeps its own eye.

To use your own GIFs instead, drop them into `assets/pigeons/` with the names
listed in [assets/pigeons/README.txt](assets/pigeons/README.txt). Any file you
supply overrides the built-in renderer for that phenotype; anything missing
falls back gracefully — **brown birds borrow the ash-red art**, and a bird that
merely *carries* brown shows its own visible colour with "carries Brown" listed
on its gene page.

---

## Save data

One `localStorage` key, `thecote.save.v1` (a save from the old `pigeonloft.save.v1` name is adopted automatically on first load). **New loft** in the nav wipes it
and starts over.
