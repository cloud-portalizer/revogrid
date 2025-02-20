/*!
 * Built by Revolist
 */
/* Generate range on size
 */
export function range(size, startAt = 0) {
  const res = [];
  const end = startAt + size;
  for (let i = startAt; i < end; i++) {
    res.push(i);
  }
  return res;
}
/* Find index position in array */
export function findPositionInArray(el, compareFn) {
  return (function (arr) {
    let m = 0;
    let n = arr.length - 1;
    while (m <= n) {
      const k = (n + m) >> 1;
      const cmp = compareFn(el, arr[k]);
      if (cmp > 0) {
        m = k + 1;
      }
      else if (cmp < 0) {
        n = k - 1;
      }
      else {
        return k;
      }
    }
    return -m - 1;
  })(this);
}
export function pushSorted(arr, el, fn) {
  arr.splice(findPositionInArray.bind(arr)(el, fn), 0, el);
  return arr;
}
// (arr1[index1] < arr2[index2])
function simpleCompare(el1, el2) {
  return el1 < el2;
}
export function mergeSortedArray(arr1, arr2, compareFn = simpleCompare) {
  const merged = [];
  let index1 = 0;
  let index2 = 0;
  let current = 0;
  while (current < arr1.length + arr2.length) {
    let isArr1Depleted = index1 >= arr1.length;
    let isArr2Depleted = index2 >= arr2.length;
    if (!isArr1Depleted && (isArr2Depleted || compareFn(arr1[index1], arr2[index2]))) {
      merged[current] = arr1[index1];
      index1++;
    }
    else {
      merged[current] = arr2[index2];
      index2++;
    }
    current++;
  }
  return merged;
}
/* Calculate system scrollbar width */
export function getScrollbarWidth(doc) {
  // Creating invisible container
  const outer = doc.createElement('div');
  const styles = outer.style;
  styles.visibility = 'hidden';
  styles.overflow = 'scroll'; // forcing scrollbar to appear
  styles.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  doc.body.appendChild(outer);
  // Creating inner element and placing it in the container
  const inner = doc.createElement('div');
  outer.appendChild(inner);
  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  // Removing temporary elements from the DOM
  outer.parentNode.removeChild(outer);
  return scrollbarWidth;
}
/* Scale a value between 2 ranges
 *
 * Sample:
 * // 55 from a 0-100 range to a 0-1000 range (Ranges don't have to be positive)
 * const n = scaleValue(55, [0,100], [0,1000]);
 *
 * Ranges of two values
 * @from
 * @to
 *
 * ~~ return value does the equivalent of Math.floor but faster.
 */
export function scaleValue(value, from, to) {
  return ((to[1] - to[0]) * (value - from[0])) / (from[1] - from[0]) + to[0];
}
export async function timeout(delay = 0) {
  await new Promise((r) => {
    setTimeout(() => r(), delay);
  });
}
export function applyMixins(derivedCtor, constructors) {
  constructors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null));
    });
  });
}
