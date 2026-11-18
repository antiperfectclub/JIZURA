/*
 * Additional core recipes from src/05_anim.js.
 * Real glyph transforms, blur channels, clipping and wipe bars.
 * No substring aliases and no fade-only blur substitute.
 */
(function (N, R, V) {
'use strict';

var E = R.E;
var clamp = R.clamp;

function inOutExpo(x) {
  x = clamp(x);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

function register(group, key, factory, differences) {
  N.register(group, key, {
    source: 'src/05_anim.js / ' + group + ':' + key,
    scope: 'glyph+graphics',
    differences: differences || [],
    build: function (c) {
      var sample = factory(c);
      return function (s, g, gs, frame) {
        var timing = V.envelope(c, c.node, frame);
        sample(s, g, gs, group === 'enter' ? timing.pin : timing.pout, frame);
      };
    }
  });
}

/* Item-level size/tracking changes become glyph position + scale tracks. */
function resize(s, g, node, scale, tracking) {
  var alignment = node.align || 'center';
  var rank = alignment === 'left' ? g.ci
    : alignment === 'right' ? g.ci - g.n + 1
    : g.ci - (g.n - 1) / 2;
  var extra = rank * tracking * node.size * scale;

  s.dx += (g.x + (g.vx || 0)) * (scale - 1);
  s.dy += (g.y + (g.vy || 0)) * (scale - 1);

  if (node.vertical) s.dy += extra;
  else s.dx += extra;

  s.sx *= scale;
  s.sy *= scale;
}

register('enter', 'blur', function (c) {
  return function (s, g, gs, p) {
    var e = E.outCubic(p);
    resize(s, g, c.node, 1 + 0.18 * (1 - e), 0.5 * (1 - e));
    s.blur = (s.blur || 0) + (1 - e) * 26;
    s.a *= Math.pow(e, 0.7);
  };
}, ['Uses the existing Gaussian-blur component.',
  'Emission requires the explicit verified blur host profile.',
  'No unblurred substitute is emitted.']);

register('enter', 'zoom', function (c) {
  return function (s, g, gs, p) {
    var e = E.outExpo(p);
    resize(s, g, c.node, 1.7 - 0.7 * e, 0);
    s.blur = (s.blur || 0) + (1 - e) * 14;
    s.a *= Math.min(1, p * 4);
  };
}, ['Emission requires the explicit verified Gaussian-blur host profile.']);

register('exit', 'blur', function (c) {
  return function (s, g, gs, p) {
    var e = E.inQuad(p);
    resize(s, g, c.node, 1 + e * 0.2, 0);
    s.blur = (s.blur || 0) + e * 30;
    s.a *= 1 - e;
  };
}, ['Emission requires the explicit verified Gaussian-blur host profile.']);

register('exit', 'shrink', function (c) {
  return function (s, g, gs, p) {
    var e = E.inCubic(p);
    resize(s, g, c.node, 1 - e * 0.96, -e * 0.2);
    s.a *= 1 - e * e;
  };
});

['enter', 'exit'].forEach(function (group) {
  register(group, 'wipe', function (c) {
    var node = c.node;
    var b = V.bounds(V.glyphs(c, node));
    var x0 = b.x0 - node.size * 0.2;
    var x1 = b.x1 + node.size * 0.2;
    var pad = Math.max(4000, c.comp.width * 2, c.comp.height * 2);
    var direction = group === 'exit' ? 1 : ((node.seed | 0) % 2 ? 1 : -1);
    var parent = V.local(c, node, group + ' wipe');
    var height = b.h * 1.3 + node.size * 0.2;
    var width = Math.max(1, node.size * 0.025);

    var bar = V.rect(c, group + ' wipe bar',
      -width / 2, b.cy - height / 2, width, height,
      { fill: c.sc.accent || c.sc.fg }, parent);

    function edge(p) {
      var e = inOutExpo(p);
      return direction > 0 ? R.mix(x0, x1, e) : R.mix(x1, x0, e);
    }

    V.animate(c, bar, function (env, frame) {
      var timing = V.envelope(c, node, frame);
      var p = group === 'enter' ? timing.pin : timing.pout;
      return { 'position.x': edge(p), alpha: p > 0 && p < 1 ? 1 : 0 };
    });

    return function (s, g, gs, p) {
      var x = edge(p);
      if (group === 'enter') {
        s.clipPolygon = direction > 0
          ? V.polygon(x0 - pad, b.y0 - pad, x, b.y1 + pad)
          : V.polygon(x, b.y0 - pad, x1 + pad, b.y1 + pad);
      } else {
        s.clipPolygon = V.polygon(x, b.y0 - pad, x1 + pad, b.y1 + pad);
      }
    };
  }, ['Editable wipe bar plus animated glyph clipping.',
    'Clipping uses the existing JavaScript Deformer component.',
    'Actual host/render verification remains pending.']);
});
})(JZNative, JZRecipeTools, JZRecipeComponents);
