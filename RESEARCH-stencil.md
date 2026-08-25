# Research notes — Toy Stencil and Frill Stencil

**Status: Toy Stencil (§2) is now IMPLEMENTED — see GENETICS.md §3.6.**
**Frill Stencil (§3) is still research only.**
The live model is documented in [GENETICS.md](GENETICS.md).

---

## 0. A naming trap first

"Frill" means two unrelated things in pigeons. Both are below, but only the
first is what pairs with Toy Stencil:

1. **Frill Stencil (`fs`)** — a *colour* gene that whitens pattern markings.
   This is the one that belongs beside Toy Stencil.
2. **The frill / frillback curl** — *structural* feather traits (the breast
   jabot of Owls and Turbits, the curled wing feathers of a Frillback). Nothing
   to do with colour. Covered briefly in §5.

---

## 1. What "stencil" means

Both stencil systems do the same broad thing: they **strip the melanin out of
the wing-pattern markings**, so bars, checks and T-pattern come out **white or
near-white** instead of dark, while the rest of the bird keeps its colour.

The result reads like the pattern was stencilled on in white — hence the name.

---

## 2. Toy Stencil (`Ts`)

### It is a complex, not a single gene

This is the important structural fact. The standard fancier account is
**three interacting factors**:

| Factor | Type | Contribution |
|---|---|---|
| `Ts1` | dominant | a **bronze**; on its own the weakest visual effect |
| `Ts2` | **incomplete/partial dominant** | a **lighter bronze** |
| `ts3` | **recessive modifier** | with `Ts1` + `Ts2` present, turns the pattern areas (bar, check, T-pattern) **white** |

**Best expression needs `Ts1//Ts1 Ts2//Ts2 ts3//ts3`** — both dominants
homozygous *and* the recessive modifier homozygous. Partial combinations give
partial results, and breeders do get usable birds without all three fixed, by
selection.

Note the ordering: `ts3` is the one that actually delivers the white, but it
cannot do it without the two bronzes underneath. That is a genuine
three-way epistatic interaction, not a simple series.

### What it does

* Acts on the **wing shield** — this is Toy Stencil's territory.
* **Does not** wash out the tail bar (this distinguishes it from opal).
* **Does not** change the base colour.
* Usually leaves a **coloured mark on the rear edge of the bar** — a useful
  tell for identifying it.

### The remarkable bit: it prints through spread and recessive red

Normally **spread** smears tail-bar pigment over the whole bird and the wing
pattern vanishes; **recessive red** likewise floods everything and hides the
pattern. Toy Stencil **punches the hidden pattern back out**, in white.

> A black bird with white bars is genetically **blue bar + spread + toy stencil**.

This matters for our model: it inverts our epistasis chain. Today spread and
recessive red sit *above* pattern and hide it. Toy Stencil would sit above
*them* and re-expose the pattern as white. It is the only thing we have looked
at that reads the pattern locus back out from under spread.

---

## 3. Frill Stencil (`fs`)

* **Autosomal recessive** — lowercase symbol in Hollander's scheme; needs
  `fs//fs` to show. It appears in the standard gene-symbol list simply as
  `fs`, "frill stencil".
* Where Toy Stencil works on the **shield / body**, Frill Stencil works mainly
  on the **tail**, and also on the **flight tips**.
* Breeders demonstrate it by pulling half the tail on a squab so the regrown
  feathers show the `fs` effect on tail and flight tips.

So the division of labour is roughly:

| | Toy Stencil `Ts` | Frill Stencil `fs` |
|---|---|---|
| Inheritance | 3-factor complex, 2 dominant + 1 recessive | single autosomal recessive |
| Acts on | wing shield / body | tail, flight tips |
| Shows through spread & rec. red | **yes** | not reported |

---

## 4. The two together — Satinettes and Oriental Frills

The Classic / Oriental Frill "stencil" look **requires both** `Ts` and `fs` in
combination — Toy Stencil doing the body, Frill Stencil doing the tail. Show
standards for Satinettes require both to be present.

Documented combination results:

* Heterozygous `Ts` + `fs` → bronze checker wing markings with **white bars,
  white flight tips and a white tail bar**.
* Homozygous `Ts` complex + `fs` + **T-pattern** + **sooty**, under extreme
  selection → the heavily whitened Oriental Frill phenotype.

### Satinette variety names (useful vocabulary)

Satinettes are white except for a coloured shield and coloured tail:

| Variety | Base |
|---|---|
| **Bluette** | blue bar |
| **Silverette** | silver (dilute blue) bar |
| **Brownette** | brown bar |
| **Sulphurette** | (yellow/dilute series) |

Plus **laced-tail** vs **spot-tail** forms — spot-tail birds show the stencil
mostly on tail and wings; laced-tail birds carry lacing over most of the body
and are usually **spread**.

