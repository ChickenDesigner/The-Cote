# Pigeon Genetics — research notes behind the game model

Everything in `js/genetics.js` is built from the rules below. Sources are listed at the bottom.

---

## 1. The single most important fact: birds use ZW, not XY

Pigeons (like all birds) determine sex the opposite way to mammals:

| | Chromosomes | Sex-linked genes |
|---|---|---|
| **Cock (male)** | **ZZ** | two copies — can be heterozygous, **can carry hidden recessives** |
| **Hen (female)** | **ZW** | one copy — **hemizygous**, whatever she has, she shows |

Consequences that drive the whole game:

1. **A hen can never "carry" a sex-linked colour.** What you see is what she is. There is no second Z to mask it.
2. **A daughter's sex-linked genes come from her father only.** She gets his Z and her mother's W. "Z chromosomes never pass from mother to daughter."
3. **A mother passes her Z only to her sons.** So a hen's colour reappears in her sons (as a carried or expressed allele), never in her daughters.
4. **The father determines the colour of all daughters** at every sex-linked locus.

This is why breeding a hen of a rare colour is a completely different strategic move from breeding a cock of one — and the game leans on that.

---

## 2. Sex-linked loci (on the Z chromosome)

### 2.1 Base colour — the `B` locus

An allelic series of three, in decreasing dominance:

```
BA (ash-red)  >  B+ (blue/black, wild type)  >  b (brown)
```

* A cock can be `BA//B+`, `BA//b`, `B+//b` — looks like the dominant one, **carries** the other.
* A hen is simply `BA//-`, `B+//-`, or `b//-` (the `-` is her W chromosome).

Classic worked cross the game reproduces exactly:

> **Blue cock carrying brown (`B+//b`) x ash-red hen (`BA//-`)**
> Sons get a Z from each parent, so all sons are ash-red (`BA//B+` or `BA//b`), carrying blue or brown.
> Daughters get Dad's Z + Mum's W, so half are blue hens and half are **brown hens**.
> The brown daughters got brown from their *father*, and no brown bird was visible in the pairing.

### 2.2 Dilution — the `D` locus

Also on the Z, so all the same rules apply. Decreasing dominance:

```
D+ (intense)  >  dP (pale)  >  d (dilute)
```

Dilute cuts pigment density roughly in half. The diluted forms have their own trade names:

| Intense | Dilute |
|---|---|
| Ash-red | **Ash-yellow** ("yellow") |
| Blue | **Silver** |
| Black (spread blue) | **Dun** |
| Brown | **Khaki** |
| Recessive red | **Recessive yellow** |

> **Note on linkage.** `B` and `D` are both on the Z and are genuinely linked, but they recombine in cocks roughly 40% of the time — close enough to independent that the game treats them as assorting independently. A real breeder would occasionally see them travel together.

---

## 3. Autosomal loci (ordinary chromosomes — cocks and hens identical)

### 3.1 Wing pattern — the `C` locus

Four alleles in one series, decreasing dominance and decreasing melanin:

```
CT (T-pattern check)  >  C (checker)  >  c+ (bar, wild type)  >  cb (barless)
```

Barless is fully recessive: a bird needs `cb//cb` to show it. Everything else can carry it.

### 3.2 Spread — the `S` locus

**Autosomal dominant.** Spread takes the pigment that would normally sit only in the tail bar and smears it over the entire bird, so the wing pattern disappears (though it is still there in the genotype — "spread is epistatic to pattern").

| Base | + Spread |
|---|---|
| Blue | **Black** |
| Ash-red | **Lavender / ash** (dull ashy silver, often with red flecking) |
| Brown | **Chocolate** |
| + dilute | Dun, pale lavender, khaki-self |

One copy is enough. `S//s+` and `S//S` look the same, but only the heterozygote can throw non-spread young.

### 3.3 Recessive red — the `e` locus

**Autosomal recessive.** `e//e` floods every feather with phaeomelanin, so:

* the bird is a solid brick/rust red all over,
* **wing pattern is hidden** (bars and checks are still in the genotype),
* spread is largely hidden too,
* with dilute it becomes **recessive yellow**.

