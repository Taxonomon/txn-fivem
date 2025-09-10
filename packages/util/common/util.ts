import {Vector3} from "../../hotlap/common/hotlap/type.ts";

export function isUndefined(o: any) {
  return typeof o === 'undefined';
}

export function isNull(o: any) {
  return o === null;
}

export function isNullOrUndefined(o: any | undefined) {
  return isUndefined(o) || isNull(o);
}

export function isObject(o: any) {
  return typeof o === 'object';
}

/**
 * Returns <code>true</code> if a given string is either <code>undefined</code>, <code>null</code>, or if its length
 * is equal to zero. Otherwise, <code>false</code> is returned.
 *
 * ```javascript
 * isEmpty(undefined); // true
 * isEmpty(null);      // true
 * isEmpty('');        // true
 * isEmpty('a');       // false
 * isEmpty('   ');     // false
 * ```
 *
 * @param {string} s A string.
 */
export function isEmpty(s: string) {
  return isNullOrUndefined(s) || s.length === 0;
}

/**
 * Checks if an <code>n</code>th bit is high for a given <code>x</code> in bit-notation.
 *
 * In the context of R* jobs, the values stored in the <code>mission.race.cpbs1</code> and <code>cpbs2</code> fields
 * denote whether a checkpoint is of a special type. The stored value <code>x</code> is encoded such that a bitwise
 * AND is needed to determine for which number <code>n</code> the AND returns 1. If that's the case, then the
 * checkpoint type mapped to <code>n</code> is the final type of that checkpoint.
 *
 * @param x A number to check against.
 * @param n The bit index to check.
 *
 * @return <code>true</code> if the <code>n</code>th bit of a given number <code>x</code> is high,
 * or <code>false</code> if it isn't.
 */
export function isBitSet(x: number, n: number): boolean {
  return (x & (1 << n)) !== 0;
}

export async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isEntityWithinTargetDistance(entity: Vector3, target: Vector3, radius: number) {
  return distanceBetweenVector3s(target, entity) <= Math.abs(radius);
}

export function distanceBetweenVector3s(a: Vector3, b: Vector3) {
  return Math.sqrt(
    Math.pow(b.x - a.x, 2)
    + Math.pow(b.y - a.y, 2)
    + Math.pow(b.z - a.z, 2)
  );
}
