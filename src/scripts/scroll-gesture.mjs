/** One intent per wheel burst. Quiet time or a reversal starts another gesture. */
export class ScrollGesture {
  lastAt = -Infinity;
  direction = 0;
  distance = 0;
  consumed = false;
  reset() {
    this.lastAt = -Infinity;
    this.direction = 0;
    this.distance = 0;
    this.consumed = false;
  }
  accept(delta, now) {
    if (!delta) return 0;
    const direction = Math.sign(delta);
    if (now - this.lastAt > 140 || direction !== this.direction) {
      this.distance = 0;
      this.consumed = false;
    }
    this.lastAt = now;
    this.direction = direction;
    if (this.consumed) return 0;
    this.distance += Math.abs(delta);
    if (this.distance < 16) return 0;
    this.consumed = true;
    return direction;
  }
}
