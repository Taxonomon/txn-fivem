export type Vector2 = {
  x: number;
  y: number;
};

export type Vector3 = {
  x: number,
  y: number,
  z: number
};

export function distanceBetweenVector3s(a: Vector3, b: Vector3) {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2)
    + Math.pow(b.y - a.y, 2)
    + Math.pow(b.z - a.z, 2)
  );
}