---

## 5. The *other* frill — structural, not colour

For completeness, since the word collides:

* **Frillback curl** — the curled wing-shield feathers of the Frillback breed.
  Breeding work from the 1930s, and later L. Paul Gibson, describes it as
  **incomplete dominant via two non-allelic genes, `Cu1` and `Cu2`**, with a
  suspected third gene affecting feather length. The curl comes from uneven
  growth on one side of the feather.
* **Breast frill / jabot** — the rosette of reversed feathers on the chest of
  Owls, Turbits and Frills. A separate structural trait.

Neither has anything to do with the stencil genes.

---

## 6. Confidence and caveats

Be careful how much weight this gets — it is **not** on the same evidential
footing as the loci already in the game:

* The base colour, dilution, pattern, spread, recessive red, recessive white
  and `Tr` eye loci all have peer-reviewed molecular backing (*SLC2A11B*,
  *EDNRB2*, *Mc1r*, the pattern CNV work).
* **Stencil has none of that.** The three-factor `Ts` account comes from
  fancier literature and the Pigeon Genetics Newsletter tradition, not from a
  mapped causal variant. Sources hedge — "seems to be the result of three
  genes working together".
* **The symbols are inconsistent across sources.** The formal gene-symbol list
  carries only `Ts` and `fs` as single entries; the `Ts1 / Ts2 / ts3`
  breakdown is a breeder-level model layered on top. There is also a muddle
  around `ma`: the symbol list gives `ma` = mahogany (recessive), while one
  account has Hollander's Modena-bronze `ma` later folded in as `Ts1`.
* Bronze expression is reported to be **suppressed by sooty**, which
  complicates any "sooty improves stencil" advice.

---

## 7. If we were to add it to the game

Sketch only, for when we decide:

* **`Ts` is done** — built as the full three-factor complex (`Ts1`, `Ts2`,
  `ts3`), drawn as an overlay layer so no base sprite changed, and predict()
  gained a signature-collapsing step so ten loci still resolve in ~4ms.
* **`fs` is the easy one** — a clean autosomal recessive, structurally
  identical to recessive white in our engine. Roughly a one-locus addition.
* **`Ts` is the expensive one** — three loci with a joint condition, which
  would multiply the breeding-prediction table considerably. A defensible
  shortcut is a single `Ts` locus standing in for the complex, with a note that
  the real thing is a three-factor system.
* **Both need new art paths.** White bars/checks on the shield, a white tail
  bar and white flight tips are not variations our sprite palette currently
  produces — the pattern colour is presently derived from the base pigment.
* **The epistasis chain would need reworking**, per §2: Toy Stencil must read
  the pattern locus back out from underneath spread and recessive red, which
  today are terminal in our chain.

---

## Sources

* [Gene Symbols for Mutant Pigeon Genes (Mangile)](https://mangile-pigeons.sperry-galligar.com/GeneSymb.html) — the formal symbol list: `Ts` toy stencil, `fs` frill stencil, `ma` mahogany, `K` kite
* [Pigeon Genetics Newsletter — Toy Stencil Phenotypes & Genetics (March 2011)](https://studylib.net/doc/8102989/email-pigeon-genetics-newsletter-march-2011)
* [Pigeon Genetics Newsletter, April 2011](https://www.genetikaholubu.cz/media/newsletter/email_pigeon_genetics_newsletter_2011_04.pdf)
* [Pigeon Genetics Newsletter, June 2019](https://www.genetikaholubu.cz/media/newsletter/email_pigeon_genetics_newsletter_2019_06.pdf)
* [Falcon Lofts — Toy/Frill Stencil](http://www.falconlofts.com/toy-frill-stencil.html)
* [Pigeon-Talk — Toy Stencil](https://www.pigeons.biz/threads/toy-stencil.58454/)
* [Pigeon-Talk — Genetics question on breeding toy frill stencil](https://www.pigeons.biz/threads/genetics-question-on-breeding-toy-frill-stencil.92241/)
* [Classic Frill Club — Satinettes](https://www.classicoldfrill.org/standard-and-judging/satinettes)
* [Seraphim Club International — The Magic of Seraphim Genetics](https://seraphimclubinternational.com/2012/01/26/the-magic-of-basic-seraphim-genetics/)
* [Expression of Bronze Phenotypes in Pigeons (PDF)](https://www.mathewsopenaccess.com/scholarly-articles/expression-of-bronze-phenotypes-in-pigeons.pdf)
* [Wikipedia — Frillback](https://en.wikipedia.org/wiki/Frillback) (Cu1 / Cu2 curl genes)
* [Wikipedia — Oriental Frill](https://en.wikipedia.org/wiki/Oriental_Frill)
