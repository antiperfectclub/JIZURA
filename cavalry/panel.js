/* JIZURA panel for Cavalry. Install once: Help > Show Scripts Folder, then Window > Scripts > JIZURA.
   Reads a .jizura.cavalry.json assembly (written by the JIZURA page) and builds the composition.
   The JSON carries every preset name, so re-importing a newer file needs no new script. */
(function () {
  if (typeof ui === 'undefined' || typeof api === 'undefined' || typeof JZCavalry === 'undefined') return;

  ui.setTitle('JIZURA');

  var status = new ui.Label('JIZURA で書き出した .jizura.cavalry.json を選んでください。');
  var button = new ui.Button('JSON からコンポジションを作る');

  function startFolder() {
    try { return api.getFolderFromPath(api.getSceneFilePath() || '') || ''; } catch (error) { return ''; }
  }

  button.onClick = function () {
    var file = api.presentOpenFile(startFolder(), 'JIZURA Cavalry JSON', 'JIZURA Assembly (*.json)');
    if (!file) return;
    var assembly, result;
    try {
      assembly = JSON.parse(api.readFromFile(file));
      result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
    } catch (error) {
      status.setText('失敗: ' + error.message);
      console.error('JIZURA: ' + (error && error.stack || error));
      return;
    }
    var blocked = (assembly.blockingWarnings || []).length;
    status.setText('完了: テキスト ' + (assembly.nodeCount || 0) + ' 項目 / レイヤー ' + result.layerIds.length +
      '。コンソールで FPS とフレーム範囲を確認してください。' + (blocked ? '（未対応 ' + blocked + ' 件）' : ''));
  };

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