A single copy (`e+//e`) shows nothing at all — which makes recessive red the classic "surprise" gene: two normal-looking birds that both carry it throw 25% red young.

### 3.4 Recessive white — the `z` locus

> The gene symbol is `z^wh`. **The `z` here is Hollander's locus letter and has nothing to do with the Z sex chromosome** — recessive white is *autosomal*. This trips up nearly everyone.

* `zwh//zwh` gives a **pure white bird with dark "bull" eyes** (dark brown/black rather than the usual orange). The likely causal variant is a missense mutation in *EDNRB2*.
* `z+//zwh` carriers are **fully coloured and invisible**.
* Recessive white is **epistatic to everything else**: colour, dilution, spread and pattern are all still in there, completely masked.
* Two carriers give the textbook **1 white : 2 coloured carriers : 1 clean coloured** ratio.

In the game a recessive white bird therefore has a *hidden phenotype* — the gene page shows you what it would have looked like, which is a big part of the fun. It's also how you smuggle a rare colour through a pedigree unnoticed.

> Bull eye is the tell. A white pigeon with **orange** eyes is white from piebalding/grizzle, not recessive white. The game gives recessive whites bull eyes.

### 3.5 Eye colour — the `Tr` locus

Pigeons show three iris colours, and they come from **two separate places** in the genome, not one series:

| Eye | Cause |
|---|---|
| **Orange** | wild type. Pteridine pigment in the stromal pigment cells. The shade runs yellow to red depending on how dense the blood vessels are. |
| **Pearl** (white) | `tr//tr`, **autosomal recessive** at the `Tr` locus. |
| **Bull** (dark) | not a `Tr` allele at all — it comes with recessive white / piebalding, from *EDNRB2*. |

**Pearl** is a nonsense mutation (**W49X**) in **SLC2A11B**: a G→A transition in exon 3 puts a premature stop codon in the protein. Losing it downregulates *CSF1R* and *GCH1*, so pteridine synthesis never happens and only the structural guanine crystals are left — which read as white with pink and red tinges from the blood vessels behind. The mutation is shared by every pearl-eyed pigeon tested, arose roughly 5,400 years ago during domestication, and has been under selection ever since.

**Bull** is a complete absence of stromal pigment cells, mapped to a single locus on linkage group 15 containing *EDNRB2* — the same gene behind recessive white plumage. That is why it travels with white feather rather than with any eye gene, and why the game resolves it as a consequence of `zwh//zwh` rather than as an allele you can breed on its own.

So in the game:

* `Tr+` (orange) is dominant to `tr` (pearl); carriers show nothing and two carriers throw 25% pearl.
* A recessive white bird shows a **bull** eye no matter what it carries at `Tr` — its pearl or orange genotype is still there, still inherited, and still listed on its gene page.

### 3.6 Toy Stencil — the `Ts` complex

The only gene group in the model that is **not a single locus**. Three factors
have to line up, and each contributes something different:

| Factor | Type | Contribution |
|---|---|---|
| `Ts1` | dominant | a bronze; on its own the weakest visual effect |
| `Ts2` | **incomplete dominant** | a lighter bronze; two copies needed for full effect |
| `ts3` | recessive | with `Ts1` and `Ts2` present, turns the markings **white** |

That gives three visible tiers:

```
Ts1 or Ts2 present, no whitener   ->  bronze markings
Ts1 + Ts2//ts2+ + ts3//ts3        ->  partial, cream markings
Ts1 + Ts2//Ts2  + ts3//ts3        ->  full white markings
```

**It prints through spread and recessive red.** Both of those normally bury the
wing pattern for good — spread smears tail-bar pigment over everything,
recessive red floods every feather. Toy Stencil punches the buried pattern back
out in white, so it reads the **pattern locus directly**, never the visible
pattern. A black bird with white bars is genetically blue bar + spread + toy
stencil. Barless birds show nothing: no markings to stencil.

It acts on the **wing shield only** — it does not wash out the tail bar (that
would be opal) and does not change the base colour. It characteristically
leaves the rear edge of each bar coloured, which the renderer reproduces.

> **Evidence note.** Unlike the other loci here, Toy Stencil has no mapped
> causal variant. The three-factor account comes from fancier literature rather
> than molecular work, and sources hedge on the exact gene count. Treat it as
> the best available model, not settled science.

