/* Hold recipes as glyph samplers. xkTallBreath: the line grows taller about its baseline (columns: about the centre) on a 3.8 s breath,
   ported from the earlier Cavalry hold pack that followed ae/p_x2_hold.jsx. The pivot is the glyph bounds, not a host bbox. */
(function (R) {
'use strict';
R.motion('hold', 'xkTallBreath', 'ae/p_x2_hold.jsx: xkTallBreath', function (a, g, gs, e) {
  var b = R.bounds(gs), V = !!e.node.vertical, px = (b.x0 + b.x1) / 2, pyUp = V ? -(b.y0 + b.y1) / 2 : -b.y1;
  var u = ((e.t / 3.8) % 1 + 1) % 1, w = u < .62 ? -(Math.cos(Math.PI * u / .62) - 1) / 2 : 1 + (Math.cos(Math.PI * (u - .62) / .38) - 1) / 2;
  var k = 1 + .1 * w * a * Math.max(0, Math.min(1.6, e.M / .7)), sx = V ? k : 1, sy = V ? 1 : k;
  var gx = g.x + (g.vx || 0), gyUp = -(g.y + (g.vy || 0));
  return { dx: (1 - sx) * (px - gx), dy: -((1 - sy) * (pyUp - gyUp)), sx: g.r90 ? sy : sx, sy: g.r90 ? sx : sy };
});
})(JZRecipeTools);
