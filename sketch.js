// Letter Variables
let rings = [];
let numRing = 5;
let fonts = [];

// ml5 Variables
let faceMesh;
let video;
let faces = [];
let options = { maxFaces: 1, refineLandmarks: false, flipped: true };
let previousLipDistance; // 초기값 추가

function preload() {
  // faceMesh = ml5.faceMesh(options);

  fonts[0] = loadFont('fonts/BebasNeue-Regular.ttf');
  fonts[1] = loadFont('fonts/Kanit-Black.ttf');
  fonts[2] = loadFont('fonts/Roboto-Regular.ttf');
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  // faceMesh.detectStart(video, gotFaces);

  try {
    faceMesh = ml5.faceMesh(options);
    faceMesh.detectStart(video, gotFaces);
  } catch (e) {
    console.warn('faceMesh init failed — continuing without face detection', e);
    faceMesh = null;
  }

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

function draw() {
  background(220);

  image(video, 0, 0, width, height);
  if (faces.length > 0 && faces[0].lips) {
    let topLeftLip = createVector(faces[0].lips.x, faces[0].lips.y);
    let bottomRightLip = createVector(
      faces[0].lips.x + faces[0].lips.width,
      faces[0].lips.y + faces[0].lips.height
    );
    let centerLip = createVector(faces[0].lips.centerX, faces[0].lips.centerY);
    noFill();
    stroke(0, 255, 0);
    // ellipse(topLeftLip.x, topLeftLip.y, 10, 10);
    // ellipse(bottomRightLip.x, bottomRightLip.y, 10, 10);
    // ellipse(centerLip.x, centerLip.y, 10, 10);

    let lipDistance = dist(
      topLeftLip.x,
      topLeftLip.y,
      bottomRightLip.x,
      bottomRightLip.y
    );

    if (previousLipDistance > 90 && previousLipDistance - lipDistance > 5) {
      for (let i = 0; i < rings.length; i++) {
        for (let j = 0; j < rings[i].length; j++) {
          let mouth = createVector(centerLip.x, centerLip.y);
          trigger(rings[i][j], mouth);
        }
      }

      print('triggered');
    }
    previousLipDistance = lipDistance;
  }

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

function gotFaces(results) {
  faces = results;
}