---

---

## 4. Epistasis order used by the game

When several genes could apply, the game resolves the visible phenotype top-down:

```
1. recessive white (zwh//zwh)  ->  white, bull eye, everything below hidden
2. recessive red   (e//e)      ->  solid red/yellow, pattern & spread hidden
3. spread          (S/-)       ->  self-coloured, pattern hidden
4. base colour x dilution      ->  the series name
5. pattern                     ->  bar / check / T-check / barless

Toy stencil runs the other way — it re-exposes what 2 and 3 hid:

1. barless, or complex incomplete  ->  nothing
2. Ts1/Ts2 only                    ->  bronze markings
3. + ts3//ts3, one Ts2             ->  cream markings
4. + ts3//ts3, two Ts2             ->  white markings
   ...painted from the PATTERN locus, straight through spread and recessive red

Eye colour resolves alongside, on its own track:

1. recessive white (zwh//zwh)  ->  bull eye, Tr genotype hidden
2. pearl           (tr//tr)    ->  pearl eye
3. otherwise                   ->  orange eye
```

Genes that are masked are still tracked, still inherited, and still shown on the bird's gene page as *hidden* or *carried*.

---

## 5. How the game builds a chick

For every offspring:

1. **Roll sex 50/50** — which chromosome the dam contributes decides it.
2. **Sex-linked loci** (`base`, `dilute`):
   * sire contributes one of his two alleles at random,
   * if the chick is a **son**, the dam contributes her single Z allele,
   * if the chick is a **daughter**, she gets `W` — so her only allele is her father's.
3. **Autosomal loci** (`spread`, `pattern`, `recred`, `eye`, `white`): each parent contributes one of their two alleles at random, independently.

The breeding screen enumerates every one of these combinations exactly (not by simulation) and shows you the true percentage chance of each phenotype, split into cocks and hens — because the two columns are genuinely different whenever a sex-linked gene is in play.

---

## Not yet in the model

**Frill Stencil (`fs`)** is researched but unimplemented — see
[RESEARCH-stencil.md](RESEARCH-stencil.md). **Toy Stencil is now implemented**;
its section is 3.6 above and the full research is in the same file.

---

## Sources

* [Learn.Genetics (Univ. of Utah) — Sex Linkage in pigeons](https://learn.genetics.utah.edu/content/pigeons/sexlinkage/)
* [Learn.Genetics — Colour](https://learn.genetics.utah.edu/content/pigeons/color/)
* [Learn.Genetics — Dilute](https://learn.genetics.utah.edu/content/pigeons/dilute/)
* [Learn.Genetics — Spread](https://learn.genetics.utah.edu/content/pigeons/spread/)
* [Learn.Genetics — Pattern](https://learn.genetics.utah.edu/content/pigeons/pattern/)
* [Learn.Genetics — Recessive Red](https://learn.genetics.utah.edu/content/pigeons/recessivered/)
* [Learn.Genetics — Epistasis](https://learn.genetics.utah.edu/content/pigeons/epistasis/)
* [OMIA:001252-8932 — Feather colour, recessive white in *Columba livia*](https://www.omia.org/OMIA001252/8932/)
* [PLOS Genetics — The genetics and evolution of eye colour in domestic pigeons](https://journals.plos.org/plosgenetics/article?id=10.1371%2Fjournal.pgen.1009770)
* [Molecular Biology and Evolution — Two genomic loci control three eye colors in the domestic pigeon](https://academic.oup.com/mbe/article/38/12/5376/6359824)
* [eLife — Introgression of regulatory alleles drives plumage pattern diversity in the rock pigeon](https://elifesciences.org/articles/34803)
* [PMC — Epistatic and combinatorial effects of pigmentary gene mutations in the domestic pigeon](https://pmc.ncbi.nlm.nih.gov/articles/PMC3990261/)
* [Pigeon Genetics Wiki — Pattern Series](https://pigeongenetics.fandom.com/wiki/Pattern_Series)
* [NBRC — Basic Pigeon Genetics](https://nbrc.us/home-page/color-basics/basic-pigeon-genetics/)
