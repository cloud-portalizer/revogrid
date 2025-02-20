/*!
 * Built by Revolist
 */
import { EMPTY_INDEX } from '../../services/selection.store.connector';
export function isHiddenStore(pos) {
  return pos === EMPTY_INDEX;
}
export function nextCell(cell, lastCell) {
  const nextItem = {};
  let types = ['x', 'y'];
  // previous item check
  for (let t of types) {
    if (cell[t] < 0) {
      nextItem[t] = cell[t];
      return nextItem;
    }
  }
  // next item check
  for (let t of types) {
    if (cell[t] >= lastCell[t]) {
      nextItem[t] = cell[t] - lastCell[t];
      return nextItem;
    }
  }
  return null;
}
export function cropCellToMax(cell, lastCell) {
  const newCell = Object.assign({}, cell);
  let types = ['x', 'y'];
  // previous item check
  for (let t of types) {
    if (cell[t] < 0) {
      newCell[t] = 0;
    }
  }
  // next item check
  for (let t of types) {
    if (cell[t] >= lastCell[t]) {
      newCell[t] = lastCell[t] - 1;
    }
  }
  return newCell;
}
export function getRange(start, end) {
  return start && end
    ? {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      x1: Math.max(start.x, end.x),
      y1: Math.max(start.y, end.y),
    }
    : null;
}
export function isRangeSingleCell(a) {
  return a.x === a.x1 && a.y === a.y1;
}
