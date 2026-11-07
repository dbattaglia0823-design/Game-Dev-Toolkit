/** Fit a fixed-coordinate design surface into a responsive browser workspace. */
export function calculateCanvasScale(width, height, {designWidth=800, designHeight=500, min=0.35, max=2.25} = {}) {
  if (![width,height,designWidth,designHeight,min,max].every(v=>Number.isFinite(v) && v>0)) throw new RangeError('Invalid viewport dimensions');
  if (min > max) throw new RangeError('Invalid zoom range');
  return Math.max(min, Math.min(max, width / designWidth, height / designHeight));
}
