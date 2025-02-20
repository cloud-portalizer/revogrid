/*!
 * Built by Revolist
 */
/**
 * Storing pre-calculated
 * Dimension information and sizes
 */
import { createStore } from '@stencil/store';
import reduce from 'lodash/reduce';
import { setStore } from '../../utils/store.utils';
import { calculateDimensionData } from './dimension.helpers';
function initialBase() {
  return {
    indexes: [],
    // item index to size
    sizes: {},
    // order in indexes[] to coordinate
    positionIndexToItem: {},
    // initial element to coordinate ^
    indexToItem: {},
    positionIndexes: []
  };
}
function initialState() {
  return Object.assign(Object.assign({}, initialBase()), { 
    // size which all items can take
    realSize: 0, 
    // initial item size if it wasn't changed
    originItemSize: 0, frameOffset: 0 });
}
export default class DimensionStore {
  constructor() {
    this.store = createStore(initialState());
  }
  getCurrentState() {
    const state = initialState();
    const keys = Object.keys(state);
    return reduce(keys, (r, k) => {
      const data = this.store.get(k);
      r[k] = data;
      return r;
    }, state);
  }
  setRealSize(count) {
    let realSize = 0;
    for (let i = 0; i < count; i++) {
      realSize += this.store.get('sizes')[i] || this.store.get('originItemSize');
    }
    setStore(this.store, { realSize });
  }
  setStore(data) {
    setStore(this.store, data);
  }
  drop() {
    setStore(this.store, initialBase());
  }
  setDimensionSize(sizes) {
    const dimensionData = calculateDimensionData(this.getCurrentState(), sizes);
    setStore(this.store, dimensionData);
    return dimensionData;
  }
}
