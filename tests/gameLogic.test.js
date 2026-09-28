import assert from "node:assert/strict";
import { IDENTITY, cssMatrix, orientationsMatch, randomTarget, rotate } from "../src/gameLogic.js";

for (const axis of ["x", "y", "z"]) {
  let orientation = [...IDENTITY];
  for (let i = 0; i < 4; i += 1) orientation = rotate(orientation, axis);
  assert.ok(orientationsMatch(orientation, IDENTITY), "four " + axis + " turns return to start");
  assert.ok(orientationsMatch(rotate(rotate(IDENTITY, axis), axis, -1), IDENTITY), axis + " inverse undoes a turn");
}

const seen = new Set();
const queue = [[...IDENTITY]];
while (queue.length) {
  const orientation = queue.shift();
  const key = orientation.join(",");
  if (seen.has(key)) continue;
  seen.add(key);
  for (const axis of ["x", "y", "z"]) queue.push(rotate(orientation, axis));
}
assert.equal(seen.size, 24, "cube has 24 reachable orientations");

for (let i = 0; i < 100; i += 1) {
  const target = randomTarget();
  assert.ok(!orientationsMatch(target, IDENTITY), "target differs from starting orientation");
  assert.ok(seen.has(target.join(",")), "target is reachable");
}

assert.match(cssMatrix(IDENTITY), /^matrix3d\(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1\)$/);
console.log("Cube rotation and target tests passed.");
