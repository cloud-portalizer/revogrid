/*!
 * Built by Revolist
 */
import isArray from 'lodash/isArray';
import map from 'lodash/map';
import BasePlugin from '../basePlugin';
export default class GroupingColumnPlugin extends BasePlugin {
  static gatherGroup(res, colData, collection, level = 0) {
    // group template
    const group = Object.assign(Object.assign({}, colData), { level, ids: [] });
    // check columns for update
    for (let k in collection.columns) {
      const key = k;
      const resultItem = res.columns[key];
      const collectionItem = collection.columns[key];
      // if column data
      if (isArray(resultItem) && isArray(collectionItem)) {
        // fill columns
        resultItem.push(...collectionItem);
        // fill grouping
        if (collectionItem.length) {
          res.columnGrouping[key].push(Object.assign(Object.assign({}, group), { ids: map(collectionItem, 'prop') }));
        }
      }
    }
    // merge column groupings
    for (let k in collection.columnGrouping) {
      const key = k;
      const collectionItem = collection.columnGrouping[key];
      res.columnGrouping[key].push(...collectionItem);
    }
    res.maxLevel = Math.max(res.maxLevel, collection.maxLevel);
    res.sort = Object.assign(Object.assign({}, res.sort), collection.sort);
    return res;
  }
}
export function isColGrouping(colData) {
  return !!colData.children;
}
