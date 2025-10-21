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
    textFont(this.font);
    textSize(this.fontSize);
    textAlign(CENTER, CENTER);
    text(this.letter, 0, 0);
    pop();
  }
}
