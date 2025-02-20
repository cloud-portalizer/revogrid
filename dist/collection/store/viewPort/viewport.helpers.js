/*!
 * Built by Revolist
 */
import { getItemByPosition } from '../dimension/dimension.helpers';
/**
 * Update items based on new scroll position
 * If viewport wasn't changed fully simple recombination of positions
 * Otherwise rebuild viewport items
 */
export function getUpdatedItemsByPosition(pos, items, realCount, virtualSize, dimension) {
  const activeItem = getItemByPosition(dimension, pos);
  const firstItem = getFirstItem(items);
  let toUpdate;
  // do simple position replacement if items already present in viewport
  if (firstItem) {
    let changedOffsetStart = activeItem.itemIndex - (firstItem.itemIndex || 0);
    if (changedOffsetStart) {
      // simple recombination
      const newData = recombineByOffset(Math.abs(changedOffsetStart), Object.assign(Object.assign({ positiveDirection: changedOffsetStart > -1 }, dimension), items));
      if (newData) {
        toUpdate = newData;
      }
      // if partial replacement add items if revo-viewport has some space left
      if (toUpdate) {
        const extra = addMissingItems(activeItem, realCount, virtualSize, toUpdate, dimension);
        if (extra.length) {
          updateMissingAndRange(toUpdate.items, extra, toUpdate);
        }
      }
    }
  }
  // new collection if no items after replacement full replacement
  if (!toUpdate) {
    const items = getItems({
      start: activeItem.start,
      startIndex: activeItem.itemIndex,
      origSize: dimension.originItemSize,
      maxSize: virtualSize,
      maxCount: realCount,
      sizes: dimension.sizes,
    });
    // range now comes from 0 to length - 1
    toUpdate = {
      items,
      start: 0,
      end: items.length - 1,
    };
  }
  return toUpdate;
}
export function updateMissingAndRange(items, missing, range) {
  items.splice(range.end + 1, 0, ...missing);
  // update range if start larger after recombination
  if (range.start >= range.end && !(range.start === range.end && range.start === 0)) {
    range.start += missing.length;
  }
  range.end += missing.length;
}
// if partial replacement add items if revo-viewport has some space left
export function addMissingItems(firstItem, realCount, virtualSize, existingCollection, dimension) {
  const lastItem = getLastItem(existingCollection);
  const items = getItems({
    sizes: dimension.sizes,
    start: lastItem.end,
    startIndex: lastItem.itemIndex + 1,
    origSize: dimension.originItemSize,
    maxSize: virtualSize - (lastItem.end - firstItem.start),
    maxCount: realCount,
  });
  return items;
}
// get revo-viewport items parameters, caching position and calculating items count in revo-viewport
export function getItems(opt, currentSize = 0) {
  const items = [];
  let index = opt.startIndex;
  let size = currentSize;
  while (size <= opt.maxSize && index < opt.maxCount) {
    const newSize = getItemSize(index, opt.sizes, opt.origSize);
    items.push({
      start: opt.start + size,
      end: opt.start + size + newSize,
      itemIndex: index,
      size: newSize,
    });
    size += newSize;
    index++;
  }
  return items;
}
/**
 * Do batch items recombination
 * If items not overlapped with existing viewport returns null
 */
export function recombineByOffset(offset, data) {
  const newItems = [...data.items];
  const itemsCount = newItems.length;
  let newRange = {
    start: data.start,
    end: data.end,
  };
  // if offset out of revo-viewport, makes sense whole redraw
  if (offset > itemsCount) {
    return null;
  }
  // is direction of scroll positive
  if (data.positiveDirection) {
    // push item to the end
    let lastItem = getLastItem(data);
    let i = newRange.start;
    const length = i + offset;
    for (; i < length; i++) {
      const newIndex = lastItem.itemIndex + 1;
      const size = getItemSize(newIndex, data.sizes, data.originItemSize);
      // if item overlapped limit break a loop
      if (lastItem.end + size > data.realSize) {
        break;
      }
      // new item index to recombine
      let newEnd = i % itemsCount;
      // item should always present, we do not create new item, we recombine them
      if (!newItems[newEnd]) {
        throw new Error('incorrect index');
      }
      // do recombination
      newItems[newEnd] = lastItem = {
        start: lastItem.end,
        end: lastItem.end + size,
        itemIndex: newIndex,
        size: size,
      };
      // update range
      newRange.start++;
      newRange.end = newEnd;
    }
    // direction is negative
  }
  else {
    // push item to the start
    let firstItem = getFirstItem(data);
    const end = newRange.end;
    for (let i = 0; i < offset; i++) {
      const newIndex = firstItem.itemIndex - 1;
      const size = getItemSize(newIndex, data.sizes, data.originItemSize);
      // new item index to recombine
      let newStart = end - i;
      newStart = (newStart < 0 ? itemsCount + newStart : newStart) % itemsCount;
      // item should always present, we do not create new item, we recombine them
      if (!newItems[newStart]) {
        throw new Error('incorrect index');
      }
      // do recombination
      newItems[newStart] = firstItem = {
        start: firstItem.start - size,
        end: firstItem.start,
        itemIndex: newIndex,
        size: size,
      };
      // update range
      newRange.start = newStart;
      newRange.end--;
    }
  }
  const range = {
    start: (newRange.start < 0 ? itemsCount + newRange.start : newRange.start) % itemsCount,
    end: (newRange.end < 0 ? itemsCount + newRange.end : newRange.end) % itemsCount,
  };
  return Object.assign({ items: newItems }, range);
}
function getItemSize(index, sizes, origSize = 0) {
  if (sizes && sizes[index]) {
    return sizes[index];
  }
  return origSize;
}
export function isActiveRange(pos, item) {
  return item && pos >= item.start && pos <= item.end;
}
export function getFirstItem(s) {
  return s.items[s.start];
}
export function getLastItem(s) {
  return s.items[s.end];
}
