import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScrollGesture } from '../src/scripts/scroll-gesture.mjs';

test('one sustained wheel gesture advances once, including its inertia tail', () => {
  const gesture = new ScrollGesture();
  const deltas = [4, 8, 20, 65, 48, 32, 20, 12, 6, 3, 1];
  assert.deepEqual(deltas.map((delta, i) => gesture.accept(delta, i * 60)).filter(Boolean), [1]);
});

test('a fresh gesture after a pause responds without an animation cooldown', () => {
  const gesture = new ScrollGesture();
  assert.equal(gesture.accept(80, 0), 1);
  assert.equal(gesture.accept(32, 50), 0);
  assert.equal(gesture.accept(80, 220), 1);
});

test('reversing direction responds immediately', () => {
  const gesture = new ScrollGesture();
  assert.equal(gesture.accept(80, 0), 1);
  assert.equal(gesture.accept(-80, 40), -1);
  assert.equal(gesture.accept(-20, 80), 0);
});

test('tiny isolated motion and zero deltas cannot advance a scene', () => {
  const gesture = new ScrollGesture();
  assert.equal(gesture.accept(5, 0), 0);
  assert.equal(gesture.accept(0, 20), 0);
  assert.equal(gesture.accept(5, 200), 0);
  gesture.reset();
  assert.equal(gesture.accept(-16, 240), -1);
});
