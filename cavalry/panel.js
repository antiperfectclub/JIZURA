/* JIZURA CV panel for Cavalry. Install once: Help > Show Scripts Folder, then Window > Scripts > JIZURA CV.
   Picks a .jizura.cavalry.json assembly (written by the JIZURA page) and builds the composition. The JSON
   carries every preset name, so a newer file needs no new script. The panel has no network listener: the
   file picker below is the whole workflow. */
(function () {
  if (typeof ui === 'undefined' || typeof api === 'undefined' || typeof JZCavalry === 'undefined') return;

  function folder() {
    try { return api.getFolderFromPath(api.getSceneFilePath() || '') || ''; } catch (error) { return ''; }
  }

  function build(assembly, source) {
    if (!assembly || assembly.format !== 'jizura.cavalry.assembly') {
      throw new Error('Cavalry 형식이 아닙니다. 파일 확장자가 아니라 format: "jizura.cavalry.assembly"인 JSON이 필요합니다. 일반 프로젝트 저장 JSON과는 호환되지 않습니다.');
    }
    var result = JZCavalry.run(assembly, { componentPath: null, fontOverrides: {}, timingPaths: null });
    var r = result.report || { built: {}, fallback: {}, missingRecipes: {}, errors: [] };
    /* assembly.nodeCount is what the page asked for; textLayerIds is what Cavalry actually kept. */
    var expected = assembly.nodeCount || 0;
    var texts = (result.textLayerIds || []).length;
    var report = r.build || null;
    var drift = !!(assembly.buildId && report && report.buildId && assembly.buildId !== report.buildId);
    var missingText = expected > 0 && texts === 0;
    var errors = (r.errors || []).length;
    var state = missingText ? '텍스트 생성 실패' : (errors || drift) ? '부분 완료' : '완료';
    var line = state + ': 텍스트 ' + texts + '/' + expected + ' 항목 / 레이어 ' + result.layerIds.length +
      ' / 정확 ' + Object.keys(r.built || {}).length + ' · 근사 ' + Object.keys(r.fallback || {}).length +
      ' · 대체 ' + (r.fontFallbacks || []).length +
      ' · 미지원 ' + Object.keys(r.missingRecipes || {}).length + ' · 오류 ' + errors +
      (drift ? ' / 빌드 불일치' : '');
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
    try { build(JSON.parse(api.readFromFile(file)), file); }
    catch (error) {
      status.setText('실패: ' + (error && error.message || error));
      console.error('JIZURA: ' + (error && error.stack || error));
    }
  };

  ui.add(status);
  ui.add(button);
  ui.addStretch();
  ui.show();
})();
