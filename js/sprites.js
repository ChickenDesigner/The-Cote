/* ============================================================
   THE COTE — sprite renderer

   Two paths:
     1. If assets/pigeons/<key>.gif (or .png) exists it is used directly,
        so your animated GIFs drop straight in. See assets/pigeons/README.txt
        for the filenames.
     2. Otherwise a built-in pixel pigeon is rasterised from the genotype,
        so every possible colour combination has art.
   ============================================================ */

var Sprites = (function () {
  'use strict';

  var W = 32, H = 30;
  var ASSET_DIR = 'assets/pigeons/';
  var onLoadCb = null;
  var IMG = {}; // key -> { state, img }

  /* ---------- image overrides ---------- */

  function requestImage(key) {
    if (IMG[key]) return IMG[key];
    var rec = { state: 'pending', img: new Image(), tried: 0 };
    IMG[key] = rec;
    var exts = ['.gif', '.png'];
    rec.img.onload = function () { rec.state = 'ok'; if (onLoadCb) onLoadCb(); };
    rec.img.onerror = function () {
      rec.tried++;
      if (rec.tried < exts.length) rec.img.src = ASSET_DIR + key + exts[rec.tried];
      else rec.state = 'fail';
    };
    rec.img.src = ASSET_DIR + key + exts[0];
    return rec;
  }

  function findImage(candidates) {
    for (var i = 0; i < candidates.length; i++) {
      var rec = requestImage(candidates[i]);
      if (rec.state === 'ok') return rec.img;
    }
    return null;
  }

  /* ---------- colour helpers ---------- */

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function rgbToHex(r) {
    function c(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
    return '#' + c(r[0]) + c(r[1]) + c(r[2]);
  }
  function shade(hex, amt) {
    var c = hexToRgb(hex);
    if (amt < 0) return rgbToHex([c[0] * (1 + amt), c[1] * (1 + amt), c[2] * (1 + amt)]);
    return rgbToHex([c[0] + (255 - c[0]) * amt, c[1] + (255 - c[1]) * amt, c[2] + (255 - c[2]) * amt]);
  }

  /* ---------- series palettes ---------- */

  var SERIES = {
    blue: {
      intense: { pig: '#242a45', ground: '#a6adcb', wing: '#b2b8d5', belly: '#ccd1e3', neck: '#2e6b51', flight: '#5b6488', head: '#a6adcb', darkBeak: true },
      pale:    { pig: '#5a6280', ground: '#bcc2d9', wing: '#c6cbdf', belly: '#dbdeeb', neck: '#5c8b76', flight: '#8188a5', head: '#bcc2d9', darkBeak: true },
      dilute:  { pig: '#8e94ac', ground: '#d3d7e6', wing: '#dcdfec', belly: '#e9ebf3', neck: '#8fa89b', flight: '#aeb4c8', head: '#d3d7e6', darkBeak: false }
    },
    ashred: {
      intense: { pig: '#8e4f54', ground: '#b7bbd1', wing: '#c3c6d9', belly: '#d9dbe7', neck: '#8e4f54', flight: '#a08087', head: '#b0b4cc', darkBeak: true },
      pale:    { pig: '#b0787a', ground: '#c9ccdd', wing: '#d3d5e3', belly: '#e3e4ee', neck: '#b0787a', flight: '#bda1a4', head: '#c2c5d8', darkBeak: false },
      dilute:  { pig: '#c8a084', ground: '#dcdee9', wing: '#e4e5ee', belly: '#eff0f5', neck: '#c8a084', flight: '#d3c1b0', head: '#d7d9e6', darkBeak: false }
    },
    brown: {
      intense: { pig: '#6a4530', ground: '#b8a48d', wing: '#c4b29d', belly: '#d5c8b6', neck: '#6a4530', flight: '#8d7259', head: '#b3a08a', darkBeak: false },
      pale:    { pig: '#8c6c53', ground: '#c8b8a4', wing: '#d2c4b2', belly: '#e0d6c7', neck: '#8c6c53', flight: '#a89179', head: '#c3b4a1', darkBeak: false },
      dilute:  { pig: '#a08b70', ground: '#d8cebd', wing: '#e0d8ca', belly: '#eae4d9', neck: '#a08b70', flight: '#c0b39d', head: '#d5cbba', darkBeak: false }
    },
    recred: {
      intense: { pig: '#7c413a', ground: '#a55d51', wing: '#ab6558', belly: '#bb7a6f', neck: '#8d4c42', flight: '#8b4a41', head: '#a86257', darkBeak: false },
      pale:    { pig: '#9a6152', ground: '#bb7c6b', wing: '#c28a77', belly: '#d09b8a', neck: '#a86a59', flight: '#a86a5b', head: '#bf8171', darkBeak: false },
      dilute:  { pig: '#b4835a', ground: '#d9a878', wing: '#dfb287', belly: '#e8c49d', neck: '#c39468', flight: '#c1905f', head: '#dcac7d', darkBeak: false }
    },
    white: {
      intense: { pig: '#c9cddc', ground: '#ebecf2', wing: '#f2f2f7', belly: '#f8f8fb', neck: '#dfe1ec', flight: '#d8dbe7', head: '#eeeff4', darkBeak: false },
      pale:    { pig: '#c9cddc', ground: '#ebecf2', wing: '#f2f2f7', belly: '#f8f8fb', neck: '#dfe1ec', flight: '#d8dbe7', head: '#eeeff4', darkBeak: false },
      dilute:  { pig: '#c9cddc', ground: '#ebecf2', wing: '#f2f2f7', belly: '#f8f8fb', neck: '#dfe1ec', flight: '#d8dbe7', head: '#eeeff4', darkBeak: false }
    }
  };

  var LEG = '#cf3f7e', LEG_DARK = '#a52c62', TOE = '#f7b17a';
  var CERE = '#e8eaf2';

  function palette(ph) {
    var base = SERIES[ph.seriesKey] || SERIES.blue;
    var src = base[ph.dil] || base.intense;
    var p = {};
    for (var k in src) p[k] = src[k];

    if (ph.patternSprite === 'spread') {
      // Spread smears the tail-bar pigment over the whole bird.
      p.ground = p.pig;
      p.wing = shade(p.pig, 0.10);
      p.belly = shade(p.pig, 0.18);
      p.head = shade(p.pig, 0.16);
      p.flight = shade(p.pig, -0.20);
      if (ph.seriesKey === 'blue') p.neck = shade('#2e6b51', ph.dil === 'dilute' ? 0.35 : -0.1);
      else p.neck = shade(p.pig, 0.02);
      p.darkBeak = (ph.seriesKey === 'blue');
    }

    p.outline = shade(p.ground, -0.30);
    p.pattern = p.pig;
    p.beak = p.darkBeak ? '#232840' : '#f6b276';
    p.beakTip = p.darkBeak ? '#141828' : '#e0904f';
    p.cere = CERE;
    // orange = wild type, pearl = no pteridine so only the white guanine
    // crystals show, bull = no stromal pigment cells at all.
    p.iris = ph.eye === 'bull' ? '#2f2740' : (ph.eye === 'pearl' ? '#f4efe0' : '#c8642a');
    p.pupil = ph.eye === 'bull' ? '#14121f' : '#17172a';
    p.eyeRing = ph.eye === 'bull' ? '#4a3f5e' : shade(p.head, -0.12);
    return p;
  }

  /* ---------- geometry ---------- */

  function inEll(x, y, cx, cy, rx, ry, rot) {
    var dx = x - cx, dy = y - cy;
    if (rot) {
      var c = Math.cos(-rot), s = Math.sin(-rot);
      var nx = dx * c - dy * s, ny = dx * s + dy * c;
      dx = nx; dy = ny;
    }
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }

  function inTri(px, py, ax, ay, bx, by, cx, cy) {
    function sign(x1, y1, x2, y2, x3, y3) { return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3); }
    var d1 = sign(px, py, ax, ay, bx, by);
    var d2 = sign(px, py, bx, by, cx, cy);
    var d3 = sign(px, py, cx, cy, ax, ay);
    var neg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    var pos = (d1 > 0) || (d2 > 0) || (d3 > 0);
    return !(neg && pos);
  }

  var WING = { cx: 16.8, cy: 15.8, rx: 9.2, ry: 4.9, rot: 0.20 };

  function wingLocal(x, y) {
    var dx = x - WING.cx, dy = y - WING.cy;
    var c = Math.cos(-WING.rot), s = Math.sin(-WING.rot);
    return { u: dx * c - dy * s, v: dx * s + dy * c };
  }

  function patternHit(x, y, kind) {
    if (kind === 'barless' || kind === 'spread' || kind === 'self') return false;
    var l = wingLocal(x, y);
    var u = l.u, v = l.v;

    if (kind === 'bar') {
      return (u >= 1.2 && u <= 2.8) || (u >= 4.4 && u <= 6.0);
    }
    if (kind === 'check') {
      if (u < -3.0) return false;
      var gu = Math.floor((u + 12) / 2.0);
      var gv = Math.floor((v + 8) / 1.7);
      return (gu + gv) % 2 === 0;
    }
    if (kind === 'tcheck') {
      if (u < -7.5) return false;
      var gu2 = Math.floor((u + 12) / 1.55);
      var gv2 = Math.floor((v + 8) / 1.35);
      return (gu2 + gv2) % 3 !== 0;
    }
    return false;
  }

  /* ---------- adult rasteriser ---------- */

  function rasterAdult(ph) {
    var p = palette(ph);
    var buf = [];
    var y, x;
    for (y = 0; y < H; y++) { buf.push(new Array(W)); }

    function set(x, y, c) { if (x >= 0 && x < W && y >= 0 && y < H) buf[y][x] = c; }

    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        var px = x + 0.5, py = y + 0.5, c = null;

        // tail / primaries sweeping back to the right
        if (px >= 15.5 && inEll(px, py, 24.0, 20.0, 8.6, 3.0, 0.32)) c = p.flight;

        // body
        if (inEll(px, py, 14.5, 17.0, 10.5, 6.8)) c = p.ground;

        // pale underside
        if (c && inEll(px, py, 12.5, 20.6, 8.5, 3.6)) c = p.belly;

        // wing shield
        if (inEll(px, py, WING.cx, WING.cy, WING.rx, WING.ry, WING.rot)) {
          c = p.wing;
          if (patternHit(px, py, ph.patternSprite)) c = p.pattern;
        }

        // folded flight feathers along the bottom of the shield
        if (inEll(px, py, 20.6, 19.4, 7.6, 2.3, 0.30) && !inEll(px, py, 13.0, 20.6, 7.0, 3.2)) c = p.flight;

        // neck
        if (inEll(px, py, 10.8, 12.0, 4.6, 3.7)) c = p.neck;

        // head
        if (inEll(px, py, 9.6, 7.2, 4.7, 4.6)) c = p.head;

        // beak
        if (inTri(px, py, 0.9, 8.2, 7.0, 6.7, 7.0, 9.6)) c = (px < 3.0 ? p.beakTip : p.beak);

        if (c) buf[y][x] = c;
      }
    }

    // cere — the small pale wattle where the beak meets the face
    set(5, 6, p.cere); set(6, 6, p.cere); set(6, 7, p.cere);

    // eye — hand-placed, it is far too small to leave to a rasteriser
    var sclera = shade(p.head, p.darkBeak ? 0.55 : 0.42);
    set(10, 6, sclera); set(11, 6, sclera); set(12, 6, sclera);
    set(10, 7, sclera); set(11, 7, sclera); set(12, 7, sclera);
    set(11, 6, p.pupil);
    set(12, 6, p.iris);
    set(11, 5, p.eyeRing); set(12, 5, p.eyeRing);

    // legs & feet
    for (y = 23; y <= 26; y++) { set(14, y, LEG); }
    set(14, 26, LEG_DARK);
    for (x = 11; x <= 17; x++) set(x, 27, LEG);
    set(13, 27, LEG_DARK); set(14, 27, LEG_DARK); set(15, 27, LEG_DARK);
    set(11, 27, TOE); set(17, 27, TOE);

    // silhouette outline
    var out = [];
    for (y = 0; y < H; y++) out.push(buf[y].slice());
    for (y = 0; y < H; y++) {
      for (x = 0; x < W; x++) {
        if (buf[y][x]) continue;
        var n = (y > 0 && buf[y - 1][x]) || (y < H - 1 && buf[y + 1][x]) ||
                (x > 0 && buf[y][x - 1]) || (x < W - 1 && buf[y][x + 1]);
        if (n) out[y][x] = p.outline;
      }
    }
    return out;
  }

  /* ---------- squab rasteriser ---------- */

  /* The squab art itself, embedded so it renders even with no assets folder
     (the plumage gallery and any offline copy included). If
     assets/pigeons/squab.gif|png exists, that file wins. */
  var SQUAB_ART = 'data:image/png;base64,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AAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAAAIQgAAEIAABCEAAAhCAAAQgAAEIQAACEIAABCAAAQhAIEfg/5YsBWdt+8NNAAAAAElFTkSuQmCC';

  /* ---------- toy stencil overlay ---------- */

  /* Drawn as a separate layer stacked over whatever art the bird already has,
     so the base sprite — built-in or a supplied GIF — is never altered.
     It paints the wing markings taken from the PATTERN locus directly, which
     is how toy stencil prints through spread and recessive red. */

  var STENCIL_COLOUR = {
    full:    '#f7f3e6',   // white
    partial: '#e9d9ab',   // cream
    bronze:  '#b07a33'    // bronze only, no whitening
  };

  function stencilLayer(ph, boxW, boxH, scale) {
    var cv = document.createElement('canvas');
    cv.className = 'pgn-stencil';
    cv.width = W * scale;
    cv.height = H * scale;
    cv.style.width = boxW + 'px';
    cv.style.height = boxH + 'px';

    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = STENCIL_COLOUR[ph.stencil] || STENCIL_COLOUR.full;

    var kind = ph.stencilPattern;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var px = x + 0.5, py = y + 0.5;
        if (!inEll(px, py, WING.cx, WING.cy, WING.rx, WING.ry, WING.rot)) continue;
        if (!patternHit(px, py, kind)) continue;
        // the complex characteristically leaves the rear edge of each bar coloured
        if (kind === 'bar' && ph.stencil !== 'bronze') {
          var u = wingLocal(px, py).u;
          if (u > 2.3 || (u > 5.5 && u <= 6.0)) continue;
        }
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return cv;
  }

  /* ---------- painting ---------- */

  function paint(canvas, grid, scale) {
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var c = grid[y][x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  /**
   * Replace the contents of `container` with art for this pigeon.
   * size = target pixel width on screen.
   */
  function mount(container, pigeon, size) {
    container.innerHTML = '';
    var ph = Genetics.phenotype(pigeon.genes);
    var isSquab = pigeon.stage === 'squab';

    // Base art goes in a stack so extra layers can sit over it untouched.
    var stack = document.createElement('div');
    stack.className = 'pgn-stack';
    container.appendChild(stack);

    var scale = Math.max(1, Math.round(size / W));

    function useImage(src) {
      var el = document.createElement('img');
      el.className = 'pgn-art';
      el.src = src;
      el.alt = pigeon.name;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      stack.appendChild(el);
      return { w: size, h: size };
    }

    // Squabs are always the one piece of art — the asset file if it is there,
    // otherwise the copy embedded above. Never the genotype renderer.
    if (isSquab) {
      var sq = findImage(['squab']);
      useImage(sq ? sq.src : SQUAB_ART);
      return;
    }

    var box;
    var img = findImage(Genetics.spriteCandidates(ph));
    if (img) {
      box = useImage(img.src);
    } else {
      var cv = document.createElement('canvas');
      cv.className = 'pgn-art';
      cv.style.width = (W * scale) + 'px';
      cv.style.height = (H * scale) + 'px';
      paint(cv, rasterAdult(ph), scale);
      stack.appendChild(cv);
      box = { w: W * scale, h: H * scale };
    }

    if (ph.stencilVisible) stack.appendChild(stencilLayer(ph, box.w, box.h, scale));
  }

  function setOnLoad(cb) { onLoadCb = cb; }

  return { mount: mount, setOnLoad: setOnLoad, palette: palette, SERIES: SERIES };
})();
