/* ============================================================
   THE COTE — screens, modals, inventory overlay
   ============================================================ */

var UI = (function () {
  'use strict';

  var $screen, $top, $nav, $inv, $modal, $confirm, $held, $toast;

  var view = { name: 'loft', loc: null };
  var explore = { encounter: null, feed: [] };
  var breeding = { sireId: null, damId: null };
  var held = null;   // { id }

  /* ---------- tiny helpers ---------- */

  function h(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pct(x) { return (x * 100).toFixed(x * 100 < 1 ? 2 : 1).replace(/\.0$/, '') + '%'; }
  function sexIcon(s) { return s === 'cock' ? '♂' : '♀'; }
  function sexWord(s) { return s === 'cock' ? 'Cock' : 'Hen'; }

  function toast(msg, kind) {
    var t = h('div', 'toast' + (kind ? ' ' + kind : ''), msg);
    $toast.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 2600);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3200);
  }

  function countdown(until, prefix) {
    var e = h('span', 'countdown');
    e.dataset.until = until;
    e.dataset.prefix = prefix || '';
    e.textContent = (prefix || '') + Game.fmtTime(until - Date.now());
    return e;
  }

  /* ---------- top bar ---------- */

  function renderTop() {
    var S = Game.state();
    Game.refreshEnergy();
    $top.innerHTML = '';

    var brand = h('div', 'brand');
    brand.innerHTML = '<span class="brand-mark">🕊</span><span>The Cote</span>';
    $top.appendChild(brand);

    var meters = h('div', 'meters');

    var en = h('div', 'meter energy');
    var lbl = h('div', 'meter-label');
    lbl.innerHTML = '<span>⚡ Energy</span><span>' + Math.floor(S.energy) + ' / ' + Game.CFG.energyMax + '</span>';
    var bar = h('div', 'bar');
    var fill = h('div', 'fill');
    fill.style.width = (S.energy / Game.CFG.energyMax * 100) + '%';
    bar.appendChild(fill);
    en.appendChild(lbl); en.appendChild(bar);
    var rem = Game.energyReadyIn();
    var sub = h('div', 'meter-sub');
    if (rem > 0) { sub.appendChild(document.createTextNode('+10 in ')); sub.appendChild(countdown(Date.now() + rem, '')); }
    else sub.textContent = 'Full';
    en.appendChild(sub);
    meters.appendChild(en);

    var gold = h('div', 'meter gold');
    gold.innerHTML = '<div class="gold-amt">🪙 ' + S.gold + '</div><div class="meter-sub">coins</div>';
    meters.appendChild(gold);

    $top.appendChild(meters);
  }

  function renderNav() {
    var btns = $nav.querySelectorAll('button[data-screen]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].dataset.screen === view.name ||
        (view.name === 'location' && btns[i].dataset.screen === 'explore') ||
        (view.name === 'breeding' && btns[i].dataset.screen === 'loft'));
    }
  }

  /* ---------- pigeon card ---------- */

  function statusBadges(p) {
    var wrap = h('div', 'badges');
    var hunger = Game.currentHunger(p);

    if (p.stage === 'squab') {
      var b = h('span', 'badge squab');
      b.appendChild(document.createTextNode('Squab · '));
      b.appendChild(countdown(p.growAt, ''));
      wrap.appendChild(b);
    }
    if (hunger < Game.CFG.hungerToBreed) wrap.appendChild(h('span', 'badge warn', 'Hungry'));
    if (p.sex === 'hen' && p.cooldownUntil > Date.now()) {
      var c = h('span', 'badge cool');
      c.appendChild(document.createTextNode('Cooldown · '));
      c.appendChild(countdown(p.cooldownUntil, ''));
      wrap.appendChild(c);
    }
    if (p.special) wrap.appendChild(h('span', 'badge special', '★ rare name'));
    return wrap;
  }

  function pigeonCard(p, opts) {
    opts = opts || {};
    var ph = Genetics.phenotype(p.genes);
    var card = h('div', 'pgn-card' + (held ? ' targetable' : ''));
    card.dataset.id = p.id;

    var art = h('div', 'pgn-art-box');
    Sprites.mount(art, p, opts.size || 128);
    card.appendChild(art);

    var nm = h('div', 'pgn-name');
    nm.innerHTML = esc(p.name) + ' <span class="sex ' + p.sex + '">' + sexIcon(p.sex) + '</span>';
    card.appendChild(nm);

    card.appendChild(h('div', 'pgn-pheno', ph.name));

    var hunger = Game.currentHunger(p);
    var hb = h('div', 'hunger');
    var hf = h('div', 'hunger-fill');
    hf.style.width = hunger + '%';
    if (hunger < 30) hf.classList.add('low');
    hb.appendChild(hf);
    card.appendChild(hb);

    card.appendChild(statusBadges(p));

    function activate(ev) {
      ev.preventDefault();
      if (held) applyHeldTo(p);
      else openPigeon(p.id);
    }
    card.addEventListener('contextmenu', activate);
    card.addEventListener('click', activate);
    return card;
  }

  /* ---------- LOFT ---------- */

  function renderLoft() {
    var S = Game.state();
    $screen.innerHTML = '';

    var head = h('div', 'screen-head');
    head.appendChild(h('h1', null, 'Your Loft'));
    head.appendChild(h('p', 'muted', S.loft.length + ' of ' + S.loftCapacity +
      ' perches used. Right-click a pigeon to open its page.'));
    $screen.appendChild(head);

    if (S.pending.length) {
      var warn = h('div', 'panel warn-panel',
        S.pending.length + ' pigeon' + (S.pending.length > 1 ? 's are' : ' is') +
        ' waiting outside — free a perch or buy a Loft Expansion.');
      $screen.appendChild(warn);
    }

    if (S.nest) {
      var sire = Game.get(S.nest.sireId), dam = Game.get(S.nest.damId);
      var nest = h('div', 'panel nest-panel');
      var nh = h('div', 'nest-info');
      nh.appendChild(h('h3', null, '🥚 Clutch in the nest'));
      nh.appendChild(h('p', 'muted',
        (sire ? sire.name : '?') + ' × ' + (dam ? dam.name : '?') + ' — ' +
        S.nest.count + ' squab' + (S.nest.count > 1 ? 's' : '') + ' expected'));
      var cd = h('p', 'nest-timer');
      cd.appendChild(document.createTextNode('Hatching in '));
      cd.appendChild(countdown(S.nest.hatchAt, ''));
      nh.appendChild(cd);
      nest.appendChild(nh);
      var btn = h('button', 'btn small', 'Hatch now');
      btn.onclick = function () {
        var r = Game.hatchNow();
        toast(r.msg, r.ok ? 'good' : 'bad');
        render();
      };
      nest.appendChild(btn);
      $screen.appendChild(nest);
    }

    var grid = h('div', 'loft-grid');
    var birds = Game.loftBirds();
    for (var i = 0; i < S.loftCapacity; i++) {
      if (birds[i]) grid.appendChild(pigeonCard(birds[i]));
      else {
        var slot = h('div', 'pgn-card empty');
        slot.innerHTML = '<div class="perch">⌐</div><div class="muted">Empty perch</div>';
        grid.appendChild(slot);
      }
    }
    $screen.appendChild(grid);

    if (S.log.length) {
      var lg = h('div', 'panel log-panel');
      lg.appendChild(h('h3', null, 'Loft diary'));
      var ul = h('ul', 'log');
      S.log.slice(0, 8).forEach(function (l) { ul.appendChild(h('li', null, Game.formatLog(l.text))); });
      lg.appendChild(ul);
      $screen.appendChild(lg);
    }
  }

  /* ---------- EXPLORE ---------- */

  var LOCATIONS = {
    city: {
      name: 'The City',
      icon: '🏙',
      blurb: 'Ledges, station roofs and chip shops. Ferals here run to checks and T-patterns, and ash-red is common.',
      cls: 'loc-city'
    },
    coast: {
      name: 'The Coast',
      icon: '🌊',
      blurb: 'Cliffs, groynes and a wet wind. Bars and barless are the rule, and dilutes and whites turn up far more often.',
      cls: 'loc-coast'
    }
  };

  function renderExplore() {
    $screen.innerHTML = '';
    var head = h('div', 'screen-head');
    head.appendChild(h('h1', null, 'Explore'));
    head.appendChild(h('p', 'muted', 'Pick somewhere to walk. Different places hold different bloodlines.'));
    $screen.appendChild(head);

    var map = h('div', 'map');
    ['coast', 'city'].forEach(function (key) {
      var L = LOCATIONS[key];
      var c = h('div', 'map-card ' + L.cls);
      c.innerHTML = '<div class="map-icon">' + L.icon + '</div>' +
        '<h2>' + L.name + '</h2><p>' + L.blurb + '</p>';
      var b = h('button', 'btn', 'Go to ' + L.name);
      b.onclick = function () { view = { name: 'location', loc: key }; explore.encounter = null; explore.feed = []; render(); };
      c.appendChild(b);
      map.appendChild(c);
    });
    $screen.appendChild(map);
  }

  function renderLocation() {
    var S = Game.state();
    var L = LOCATIONS[view.loc];
    $screen.innerHTML = '';

    var head = h('div', 'screen-head');
    var back = h('button', 'btn ghost small', '← Back to map');
    back.onclick = function () { view = { name: 'explore' }; render(); };
    head.appendChild(back);
    head.appendChild(h('h1', null, L.icon + ' ' + L.name));
    $screen.appendChild(head);

    var panel = h('div', 'panel walk-panel ' + L.cls);

    if (explore.encounter && explore.encounter.kind === 'pigeon') {
      panel.appendChild(h('p', 'encounter', explore.encounter.text));
      var row = h('div', 'row');
      var yes = h('button', 'btn', 'Yes — try to catch it (−' + (Game.CFG.costCatchExtra) + ' energy)');
      yes.onclick = function () {
        var r = Game.attemptCatch(view.loc);
        explore.feed.unshift({ text: r.text, kind: r.ok ? 'good' : 'bad' });
        explore.encounter = null;
        render();
        if (r.ok) toast(r.text, 'good');
      };
      var no = h('button', 'btn ghost', 'No — let it be');
      no.onclick = function () {
        explore.feed.unshift({ text: 'You keep still. It struts off between the railings.', kind: '' });
        explore.encounter = null;
        render();
      };
      row.appendChild(yes); row.appendChild(no);
      panel.appendChild(row);
    } else {
      var walk = h('button', 'btn big', 'Walk forward  (−' + Game.CFG.costWalk + ' energy)');
      if (S.energy < Game.CFG.costWalk) {
        walk.disabled = true;
        walk.textContent = 'Too tired to walk';
      }
      walk.onclick = function () {
        var r = Game.walk(view.loc);
        if (r.kind === 'pigeon') explore.encounter = r;
        else explore.feed.unshift({ text: r.text, kind: r.kind === 'coins' ? 'good' : '' });
        render();
      };
      panel.appendChild(walk);
      if (S.energy < Game.CFG.costWalk) {
        var w = h('p', 'muted');
        w.appendChild(document.createTextNode('Out of energy. Next 10% in '));
        w.appendChild(countdown(Date.now() + Game.energyReadyIn(), ''));
        w.appendChild(document.createTextNode('. An Energy Refill from the shop fixes it instantly.'));
        panel.appendChild(w);
      }
    }
    $screen.appendChild(panel);

    if (explore.feed.length) {
      var fp = h('div', 'panel');
      fp.appendChild(h('h3', null, 'Along the way'));
      var ul = h('ul', 'log');
      explore.feed.slice(0, 12).forEach(function (f) {
        ul.appendChild(h('li', f.kind, f.text));
      });
      fp.appendChild(ul);
      $screen.appendChild(fp);
    }
  }

  /* ---------- FARM ---------- */

  var scytheOn = false;

  /** A small pixel plant, drawn per crop and growth stage. */
  function plantSVG(cropId, stage, isSuper) {
    var STEM = isSuper ? '#7ec25e' : '#5f8f4a';
    var LEAF = isSuper ? '#95d874' : '#74a95b';
    var DARK = isSuper ? '#5d9143' : '#4a7038';
    var parts = [];
    function r(x, y, w, h, c) {
      parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>');
    }

    // soil bed
    r(0, 20, 24, 4, '#57402f');
    r(0, 20, 24, 1, '#6d5340');

    if (stage === 'seedling') {
      r(11, 16, 2, 4, STEM);
      r(8, 16, 3, 2, LEAF);
      r(13, 16, 3, 2, LEAF);
    } else if (stage === 'sprout') {
      r(11, 10, 2, 10, STEM);
      r(7, 12, 4, 2, LEAF);
      r(13, 12, 4, 2, LEAF);
      r(8, 16, 3, 2, DARK);
      r(13, 16, 3, 2, DARK);
    } else if (stage === 'adult') {
      r(11, 6, 2, 14, STEM);
      r(6, 11, 5, 2, LEAF);
      r(13, 11, 5, 2, LEAF);
      r(7, 16, 4, 2, DARK);
      r(13, 16, 4, 2, DARK);
      if (cropId === 'corn') {
        r(12, 2, 5, 2, LEAF);
        r(13, 3, 4, 8, '#e8c04a');
        r(12, 4, 1, 6, '#c29a34');
        r(17, 4, 1, 6, '#f4dd86');
      } else if (cropId === 'millet') {
        r(12, 1, 3, 3, '#e2c96f');
        r(13, 4, 3, 3, '#d6b757');
        r(14, 7, 3, 3, '#c4a33e');
      } else {
        parts.push('<circle cx="12" cy="6" r="' + (isSuper ? 6.5 : 5.5) + '" fill="#f0c542"/>');
        parts.push('<circle cx="12" cy="6" r="2.6" fill="#7a5230"/>');
      }
      if (isSuper) {
        // a couple of glints so a Super crop reads at a glance
        r(3, 3, 2, 2, '#ffe89a');
        r(20, 8, 2, 2, '#ffe89a');
        r(5, 14, 1, 1, '#ffe89a');
      }
    }

    return '<svg viewBox="0 0 24 24" width="100%" height="100%" shape-rendering="crispEdges" ' +
           'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + parts.join('') + '</svg>';
  }

  var STAGE_LABEL = { seedling: 'Seedling', sprout: 'Sprout', adult: 'Adult' };

  function farmSignature() {
    return Game.state().plots.map(function (p) {
      return p ? p.crop + ':' + Game.plotStage(p) : '-';
    }).join('|');
  }

  function renderFarm() {
    var S = Game.state();
    $screen.innerHTML = '';

    var head = h('div', 'screen-head');
    head.appendChild(h('h1', null, 'Farm'));
    head.appendChild(h('p', 'muted',
      'Buy seed in the shop, open your inventory and click Use, then click a growing spot to sow it. ' +
      'Once a plant is Adult, pick up the scythe and click it to cut and sell the grain.'));
    $screen.appendChild(head);

    var layout = h('div', 'farm-layout');

    /* tool rail */
    var rail = h('div', 'farm-tools');
    rail.appendChild(h('div', 'rail-label', 'Tools'));

    var scythe = h('button', 'tool' + (scytheOn ? ' active' : ''));
    scythe.innerHTML = '<span class="tool-icon">🌾</span><span class="tool-name">Scythe</span>';
    scythe.title = 'Toggle the scythe, then click an adult plant to harvest it';
    scythe.onclick = function () {
      scytheOn = !scytheOn;
      if (scytheOn && held) { held = null; }
      renderHeld();
      render();
    };
    rail.appendChild(scythe);

    var ready = Game.readyCount();
    rail.appendChild(h('div', 'rail-note', ready
      ? ready + ' ready to cut'
      : 'nothing ready yet'));

    // Each plot carries its own run of fertilized growings, so summarise.
    var fedCount = Game.fertilizedPlotCount();
    var fedTier = null, totalLeft = 0;
    S.plots.forEach(function (_, i) {
      var f = Game.plotFertilizer(i);
      if (f) { fedTier = f; totalLeft += Game.plotFertCharges(i); }
    });

    var soil = h('div', 'soil-state' + (fedTier ? ' fed' : ''));
    soil.innerHTML = fedTier
      ? '<div class="soil-icon">' + fedTier.icon + '</div>' +
        '<div class="soil-name">' + fedTier.name + '</div>' +
        '<div class="soil-sub">' + fedCount + ' of ' + S.plots.length + ' plots fed</div>' +
        '<div class="soil-sub">' + totalLeft + ' growings banked</div>'
      : '<div class="soil-icon">🌱</div><div class="soil-sub">plain soil</div>';
    soil.title = 'Fertilizer is stocked per plot — an unused plot keeps all of its growings';
    rail.appendChild(soil);
    rail.appendChild(h('div', 'rail-note',
      fedTier
        ? 'Super ' + Math.round(fedTier.chance * 100) + '% on fed plots'
        : 'Super ' + Math.round(Game.SUPER_CHANCE * 100) + '%'));

    var seedBtn = h('button', 'tool');
    seedBtn.innerHTML = '<span class="tool-icon">🌱</span><span class="tool-name">Seed bag</span>';
    seedBtn.title = 'Open the inventory to pick a seed';
    seedBtn.onclick = function () { toggleInv(true); };
    rail.appendChild(seedBtn);

    var bag = h('div', 'seed-bag');
    var seedTotal = 0;
    Game.CROP_ORDER.forEach(function (id) {
      var n = Game.itemCount('seed_' + id);
      seedTotal += n;
      var line = h('div', 'bag-line' + (n ? '' : ' none'));
      line.innerHTML = '<span>' + Game.CROPS[id].icon + '</span><span class="bag-n">×' + n + '</span>';
      line.title = Game.CROPS[id].seedName + ': ' + n;
      bag.appendChild(line);
    });
    rail.appendChild(bag);
    if (!seedTotal) rail.appendChild(h('div', 'rail-note', 'bag is empty'));

    layout.appendChild(rail);


    /* plots — only as many empty spots are offered as you have seed for */
    var sowing = held && held.target === 'plot';
    var seedsLeft = sowing ? Game.itemCount(held.id) : 0;
    var budget = seedsLeft;

    var grid = h('div', 'farm-grid');
    S.plots.forEach(function (plot, i) {
      var cell = h('div', 'plot');
      var stage = Game.plotStage(plot);
      var crop = plot ? Game.CROPS[plot.crop] : null;
      var canSow = false;

      if (scytheOn) cell.classList.add('scything');
      if (sowing && !plot) {
        if (budget > 0) { canSow = true; budget--; cell.classList.add('sowable'); }
        else cell.classList.add('no-seed');
      }
      if (stage === 'adult') cell.classList.add('ready');

      // the Super roll happens at sowing but only shows once the plant is Adult
      var isSuper = !!(plot && plot.sup && stage === 'adult');
      if (isSuper) cell.classList.add('super');

      var art = h('div', 'plot-art');
      art.innerHTML = plantSVG(plot ? plot.crop : null, stage, isSuper);
      cell.appendChild(art);

      // this plot's own remaining fertilized growings
      var pf = Game.plotFertilizer(i);
      if (pf) {
        var tag = h('div', 'plot-fert');
        tag.innerHTML = '<span>' + pf.icon + '</span><span>×' + Game.plotFertCharges(i) + '</span>';
        tag.title = pf.name + ' — ' + Game.plotFertCharges(i) + ' fertilized growings left in this plot (' +
                    Math.round(pf.chance * 100) + '% Super)';
        cell.appendChild(tag);
      }

      if (!plot) {
        cell.appendChild(h('div', 'plot-name', 'Empty spot'));
        var emptyText = 'Nothing sown';
        if (sowing) {
          emptyText = canSow
            ? 'Click to sow ' + held.name.toLowerCase()
            : 'No ' + held.name.toLowerCase() + ' left for this one';
        }
        cell.appendChild(h('div', 'plot-sub muted', emptyText));
      } else {
        cell.appendChild(h('div', 'plot-name',
          crop.icon + ' ' + (isSuper ? 'Super ' : '') + crop.name));
        if (stage === 'adult') {
          var worth = crop.sell * (plot.sup ? Game.SUPER_MULTIPLIER : 1);
          var rb = h('div', 'plot-sub ' + (isSuper ? 'super-text' : 'ready-text'),
            (isSuper ? '★ Super · ready · ' : 'Adult · ready · ') + worth + ' coins');
          cell.appendChild(rb);
        } else {
          var sub = h('div', 'plot-sub muted');
          sub.appendChild(document.createTextNode(STAGE_LABEL[stage] + ' · '));
          sub.appendChild(countdown(plot.plantedAt + crop.growMs, ''));
          cell.appendChild(sub);
        }
      }

      cell.onclick = function () {
        if (scytheOn) {
          var r = Game.harvest(i);
          toast(r.msg, r.ok ? 'good' : 'bad');
          render();
          return;
        }
        if (sowing && !plot && !canSow) {
          toast('You only have ' + seedsLeft + ' ' + held.name.toLowerCase() +
                ' — enough for the ' + seedsLeft + ' spot' + (seedsLeft === 1 ? '' : 's') +
                ' outlined in green.', 'bad');
          return;
        }
        if (sowing) {
          var p = Game.plant(i, held.crop);
          if (p.ok) {
            var left = Game.itemCount(held.id);
            toast(p.msg + (left ? ' ' + left + ' left.' : ' That was your last one.'), 'good');
            if (!left) held = null;
          } else {
            toast(p.msg, 'bad');
          }
          renderHeld();
          render();
          return;
        }
        if (stage === 'adult') {
          toast('Pick up the scythe first, then click the plant.');
        } else if (plot) {
          toast(Game.CROPS[plot.crop].name + ' is still ' + STAGE_LABEL[stage].toLowerCase() + '.');
        } else {
          toast('Empty spot. Use a seed from your inventory to sow it.');
        }
      };

      grid.appendChild(cell);
    });
    layout.appendChild(grid);
    $screen.appendChild(layout);

    /* ---- Farm & Supply Store (collapsible) ---- */
    var store = h('div', 'panel store-panel' + (S.storeOpen ? '' : ' shut'));

    var sh = h('button', 'store-head');
    sh.setAttribute('aria-expanded', S.storeOpen ? 'true' : 'false');
    sh.innerHTML = '<span class="store-caret">' + (S.storeOpen ? '▾' : '▸') + '</span>' +
      '<h3>🏪 Farm &amp; Supply Store</h3>' +
      '<span class="muted small store-gold">🪙 ' + S.gold + '</span>';
    sh.onclick = function () {
      S.storeOpen = !S.storeOpen;
      Game.save();
      render();
    };
    store.appendChild(sh);

    if (!S.storeOpen) {
      $screen.appendChild(store);
      return;
    }

    store.appendChild(h('p', 'muted small',
      'Every crop has a ' + Math.round(Game.SUPER_CHANCE * 100) + '% chance of coming up Super, ' +
      'which sells for double. Fertilizer is worked into all ' + Game.PLOT_COUNT +
      ' plots at once, and each plot then keeps its own ' + Game.FERTILIZER_GROWINGS +
      ' fertilized growings — a spot you never sow keeps every one of them.'));

    store.appendChild(h('h4', 'store-sub', 'Seed'));
    var seedGrid = h('div', 'store-grid');
    Game.CROP_ORDER.forEach(function (id) {
      var c = Game.CROPS[id];
      seedGrid.appendChild(storeCard('seed_' + id, c.icon, c.seedName, c.price,
        Game.fmtTime(c.growMs) + ' · sells ' + c.sell + ' · Super ' + (c.sell * Game.SUPER_MULTIPLIER),
        'Held: ' + Game.itemCount('seed_' + id)));
    });
    store.appendChild(seedGrid);

    store.appendChild(h('h4', 'store-sub', 'Fertilizer'));
    var fertGrid = h('div', 'store-grid');
    Game.FERTILIZER_ORDER.forEach(function (id) {
      var f = Game.FERTILIZERS[id];
      fertGrid.appendChild(storeCard(id, f.icon, f.name, f.price,
        'Super chance ' + Math.round(f.chance * 100) + '% · ' + Game.FERTILIZER_GROWINGS + ' growings',
        'Held: ' + Game.itemCount(id) + (fedTier && fedTier.id === id ? ' · ' + fedCount + ' plots fed' : '')));
    });
    store.appendChild(fertGrid);
    $screen.appendChild(store);
  }

  function storeCard(id, icon, name, price, blurb, held) {
    var S = Game.state();
    var c = h('div', 'store-card');
    c.innerHTML = '<div class="store-icon">' + icon + '</div>' +
      '<div class="store-name">' + name + '</div>' +
      '<div class="store-blurb muted small">' + blurb + '</div>' +
      '<div class="store-held small">' + held + '</div>';
    var row = h('div', 'store-buttons');

    var buy = h('button', 'btn small', 'Buy 🪙 ' + price);
    if (S.gold < price) buy.classList.add('cant');
    buy.onclick = function () {
      var r = Game.buy(id);
      toast(r.ok ? 'Bought ' + name + '.' : r.msg, r.ok ? 'good' : 'bad');
      render();
    };
    row.appendChild(buy);

    // fertilizer is used straight from the store as well as the inventory
    if (Game.FERTILIZERS[id]) {
      var use = h('button', 'btn ghost small', 'Use');
      if (!Game.itemCount(id)) use.classList.add('cant');
      use.onclick = function () {
        var r = Game.useSelfItem(id);
        toast(r.msg, r.ok ? 'good' : 'bad');
        render();
      };
      row.appendChild(use);
    }
    c.appendChild(row);
    return c;
  }

  /* ---------- SHOP ---------- */

  function renderShop() {
    var S = Game.state();
    $screen.innerHTML = '';
    var head = h('div', 'screen-head');
    head.appendChild(h('h1', null, 'Shop'));
    head.appendChild(h('p', 'muted', 'You have 🪙 ' + S.gold + '.'));
    $screen.appendChild(head);

    var grid = h('div', 'shop-grid');
    // seed and fertilizer live in the Farm & Supply Store instead
    Game.SHOP.filter(function (i) { return i.store !== 'farm'; }).forEach(function (item) {
      var price = Game.itemPrice(item.id);
      var c = h('div', 'shop-card');
      c.innerHTML = '<div class="shop-icon">' + item.icon + '</div>' +
        '<h3>' + item.name + '</h3>' +
        '<p>' + item.desc + '</p>';

      var owned;
      if (item.id === 'feed') { var f = Game.itemCount('feed'); owned = f.bags + ' bag(s), ' + f.uses + ' uses'; }
      else if (item.id === 'nestbox') owned = S.loftCapacity + ' perches';
      else owned = Game.itemCount(item.id) + ' owned';
      c.appendChild(h('div', 'shop-owned', owned));

      var b = h('button', 'btn', 'Buy — 🪙 ' + price);
      if (S.gold < price) b.classList.add('cant');
      b.onclick = function () {
        var r = Game.buy(item.id);
        toast(r.ok ? 'Bought ' + item.name + '.' : r.msg, r.ok ? 'good' : 'bad');
        render();
      };
      c.appendChild(b);
      grid.appendChild(c);
    });
    $screen.appendChild(grid);
  }

  /* ---------- INVENTORY OVERLAY ---------- */

  var invOpen = false;

  function toggleInv(force) {
    invOpen = force === undefined ? !invOpen : force;
    renderInv();
  }

  function renderInv() {
    var S = Game.state();
    $inv.classList.toggle('hidden', !invOpen);
    if (!invOpen) return;
    $inv.innerHTML = '';

    var box = h('div', 'inv-box');
    var head = h('div', 'inv-head');
    head.appendChild(h('h2', null, 'Inventory'));
    var x = h('button', 'icon-btn', '✕');
    x.onclick = function () { toggleInv(false); };
    head.appendChild(x);
    box.appendChild(head);

    var list = h('div', 'inv-list');
    var any = false;

    function row(id, name, icon, countText, desc, disabled) {
      any = true;
      var r = h('div', 'inv-row');
      r.innerHTML = '<div class="inv-icon">' + icon + '</div>' +
        '<div class="inv-meta"><div class="inv-name">' + name + ' <span class="inv-count">' + countText + '</span></div>' +
        '<div class="muted small">' + desc + '</div></div>';
      var b = h('button', 'btn small', 'Use');
      if (disabled) b.classList.add('cant');
      b.onclick = function () { useFromInventory(id); };
      r.appendChild(b);
      list.appendChild(r);
    }

    Game.CROP_ORDER.forEach(function (id) {
      var c = Game.CROPS[id];
      var n = Game.itemCount('seed_' + id);
      if (n) row('seed_' + id, c.seedName, c.icon, '×' + n,
        'Click Use, then click a growing spot on the farm.', false);
    });

    Game.FERTILIZER_ORDER.forEach(function (id) {
      var fz = Game.FERTILIZERS[id];
      var n = Game.itemCount(id);
      if (n) row(id, fz.name, fz.icon, '×' + n,
        'Works into every plot at once — Super chance ' + Math.round(fz.chance * 100) +
        '%, ' + Game.FERTILIZER_GROWINGS + ' growings per plot.', false);
    });

    var f = Game.itemCount('feed');
    if (f.bags) row('feed', 'Pigeon Feed', '🌾', '×' + f.bags + ' (' + f.uses + ' uses)',
      'Click Use, then right-click a pigeon in the loft.', false);
    if (Game.itemCount('growth')) row('growth', 'Growth Serum', '🧪', '×' + Game.itemCount('growth'),
      'Click Use, then right-click a squab.', false);
    if (Game.itemCount('cooldown')) row('cooldown', 'Cooldown Remover', '⏱', '×' + Game.itemCount('cooldown'),
      'Click Use, then right-click a hen on cooldown.', false);
    if (Game.itemCount('sexchange')) row('sexchange', 'Sex Changer', '♂♀', '×' + Game.itemCount('sexchange'),
      'Click Use, then right-click a pigeon. Colour is kept; sex-linked carries are not.', false);
    if (Game.itemCount('reshuffle')) row('reshuffle', 'Total Reshuffle', '🎲', '×' + Game.itemCount('reshuffle'),
      'Click Use, then right-click a pigeon. Rerolls every locus; the name and sex stay.', false);
    if (Game.itemCount('energy')) row('energy', 'Energy Refill', '⚡', '×' + Game.itemCount('energy'),
      'Used on yourself straight away.', false);

    if (!any) list.appendChild(h('p', 'muted', 'Empty. The shop can fix that.'));
    box.appendChild(list);

    var foot = h('div', 'inv-foot');
    foot.innerHTML = '<span class="gold-amt">🪙 ' + S.gold + '</span>';
    box.appendChild(foot);

    $inv.appendChild(box);
  }

  function useFromInventory(id) {
    var item = null;
    Game.SHOP.forEach(function (i) { if (i.id === id) item = i; });
    if (!item) return;

    if (item.target === 'self') {
      var r = Game.useSelfItem(id);
      toast(r.msg, r.ok ? 'good' : 'bad');
      render();
      return;
    }
    held = { id: id, name: item.name, icon: item.icon, target: item.target, crop: item.crop };
    scytheOn = false;
    toggleInv(false);

    if (item.target === 'plot') {
      view = { name: 'farm' };
      renderHeld();
      render();
      toast('Holding ' + item.name + ' — click a growing spot to sow it. Esc to put it away.');
      return;
    }

    if (view.name !== 'loft') { view = { name: 'loft' }; }
    renderHeld();
    render();
    toast('Holding ' + item.name + ' — right-click a pigeon to use it. Esc to drop.');
  }

  /** How many uses are left of whatever is on the cursor. */
  function heldRemaining() {
    if (!held) return null;
    if (held.id === 'feed') return Game.itemCount('feed').uses;
    var n = Game.itemCount(held.id);
    return typeof n === 'number' ? n : null;
  }

  function renderHeld() {
    var icon = null, label = null;
    if (held) {
      icon = held.icon;
      label = held.name;
      var n = heldRemaining();
      if (n !== null) label += ' ×' + n;
    }
    else if (scytheOn) { icon = '🌾'; label = 'Scythe'; }

    if (!icon) {
      $held.classList.add('hidden');
      $held.innerHTML = '';
      document.body.classList.remove('holding');
      return;
    }
    $held.classList.remove('hidden');
    document.body.classList.add('holding');
    $held.innerHTML = '<span class="held-icon">' + icon + '</span><span>' + label + '</span>';
  }

  function applyHeldTo(p) {
    if (held.target === 'plot') {
      toast(held.name + ' are for the farm, not for pigeons.', 'bad');
      return;
    }
    var r = Game.applyItem(held.id, p.id);
    toast(r.msg, r.ok ? 'good' : 'bad');
    if (r.ok) {
      var left = held.id === 'feed' ? Game.itemCount('feed').uses : Game.itemCount(held.id);
      if (!left) held = null;
    }
    renderHeld();
    render();
  }

  function dropHeld() {
    if (!held && !scytheOn) return;
    held = null;
    scytheOn = false;
    renderHeld();
    render();
  }

  /* ---------- MODALS ---------- */

  function openModal(node, wide) {
    $modal.innerHTML = '';
    $modal.classList.remove('hidden');
    var box = h('div', 'modal-box' + (wide ? ' wide' : ''));
    var close = h('button', 'icon-btn modal-close', '✕');
    close.onclick = closeModal;
    box.appendChild(close);
    box.appendChild(node);
    $modal.appendChild(box);
  }

  function closeModal() { $modal.classList.add('hidden'); $modal.innerHTML = ''; }

  /* Native confirm() is unreliable — some browsers auto-dismiss it, which made
     Sell and Rehome silently do nothing. This asks in-page instead. */
  function closeConfirm() { $confirm.classList.add('hidden'); $confirm.innerHTML = ''; }

  function askConfirm(opts, onYes) {
    $confirm.innerHTML = '';
    $confirm.classList.remove('hidden');
    var box = h('div', 'confirm-box');
    box.appendChild(h('h3', null, opts.title));
    if (opts.body) box.appendChild(h('p', 'muted', opts.body));
    var row = h('div', 'confirm-row');
    var no = h('button', 'btn ghost', opts.no || 'Cancel');
    no.onclick = closeConfirm;
    var yes = h('button', 'btn' + (opts.danger ? ' danger' : ''), opts.yes || 'Confirm');
    yes.onclick = function () { closeConfirm(); onYes(); };
    row.appendChild(no);
    row.appendChild(yes);
    box.appendChild(row);
    $confirm.appendChild(box);
    yes.focus();
  }

  /* ---------- pigeon info page ---------- */

  function openPigeon(id) {
    var p = Game.get(id);
    if (!p) return;
    var ph = Genetics.phenotype(p.genes);
    var info = Genetics.describe(p);
    var wrap = h('div', 'pigeon-page');

    var top = h('div', 'pp-top');
    var art = h('div', 'pp-art');
    Sprites.mount(art, p, 192);
    top.appendChild(art);

    var meta = h('div', 'pp-meta');

    var title = h('h2', 'pp-name');
    title.innerHTML = esc(p.name) + ' <span class="sex ' + p.sex + '">' + sexIcon(p.sex) + '</span>';
    var penBtn = h('button', 'rename-btn', '✏️');
    penBtn.title = 'Rename ' + p.name;
    penBtn.setAttribute('aria-label', 'Rename this pigeon');
    title.appendChild(penBtn);
    meta.appendChild(title);

    penBtn.onclick = function () {
      var editor = h('div', 'rename-row');
      var input = h('input', 'rename-input');
      input.type = 'text';
      input.value = p.name;
      input.maxLength = 20;
      input.setAttribute('aria-label', 'New name');

      var save = h('button', 'btn small', 'Save');
      var cancel = h('button', 'btn ghost small', 'Cancel');
      editor.appendChild(input);
      editor.appendChild(save);
      editor.appendChild(cancel);
      title.replaceWith(editor);
      input.focus();
      input.select();

      function commit() {
        var r = Game.rename(p.id, input.value);
        toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) { openPigeon(p.id); render(); }
        else input.focus();
      }
      function abandon() { openPigeon(p.id); }

      save.onclick = commit;
      cancel.onclick = abandon;
      input.onkeydown = function (e) {
        e.stopPropagation();                       // do not let Esc close the modal
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') abandon();
      };
    };
    meta.appendChild(h('div', 'pp-pheno', ph.name));

    if (ph.white) {
      meta.appendChild(h('div', 'pp-hidden',
        'Recessive white masks everything, the eye included. Underneath, this bird is ' +
        ph.underlying.name + '.'));
    }

    if (ph.stencilVisible) {
      var patWord = { bar: 'bars', check: 'checks', tcheck: 'T-check', barless: 'markings' }[ph.stencilPattern];
      var msg;
      if (ph.stencil === 'full') {
        msg = 'Toy stencil is printing the ' + patWord + ' in white.';
      } else if (ph.stencil === 'partial') {
        msg = 'Toy stencil is printing the ' + patWord + ' in cream. Only one copy of Ts2, ' +
              'so the whitening stops short — breed for Ts2//Ts2 to finish it.';
      } else {
        msg = 'The stencil bronze is showing on the ' + patWord + ', but the complex is ' +
              'incomplete. Full white needs Ts1, Ts2//Ts2 and ts3//ts3 together.';
      }
      if (ph.spread || ph.recred) {
        msg += ' It is printing straight through the ' +
               (ph.recred ? 'recessive red' : 'spread') + ' that would otherwise bury the pattern.';
      }
      meta.appendChild(h('div', 'pp-stencil', msg));
    }

    var facts = h('div', 'pp-facts');
    function fact(k, v) {
      var d = h('div', 'fact');
      d.innerHTML = '<span class="k">' + k + '</span><span class="v">' + v + '</span>';
      facts.appendChild(d);
    }
    fact('Sex', sexWord(p.sex) + (p.sex === 'cock' ? ' (ZZ)' : ' (ZW)'));
    fact('Stage', p.stage === 'squab' ? 'Squab' : 'Adult');
    fact('Generation', p.generation || 1);
    fact('Origin', { starter: 'Founder', caught: 'Caught while exploring', bred: 'Bred in this loft', wild: 'Wild' }[p.origin] || p.origin);
    fact('Eye', ph.eyeName);
    if (ph.stencilVisible) fact('Toy stencil', ph.stencilName);
    meta.appendChild(facts);

    // hunger
    var hunger = Game.currentHunger(p);
    var hw = h('div', 'pp-hunger');
    hw.innerHTML = '<div class="meter-label"><span>Hunger</span><span>' + Math.round(hunger) + '%</span></div>';
    var hb = h('div', 'hunger');
    var hf = h('div', 'hunger-fill' + (hunger < 30 ? ' low' : ''));
    hf.style.width = hunger + '%';
    hb.appendChild(hf);
    hw.appendChild(hb);
    meta.appendChild(hw);

    if (p.stage === 'squab') {
      var g = h('div', 'pp-timer');
      g.appendChild(document.createTextNode('Grows up in '));
      g.appendChild(countdown(p.growAt, ''));
      meta.appendChild(g);
    }
    if (p.sex === 'hen' && p.cooldownUntil > Date.now()) {
      var cd = h('div', 'pp-timer');
      cd.appendChild(document.createTextNode('Breeding cooldown ends in '));
      cd.appendChild(countdown(p.cooldownUntil, ''));
      meta.appendChild(cd);
    }
    if (p.sex === 'cock') meta.appendChild(h('div', 'pp-timer muted', 'Cocks have no breeding cooldown.'));

    top.appendChild(meta);
    wrap.appendChild(top);

    // genes
    var gsec = h('div', 'pp-section');
    gsec.appendChild(h('h3', null, 'Genotype'));
    var tbl = h('table', 'gene-table');
    var thead = h('thead');
    thead.innerHTML = '<tr><th>Locus</th><th>Alleles</th><th>Reading</th></tr>';
    tbl.appendChild(thead);
    var tb = h('tbody');
    info.rows.forEach(function (r) {
      var tr = h('tr');
      tr.innerHTML =
        '<td><span class="locus">' + r.locus + '</span><span class="chrom ' + (r.chrom === 'sex-linked' ? 'z' : 'a') + '">' + r.chrom + '</span></td>' +
        '<td class="alleles">' + esc(r.alleles) + '</td>' +
        '<td>' + esc(r.reading) + '</td>';
      tr.title = r.note;
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    gsec.appendChild(tbl);

    var carr = h('div', 'carries');
    if (info.carried.length) {
      carr.innerHTML = '<strong>Carries (hidden):</strong> ' + info.carried.map(esc).join(', ');
    } else {
      carr.innerHTML = '<strong>Carries:</strong> nothing hidden — this bird breeds true at every locus.';
    }
    gsec.appendChild(carr);

    if (p.sex === 'hen') {
      gsec.appendChild(h('p', 'note',
        'She is ZW, so at the sex-linked loci she has only one allele. A hen can never carry a hidden ' +
        'sex-linked colour, and she passes those genes to her sons only.'));
    } else {
      gsec.appendChild(h('p', 'note',
        'He is ZZ, so he can hide a recessive at the sex-linked loci. Every one of his daughters takes ' +
        'her sex-linked colour from him alone.'));
    }
    wrap.appendChild(gsec);

    // buttons
    var btns = h('div', 'pp-buttons');
    var gen = h('button', 'btn', '🌳 Genealogy');
    gen.onclick = function () { openGenealogy(p.id); };
    btns.appendChild(gen);

    var brd = h('button', 'btn', '🥚 Breeding');
    brd.onclick = function () {
      closeModal();
      breeding = { sireId: null, damId: null };
      if (p.stage === 'adult') {
        if (p.sex === 'cock') breeding.sireId = p.id; else breeding.damId = p.id;
      }
      view = { name: 'breeding' };
      render();
    };
    btns.appendChild(brd);

    var sellBtn = h('button', 'btn', '🪙 Sell — ' + Game.CFG.sellPrice + ' coins');
    sellBtn.onclick = function () {
      askConfirm({
        title: 'Sell ' + p.name + '?',
        body: 'They leave the loft for good and you are paid ' + Game.CFG.sellPrice +
              ' coins. Their pedigree entry stays on file.',
        yes: '🪙 Sell for ' + Game.CFG.sellPrice,
        no: 'Keep them'
      }, function () {
        var r = Game.sell(p.id);
        toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) closeModal();
        render();
      });
    };
    btns.appendChild(sellBtn);

    var rehomeBtn = h('button', 'btn ghost', 'Rehome');
    rehomeBtn.onclick = function () {
      askConfirm({
        title: 'Rehome ' + p.name + '?',
        body: 'They go off to another loft and the perch is freed. No coins change hands. ' +
              'Their pedigree entry stays on file.',
        yes: 'Rehome',
        no: 'Keep them',
        danger: true
      }, function () {
        var r = Game.rehome(p.id);
        toast(r.msg, r.ok ? 'good' : 'bad');
        if (r.ok) closeModal();
        render();
      });
    };
    btns.appendChild(rehomeBtn);

    wrap.appendChild(btns);
    openModal(wrap, true);
  }

  /* ---------- genealogy ---------- */

  function pedNode(node, depth, maxDepth) {
    if (!node) {
      var un = h('div', 'ped-node unknown');
      un.innerHTML = '<div class="ped-name">Unknown</div>';
      return un;
    }
    var p = node.pigeon;
    var ph = Genetics.phenotype(p.genes);
    var box = h('div', 'ped-node ' + p.sex);
    var art = h('div', 'ped-art');
    Sprites.mount(art, p, depth === 0 ? 96 : 56);
    box.appendChild(art);
    var nm = h('div', 'ped-name');
    nm.innerHTML = esc(p.name) + ' <span class="sex ' + p.sex + '">' + sexIcon(p.sex) + '</span>';
    box.appendChild(nm);
    box.appendChild(h('div', 'ped-pheno', ph.name));

    if (depth === 0) {
      // the bird the tree is rooted on — its page is one click away
      box.onclick = function (e) { e.stopPropagation(); openPigeon(p.id); };
      box.title = 'Open ' + p.name + '’s page';
      box.classList.add('ped-root');
    } else if (p.sireId || p.damId) {
      // an ancestor with a pedigree of its own — re-root on it to go further back
      box.onclick = function (e) { e.stopPropagation(); openGenealogy(p.id, true); };
      box.title = 'Follow ' + p.name + '’s line further back';
      box.classList.add('ped-more');
      box.appendChild(h('div', 'ped-follow', 'follow line →'));
    } else {
      box.onclick = function (e) { e.stopPropagation(); openPigeon(p.id); };
      box.title = p.name + ' is a founder — open their page';
      box.classList.add('ped-founder');
    }

    if (depth < maxDepth && (node.sire || node.dam)) {
      var kids = h('div', 'ped-parents');
      var s = h('div', 'ped-branch');
      s.appendChild(h('div', 'ped-tag', 'sire'));
      s.appendChild(pedNode(node.sire, depth + 1, maxDepth));
      var d = h('div', 'ped-branch');
      d.appendChild(h('div', 'ped-tag', 'dam'));
      d.appendChild(pedNode(node.dam, depth + 1, maxDepth));
      kids.appendChild(s); kids.appendChild(d);
      var col = h('div', 'ped-col');
      col.appendChild(box);
      col.appendChild(kids);
      return col;
    }
    return box;
  }

  /* Three generations at a time. To see further back, click an ancestor and
     the tree re-roots on that bird — the trail across the top walks it back. */
  var GEN_DEPTH = 3;
  var genTrail = [];

  function openGenealogy(id, keepTrail) {
    var p = Game.get(id);
    if (!p) return;

    if (!keepTrail) genTrail = [id];
    else {
      var already = genTrail.indexOf(id);
      if (already >= 0) genTrail.length = already + 1;   // stepping back on itself
      else genTrail.push(id);
    }

    var tree = Game.ancestors(id, GEN_DEPTH);
    var wrap = h('div', 'geneal');
    wrap.appendChild(h('h2', null, 'Genealogy — ' + p.name));

    if (genTrail.length > 1) {
      var crumbs = h('div', 'ped-trail');
      genTrail.forEach(function (tid, i) {
        var b = Game.get(tid);
        if (!b) return;
        if (i) crumbs.appendChild(h('span', 'ped-crumb-sep', '→'));
        if (i === genTrail.length - 1) {
          crumbs.appendChild(h('span', 'ped-crumb current', b.name));
        } else {
          var link = h('button', 'ped-crumb', b.name);
          link.onclick = function () { genTrail.length = i; openGenealogy(tid, true); };
          crumbs.appendChild(link);
        }
      });
      wrap.appendChild(crumbs);
    }

    wrap.appendChild(h('p', 'muted',
      'Three generations at a time. Click a grandparent or parent to follow that line further back — ' +
      'ancestors stay on file forever, even after a bird leaves the loft.'));

    if (!p.sireId && !p.damId) {
      wrap.appendChild(h('div', 'panel', p.name + ' is a founder — caught wild or part of your starting pair, so there is no recorded pedigree.'));
    }

    var scroller = h('div', 'ped-scroll');
    scroller.appendChild(pedNode(tree, 0, GEN_DEPTH));
    wrap.appendChild(scroller);

    var back = h('div', 'ped-actions');
    var openBtn = h('button', 'btn ghost small', 'Open ' + p.name + '’s page');
    openBtn.onclick = function () { openPigeon(p.id); };
    back.appendChild(openBtn);
    if (genTrail.length > 1) {
      var up = h('button', 'btn ghost small', '← Back a step');
      up.onclick = function () {
        genTrail.pop();
        openGenealogy(genTrail[genTrail.length - 1], true);
      };
      back.appendChild(up);
    }
    wrap.appendChild(back);

    openModal(wrap, true);
  }

  /* ---------- BREEDING ---------- */

  function eligible(sex) {
    return Game.loftBirds().filter(function (p) { return p.sex === sex && p.stage === 'adult'; });
  }

  function openPicker(sex) {
    var list = eligible(sex);
    var wrap = h('div', 'picker');
    wrap.appendChild(h('h2', null, 'Choose a ' + (sex === 'cock' ? 'cock' : 'hen')));
    if (!list.length) {
      wrap.appendChild(h('p', 'muted', 'No adult ' + (sex === 'cock' ? 'cocks' : 'hens') + ' in the loft.'));
    }
    var grid = h('div', 'picker-grid');
    list.forEach(function (p) {
      var ph = Genetics.phenotype(p.genes);
      var c = h('div', 'pick-card');
      var art = h('div', 'pgn-art-box');
      Sprites.mount(art, p, 96);
      c.appendChild(art);
      c.appendChild(h('div', 'pgn-name', p.name));
      c.appendChild(h('div', 'pgn-pheno', ph.name));
      var why = Game.canBreed(p);
      if (why) { c.classList.add('blocked'); c.appendChild(h('div', 'badge warn', why)); }
      c.onclick = function () {
        if (why) { toast(why, 'bad'); return; }
        if (sex === 'cock') breeding.sireId = p.id; else breeding.damId = p.id;
        closeModal(); render();
      };
      grid.appendChild(c);
    });
    wrap.appendChild(grid);
    openModal(wrap, true);
  }

  function breedSlot(sex) {
    var id = sex === 'cock' ? breeding.sireId : breeding.damId;
    var p = id ? Game.get(id) : null;
    var slot = h('div', 'breed-slot ' + sex);
    slot.appendChild(h('div', 'breed-slot-title', sex === 'cock' ? '♂ Male' : '♀ Female'));

    if (p) {
      var art = h('div', 'pgn-art-box');
      Sprites.mount(art, p, 128);
      slot.appendChild(art);
      slot.appendChild(h('div', 'pgn-name', p.name));
      slot.appendChild(h('div', 'pgn-pheno', Genetics.phenotype(p.genes).name));
      var d = Genetics.describe(p);
      if (d.carried.length) slot.appendChild(h('div', 'small muted', 'carries ' + d.carried.join(', ')));
      var ch = h('button', 'btn ghost small', 'Change');
      ch.onclick = function () { openPicker(sex); };
      slot.appendChild(ch);
    } else {
      var e = h('div', 'breed-empty');
      e.innerHTML = '<div class="perch">＋</div><div class="muted">Click to choose</div>';
      slot.appendChild(e);
      slot.onclick = function () { openPicker(sex); };
      slot.classList.add('clickable');
    }
    return slot;
  }

  function predictionTable(sire, dam) {
    var pred = Genetics.predict(sire, dam);
    var wrap = h('div', 'predict');
    wrap.appendChild(h('h3', null, 'Predicted young'));
    wrap.appendChild(h('p', 'muted',
      'Exact odds, worked out from every possible gamete combination. Each column sums to 100% ' +
      'and each chick is 50% likely to be of that sex. The columns differ whenever a sex-linked gene is in play.'));

    var cols = h('div', 'predict-cols');
    [['cock', '♂ Sons'], ['hen', '♀ Daughters']].forEach(function (pair) {
      var sex = pair[0];
      var col = h('div', 'predict-col');
      col.appendChild(h('h4', null, pair[1]));
      pred[sex].forEach(function (o) {
        var row = h('div', 'predict-row');
        var art = h('div', 'predict-art');
        Sprites.mount(art, { id: 'pred' + sex + o.name, name: o.name, genes: o.genes, stage: 'adult' }, 64);
        row.appendChild(art);
        var meta = h('div', 'predict-meta');
        meta.appendChild(h('div', 'predict-name', o.name));
        if (o.white && o.hiddenList && o.hiddenList.length) {
          var names = o.hiddenList.slice(0, 3).map(function (x) { return x.name; });
          var extra = o.hiddenList.length - names.length;
          meta.appendChild(h('div', 'small muted',
            'hiding ' + names.join(', ') + (extra > 0 ? ' or ' + extra + ' other' + (extra > 1 ? 's' : '') : '')));
        }
        row.appendChild(meta);
        row.appendChild(h('div', 'predict-pct', pct(o.p)));
        col.appendChild(row);
      });
      cols.appendChild(col);
    });
    wrap.appendChild(cols);
    return wrap;
  }

  function renderBreeding() {
    var S = Game.state();
    $screen.innerHTML = '';

    // A slotted bird can stop being eligible while you are looking at it —
    // sold, rehomed, or flipped by a Sex Changer. Drop it rather than pair it.
    if (breeding.sireId) {
      var sc = Game.get(breeding.sireId);
      if (!sc || sc.sex !== 'cock' || S.loft.indexOf(sc.id) < 0) breeding.sireId = null;
    }
    if (breeding.damId) {
      var dc = Game.get(breeding.damId);
      if (!dc || dc.sex !== 'hen' || S.loft.indexOf(dc.id) < 0) breeding.damId = null;
    }

    var head = h('div', 'screen-head');
    var back = h('button', 'btn ghost small', '← Back to loft');
    back.onclick = function () { view = { name: 'loft' }; render(); };
    head.appendChild(back);
    head.appendChild(h('h1', null, 'Breeding'));
    $screen.appendChild(head);

    var pairRow = h('div', 'breed-row');
    pairRow.appendChild(breedSlot('cock'));
    var amp = h('div', 'breed-amp', '×');
    pairRow.appendChild(amp);
    pairRow.appendChild(breedSlot('hen'));
    $screen.appendChild(pairRow);

    var sire = breeding.sireId ? Game.get(breeding.sireId) : null;
    var dam = breeding.damId ? Game.get(breeding.damId) : null;

    if (sire && dam) {
      var rel = Game.relation(sire.id, dam.id);
      if (rel) $screen.appendChild(h('div', 'panel warn-panel',
        'These two are ' + rel + '. Line-breeding fixes recessives fast — it is also how you find them.'));

      var panel = h('div', 'panel');
      panel.appendChild(predictionTable(sire, dam));
      $screen.appendChild(panel);

      var act = h('div', 'breed-actions');
      if (S.nest) {
        act.appendChild(h('p', 'muted', 'There is already a clutch in the nest. Hatch it first.'));
        var hb = h('button', 'btn', 'Hatch now');
        hb.onclick = function () { var r = Game.hatchNow(); toast(r.msg, r.ok ? 'good' : 'bad'); render(); };
        act.appendChild(hb);
      } else {
        var err = Game.canBreed(sire) || Game.canBreed(dam) || Game.breedingSpaceError();
        var go = h('button', 'btn big', '🥚 Breed this pair');
        if (err) { go.disabled = true; act.appendChild(h('p', 'warn-text', err)); }
        go.onclick = function () {
          var r = Game.breed(sire.id, dam.id);
          toast(r.msg, r.ok ? 'good' : 'bad');
          render();
        };
        act.appendChild(go);
        act.appendChild(h('p', 'muted',
          '30 minute gestation. The hen then goes on a ' + Math.round(Game.CFG.henCooldownMs / 60000) +
          ' minute cooldown; the cock is free to pair again immediately.'));
      }
      $screen.appendChild(act);
    } else {
      $screen.appendChild(h('div', 'panel', 'Pick a cock and a hen to see exactly what they can throw.'));
    }

    if (S.nest) {
      var nsire = Game.get(S.nest.sireId), ndam = Game.get(S.nest.damId);
      var nest = h('div', 'panel nest-panel');
      var ni = h('div', 'nest-info');
      ni.appendChild(h('h3', null, '🥚 In the nest'));
      ni.appendChild(h('p', 'muted', (nsire ? nsire.name : '?') + ' × ' + (ndam ? ndam.name : '?') +
        ' — ' + S.nest.count + ' squab' + (S.nest.count > 1 ? 's' : '')));
      var t = h('p', 'nest-timer');
      t.appendChild(document.createTextNode('Hatching in '));
      t.appendChild(countdown(S.nest.hatchAt, ''));
      ni.appendChild(t);
      nest.appendChild(ni);
      var hb2 = h('button', 'btn small', 'Hatch now');
      hb2.onclick = function () { var r = Game.hatchNow(); toast(r.msg, r.ok ? 'good' : 'bad'); render(); };
      nest.appendChild(hb2);
      $screen.appendChild(nest);
    }
  }

  /* ---------- root render ---------- */

  function render() {
    renderTop();
    renderNav();
    if (view.name === 'loft') renderLoft();
    else if (view.name === 'farm') renderFarm();
    else if (view.name === 'explore') renderExplore();
    else if (view.name === 'location') renderLocation();
    else if (view.name === 'shop') renderShop();
    else if (view.name === 'breeding') renderBreeding();
    renderInv();
    renderHeld();   // keeps the ×count on the cursor honest after any change
  }

  function go(name) {
    view = { name: name };
    if (name === 'breeding') breeding = { sireId: null, damId: null };
    render();
  }

  /* ---------- countdown ticking ---------- */

  function tickCountdowns() {
    var els = document.querySelectorAll('.countdown');
    for (var i = 0; i < els.length; i++) {
      var until = parseInt(els[i].dataset.until, 10);
      els[i].textContent = (els[i].dataset.prefix || '') + Game.fmtTime(until - Date.now());
    }
  }

  /* ---------- boot ---------- */

  function init() {
    $top = document.getElementById('topbar');
    $nav = document.getElementById('nav');
    $screen = document.getElementById('screen');
    $inv = document.getElementById('inv-overlay');
    $modal = document.getElementById('modal');
    $confirm = document.getElementById('confirm');
    $held = document.getElementById('held');
    $toast = document.getElementById('toast-wrap');

    $nav.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'btn-inv') { toggleInv(); return; }
      if (b.dataset.screen) go(b.dataset.screen);
    });

    document.getElementById('btn-reset').onclick = function () {
      askConfirm({
        title: 'Start a brand new loft?',
        body: 'Your current birds, pedigrees, coins and items are erased for good.',
        yes: 'Erase and start over',
        no: 'Cancel',
        danger: true
      }, function () {
        Game.reset();
        view = { name: 'loft' };
        render();
        toast('New loft started.');
      });
    };

    $modal.addEventListener('click', function (e) { if (e.target === $modal) closeModal(); });
    $confirm.addEventListener('click', function (e) { if (e.target === $confirm) closeConfirm(); });
    $inv.addEventListener('click', function (e) { if (e.target === $inv) toggleInv(false); });

    document.addEventListener('mousemove', function (e) {
      if (!held) return;
      $held.style.left = (e.clientX + 14) + 'px';
      $held.style.top = (e.clientY + 14) + 'px';
    });

    document.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.pgn-card') || e.target.closest('.pick-card')) return; // handled per-card
      if (e.target.closest('.plot')) return;
      if (held || scytheOn) { e.preventDefault(); dropHeld(); toast('Put it away.'); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$confirm.classList.contains('hidden')) { closeConfirm(); return; }
        if (held || scytheOn) { dropHeld(); return; }
        if (!$modal.classList.contains('hidden')) { closeModal(); return; }
        if (invOpen) toggleInv(false);
      }
      if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.metaKey) toggleInv();
    });

    Sprites.setOnLoad(function () { render(); });

    Game.load();
    Game.refreshAll();
    Game.save();
    render();

    var lastFarmSig = farmSignature();
    setInterval(function () {
      tickCountdowns();
      if (Game.tickTimers()) { lastFarmSig = farmSignature(); render(); return; }
      // crops change stage on their own; redraw the farm only when one crosses
      var sig = farmSignature();
      if (sig !== lastFarmSig) {
        lastFarmSig = sig;
        if (view.name === 'farm') { render(); return; }
      }
      renderTop();
    }, 1000);
  }

  return { init: init, render: render, openPigeon: openPigeon, toast: toast };
})();
