# Cavalry Export (experimental)

AE 버튼 옆의 **Cavalry Export**를 누르면 현재 편집 내용을 확정하고 선택한 행 범위의 assembly를 만듭니다. 경고 모달에서 누락·대체 항목을 읽고 **Export approximation**을 누르면 `.cavalry.js`를 저장합니다. **Exact support only**는 경고가 하나라도 있으면 다운로드를 막습니다. 초기 버전에는 호스트 검증 경고가 항상 있으므로 정확 지원 모드로 내보낼 수 없습니다.

Cavalry의 **Window → JavaScript Editor**에서 파일을 열고 실행합니다. JavaScript Layer의 expression에 넣는 코드가 아닙니다. 새 컴포지션에 컷별 null, 배경, 텍스트·모션 계층을 생성합니다. 기존 Scene을 저장하거나 덮어쓰지 않습니다.

실행 후 **Composition Settings**에서 경고에 표시된 FPS 및 프레임 범위 `0 … frameCount - 1`을 직접 지정하십시오. 음악은 포함되지 않습니다. 원본 음악을 가져와 `audioOffset`초만큼 앞부분을 잘라 맞춥니다. 컴포지션 크기는 현재 plan의 `W`, `H`입니다.

## 지원 범위와 검토 결과

- `center`, `scatter`의 주 텍스트 배치·크기·색상, 배경색, stagger 및 컷 표시 구간을 옮깁니다. 기존 `src/06_layouts.js`의 계산과 seed를 사용합니다.
- `cut`과 선형 `fade`만 지원합니다. 다른 레이아웃은 독립적인 기본 center params로, 다른 등장·퇴장은 fade로 대체하고 경고합니다. 컷 중간부터 내보내도 원래 모션 위상을 유지합니다.
- center 부가 텍스트·밑줄, scatter extras, 장식·hold·treatment·camera·transition·morph·HUD·global FX·고스트·텍스처·글로우·tracking/leading은 아직 이식하지 않았습니다. `centerFree`는 clipping 없이는 잘못된 결과가 나오므로 내보내기를 거부합니다.
- 폰트는 가사 언어에 따른 `J.faceOf()`와 weight별 스타일명을 사용합니다. 설치된 폰트의 실제 스타일명은 호스트에서 확인해야 합니다.
- assembly는 좌상단 원점, 정수 프레임 `[start, end)`입니다. 런타임은 중심 원점으로 변환하고 out frame에 `end - 1`을 전달합니다. Y축·회전 방향과 glyph bounds는 비대칭 장면으로 Cavalry 실앱 검증이 필요합니다.

AE의 `J.planForAE()` → JSON → `ae/50_build.jsx` 패턴처럼 데이터와 호스트 생성을 분리합니다. AE exporter·배포물은 호출하거나 재생성하지 않습니다. 제안의 향후 Sub-Mesh/Stagger 백엔드와 세부 모듈 분리는 실제 포팅 시점에 추가합니다.

## 빌드·검증

```sh
python3 build_cavalry.py
node tools/test_cavalry_export.js
python3 build.py --dev
```

`cavalry/browser.js`, `cavalry/runtime.js`를 수정하면 먼저 bundle을 재생성해야 합니다. 기존 웹 빌드는 `src/11r_cavalry.js`를 자동 포함합니다. bundle에는 런타임이 문자열로 들어가며 브라우저에서 호스트 API를 실행하지 않습니다. 테스트는 assembly·좌표 변환·프레임 경계·stagger·직렬화 범위·다운로드 계약을 검증하는 mock 테스트이며 Cavalry 렌더 검증을 대체하지 않습니다.

## 선택적 네이티브 component 저장

다운로드 파일 맨 아래 옵션을 수정합니다. 경로는 Cavalry가 실행되는 컴퓨터의 절대경로입니다.

```js
JZCavalry.run(/* generated assembly */, {
  componentPath: '/absolute/path/song.cvc',
  fontOverrides: { gothic_black: { family: 'Noto Sans CJK KR', style: 'Black' } }
});
```

`api.serialise(layerIds, true)`로 이번에 만든 계층만 직렬화하고 `api.writeToFile(path, data, false)`로 저장합니다. 기존 파일은 덮어쓰지 않습니다. `.cvc`는 **File → Import Scene**으로, 같은 내용을 `.json`으로 저장한 경우에는 `api.deserialise()`로 읽습니다. `.cv` 전체 Scene 저장은 사용자가 Cavalry에서 수행합니다.

## 공식 참조

- [Scripting 시작 및 Text/Sub-Mesh/Stagger 예제](https://cavalry.studio/docs/tech-info/scripting/scripting-getting-started/)
- [API: composition, clip, keyframe, bounding box, serialise, writeToFile](https://cavalry.studio/docs/tech-info/scripting/api-module/)
- [JavaScript Editor](https://cavalry.studio/docs/user-interface/menus/window-menu/javascript-editor/)

FPS·Frame Range의 scripting path는 Copy Scripting Path로 호스트에서 확인하기 전까지 추측하지 않습니다. 런타임 API와 화면·폰트·보간의 실제 동작은 Cavalry 버전별 확인이 필요합니다.
