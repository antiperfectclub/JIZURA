/*
 * One executable registry. JZPresets is a compatibility name,
 * not a second collection or a lower-fidelity implementation.
 */
(function () {
'use strict';
var nativeRegistry = JZNative;
var compatibility = JZPresets;

['register', 'get', 'manifest'].forEach(function (key) {
  if (nativeRegistry[key] !== compatibility[key]) {
    throw new Error('Registry divergence before integration: ' + key);
  }
});

['resolve', 'build', 'built'].forEach(function (key) {
  if (typeof compatibility[key] !== 'function') {
    throw new Error('Missing registry interface: ' + key);
  }
  nativeRegistry[key] = compatibility[key];
});

JZPresets = nativeRegistry;

if (JZPresets !== JZNative) {
  throw new Error('Cavalry registry integration failed');
}
})();
