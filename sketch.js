let rings = [];
let numRing = 5;
let fonts = []; // 각 굵기별 폰트 파일
let faceMeshMP, cameraMP, video;
let mouthCenter = null;
let mouthDistance = 0;
let previousLipDistance = 0;
let lastMousePressed = false;

function preload() {
  // 각 굵기별 한글 폰트 불러오기
  fonts[0] = loadFont('fonts/Pretendard-ExtraLight.ttf'); // 제일 바깥 (가장 굵게)
  fonts[1] = loadFont('fonts/Pretendard-Regular.ttf');
  fonts[2] = loadFont('fonts/Pretendard-Medium.ttf');
  fonts[3] = loadFont('fonts/Pretendard-Bold.ttf');
  fonts[4] = loadFont('fonts/Pretendard-Black.ttf');
}

function setup() {
  const canvas = createCanvas(800, 600);
  canvas.parent('p5-container');
  textAlign(CENTER, CENTER);
  noStroke();

  video = createCapture(VIDEO);
  video.size(800, 600);
  video.hide();

  // MediaPipe FaceMesh 설정
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

  cameraMP = new Camera(video.elt, {
    onFrame: async () => await faceMeshMP.send({ image: video.elt }),
    width: 800,
    height: 600,
  });
  cameraMP.start();

  // 글자 링 생성
  for (let i = 0; i < numRing; i++) {
    rings[i] = [];
    let r = 40 + i * 18;
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
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const lm = results.multiFaceLandmarks[0];
    const up = lm[13];
    const low = lm[14];

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
  background(0);

  if (video) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop();
  }

  if (mouthCenter && mouthDistance > 0) {
    let mirroredMouthCenter = mouthCenter.copy();
    mirroredMouthCenter.x = width - mirroredMouthCenter.x;

    if (previousLipDistance > 0 && mouthDistance > previousLipDistance + 6) {
      for (let ring of rings) {
        for (let letter of ring) {
          trigger(letter, mirroredMouthCenter);
        }
      }
    }
    previousLipDistance = mouthDistance;
  }

  for (let ring of rings) {
    for (let letter of ring) {
      letter.update();
      letter.display();
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
