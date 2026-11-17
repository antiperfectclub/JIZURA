/* JIZURA CV panel for Cavalry. Install once: Help > Show Scripts Folder, then Window > Scripts > JIZURA CV.
   Picks a .jizura.cavalry.json assembly (written by the JIZURA page) and builds the composition. The JSON
   carries every preset name, so a newer file needs no new script. When Cavalry exposes WebServer the panel
   also accepts a file from JIZURA_CV_Loader.js; when it does not, the button below is the whole workflow. */
(function () {
  if (typeof ui === 'undefined' || typeof api === 'undefined' || typeof JZCavalry === 'undefined') return;

  function folder() {
    try { return api.getFolderFromPath(api.getSceneFilePath() || '') || ''; } catch (error) { return ''; }
  }

  function build(assembly, source) {
    if (!assembly || assembly.format !== 'jizura.cavalry.assembly') throw new Error('JIZURA の JSON ではありません');
    var result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
    var r = result.report || { built: {}, fallback: {}, missing: {}, errors: [] };
    var line = '完了: テキスト ' + (assembly.nodeCount || 0) + ' 項目 / レイヤー ' + result.layerIds.length +
      ' / 正確 ' + Object.keys(r.built).length + ' · 近似 ' + Object.keys(r.fallback).length +
      ' · 未対応 ' + Object.keys(r.missing).length + ' · エラー ' + r.errors.length;
    status.setText(line + (source ? '（' + source + '）' : ''));
    console.log('JIZURA report:\n' + JSON.stringify(r, null, 2));
    return result;
  }

  ui.setTitle('JIZURA CV');
  var status = new ui.Label('JIZURA で書き出した .jizura.cavalry.json を選んでください。');
  var button = new ui.Button('JSON からコンポジションを作る');

  button.onClick = function () {
    var file = api.presentOpenFile(folder(), 'JIZURA Cavalry JSON', 'JIZURA Assembly (*.json)');
    if (!file) return;
    try { build(JSON.parse(api.readFromFile(file))); }
    catch (error) {
      status.setText('失敗: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  };

  var bridged = typeof JZBridge !== 'undefined' && JZBridge.start(function (assembly) {
    try { build(assembly, 'ローダーから受信'); }
    catch (error) {
      status.setText('失敗: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  });
  if (bridged) status.setText('パネル受信待ち (localhost:' + JZBridge.port + ')。JSON を選ぶこともできます。');

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
