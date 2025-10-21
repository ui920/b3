// Letter.js
class Letter {
  constructor(x, y, fontSize, font) {
    let characters = [
      '균',
      '형',
      '흔',
      '들',
      '림',
      '중',
      '심',
      '불',
      '안',
      '정',
      '조',
      '화',
      'B',
      'A',
      'L',
      'A',
      'N',
      'C',
      'E',
    ];

    this.letter = random(characters);
    this.fontSize = fontSize;
    this.font = font;

    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.angle = 0;
    this.angleV = 0;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    this.angle += this.angleV;
  }

  display() {
    fill(255);
    noStroke();
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle);

    // 한글과 영어 구분해서 폰트 적용
    if (/[가-힣]/.test(this.letter)) {
      textFont(koreanFont); // 한글용 폰트
    } else {
      textFont(this.font); // 영어용 폰트
    }

    textSize(this.fontSize);
    textAlign(CENTER, CENTER);
    text(this.letter, 0, 0);
    pop();
  }
}
