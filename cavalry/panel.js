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
    if (!assembly || assembly.format !== 'jizura.cavalry.assembly') throw new Error('JIZURA의 JSON이 아닙니다');
    var result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
    var r = result.report || { built: {}, fallback: {}, missing: {}, errors: [] };
    var line = '완료: 텍스트 ' + (assembly.nodeCount || 0) + ' 항목 / 레이어 ' + result.layerIds.length +
      ' / 정확 ' + Object.keys(r.built).length + ' · 근사 ' + Object.keys(r.fallback).length +
      ' · 미지원 ' + Object.keys(r.missing).length + ' · 오류 ' + r.errors.length;
    status.setText(line + (source ? ' (' + source + ')' : ''));
    console.log('JIZURA report:\n' + JSON.stringify(r, null, 2));
    return result;
  }

  ui.setTitle('JIZURA CV');
  var status = new ui.Label('JIZURA에서 내보낸 .jizura.cavalry.json을 선택해주세요.');
  var button = new ui.Button('JSON으로 컴포지션 만들기');

  button.onClick = function () {
    var file = api.presentOpenFile(folder(), 'JIZURA Cavalry JSON', 'JIZURA Assembly (*.json)');
    if (!file) return;
    try { build(JSON.parse(api.readFromFile(file))); }
    catch (error) {
      status.setText('실패: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  };

  var bridged = typeof JZBridge !== 'undefined' && JZBridge.start(function (assembly) {
    try { build(assembly, '로더에서 수신'); }
    catch (error) {
      status.setText('실패: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  });
  if (bridged) status.setText('패널 수신 대기 중 (localhost:' + JZBridge.port + '). JSON을 선택할 수도 있습니다.');

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
