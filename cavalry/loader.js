/* JIZURA CV Loader. Run from the JavaScript Editor (or keep it in the Scripts folder and run it there).
   It posts the picked assembly to an open JIZURA CV panel when Cavalry's WebClient can reach it, and builds
   the composition itself otherwise, so it never depends on the panel being open. */
(function () {
  if (typeof ui === 'undefined' || typeof api === 'undefined' || typeof JZCavalry === 'undefined') return;

  function folder() {
    try { return api.getFolderFromPath(api.getSceneFilePath() || '') || ''; } catch (error) { return ''; }
  }

  function summary(result, assembly) {
    var r = result.report || { built: {}, fallback: {}, missing: {}, errors: [] };
    return '完了: レイヤー ' + result.layerIds.length + ' / テキスト ' + (assembly.nodeCount || 0) +
      ' / 正確 ' + Object.keys(r.built).length + ' · 近似 ' + Object.keys(r.fallback).length +
      ' · 未対応 ' + Object.keys(r.missing).length + ' · エラー ' + r.errors.length;
  }

  ui.setTitle('JIZURA CV Loader');
  var status = new ui.Label('JIZURA の .jizura.cavalry.json を選ぶとコンポジションを作ります。');
  var button = new ui.Button('Cavalry JSON を読み込む');

  button.onClick = function () {
    var file = api.presentOpenFile(folder(), 'JIZURA Cavalry JSON', 'JIZURA Assembly (*.json)');
    if (!file) return;

    if (typeof JZBridge !== 'undefined' && JZBridge.handoff(file)) {
      status.setText('JIZURA CV パネルに送信しました。パネル側の表示を確認してください。');
      return;
    }

    var assembly;
    try { assembly = JSON.parse(api.readFromFile(file)); }
    catch (error) { status.setText('読み込み失敗: ' + (error && error.message || error)); return; }
    if (!assembly || assembly.format !== 'jizura.cavalry.assembly') {
      status.setText('JIZURA の JSON ではありません: ' + file);
      return;
    }

    try {
      var result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
      status.setText(summary(result, assembly) + '（パネルは未接続のため、ここで構築しました）');
      console.log('JIZURA report:\n' + JSON.stringify(result.report || {}, null, 2));
    } catch (error) {
      status.setText('失敗: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  };

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
