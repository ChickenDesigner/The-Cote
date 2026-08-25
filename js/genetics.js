/* ============================================================
   THE COTE — genetics engine
   See GENETICS.md for the research this is built on.
   ============================================================ */

var Genetics = (function () {
  'use strict';

  // 'Z' = sex-linked (on the Z chromosome), 'A' = autosomal
  var LOCI = {
    base: {
      key: 'base',
      name: 'Base Colour',
      chrom: 'Z',
      symbol: 'B',
      order: ['BA', 'B+', 'b'],
      label: { 'BA': 'Ash-Red', 'B+': 'Blue/Black', 'b': 'Brown', 'W': '— (W)' },
      note: 'Sex-linked. BA > B+ > b.'
    },
    dilute: {
      key: 'dilute',
      name: 'Dilution',
      chrom: 'Z',
      symbol: 'D',
      order: ['D+', 'dP', 'd'],
      label: { 'D+': 'Intense', 'dP': 'Pale', 'd': 'Dilute', 'W': '— (W)' },
      note: 'Sex-linked. D+ > dP > d.'
    },
    spread: {
      key: 'spread',
      name: 'Spread',
      chrom: 'A',
      symbol: 'S',
      order: ['S', 's+'],
      label: { 'S': 'Spread', 's+': 'Non-spread' },
      note: 'Autosomal dominant. Hides wing pattern.'
    },
    pattern: {
      key: 'pattern',
      name: 'Wing Pattern',
      chrom: 'A',
      symbol: 'C',
      order: ['CT', 'C', 'c+', 'cb'],
      label: { 'CT': 'T-Pattern Check', 'C': 'Checker', 'c+': 'Bar', 'cb': 'Barless' },
      note: 'Autosomal. CT > C > c+ > cb.'
    },
    recred: {
      key: 'recred',
      name: 'Recessive Red',
      chrom: 'A',
      symbol: 'e',
      order: ['e+', 'e'],
      label: { 'e+': 'Wild type', 'e': 'Recessive red' },
      note: 'Autosomal recessive. e//e hides colour and pattern.'
    },
    /* --- the Toy Stencil complex: three factors that must line up --- */
    ts1: {
      key: 'ts1',
      name: 'Stencil Bronze',
      chrom: 'A',
      symbol: 'Ts1',
      order: ['Ts1', 'ts1+'],
      label: { 'Ts1': 'Bronze factor', 'ts1+': 'Absent' },
      note: 'Autosomal dominant. First factor of the Toy Stencil complex. On its own it only bronzes the wing pattern.',
      describePair: function (pair) {
        if (pair[0] === 'Ts1' && pair[1] === 'Ts1') return { reading: 'Bronze factor — pure', carries: null };
        if (pair[0] === 'Ts1' || pair[1] === 'Ts1') return { reading: 'Bronze factor — one copy, still shows', carries: 'No bronze factor' };
        return { reading: 'Absent — pure', carries: null };
      }
    },
    ts2: {
      key: 'ts2',
      name: 'Stencil Lightener',
      chrom: 'A',
      symbol: 'Ts2',
      order: ['Ts2', 'ts2+'],
      label: { 'Ts2': 'Lightener', 'ts2+': 'Absent' },
      note: 'Autosomal, incomplete dominant. Two copies allow the full white stencil; one copy only ever gives a partial one.',
      describePair: function (pair) {
        var n = (pair[0] === 'Ts2' ? 1 : 0) + (pair[1] === 'Ts2' ? 1 : 0);
        if (n === 2) return { reading: 'Lightener — two copies, full whitening possible', carries: null };
        if (n === 1) return { reading: 'Lightener — one copy, so whitening can only be partial', carries: 'No lightener' };
        return { reading: 'Absent — pure', carries: null };
      }
    },
    ts3: {
      key: 'ts3',
      name: 'Stencil Whitener',
      chrom: 'A',
      symbol: 'ts3',
      order: ['Ts3+', 'ts3'],
      label: { 'Ts3+': 'Absent', 'ts3': 'Whitener' },
      note: 'Autosomal recessive. ts3//ts3 is what actually turns the pattern white — but only when Ts1 and Ts2 are there to work with.',
      describePair: function (pair) {
        if (pair[0] === 'ts3' && pair[1] === 'ts3') return { reading: 'Whitener — active', carries: null };
        if (pair[0] === 'ts3' || pair[1] === 'ts3') return { reading: 'Absent, carries the whitener', carries: 'Stencil whitener' };
        return { reading: 'Absent — pure', carries: null };
      }
    },
    eye: {
      key: 'eye',
      name: 'Eye Colour',
      chrom: 'A',
      symbol: 'Tr',
      order: ['Tr+', 'tr'],
      label: { 'Tr+': 'Orange', 'tr': 'Pearl' },
      note: 'Autosomal recessive at the Tr locus (SLC2A11B). tr//tr gives a pearl eye. A recessive white bird shows a bull eye instead, whatever it carries here.'
    },
    white: {
      key: 'white',
      name: 'Recessive White',
      chrom: 'A',
      symbol: 'z',
      order: ['z+', 'zwh'],
      label: { 'z+': 'Wild type', 'zwh': 'Recessive white' },
      note: 'Autosomal recessive (the "z" is a locus letter, NOT the Z chromosome). Epistatic to everything.'
    }
  };

  var LOCUS_KEYS = ['base', 'dilute', 'spread', 'pattern', 'ts1', 'ts2', 'ts3', 'recred', 'eye', 'white'];
  var SEX_LINKED = ['base', 'dilute'];

  /* ---------- helpers ---------- */

  function rank(locusKey, allele) {
    var i = LOCI[locusKey].order.indexOf(allele);
    return i === -1 ? 99 : i; // 'W' sorts last
  }

  // The expressed allele at a locus (ignores W).
  function expressed(locusKey, pair) {
    var a = pair[0], b = pair[1];
    if (b === 'W' || b === undefined) return a;
    if (a === 'W') return b;
    return rank(locusKey, a) <= rank(locusKey, b) ? a : b;
  }

  // Sorted for display: dominant allele first.
  function sortPair(locusKey, pair) {
    if (pair[1] === 'W') return [pair[0], 'W'];
    return rank(locusKey, pair[0]) <= rank(locusKey, pair[1]) ? [pair[0], pair[1]] : [pair[1], pair[0]];
  }

  function hasAllele(pair, allele) {
    return pair[0] === allele || pair[1] === allele;
  }

  function isHomozygous(pair, allele) {
    return pair[0] === allele && pair[1] === allele;
  }

  function countAllele(pair, allele) {
    return (pair[0] === allele ? 1 : 0) + (pair[1] === allele ? 1 : 0);
  }

  function pairString(locusKey, pair) {
    var p = sortPair(locusKey, pair);
    return p[0] + ' // ' + (p[1] === 'W' ? '—' : p[1]);
  }

  /* ---------- phenotype ---------- */

  // seriesKey feeds the sprite renderer; name feeds the UI.
  function colourSeries(baseAllele, dilAllele, spread) {
    var s;
    if (baseAllele === 'BA') s = 'ashred';
    else if (baseAllele === 'b') s = 'brown';
    else s = 'blue';

    var dil = dilAllele === 'd' ? 'dilute' : (dilAllele === 'dP' ? 'pale' : 'intense');
    var name;

    if (s === 'blue') {
      if (spread) name = { intense: 'Black', pale: 'Pale Black', dilute: 'Dun' }[dil];
      else name = { intense: 'Blue', pale: 'Pale Blue', dilute: 'Silver' }[dil];
    } else if (s === 'ashred') {
      if (spread) name = { intense: 'Lavender', pale: 'Pale Lavender', dilute: 'Cream Lavender' }[dil];
      else name = { intense: 'Ash-Red', pale: 'Pale Ash-Red', dilute: 'Ash-Yellow' }[dil];
    } else {
      if (spread) name = { intense: 'Chocolate', pale: 'Pale Chocolate', dilute: 'Khaki Self' }[dil];
      else name = { intense: 'Brown', pale: 'Pale Brown', dilute: 'Khaki' }[dil];
    }
    return { seriesKey: s, dil: dil, name: name };
  }

  var PATTERN_NAME = { 'CT': 'T-Check', 'C': 'Check', 'c+': 'Bar', 'cb': 'Barless' };
  var PATTERN_SPRITE = { 'CT': 'tcheck', 'C': 'check', 'c+': 'bar', 'cb': 'barless' };

  var STENCIL_SUFFIX = {
    full: ' (toy stencil)',
    partial: ' (partial toy stencil)',
    bronze: ' (stencil bronze)'
  };
  var STENCIL_NAME = {
    none: 'None',
    bronze: 'Bronze only — Ts1/Ts2 without the whitener',
    partial: 'Partial — one copy of Ts2',
    full: 'Full white stencil'
  };

  /**
   * Resolve a genotype to everything the game needs to draw and describe it.
   * `underlying` = what it would look like with recessive white switched off.
   */
  function phenotype(genes) {
    var baseA = expressed('base', genes.base);
    var dilA = expressed('dilute', genes.dilute);
    var patA = expressed('pattern', genes.pattern);
    var spread = hasAllele(genes.spread, 'S');
    var recred = isHomozygous(genes.recred, 'e');
    var white = isHomozygous(genes.white, 'zwh');
    // Older saves predate the Tr locus; treat a missing pair as wild-type orange.
    var pearl = !!genes.eye && isHomozygous(genes.eye, 'tr');

    /* Toy Stencil: three factors that only deliver white together.
       Ts1 (dominant bronze) + two copies of Ts2 (incomplete dominant) +
       ts3//ts3 (recessive whitener) = the full white stencil. Fewer of them
       give a partial stencil, or just bronze. */
    var ts1On = !!genes.ts1 && hasAllele(genes.ts1, 'Ts1');
    var ts2n = genes.ts2 ? countAllele(genes.ts2, 'Ts2') : 0;
    var ts3On = !!genes.ts3 && isHomozygous(genes.ts3, 'ts3');

    var stencil = 'none';
    if (ts3On && ts1On && ts2n === 2) stencil = 'full';
    else if (ts3On && ts1On && ts2n === 1) stencil = 'partial';
    else if (ts1On || ts2n > 0) stencil = 'bronze';

    // Barless birds have no markings for the stencil to bite on.
    if (patA === 'cb') stencil = 'none';

    var ph = {
      baseAllele: baseA,
      diluteAllele: dilA,
      patternAllele: patA,
      spread: spread,
      recred: recred,
      white: white,
      // Bull eye comes with recessive white and overrides the Tr locus.
      eye: white ? 'bull' : (pearl ? 'pearl' : 'orange'),
      pearl: pearl && !white,
      bullEye: white
    };
    ph.eyeName = { bull: 'Bull (dark)', pearl: 'Pearl (white)', orange: 'Orange' }[ph.eye];

    // --- what it looks like ignoring recessive white ---
    var under;
    if (recred) {
      var rn = dilA === 'd' ? 'Recessive Yellow' : (dilA === 'dP' ? 'Pale Recessive Red' : 'Recessive Red');
      under = {
        name: rn,
        seriesKey: 'recred',
        dil: dilA === 'd' ? 'dilute' : (dilA === 'dP' ? 'pale' : 'intense'),
        patternSprite: 'self',
        patternName: null
      };
    } else {
      var cs = colourSeries(baseA, dilA, spread);
      under = {
        name: spread ? cs.name : cs.name + ' ' + PATTERN_NAME[patA],
        seriesKey: cs.seriesKey,
        dil: cs.dil,
        patternSprite: spread ? 'spread' : PATTERN_SPRITE[patA],
        patternName: spread ? null : PATTERN_NAME[patA]
      };
    }

    /* Toy Stencil prints the wing pattern back out even through spread and
       recessive red, which normally bury it — so the stencil always reads the
       pattern locus directly, never the visible pattern. */
    under.stencil = stencil;
    under.stencilPattern = PATTERN_SPRITE[patA];
    if (stencil !== 'none') under.name += STENCIL_SUFFIX[stencil];

    // A pearl eye is worth calling out; orange is the default and stays unsaid.
    if (pearl) under.name += ', pearl eye';
    ph.underlying = under;

    if (white) {
      ph.name = 'Recessive White';
      ph.seriesKey = 'white';
      ph.dil = 'intense';
      ph.patternSprite = 'self';
      ph.patternName = null;
      // recessive white buries the stencil along with everything else
      ph.stencil = 'none';
      ph.stencilPattern = under.stencilPattern;
    } else {
      ph.name = under.name;
      ph.seriesKey = under.seriesKey;
      ph.dil = under.dil;
      ph.patternSprite = under.patternSprite;
      ph.patternName = under.patternName;
      ph.stencil = stencil;
      ph.stencilPattern = under.stencilPattern;
    }

    ph.stencilName = STENCIL_NAME[ph.stencil];
    ph.stencilVisible = ph.stencil !== 'none';
    return ph;
  }

  /**
   * Sprite lookup key, e.g. "blue_bar", "ashred_dilute_check", "recred", "white", "blue_spread".
   */
  function spriteKey(ph) {
    if (ph.white) return 'white';
    var parts = [ph.seriesKey];
    if (ph.dil === 'dilute') parts.push('dilute');
    else if (ph.dil === 'pale') parts.push('pale');
    if (ph.seriesKey !== 'recred') parts.push(ph.patternSprite);
    return parts.join('_');
  }

  /**
   * Ordered list of sprite filenames to try before falling back to the
   * built-in pixel renderer. Honours "brown bar uses the red bar art".
   */
  function spriteCandidates(ph) {
    var out = [];
    var k = spriteKey(ph);
    out.push(k);
    // brown has no dedicated art yet -> borrow the ash-red art
    if (ph.seriesKey === 'brown') out.push(k.replace(/^brown/, 'ashred'));
    if (ph.dil === 'pale') out.push(k.replace('_pale', ''));
    // pattern fallback: tcheck -> check -> bar
    if (ph.patternSprite === 'tcheck') {
      out.push(k.replace('_tcheck', '_check'));
      if (ph.seriesKey === 'brown') out.push(k.replace(/^brown/, 'ashred').replace('_tcheck', '_check'));
    }
    if (ph.patternSprite === 'barless') {
      out.push(k.replace('_barless', '_bar'));
      if (ph.seriesKey === 'brown') out.push(k.replace(/^brown/, 'ashred').replace('_barless', '_bar'));
    }
    return out;
  }

  /* ---------- describing a genotype in words ---------- */

  /**
   * A human-readable line per locus + a list of hidden/carried traits.
   */
  function describe(pigeon) {
    var genes = pigeon.genes;
    var isHen = pigeon.sex === 'hen';
    var rows = [];
    var carried = [];

    LOCUS_KEYS.forEach(function (key) {
      var L = LOCI[key];
      var pair = sortPair(key, genes[key]);
      var exp = expressed(key, pair);
      var reading;

      if (L.chrom === 'Z') {
        if (isHen) {
          reading = L.label[exp] + ' — hemizygous, cannot carry anything hidden here';
        } else if (pair[0] === pair[1]) {
          reading = L.label[exp] + ' — pure';
        } else {
          reading = L.label[pair[0]] + ', carries ' + L.label[pair[1]];
          carried.push(L.label[pair[1]] + ' (sex-linked)');
        }
      } else if (L.describePair) {
        var d = L.describePair(pair);
        reading = d.reading;
        if (d.carries) carried.push(d.carries);
      } else if (pair[0] === pair[1]) {
        reading = L.label[exp] + ' — pure';
      } else if (key === 'spread') {
        // "carries Not spread" reads badly; say what it actually means.
        reading = 'Spread — one copy only, so half its young inherit no spread';
        carried.push('Non-spread (heterozygous Spread)');
      } else {
        reading = L.label[pair[0]] + ', carries ' + L.label[pair[1]];
        carried.push(L.label[pair[1]]);
      }

      rows.push({
        locus: L.name,
        chrom: L.chrom === 'Z' ? 'sex-linked' : 'autosomal',
        alleles: pairString(key, pair),
        reading: reading,
        note: L.note
      });
    });

    return { rows: rows, carried: carried };
  }

  /* ---------- gametes & breeding ---------- */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // Which alleles a parent can hand down at one locus, with probabilities.
  function gametes(pigeon, locusKey) {
    var pair = pigeon.genes[locusKey];
    var isZ = LOCI[locusKey].chrom === 'Z';
    if (isZ && pigeon.sex === 'hen') {
      // Only one Z allele; the other option is W, handled by the sex roll.
      return [{ allele: pair[0], p: 1 }];
    }
    if (pair[0] === pair[1]) return [{ allele: pair[0], p: 1 }];
    return [{ allele: pair[0], p: 0.5 }, { allele: pair[1], p: 0.5 }];
  }

  /** Build one chick's genotype from a sire and dam. */
  function makeChildGenes(sire, dam) {
    var sex = Math.random() < 0.5 ? 'cock' : 'hen';
    var genes = {};

    SEX_LINKED.forEach(function (key) {
      var fromSire = pick(sire.genes[key]);              // cock always has 2 real alleles
      if (sex === 'cock') {
        var fromDam = dam.genes[key][0];                 // hen's single Z
        genes[key] = sortPair(key, [fromSire, fromDam]);
      } else {
        genes[key] = [fromSire, 'W'];                    // daughter: dad's Z + mum's W
      }
    });

    ['spread', 'pattern', 'ts1', 'ts2', 'ts3', 'recred', 'eye', 'white'].forEach(function (key) {
      genes[key] = sortPair(key, [pick(sire.genes[key]), pick(dam.genes[key])]);
    });

    return { sex: sex, genes: genes };
  }

  /**
   * Exact offspring distribution (enumerated, not simulated).
   * Returns { cock: [{name, spriteKey, ph, p}], hen: [...] } with p summing to 1 within each sex.
   */
  function predict(sire, dam) {
    var result = { cock: [], hen: [] };

    ['cock', 'hen'].forEach(function (sex) {
      var combos = [{ genes: {}, p: 1 }];

      LOCUS_KEYS.forEach(function (key) {
        var isZ = LOCI[key].chrom === 'Z';
        var options = [];

        if (isZ) {
          var sireOpts = gametes(sire, key);
          if (sex === 'hen') {
            sireOpts.forEach(function (s) { options.push({ pair: [s.allele, 'W'], p: s.p }); });
          } else {
            var damAllele = dam.genes[key][0];
            sireOpts.forEach(function (s) {
              options.push({ pair: sortPair(key, [s.allele, damAllele]), p: s.p });
            });
          }
        } else {
          var so = gametes(sire, key), doo = gametes(dam, key);
          so.forEach(function (s) {
            doo.forEach(function (d) {
              options.push({ pair: sortPair(key, [s.allele, d.allele]), p: s.p * d.p });
            });
          });
        }

        /* Collapse allele pairs that the phenotype cannot tell apart before
           taking the cross product. With ten loci the raw product runs to
           hundreds of thousands of combinations; this keeps it in the
           thousands without changing a single probability. */
        var merged = [], seen = {};
        options.forEach(function (o) {
          var sig = locusSignature(key, o.pair);
          if (seen[sig] === undefined) {
            seen[sig] = merged.length;
            merged.push({ pair: o.pair, p: o.p });
          } else {
            merged[seen[sig]].p += o.p;
          }
        });
        options = merged;

        var next = [];
        combos.forEach(function (c) {
          options.forEach(function (o) {
            var g = {};
            for (var k in c.genes) g[k] = c.genes[k];
            g[key] = o.pair;
            next.push({ genes: g, p: c.p * o.p });
          });
        });
        combos = next;
      });

      var agg = {};
      combos.forEach(function (c) {
        var ph = phenotype(c.genes);
        // All recessive whites look identical, so they collapse into one row;
        // what they are hiding is tracked separately.
        var label = ph.white ? 'Recessive White' : ph.name;
        if (!agg[label]) {
          agg[label] = {
            name: ph.name,
            white: ph.white,
            hidden: {},
            ph: ph,
            genes: c.genes,   // a representative genotype, used to draw the preview art
            sex: sex,
            p: 0
          };
        }
        agg[label].p += c.p;
        if (ph.white) {
          var u = ph.underlying.name;
          agg[label].hidden[u] = (agg[label].hidden[u] || 0) + c.p;
        }
      });

      var list = [];
      for (var k2 in agg) {
        var entry = agg[k2];
        var hid = [];
        for (var hk in entry.hidden) hid.push({ name: hk, p: entry.hidden[hk] });
        hid.sort(function (a, b) { return b.p - a.p; });
        entry.hiddenList = hid;
        list.push(entry);
      }
      list.sort(function (a, b) { return b.p - a.p; });
      result[sex] = list;
    });

    return result;
  }

  /* ---------- random wild birds ---------- */

  /**
   * Everything phenotype() actually reads from one locus. Two allele pairs
   * with the same signature always produce the same bird, so they can be
   * merged in predict() without touching the odds.
   */
  function locusSignature(key, pair) {
    switch (key) {
      case 'spread': return hasAllele(pair, 'S') ? 'S' : '-';
      case 'recred': return isHomozygous(pair, 'e') ? 'e' : '-';
      case 'eye':    return isHomozygous(pair, 'tr') ? 'tr' : '-';
      case 'white':  return isHomozygous(pair, 'zwh') ? 'w' : '-';
      case 'ts1':    return hasAllele(pair, 'Ts1') ? '1' : '-';
      case 'ts2':    return String(countAllele(pair, 'Ts2'));   // 0 / 1 / 2 all differ
      case 'ts3':    return isHomozygous(pair, 'ts3') ? '3' : '-';
      default:       return expressed(key, pair);               // base, dilute, pattern
    }
  }

  function weightedPick(table) {
    var total = 0, k;
    for (k in table) total += table[k];
    var r = Math.random() * total;
    for (k in table) { r -= table[k]; if (r <= 0) return k; }
    return k;
  }

  // Allele frequency pools. Each location feels different.
  var POOLS = {
    city: {
      base: { 'B+': 52, 'BA': 36, 'b': 12 },
      dilute: { 'D+': 76, 'dP': 8, 'd': 16 },
      spread: { 's+': 76, 'S': 24 },
      pattern: { 'CT': 26, 'C': 40, 'c+': 30, 'cb': 4 },
      ts1: { 'Ts1': 14, 'ts1+': 86 },
      ts2: { 'Ts2': 12, 'ts2+': 88 },
      ts3: { 'ts3': 26, 'Ts3+': 74 },
      recred: { 'e+': 82, 'e': 18 },
      eye: { 'Tr+': 88, 'tr': 12 },
      white: { 'z+': 92, 'zwh': 8 }
    },
    coast: {
      base: { 'B+': 60, 'BA': 26, 'b': 14 },
      dilute: { 'D+': 58, 'dP': 12, 'd': 30 },
      spread: { 's+': 84, 'S': 16 },
      pattern: { 'CT': 8, 'C': 26, 'c+': 54, 'cb': 12 },
      ts1: { 'Ts1': 6, 'ts1+': 94 },
      ts2: { 'Ts2': 5, 'ts2+': 95 },
      ts3: { 'ts3': 18, 'Ts3+': 82 },
      recred: { 'e+': 88, 'e': 12 },
      eye: { 'Tr+': 74, 'tr': 26 },
      white: { 'z+': 82, 'zwh': 18 }
    },
    // Total Reshuffle rolls from a deliberately flat pool — you are paying 1000
    // coins for a gamble, so rare alleles come up far more often than in the wild.
    reshuffle: {
      base: { 'B+': 38, 'BA': 34, 'b': 28 },
      dilute: { 'D+': 46, 'dP': 20, 'd': 34 },
      spread: { 's+': 62, 'S': 38 },
      pattern: { 'CT': 24, 'C': 26, 'c+': 30, 'cb': 20 },
      ts1: { 'Ts1': 40, 'ts1+': 60 },
      ts2: { 'Ts2': 36, 'ts2+': 64 },
      ts3: { 'ts3': 48, 'Ts3+': 52 },
      recred: { 'e+': 70, 'e': 30 },
      eye: { 'Tr+': 66, 'tr': 34 },
      white: { 'z+': 72, 'zwh': 28 }
    },
    starter: {
      base: { 'B+': 55, 'BA': 32, 'b': 13 },
      dilute: { 'D+': 70, 'dP': 8, 'd': 22 },
      spread: { 's+': 80, 'S': 20 },
      pattern: { 'CT': 16, 'C': 34, 'c+': 44, 'cb': 6 },
      ts1: { 'Ts1': 9, 'ts1+': 91 },
      ts2: { 'Ts2': 8, 'ts2+': 92 },
      ts3: { 'ts3': 20, 'Ts3+': 80 },
      recred: { 'e+': 86, 'e': 14 },
      eye: { 'Tr+': 86, 'tr': 14 },
      white: { 'z+': 90, 'zwh': 10 }
    }
  };

  function randomGenes(sex, poolName) {
    var pool = POOLS[poolName] || POOLS.starter;
    var genes = {};
    SEX_LINKED.forEach(function (key) {
      var a = weightedPick(pool[key]);
      genes[key] = sex === 'hen' ? [a, 'W'] : sortPair(key, [a, weightedPick(pool[key])]);
    });
    ['spread', 'pattern', 'ts1', 'ts2', 'ts3', 'recred', 'eye', 'white'].forEach(function (key) {
      genes[key] = sortPair(key, [weightedPick(pool[key]), weightedPick(pool[key])]);
    });
    return genes;
  }

  return {
    LOCI: LOCI,
    LOCUS_KEYS: LOCUS_KEYS,
    SEX_LINKED: SEX_LINKED,
    expressed: expressed,
    sortPair: sortPair,
    hasAllele: hasAllele,
    isHomozygous: isHomozygous,
    pairString: pairString,
    phenotype: phenotype,
    spriteKey: spriteKey,
    spriteCandidates: spriteCandidates,
    describe: describe,
    makeChildGenes: makeChildGenes,
    predict: predict,
    randomGenes: randomGenes
  };
})();
