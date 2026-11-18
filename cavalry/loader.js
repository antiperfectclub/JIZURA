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
    return '완료: 레이어 ' + result.layerIds.length + ' / 텍스트 ' + (assembly.nodeCount || 0) +
      ' / 정확 ' + Object.keys(r.built).length + ' · 근사 ' + Object.keys(r.fallback).length +
      ' · 미지원 ' + Object.keys(r.missing).length + ' · 오류 ' + r.errors.length;
  }

  ui.setTitle('JIZURA CV Loader');
  var status = new ui.Label('JIZURA의 .jizura.cavalry.json을 선택하면 컴포지션을 생성합니다.');
  var button = new ui.Button('Cavalry JSON 불러오기');

  button.onClick = function () {
    var file = api.presentOpenFile(folder(), 'JIZURA Cavalry JSON', 'JIZURA Assembly (*.json)');
    if (!file) return;

    if (typeof JZBridge !== 'undefined' && JZBridge.handoff(file)) {
      status.setText('JIZURA CV 패널로 전송했습니다. 패널 쪽 화면을 확인해주세요.');
      return;
    }

    var assembly;
    try { assembly = JSON.parse(api.readFromFile(file)); }
    catch (error) { status.setText('불러오기 실패: ' + (error && error.message || error)); return; }
    if (!assembly || assembly.format !== 'jizura.cavalry.assembly') {
      status.setText('JIZURA의 JSON이 아닙니다: ' + file);
      return;
    }

    try {
      var result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
      status.setText(summary(result, assembly) + ' (패널 미연결로 인해 직접 생성함)');
      console.log('JIZURA report:\n' + JSON.stringify(result.report || {}, null, 2));
    } catch (error) {
      status.setText('실패: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  };

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
