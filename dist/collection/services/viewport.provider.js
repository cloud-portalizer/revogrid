/*!
 * Built by Revolist
 */
import reduce from 'lodash/reduce';
import { columnTypes, rowTypes } from '../store/storeTypes';
import ViewportStore from '../store/viewPort/viewport.store';
export default class ViewportProvider {
  constructor() {
    this.stores = reduce([...rowTypes, ...columnTypes], (sources, k) => {
      sources[k] = new ViewportStore();
      return sources;
    }, {});
  }
  setViewport(dimensionType, data) {
    this.stores[dimensionType].setViewport(data);
  }
}
