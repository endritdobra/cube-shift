export const IDENTITY = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]);

const TURNS = {
  x: [1, 0, 0, 0, 0, -1, 0, 1, 0],
  y: [0, 0, 1, 0, 1, 0, -1, 0, 0],
  z: [0, -1, 0, 1, 0, 0, 0, 0, 1]
};

export function multiply(a, b) {
  const result = Array(9).fill(0);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      for (let k = 0; k < 3; k += 1) result[row * 3 + col] += a[row * 3 + k] * b[k * 3 + col];
    }
  }
  return result;
}

export function rotate(orientation, axis, step = 1) {
  if (!TURNS[axis] || ![-1, 1].includes(step)) throw new Error("Invalid cube rotation");
  const turn = step === 1 ? TURNS[axis] : multiply(multiply(TURNS[axis], TURNS[axis]), TURNS[axis]);
  return multiply(turn, orientation);
}

export function orientationsMatch(a, b) {
  return a.every((value, index) => value === b[index]);
}

export function randomTarget(random = Math.random) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let orientation = [...IDENTITY];
    const turns = 2 + Math.floor(random() * 3);
    for (let i = 0; i < turns; i += 1) {
      const axis = ["x", "y", "z"][Math.floor(random() * 3)];
      orientation = rotate(orientation, axis, random() < .5 ? -1 : 1);
    }
    if (!orientationsMatch(orientation, IDENTITY)) return orientation;
  }
  return rotate(IDENTITY, "x");
}

export function cssMatrix(orientation) {
  const m = orientation;
  return "matrix3d(" + [m[0], m[3], m[6], 0, m[1], m[4], m[7], 0, m[2], m[5], m[8], 0, 0, 0, 0, 1].join(",") + ")";
}
