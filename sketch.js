// Letter Variables
let rings = [];
let numRing = 5;
let fonts = [];

// MediaPipe Variables
let faceMeshMP = null;
let cameraMP = null;
let mouthCenter = null;
let mouthDistance = 0;
let previousLipDistance = 0;
let lastMousePressed = false;

// 비디오 변수를 전역으로 선언
let video;

function preload() {
  // 폰트는 프로젝트 폴더에 있을 때만 로드, 실패하면 브라우저 기본폰트 사용됨
  fonts[0] = loadFont('fonts/BebasNeue-Regular.ttf');
  fonts[1] = loadFont('fonts/Kanit-Black.ttf');
  fonts[2] = loadFont('fonts/Roboto-Regular.ttf');
}

function setup() {
  // 💡 [수정] 캔버스 객체를 변수에 할당하고 .parent()로 HTML 요소에 연결
  const canvas = createCanvas(640, 480);
  canvas.parent('p5-container');

  // p5 비디오 (HTMLVideoElement는 video.elt)
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide(); // DOM 요소로 표시되는 것은 숨김. 캔버스에 직접 그릴 예정.

  // MediaPipe FaceMesh 초기화
  faceMeshMP = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMeshMP.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMeshMP.onResults(onResults);

  // camera_utils의 Camera를 사용해 p5 비디오 엘리먼트를 프레임 전송
  cameraMP = new Camera(video.elt, {
    onFrame: async () => {
      // send에는 video element 전달
      await faceMeshMP.send({ image: video.elt });
    },
    width: 640,
    height: 480,
  });
  cameraMP.start();

  // 글자 링 생성
  for (let i = 0; i < numRing; i++) {
    rings[i] = [];

    let r = 30 + i * 15;
    let circumference = 2 * PI * r;
    let fontSize = 10 + i * 3;
    let font = fonts[i % fonts.length];
    let num = floor(circumference / fontSize);

    for (let j = 0; j < num; j++) {
      let angle = (TWO_PI / num) * j;
      let x = width / 2 + r * cos(angle);
      let y = height / 2 + r * sin(angle);
      rings[i].push(new Letter(x, y, fontSize, font));
    }
  }
}

function onResults(results) {
  // MediaPipe 결과에서 첫 얼굴의 랜드마크 사용
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const lm = results.multiFaceLandmarks[0];

    // MediaPipe FaceMesh의 468 포인트 중 입술 중심에 가까운 인덱스 사용 (예: 13, 14)
    // 필요하면 다른 인덱스로 조정
    const up = lm[13];
    const low = lm[14];

    // normalized 좌표를 캔버스 픽셀 좌표로 변환
    const upX = up.x * width;
    const upY = up.y * height;
    const lowX = low.x * width;
    const lowY = low.y * height;

    mouthCenter = createVector((upX + lowX) / 2, (upY + lowY) / 2);
    mouthDistance = dist(upX, upY, lowX, lowY);
  } else {
    mouthCenter = null;
    mouthDistance = 0;
  }
}

function draw() {
  // 비디오를 캔버스에 그립니다. (배경 역할)
  if (video) {
    // 💡 [추가] 좌우 반전을 위한 변환 적용
    push();
    translate(width, 0); // X축을 캔버스 너비만큼 이동
    scale(-1, 1); // X축을 기준으로 반전
    image(video, 0, 0, width, height);
    pop(); // 변환 상태 초기화
  } else {
    background(220); // 비디오가 준비되지 않은 경우에 대비
  }

  // 입술 데이터가 있으면 트리거 로직 실행
  if (mouthCenter && mouthDistance > 0) {
    // 💡 [추가] 화면에 보이는 반전된 위치에 맞게 mouthCenter의 X 좌표를 보정
    let mirroredMouthCenter = mouthCenter.copy();
    mirroredMouthCenter.x = width - mirroredMouthCenter.x;

    // 이전 거리와 현재 거리 비교 — 입을 벌렸을 때 발동
    if (previousLipDistance > 0 && mouthDistance > previousLipDistance + 6) {
      for (let i = 0; i < rings.length; i++) {
        for (let j = 0; j < rings[i].length; j++) {
          // 💡 [수정] 반전된 위치를 기준으로 trigger 실행
          trigger(rings[i][j], mirroredMouthCenter);
        }
      }
      print('triggered by mouth open');
    }
    previousLipDistance = mouthDistance;

    // 디버그: 입 주변 위치 시각화 (원하면 사용)
    noFill();
    // stroke(0, 255, 0);
    // 💡 [수정] 반전된 위치에 디버그 원 그리기
    ellipse(mirroredMouthCenter.x, mirroredMouthCenter.y, 10, 10);
  } else {
    // MediaPipe 로드 실패나 얼굴 미검출 시 마우스 클릭으로 폴백 트리거
    if (mouseIsPressed && !lastMousePressed) {
      let mouth = createVector(width / 2, height / 2);
      for (let i = 0; i < rings.length; i++) {
        for (let j = 0; j < rings[i].length; j++) {
          trigger(rings[i][j], mouth);
        }
      }
      print('fallback triggered by mouse press');
    }
    lastMousePressed = mouseIsPressed;
  }

  // update & display letters
  for (let i = 0; i < rings.length; i++) {
    for (let j = 0; j < rings[i].length; j++) {
      rings[i][j].update();
      rings[i][j].display();
    }
  }
}

function trigger(letter, mouth) {
  let force = p5.Vector.sub(letter.position, mouth);
  let distance = force.mag();
  force.normalize();

  let magnitude = map(distance, 0, width, 0.1, 1) * random(0.1, 1);
  force.mult(magnitude);
  letter.applyForce(force);

  letter.angleV = map(distance, 0, width, 0.01, 0.1) * random(0.5, 2);
}
