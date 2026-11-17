/* Procedural motion: a seconds clock (Value node) feeding JavaScript Utility nodes, whose outputs are
   connected to layer attributes. This is how a recipe that is a formula, not a keyframe list, can survive
   the port (for example a damped camera settle).

   Nothing here is guessed: the clock is a keyed Value node, the utility input is `array.0` (n0), and every
   connection is verified through api.getInConnection when the host exposes it. A host that cannot create the
   nodes makes connect() throw, which the runtime records in report.errors instead of building a silent no-op. */
var JZProcedural = (function () {
'use strict';

var clockId = null;
var created = [];
var ready = false;
var reason = 'not started';

function linearKey(layerId, attr, frame, value) {
  var values = {};
  values[attr] = value;
  api.keyframe(layerId, frame, values);
  var interpolation = {};
  interpolation[attr] = { frame: frame, type: 1 };
  api.modifyKeyframe(layerId, interpolation);
}

/* One clock per composition; returns the node id, or null when this host cannot make the clock. */
function begin(comp) {
  created = [];
  clockId = null;
  ready = false;
  try {
    clockId = api.create('value', 'JIZURA / Seconds');
    if (!clockId) throw new Error('api.create("value") returned no id');
    api.setInFrame(clockId, 0);
    api.setOutFrame(clockId, comp.frameCount - 1);
    linearKey(clockId, 'value', 0, 0);
    if (comp.frameCount > 1) linearKey(clockId, 'value', comp.frameCount - 1, (comp.frameCount - 1) / comp.fps);
    created.push(clockId);
    ready = true;
    reason = '';
    return clockId;
  } catch (e) {
    clockId = null;
    reason = 'seconds clock unavailable (' + (e && e.message || e) + ')';
    if (typeof console !== 'undefined' && console.warn) console.warn('JIZURA: ' + reason);
    return null;
  }
}

function reset() {
  created = [];
  clockId = null;
  ready = false;
}

/* Connect a formula to one attribute of one layer. `expression` is the body of a JavaScript Utility:
   n0 is the seconds clock. Throws on any missing host capability. */
function connect(targetId, attribute, expression, cut, name) {
  if (!ready || !clockId) throw new Error('Procedural clock is not initialised' + (reason ? ': ' + reason : ''));
  var id = api.create('javaScript', name || ('JIZURA / ' + attribute));
  if (!id) throw new Error('api.create("javaScript") returned no id');
  if (typeof api.getArrayCount === 'function' && api.getArrayCount(id, 'array') < 1) {
    throw new Error('JavaScript n0 input is unavailable');
  }
  api.set(id, { expression: expression });
  api.setInFrame(id, cut.start);
  api.setOutFrame(id, cut.end - 1);
  api.connect(clockId, 'id', id, 'array.0', true);
  api.connect(id, 'id', targetId, attribute, true);
  if (typeof api.getInConnection === 'function' && !api.getInConnection(targetId, attribute)) {
    throw new Error('Missing procedural connection: ' + targetId + '.' + attribute);
  }
  created.push(id);
  return id;
}

return {
  begin: begin,
  connect: connect,
  reset: reset,
  available: function () { return ready; },
  created: function () { return created.slice(); }
};
})();
