/* Loader <-> panel bridge over Cavalry's WebServer / WebClient.
   Both APIs are documented, but this build was written with Cavalry closed, so every call is guarded and a
   failure is not fatal: the panel and the loader each build a JSON they were given, on their own. */
var JZBridge = (function () {
'use strict';
var PORT = 41234, VERSION = 'JIZURA_CV/1';

function hasServer() { return typeof api !== 'undefined' && typeof api.WebServer === 'function'; }
function hasClient() { return typeof api !== 'undefined' && typeof api.WebClient === 'function'; }

/* Panel side: listen for posted assemblies. Returns false when the host has no WebServer. */
var bound = null;
function start(onMessage) {
  if (!hasServer()) return false;
  if (bound) return true;
  var server;
  try {
    server = new api.WebServer();
    if (typeof server.setResultForGet === 'function') server.setResultForGet(VERSION);
    if (typeof server.addCallbackObject === 'function') server.addCallbackObject({
      onPost: function () {
        try {
          var guard = 0;
          while (typeof server.postCount === 'function' && server.postCount() > 0 && guard++ < 16) {
            var post = server.getNextPost();
            var text = post && (post.result != null ? post.result : post.body);
            if (text == null) continue;
            var msg = typeof text === 'string' ? JSON.parse(text) : text;
            if (!msg) continue;
            var assembly = msg.path ? JSON.parse(api.readFromFile(msg.path)) : msg.assembly;
            if (assembly) onMessage(assembly, msg);
          }
        } catch (e) { console.warn('JIZURA bridge: ' + (e && e.message || e)); }
      }
    });
    if (typeof server.listen === 'function') server.listen('localhost', PORT);
    if (typeof server.setHighFrequency === 'function') server.setHighFrequency();
    bound = server;
    return true;
  } catch (e) {
    console.warn('JIZURA bridge: WebServer unavailable (' + (e && e.message || e) + '). Pick the JSON in the panel instead.');
    return false;
  }
}

/* Loader side: send the file path when a panel answers, otherwise return false and let the loader build. */
function handoff(file) {
  if (!hasClient()) return false;
  try {
    var client = new api.WebClient('http://localhost:' + PORT);
    client.get('/get');
    if (typeof client.status === 'function' && client.status() !== 200) return false;
    var body = typeof client.body === 'function' ? String(client.body() || '') : '';
    if (body.indexOf('JIZURA_CV') !== 0) return false;
    client.post('/post', JSON.stringify({ type: 'path', path: file }), 'application/json');
    return typeof client.status !== 'function' || client.status() === 200;
  } catch (e) {
    return false;
  }
}

return { version: VERSION, port: PORT, start: start, handoff: handoff, server: hasServer, client: hasClient };
})();
