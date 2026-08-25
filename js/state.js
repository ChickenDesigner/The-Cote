/* ============================================================
   THE COTE — game state, timers, economy
   All timers are timestamp-based, so they keep running while
   the game is closed.
   ============================================================ */

var Game = (function () {
  'use strict';

  var SAVE_KEY = 'thecote.save.v1';
  var LEGACY_SAVE_KEY = 'pigeonloft.save.v1';   // the game was called Pigeon Loft
  var MIN = 60 * 1000;

  var CFG = {
    energyMax: 100,
    energyTickMs: 15 * MIN,   // +10% every 15 minutes
    energyPerTick: 10,
    costWalk: 3,
    costCoinExtra: 2,         // total 5 on a coin find
    costCatchExtra: 9,        // total 12 on a catch attempt
    catchChance: 0.5,

    hungerFullMs: 10 * 60 * MIN, // 100 -> 0 over 10 hours
    hungerToBreed: 30,

    gestationMs: 30 * MIN,
    growMs: 60 * MIN,
    henCooldownMs: 120 * MIN,

    startingLoft: 5,
    maxLoft: 30,
    startingGold: 120,
    sellPrice: 60,

    expansionBase: 100,       // first Loft Expansion costs this
    expansionStep: 150,       // and 150 more each time after
    expansionSlots: 5,        // perches added per purchase
    clutchMax: 2              // a clutch can be 1 or 2, so 2 perches must be free
  };

  /* ---------- crops ---------- */

  var PLOT_COUNT = 6;

  var CROPS = {
    corn: {
      id: 'corn', name: 'Corn', seedName: 'Corn Seeds',
      price: 10, growMs: 30 * 1000, sell: 20, icon: '🌽'
    },
    millet: {
      id: 'millet', name: 'Millet', seedName: 'Millet Seeds',
      price: 15, growMs: 60 * 1000, sell: 30, icon: '🌾'
    },
    sunflower: {
      id: 'sunflower', name: 'Sunflower', seedName: 'Sunflower Seeds',
      price: 20, growMs: 120 * 1000, sell: 40, icon: '🌻'
    }
  };

  var CROP_ORDER = ['corn', 'millet', 'sunflower'];

  // Base odds of a crop coming up "Super" — worth double at harvest.
  var SUPER_CHANCE = 0.05;
  var SUPER_MULTIPLIER = 2;
  var FERTILIZER_GROWINGS = 10;

  var FERTILIZERS = {
    fert_compost: { id: 'fert_compost', name: 'Compost', price: 50, chance: 0.10, icon: '🪱' },
    fert_guano:   { id: 'fert_guano',   name: 'Pigeon Guano', price: 100, chance: 0.15, icon: '🌿' },
    fert_nitrate: { id: 'fert_nitrate', name: 'Nitrate Blend', price: 150, chance: 0.20, icon: '⚗️' }
  };
  var FERTILIZER_ORDER = ['fert_compost', 'fert_guano', 'fert_nitrate'];

  var SHOP = [
    /* store: 'farm' items live in the Farm & Supply Store, not the main shop */
    { id: 'seed_corn', name: 'Corn Seeds', price: 10, target: 'plot', crop: 'corn', store: 'farm',
      desc: 'Ready in 30 seconds, sells for 20 coins.', icon: '🌽' },
    { id: 'seed_millet', name: 'Millet Seeds', price: 15, target: 'plot', crop: 'millet', store: 'farm',
      desc: 'Ready in 1 minute, sells for 30 coins.', icon: '🌾' },
    { id: 'seed_sunflower', name: 'Sunflower Seeds', price: 20, target: 'plot', crop: 'sunflower', store: 'farm',
      desc: 'Ready in 2 minutes, sells for 40 coins.', icon: '🌻' },
    { id: 'fert_compost', name: 'Compost', price: 50, target: 'self', store: 'farm',
      desc: 'Worked into every plot. Super chance 10%, and each plot keeps its own 10 fertilized growings.', icon: '🪱' },
    { id: 'fert_guano', name: 'Pigeon Guano', price: 100, target: 'self', store: 'farm',
      desc: 'Worked into every plot. Super chance 15%, and each plot keeps its own 10 fertilized growings.', icon: '🌿' },
    { id: 'fert_nitrate', name: 'Nitrate Blend', price: 150, target: 'self', store: 'farm',
      desc: 'Worked into every plot. Super chance 20%, and each plot keeps its own 10 fertilized growings.', icon: '⚗️' },
    { id: 'energy', name: 'Energy Refill', price: 250, target: 'self',
      desc: 'Snaps your explore energy back to full.', icon: '⚡' },
    { id: 'feed', name: 'Pigeon Feed', price: 60, target: 'pigeon', uses: 4,
      desc: 'A bag with 4 uses. Restores one pigeon’s hunger to 100%. A full pigeon will refuse it.', icon: '🌾' },
    { id: 'growth', name: 'Growth Serum', price: 300, target: 'pigeon',
      desc: 'A squab grows into a breeding adult instantly.', icon: '🧪' },
    { id: 'cooldown', name: 'Cooldown Remover', price: 200, target: 'pigeon',
      desc: 'Clears a hen’s breeding cooldown. Cocks never have one.', icon: '⏱' },
    { id: 'sexchange', name: 'Sex Changer', price: 50, target: 'pigeon',
      desc: 'Flips a pigeon between cock and hen. Their colour is kept, but the sex-linked genes are rebuilt to fit: a cock loses whatever he was carrying hidden, and a hen comes out pure for what she shows.', icon: '♂♀' },
    { id: 'reshuffle', name: 'Total Reshuffle', price: 1000, target: 'pigeon',
      desc: 'Rolls a completely new genotype for one pigeon at every locus. Keeps their name and sex; everything else is a gamble. Rare alleles turn up far more often here than in the wild.', icon: '🎲' },
    { id: 'nestbox', name: 'Loft Expansion', price: 100, target: 'self',
      desc: 'Adds 5 more perches to the loft. The first one is cheap; each after costs 150 more than the last.', icon: '🏠' }
  ];

  /** Look a shop entry up by id. Never index into SHOP — the order changes. */
  function shopItem(id) {
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) return SHOP[i];
    return null;
  }

  var S = null;
  var listeners = [];

  function emit() { listeners.forEach(function (f) { f(); }); }
  function onChange(f) { listeners.push(f); }

  /* ---------- ids ---------- */

  function uid() {
    S.nextId = (S.nextId || 1) + 1;
    return 'p' + S.nextId;
  }

  /* ---------- pigeon construction ---------- */

  function makePigeon(opts) {
    opts = opts || {};
    var sex = opts.sex || (Math.random() < 0.5 ? 'cock' : 'hen');
    var nm = opts.name ? { name: opts.name, special: false } : Names.random(sex);
    var now = Date.now();
    return {
      id: opts.id || uid(),
      name: nm.name,
      special: nm.special,
      sex: sex,
      stage: opts.stage || 'adult',
      genes: opts.genes || Genetics.randomGenes(sex, opts.pool || 'starter'),
      bornAt: now,
      growAt: opts.stage === 'squab' ? now + CFG.growMs : now,
      hunger: 100,
      hungerAt: now,
      cooldownUntil: 0,
      sireId: opts.sireId || null,
      damId: opts.damId || null,
      origin: opts.origin || 'wild',
      generation: opts.generation || 1
    };
  }

  function register(p) {
    S.birds[p.id] = p;
    return p;
  }

  function get(id) { return S.birds[id] || null; }

  function loftBirds() {
    return S.loft.map(get).filter(Boolean);
  }

  /* ---------- new game ---------- */

  function newGame() {
    S = {
      nextId: 1,
      gold: CFG.startingGold,
      energy: CFG.energyMax,
      energyAt: Date.now(),
      loftCapacity: CFG.startingLoft,
      nestboxesBought: 0,
      loft: [],
      birds: {},
      inventory: { feed: [], growth: 0, cooldown: 0, energy: 0, reshuffle: 0, sexchange: 0 },
      plots: emptyPlots(),
      plotFert: emptyPlotFert(),
      storeOpen: true,
      nest: null,
      pending: [],          // squabs hatched with no free perch
      log: [],
      stats: { caught: 0, bred: 0, walks: 0 },
      createdAt: Date.now()
    };

    var cock = register(makePigeon({ sex: 'cock', pool: 'starter', origin: 'starter' }));
    var hen = register(makePigeon({ sex: 'hen', pool: 'starter', origin: 'starter' }));
    S.loft = [cock.id, hen.id];
    save();
    return S;
  }

  /* ---------- persistence ---------- */

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) {}
    if (!raw) {
      // A loft saved before the rename still belongs to the player — adopt it.
      try {
        raw = localStorage.getItem(LEGACY_SAVE_KEY);
        if (raw) {
          localStorage.setItem(SAVE_KEY, raw);
          localStorage.removeItem(LEGACY_SAVE_KEY);
        }
      } catch (e) {}
    }
    if (!raw) return newGame();
    try {
      S = JSON.parse(raw);
      if (!S || !S.birds) return newGame();
    } catch (e) { return newGame(); }
    if (!S.inventory) S.inventory = { feed: [], growth: 0, cooldown: 0, energy: 0, reshuffle: 0, sexchange: 0 };
    if (S.inventory.reshuffle === undefined) S.inventory.reshuffle = 0;
    if (S.inventory.sexchange === undefined) S.inventory.sexchange = 0;
    // saves made before the Tr locus existed get wild-type orange eyes
    for (var bid in S.birds) {
      var bp = S.birds[bid];
      if (bp.genes && !bp.genes.eye) bp.genes.eye = ['Tr+', 'Tr+'];
      // saves from before the Toy Stencil complex get the plain wild type
      if (bp.genes && !bp.genes.ts1) bp.genes.ts1 = ['ts1+', 'ts1+'];
      if (bp.genes && !bp.genes.ts2) bp.genes.ts2 = ['ts2+', 'ts2+'];
      if (bp.genes && !bp.genes.ts3) bp.genes.ts3 = ['Ts3+', 'Ts3+'];
    }
    // Feed bags bought while the shop lookup was broken stored no use count at
    // all. They were paid for, so give them back at full strength.
    if (S.inventory && S.inventory.feed && S.inventory.feed.length) {
      var fullBag = shopItem('feed').uses;
      S.inventory.feed = S.inventory.feed.map(function (u) {
        return (typeof u === 'number' && u > 0) ? u : fullBag;
      });
    }
    if (!S.plotFert || S.plotFert.length !== PLOT_COUNT) S.plotFert = emptyPlotFert();
    if (S.storeOpen === undefined) S.storeOpen = true;
    delete S.fertilizer;   // superseded by the per-plot runs
    if (!S.plots || !S.plots.length) S.plots = emptyPlots();
    if (!S.pending) S.pending = [];
    if (!S.log) S.log = [];
    return S;
  }

  function reset() {
    try {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
    } catch (e) {}
    return newGame();
  }

  /* ---------- timers (also run offline) ---------- */

  function energy() {
    return S.energy;
  }

  function refreshEnergy() {
    var now = Date.now();
    if (S.energy >= CFG.energyMax) { S.energyAt = now; return; }
    var elapsed = now - S.energyAt;
    if (elapsed < CFG.energyTickMs) return;
    var ticks = Math.floor(elapsed / CFG.energyTickMs);
    S.energy = Math.min(CFG.energyMax, S.energy + ticks * CFG.energyPerTick);
    S.energyAt += ticks * CFG.energyTickMs;
    if (S.energy >= CFG.energyMax) S.energyAt = now;
  }

  function energyReadyIn() {
    if (S.energy >= CFG.energyMax) return 0;
    return Math.max(0, (S.energyAt + CFG.energyTickMs) - Date.now());
  }

  function currentHunger(p) {
    var elapsed = Date.now() - (p.hungerAt || p.bornAt);
    var lost = (elapsed / CFG.hungerFullMs) * 100;
    return Math.max(0, Math.min(100, (p.hunger === undefined ? 100 : p.hunger) - lost));
  }

  function commitHunger(p) {
    p.hunger = currentHunger(p);
    p.hungerAt = Date.now();
  }

  function refreshGrowth() {
    var changed = false;
    for (var id in S.birds) {
      var p = S.birds[id];
      if (p.stage === 'squab' && Date.now() >= p.growAt) {
        p.stage = 'adult';
        logMsg(ref(p) + ' has grown up and is ready to breed.');
        changed = true;
      }
    }
    return changed;
  }

  function refreshNest() {
    if (!S.nest) return false;
    if (Date.now() < S.nest.hatchAt) return false;
    hatchNow(true);
    return true;
  }

  function refreshAll() {
    refreshEnergy();
    refreshGrowth();
    refreshNest();
    placePending();
  }

  /** Called once a second. Returns true if anything visible changed. */
  function tickTimers() {
    refreshEnergy();
    var a = refreshGrowth();
    var b = refreshNest();
    var c = placePending();
    if (a || b || c) { save(); return true; }
    return false;
  }

  /* ---------- log ---------- */

  /* Diary entries store a {bird-id} token rather than a name, so renaming a
     pigeon updates every line that mentions it. Older entries hold literal
     names and simply render as written. */
  function ref(p) { return '{' + (p && p.id ? p.id : '?') + '}'; }

  function formatLog(text) {
    return String(text).replace(/\{(p\d+)\}/g, function (whole, id) {
      var b = S.birds[id];
      return b ? b.name : 'a bird no longer on file';
    });
  }

  function logMsg(text) {
    S.log.unshift({ t: Date.now(), text: text });
    if (S.log.length > 60) S.log.length = 60;
  }

  /* ---------- loft ---------- */

  function freeSlots() { return S.loftCapacity - S.loft.length; }

  function addToLoft(p) {
    if (freeSlots() <= 0) { S.pending.push(p.id); return false; }
    S.loft.push(p.id);
    return true;
  }

  function placePending() {
    var moved = false;
    while (S.pending.length && freeSlots() > 0) {
      var id = S.pending.shift();
      if (S.birds[id]) { S.loft.push(id); moved = true; logMsg(ref(S.birds[id]) + ' moved into a free perch.'); }
    }
    return moved;
  }

  function rehome(id) {
    var p = get(id);
    if (!p) return { ok: false, msg: 'No such pigeon.' };
    var i = S.loft.indexOf(id);
    if (i < 0) return { ok: false, msg: p.name + ' is not on a perch.' };
    S.loft.splice(i, 1);
    p.rehomed = true;
    logMsg(ref(p) + ' was rehomed. Their pedigree entry stays on file.');
    placePending();
    save(); emit();
    return { ok: true, msg: p.name + ' was rehomed. No coins changed hands.' };
  }

  var NAME_MAX = 20;

  function rename(id, raw) {
    var p = get(id);
    if (!p) return { ok: false, msg: 'No such pigeon.' };
    // collapse whitespace and drop anything that would not print
    var name = String(raw == null ? '' : raw)
      .replace(/[\x00-\x1f\x7f]/g, '')   // strip control characters
      .replace(/\s+/g, ' ')
      .trim();
    if (!name) return { ok: false, msg: 'A pigeon needs a name.' };
    if (name.length > NAME_MAX) {
      return { ok: false, msg: 'Keep it to ' + NAME_MAX + ' characters or fewer.' };
    }
    var old = p.name;
    if (name === old) return { ok: false, msg: 'That is already their name.' };
    p.name = name;
    // the ★ badge should only stick if the new name really is a rare one
    p.special = Names.SPECIAL.indexOf(name) >= 0;
    logMsg(ref(p) + ' used to be called ' + old + '.');
    save(); emit();
    return { ok: true, old: old, msg: old + ' is now ' + name + '.' };
  }

  function sell(id) {
    var p = get(id);
    if (!p) return { ok: false, msg: 'No such pigeon.' };
    var i = S.loft.indexOf(id);
    if (i < 0) return { ok: false, msg: p.name + ' is not on a perch.' };
    S.loft.splice(i, 1);
    p.sold = true;
    S.gold += CFG.sellPrice;
    logMsg(ref(p) + ' was sold for ' + CFG.sellPrice + ' coins.');
    placePending();
    save(); emit();
    return { ok: true, msg: p.name + ' sold for ' + CFG.sellPrice + ' coins.' };
  }

  /* ---------- gold & shop ---------- */

  function nestboxPrice() {
    return CFG.expansionBase + CFG.expansionStep * (S.nestboxesBought || 0);
  }

  function itemPrice(id) {
    if (id === 'nestbox') return nestboxPrice();
    for (var i = 0; i < SHOP.length; i++) if (SHOP[i].id === id) return SHOP[i].price;
    return 0;
  }

  function buy(id) {
    var price = itemPrice(id);
    if (S.gold < price) return { ok: false, msg: 'Not enough coins.' };
    if (id === 'nestbox' && S.loftCapacity >= CFG.maxLoft) return { ok: false, msg: 'The loft is already at its maximum size.' };
    S.gold -= price;
    if (id === 'feed') S.inventory.feed.push(shopItem('feed').uses);
    else if (id === 'nestbox') {
      S.loftCapacity = Math.min(CFG.maxLoft, S.loftCapacity + CFG.expansionSlots);
      S.nestboxesBought = (S.nestboxesBought || 0) + 1;
      placePending();
    } else S.inventory[id] = (S.inventory[id] || 0) + 1;
    save(); emit();
    return { ok: true, msg: 'Bought ' + id + '.' };
  }

  /* ---------- items ---------- */

  function useSelfItem(id) {
    if (FERTILIZERS[id]) {
      if (!S.inventory[id]) return { ok: false, msg: 'You have none.' };
      var f = FERTILIZERS[id];
      S.inventory[id]--;
      applyFertilizer(id);
      logMsg(f.name + ' worked into all ' + S.plots.length + ' plots — Super chance ' +
             Math.round(f.chance * 100) + '%, ' + FERTILIZER_GROWINGS + ' growings each.');
      save(); emit();
      return {
        ok: true,
        msg: f.name + ' worked into all ' + S.plots.length + ' plots. Super chance ' +
             Math.round(f.chance * 100) + '%, and each plot has its own ' +
             FERTILIZER_GROWINGS + ' growings to spend.'
      };
    }

    if (id === 'energy') {
      if (!S.inventory.energy) return { ok: false, msg: 'You have none.' };
      if (S.energy >= CFG.energyMax) return { ok: false, msg: 'Your energy is already full.' };
      S.inventory.energy--;
      S.energy = CFG.energyMax;
      S.energyAt = Date.now();
      save(); emit();
      return { ok: true, msg: 'Energy restored to full.' };
    }
    return { ok: false, msg: 'That item is used on a pigeon.' };
  }

  function applyItem(id, pigeonId) {
    var p = get(pigeonId);
    if (!p) return { ok: false, msg: 'No such pigeon.' };

    if (id === 'feed') {
      var idx = -1, best = 99;
      for (var i = 0; i < S.inventory.feed.length; i++) {
        if (S.inventory.feed[i] > 0 && S.inventory.feed[i] < best) { best = S.inventory.feed[i]; idx = i; }
      }
      if (idx === -1) return { ok: false, msg: 'You have no feed left.' };
      if (currentHunger(p) >= 99.5) return { ok: false, msg: p.name + ' is already full and turns their head away.' };
      p.hunger = 100; p.hungerAt = Date.now();
      S.inventory.feed[idx]--;
      if (S.inventory.feed[idx] <= 0) S.inventory.feed.splice(idx, 1);
      save(); emit();
      return { ok: true, msg: p.name + ' tucks in. Hunger restored to 100%.' };
    }

    if (id === 'growth') {
      if (!S.inventory.growth) return { ok: false, msg: 'You have none.' };
      if (p.stage !== 'squab') return { ok: false, msg: p.name + ' is already an adult.' };
      S.inventory.growth--;
      p.stage = 'adult'; p.growAt = Date.now();
      save(); emit();
      return { ok: true, msg: p.name + ' shoots up into a full-grown adult.' };
    }

    if (id === 'sexchange') {
      if (!S.inventory.sexchange) return { ok: false, msg: 'You have none.' };
      if (S.nest && (S.nest.sireId === pigeonId || S.nest.damId === pigeonId)) {
        return { ok: false, msg: p.name + ' is sitting on a clutch. Hatch it first.' };
      }
      S.inventory.sexchange--;
      var was = p.sex;
      if (p.sex === 'cock') {
        // ZZ -> ZW. The W takes the place of one Z, so only the allele he was
        // showing survives; anything he carried hidden is gone.
        Genetics.SEX_LINKED.forEach(function (k) {
          p.genes[k] = [Genetics.expressed(k, p.genes[k]), 'W'];
        });
        p.sex = 'hen';
      } else {
        // ZW -> ZZ. Her single Z is copied into the slot the W held, so she
        // comes out homozygous and breeds true at both sex-linked loci.
        Genetics.SEX_LINKED.forEach(function (k) {
          var a = p.genes[k][0];
          p.genes[k] = [a, a];
        });
        p.sex = 'cock';
      }
      p.cooldownUntil = 0;
      logMsg(ref(p) + ' changed from ' + was + ' to ' + p.sex + '.');
      save(); emit();
      return { ok: true, msg: p.name + ' is now a ' + p.sex + '.' };
    }

    if (id === 'reshuffle') {
      if (!S.inventory.reshuffle) return { ok: false, msg: 'You have none.' };
      S.inventory.reshuffle--;
      var before = Genetics.phenotype(p.genes).name;
      p.genes = Genetics.randomGenes(p.sex, 'reshuffle');
      p.reshuffled = (p.reshuffled || 0) + 1;
      var after = Genetics.phenotype(p.genes).name;
      logMsg(ref(p) + ' was reshuffled: ' + before + ' → ' + after + '.');
      save(); emit();
      return { ok: true, msg: p.name + ' comes out of the shuffle as ' + after + '.' };
    }

    if (id === 'cooldown') {
      if (!S.inventory.cooldown) return { ok: false, msg: 'You have none.' };
      if (p.sex !== 'hen') return { ok: false, msg: 'Cocks have no breeding cooldown.' };
      if (!p.cooldownUntil || p.cooldownUntil <= Date.now()) return { ok: false, msg: p.name + ' is not on cooldown.' };
      S.inventory.cooldown--;
      p.cooldownUntil = 0;
      save(); emit();
      return { ok: true, msg: p.name + ' is ready to nest again.' };
    }

    return { ok: false, msg: 'That item cannot be used on a pigeon.' };
  }

  function itemCount(id) {
    if (id === 'feed') {
      var uses = 0;
      S.inventory.feed.forEach(function (u) { uses += u; });
      return { bags: S.inventory.feed.length, uses: uses };
    }
    return S.inventory[id] || 0;
  }

  /* ---------- exploring ---------- */

  function spend(n) {
    refreshEnergy();
    if (S.energy < n) return false;
    if (S.energy >= CFG.energyMax) S.energyAt = Date.now();
    S.energy -= n;
    return true;
  }

  var FLAVOUR = {
    city: [
      'You find nothing but a crumpled bus ticket.',
      'A shutter rattles somewhere above you. Nothing.',
      'Nothing here except the smell of warm concrete.',
      'A crow eyes you from a lamppost. You find nothing.',
      'You find nothing. Someone’s radio drifts down from a window.'
    ],
    coast: [
      'You find nothing but wet shingle.',
      'The tide has left nothing but weed and foam.',
      'Nothing. A gull screams at you on principle.',
      'You find nothing. Salt wind stings your eyes.',
      'Nothing here but a rope end and a broken crab shell.'
    ]
  };

  var COIN_FLAVOUR = {
    city: ['A coin glints in a drain grate.', 'You find loose change in a phone box.', 'Someone dropped a few coins by the bakery door.'],
    coast: ['A coin winks up at you from the shingle.', 'You dig a few coins out of the damp sand.', 'A coin sits inside an upturned bucket.']
  };

  function walk(loc) {
    refreshAll();
    if (S.energy < CFG.costWalk) return { kind: 'tired', text: 'You are too tired to go any further.' };

    var roll = Math.random() * 100;

    if (roll < 52) {
      spend(CFG.costWalk);
      S.stats.walks++;
      save(); emit();
      var list = FLAVOUR[loc] || FLAVOUR.city;
      return { kind: 'nothing', text: list[Math.floor(Math.random() * list.length)] };
    }

    if (roll < 80) {
      if (!spend(CFG.costWalk + CFG.costCoinExtra)) return { kind: 'tired', text: 'You are too tired to go any further.' };
      var coins = 3 + Math.floor(Math.random() * 13); // 3-15
      S.gold += coins;
      S.stats.walks++;
      save(); emit();
      var cf = COIN_FLAVOUR[loc] || COIN_FLAVOUR.city;
      return { kind: 'coins', coins: coins, text: cf[Math.floor(Math.random() * cf.length)] + ' (+' + coins + ' coins)' };
    }

    // pigeon encounter — energy for the walk itself is spent now,
    // the catch attempt costs extra and is charged on "Yes".
    spend(CFG.costWalk);
    S.stats.walks++;
    save(); emit();
    return {
      kind: 'pigeon',
      text: 'A pigeon stumbles onto your path and stares at you… Try to catch it?',
      loc: loc
    };
  }

  function attemptCatch(loc) {
    refreshEnergy();
    if (S.energy < CFG.costCatchExtra) {
      return { ok: false, tired: true, text: 'You lunge, but you have nothing left in the tank. It flaps away.' };
    }
    S.energy -= CFG.costCatchExtra;

    if (Math.random() < CFG.catchChance) {
      var p = register(makePigeon({ pool: loc, origin: 'caught' }));
      var placed = addToLoft(p);
      S.stats.caught++;
      logMsg('Caught ' + ref(p) + ' at the ' + loc + '.');
      save(); emit();
      return {
        ok: true, pigeon: p, placed: placed,
        text: 'Got it! ' + p.name + (p.special ? ' (a rare one!)' : '') + ' is yours.' +
              (placed ? '' : ' The loft is full — they are waiting outside until you free a perch.')
      };
    }
    save(); emit();
    return { ok: false, text: 'It slips through your hands and clatters away over the rooftops.' };
  }

  /* ---------- breeding ---------- */

  function canBreed(p) {
    if (!p) return 'No bird selected.';
    if (p.stage !== 'adult') return p.name + ' is still a squab.';
    if (currentHunger(p) < CFG.hungerToBreed) return p.name + ' is too hungry (needs ' + CFG.hungerToBreed + '% hunger).';
    if (p.sex === 'hen' && p.cooldownUntil > Date.now()) return p.name + ' is still on cooldown.';
    return null;
  }

  function relation(aId, bId) {
    // simple close-relative check for a warning (not a block)
    var a = get(aId), b = get(bId);
    if (!a || !b) return null;
    if (a.sireId && a.sireId === b.id) return 'parent/child';
    if (a.damId && a.damId === b.id) return 'parent/child';
    if (b.sireId === a.id || b.damId === a.id) return 'parent/child';
    if (a.sireId && a.sireId === b.sireId) return 'siblings';
    if (a.damId && a.damId === b.damId) return 'siblings';
    return null;
  }

  /**
   * A clutch can be one or two squabs and the count is not decided until it
   * hatches, so the loft must have room for the largest one before laying.
   * Returns null when there is room, or the reason there is not.
   */
  function breedingSpaceError() {
    var free = freeSlots();
    if (free >= CFG.clutchMax) return null;
    return 'Not enough space in the loft. A clutch can be up to ' + CFG.clutchMax +
           ' squabs, so you need ' + CFG.clutchMax + ' free perches — you have ' +
           free + '. Sell, rehome, or buy a Loft Expansion.';
  }

  function breed(sireId, damId) {
    var sire = get(sireId), dam = get(damId);
    var err = canBreed(sire) || canBreed(dam);
    if (err) return { ok: false, msg: err };
    if (sire.sex !== 'cock' || dam.sex !== 'hen') return { ok: false, msg: 'You need one cock and one hen.' };
    if (S.nest) return { ok: false, msg: 'There is already a clutch in the nest.' };
    var space = breedingSpaceError();
    if (space) return { ok: false, msg: space };

    var count = Math.random() < 0.65 ? 2 : 1;
    S.nest = {
      sireId: sireId, damId: damId,
      startedAt: Date.now(),
      hatchAt: Date.now() + CFG.gestationMs,
      count: count
    };
    dam.cooldownUntil = Date.now() + CFG.henCooldownMs;
    commitHunger(sire); commitHunger(dam);
    sire.hunger = Math.max(0, sire.hunger - 15);
    dam.hunger = Math.max(0, dam.hunger - 25);
    S.stats.bred++;
    logMsg(ref(sire) + ' and ' + ref(dam) + ' settle onto a clutch of ' + count + '.');
    save(); emit();
    return { ok: true, msg: 'Eggs laid. ' + count + ' squab' + (count > 1 ? 's' : '') + ' due in 30 minutes.' };
  }

  function hatchNow(silent) {
    if (!S.nest) return { ok: false, msg: 'No clutch in the nest.' };
    var sire = get(S.nest.sireId), dam = get(S.nest.damId);
    if (!sire || !dam) { S.nest = null; save(); emit(); return { ok: false, msg: 'The clutch was lost.' }; }

    var born = [];
    var gen = Math.max(sire.generation || 1, dam.generation || 1) + 1;
    for (var i = 0; i < S.nest.count; i++) {
      var child = Genetics.makeChildGenes(sire, dam);
      var p = register(makePigeon({
        sex: child.sex, genes: child.genes, stage: 'squab',
        sireId: sire.id, damId: dam.id, origin: 'bred', generation: gen
      }));
      addToLoft(p);
      born.push(p);
    }
    S.nest = null;
    logMsg('Hatched: ' + born.map(function (b) { return ref(b); }).join(' and ') + '.');
    save(); emit();
    return { ok: true, born: born, msg: born.length + ' squab' + (born.length > 1 ? 's' : '') + ' hatched!' };
  }

  /* ---------- farming ---------- */

  function emptyPlots() {
    var a = [];
    for (var i = 0; i < PLOT_COUNT; i++) a.push(null);
    return a;
  }

  /** Half the growing time as a seedling, half as a sprout, then adult. */
  function plotStage(plot) {
    if (!plot) return null;
    var c = CROPS[plot.crop];
    if (!c) return null;
    var elapsed = Date.now() - plot.plantedAt;
    if (elapsed >= c.growMs) return 'adult';
    if (elapsed >= c.growMs / 2) return 'sprout';
    return 'seedling';
  }

  function plotReadyIn(plot) {
    if (!plot) return 0;
    return Math.max(0, plot.plantedAt + CROPS[plot.crop].growMs - Date.now());
  }

  /* Fertilizer is worked into every plot, and each plot then carries its own
     run of fertilized growings. A spot you never sow keeps all of its. */

  function emptyPlotFert() {
    var a = [];
    for (var i = 0; i < PLOT_COUNT; i++) a.push(null);
    return a;
  }

  /** The fertilizer in one plot's soil, or null once that plot's run is spent. */
  function plotFertilizer(index) {
    var f = S.plotFert && S.plotFert[index];
    if (!f || !f.tier || f.charges <= 0) return null;
    return FERTILIZERS[f.tier] || null;
  }

  function plotFertCharges(index) {
    var f = S.plotFert && S.plotFert[index];
    return f && f.charges > 0 ? f.charges : 0;
  }

  function superChanceForPlot(index) {
    var f = plotFertilizer(index);
    return f ? f.chance : SUPER_CHANCE;
  }

  /** How many plots still have fertilized growings left. */
  function fertilizedPlotCount() {
    var n = 0;
    for (var i = 0; i < S.plots.length; i++) if (plotFertilizer(i)) n++;
    return n;
  }

  function applyFertilizer(id) {
    var f = FERTILIZERS[id];
    if (!f) return null;
    if (!S.plotFert || S.plotFert.length !== S.plots.length) S.plotFert = emptyPlotFert();
    for (var i = 0; i < S.plots.length; i++) {
      S.plotFert[i] = { tier: id, charges: FERTILIZER_GROWINGS };
    }
    return f;
  }

  function plant(index, cropId) {
    var c = CROPS[cropId];
    if (!c) return { ok: false, msg: 'Unknown seed.' };
    if (index < 0 || index >= S.plots.length) return { ok: false, msg: 'No such growing spot.' };
    if (S.plots[index]) return { ok: false, msg: 'Something is already growing there.' };
    var seedId = 'seed_' + cropId;
    if (!S.inventory[seedId]) return { ok: false, msg: 'You have no ' + c.seedName.toLowerCase() + '.' };
    S.inventory[seedId]--;

    // The roll happens now, but stays hidden until the plant is Adult.
    var isSuper = Math.random() < superChanceForPlot(index);

    // One growing spent off THIS plot's run, whether or not it paid off.
    // Plots you leave alone keep every growing they were given.
    var fz = plotFertilizer(index);
    if (fz) {
      S.plotFert[index].charges--;
      if (S.plotFert[index].charges <= 0) {
        S.plotFert[index] = null;
        logMsg('The ' + fz.name.toLowerCase() + ' in plot ' + (index + 1) + ' is spent.');
      }
    }

    S.plots[index] = { crop: cropId, plantedAt: Date.now(), sup: isSuper };
    save(); emit();
    return { ok: true, msg: c.name + ' planted. Ready in ' + fmtTime(c.growMs) + '.' };
  }

  function harvest(index) {
    var plot = S.plots[index];
    if (!plot) return { ok: false, msg: 'Nothing growing there.' };
    var c = CROPS[plot.crop];
    if (plotStage(plot) !== 'adult') {
      return { ok: false, msg: 'The ' + c.name.toLowerCase() + ' is not ready — ' +
                              fmtTime(plotReadyIn(plot)) + ' to go.' };
    }
    var sup = !!plot.sup;
    var coins = c.sell * (sup ? SUPER_MULTIPLIER : 1);
    S.plots[index] = null;
    S.gold += coins;
    logMsg('Harvested ' + (sup ? 'a Super ' : '') + c.name.toLowerCase() +
           ' and sold the grain for ' + coins + ' coins.');
    save(); emit();
    return {
      ok: true, coins: coins, sup: sup,
      msg: sup
        ? 'A Super ' + c.name.toLowerCase() + '! Double money — ' + coins + ' coins.'
        : 'Cut and sold — ' + coins + ' coins for the ' + c.name.toLowerCase() + '.'
    };
  }

  function readyCount() {
    var n = 0;
    S.plots.forEach(function (p) { if (plotStage(p) === 'adult') n++; });
    return n;
  }

  /* ---------- pedigree ---------- */

  function ancestors(id, depth) {
    var p = get(id);
    if (!p || depth <= 0) return null;
    return {
      pigeon: p,
      sire: p.sireId ? ancestors(p.sireId, depth - 1) : null,
      dam: p.damId ? ancestors(p.damId, depth - 1) : null
    };
  }

  function pedigreeDepth(id) {
    var p = get(id);
    if (!p) return 0;
    var s = p.sireId ? pedigreeDepth(p.sireId) : 0;
    var d = p.damId ? pedigreeDepth(p.damId) : 0;
    return 1 + Math.max(s, d);
  }

  /* ---------- misc ---------- */

  function fmtTime(ms) {
    if (ms <= 0) return '0s';
    var s = Math.ceil(ms / 1000);
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60); s -= m * 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + s + 's';
    return s + 's';
  }

  return {
    CFG: CFG, SHOP: SHOP,
    state: function () { return S; },
    load: load, save: save, reset: reset, onChange: onChange, emit: emit,
    rename: rename, formatLog: formatLog,
    get: get, loftBirds: loftBirds, freeSlots: freeSlots, rehome: rehome, sell: sell, addToLoft: addToLoft,
    makePigeon: makePigeon, register: register,
    refreshAll: refreshAll, refreshEnergy: refreshEnergy, energyReadyIn: energyReadyIn,
    tickTimers: tickTimers,
    currentHunger: currentHunger,
    buy: buy, itemPrice: itemPrice, nestboxPrice: nestboxPrice,
    useSelfItem: useSelfItem, applyItem: applyItem, itemCount: itemCount,
    walk: walk, attemptCatch: attemptCatch,
    CROPS: CROPS, CROP_ORDER: CROP_ORDER, PLOT_COUNT: PLOT_COUNT,
    FERTILIZERS: FERTILIZERS, FERTILIZER_ORDER: FERTILIZER_ORDER,
    SUPER_CHANCE: SUPER_CHANCE, SUPER_MULTIPLIER: SUPER_MULTIPLIER, FERTILIZER_GROWINGS: FERTILIZER_GROWINGS,
    plotFertilizer: plotFertilizer, plotFertCharges: plotFertCharges,
    superChanceForPlot: superChanceForPlot, fertilizedPlotCount: fertilizedPlotCount,
    plotStage: plotStage, plotReadyIn: plotReadyIn, plant: plant, harvest: harvest, readyCount: readyCount,
    canBreed: canBreed, breed: breed, hatchNow: hatchNow, relation: relation,
    breedingSpaceError: breedingSpaceError,
    ancestors: ancestors, pedigreeDepth: pedigreeDepth,
    fmtTime: fmtTime, logMsg: logMsg
  };
})();
