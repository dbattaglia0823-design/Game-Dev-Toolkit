import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCanvasScale } from '../builder/viewport.js';

test('large 1440p workspace increases the canvas preview', () => {
  assert.equal(calculateCanvasScale(1700,1100), 2.125);
});
test('narrow workspace scales down while preserving original design units', () => {
  assert.equal(calculateCanvasScale(400,300),0.5);
});
test('zoom stays within limits and rejects bad dimensions', () => {
  assert.equal(calculateCanvasScale(4000,2600),2.25);
  assert.equal(calculateCanvasScale(100,100),0.35);
  assert.throws(()=>calculateCanvasScale(0,800),RangeError);
});
