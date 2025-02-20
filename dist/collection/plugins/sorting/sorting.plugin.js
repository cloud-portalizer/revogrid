/*!
 * Built by Revolist
 */
import size from 'lodash/size';
import { setStore } from '../../utils/store.utils';
import ColumnDataProvider from '../../services/column.data.provider';
import BasePlugin from '../basePlugin';
/**
 * lifecycle
 * 1) @event beforesorting - sorting just started, nothing happened yet
 * 2) @metod updateColumnSorting - column sorting icon applied to grid and column get updated, data still untiuched
 * 3) @event beforesortingapply - before we applied sorting data to data source, you can prevent data apply from here
 * 4) @event afterSortingApply - sorting applied, just finished event
 *
 * If you prevent event it'll not reach farther steps
 */
export default class SortingPlugin extends BasePlugin {
  constructor(revogrid) {
    super(revogrid);
    this.revogrid = revogrid;
    this.sorting = null;
    this.sortingFunc = null;
    const beforesourceset = ({ detail }) => {
      if (this.hasSorting) {
        // is sorting allowed
        const event = this.emit('beforesourcesortingapply');
        // sorting prevented
        if (event.defaultPrevented) {
          return;
        }
      }
      const data = this.setData(detail.source, detail.type);
      if (data) {
        detail.source = data;
      }
    };
    const aftercolumnsset = async ({ detail: { order } }) => {
      const columns = await this.revogrid.getColumns();
      const sortingFunc = {};
      for (let prop in order) {
        const column = ColumnDataProvider.getColumnByProp(columns, prop);
        const cmp = (column === null || column === void 0 ? void 0 : column.cellCompare) || this.defaultCellCompare;
        sortingFunc[prop] = order[prop] == 'desc' ? this.descCellCompare(cmp) : cmp;
      }
      this.sort(order, sortingFunc);
    };
    const headerclick = async (e) => {
      var _a, _b;
      if (e.defaultPrevented) {
        return;
      }
      if (!e.detail.column.sortable) {
        return;
      }
      this.headerclick(e.detail.column, e.detail.index, (_b = (_a = e.detail) === null || _a === void 0 ? void 0 : _a.originalEvent) === null || _b === void 0 ? void 0 : _b.shiftKey);
    };
    this.addEventListener('beforesourceset', beforesourceset);
    this.addEventListener('aftercolumnsset', aftercolumnsset);
    this.addEventListener('initialHeaderClick', headerclick);
  }
  get hasSorting() {
    return !!this.sorting;
  }
  async headerclick(column, index, additive) {
    let order = this.getNextOrder(column.order);
    const beforeEvent = this.emit('beforesorting', { column, order, additive });
    if (beforeEvent.defaultPrevented) {
      return;
    }
    order = beforeEvent.detail.order;
    const newCol = await this.revogrid.updateColumnSorting(beforeEvent.detail.column, index, order, additive);
    // apply sort data
    const beforeApplyEvent = this.emit('beforesortingapply', { column: newCol, order, additive });
    if (beforeApplyEvent.defaultPrevented) {
      return;
    }
    order = beforeApplyEvent.detail.order;
    const cellCmp = (column === null || column === void 0 ? void 0 : column.cellCompare) || this.defaultCellCompare;
    const cmp = order == 'asc' ? cellCmp : order == 'desc' ? this.descCellCompare(cellCmp) : undefined;
    if (additive && this.sorting) {
      const sorting = {};
      const sortingFunc = {};
      Object.assign(sorting, this.sorting);
      Object.assign(sortingFunc, this.sortingFunc);
      if (column.prop in sorting && size(sorting) > 1 && order === undefined) {
        delete sorting[column.prop];
        delete sortingFunc[column.prop];
      }
      else {
        sorting[column.prop] = order;
        sortingFunc[column.prop] = cmp;
      }
      this.sort(sorting, sortingFunc);
    }
    else {
      this.sort({ [column.prop]: order }, { [column.prop]: cmp });
    }
  }
  setData(data, type) {
    // sorting available for rgRow type only
    if (type === 'rgRow' && this.sortingFunc) {
      return this.sortItems(data, this.sortingFunc);
    }
  }
  /**
   * Sorting apply, available for rgRow type only
   * @param sorting - per column sorting
   * @param data - this.stores['rgRow'].store.get('source')
   */
  async sort(sorting, sortingFunc) {
    if (!size(sorting)) {
      this.sorting = null;
      this.sortingFunc = null;
      return;
    }
    this.sorting = sorting;
    this.sortingFunc = sortingFunc;
    const store = await this.revogrid.getSourceStore();
    const source = store.get('source');
    const proxyItems = this.sortIndexByItems([...store.get('proxyItems')], source, this.sortingFunc);
    setStore(store, {
      proxyItems,
      source: [...source],
    });
    this.emit('afterSortingApply');
  }
  defaultCellCompare(prop, a, b) {
    var _a, _b;
    const av = (_a = a[prop]) === null || _a === void 0 ? void 0 : _a.toString().toLowerCase();
    const bv = (_b = b[prop]) === null || _b === void 0 ? void 0 : _b.toString().toLowerCase();
    return av == bv ? 0 : av > bv ? 1 : -1;
  }
  descCellCompare(cmp) {
    return (prop, a, b) => { return -1 * cmp(prop, a, b); };
  }
  sortIndexByItems(indexes, source, sortingFunc) {
    // TODO - is there a situation where multiple kvps in the `sorting` object would cause this to break?
    for (let prop in sortingFunc) {
      if (typeof sortingFunc[prop] === 'undefined') {
        // Unsort indexes
        return [...Array(indexes.length).keys()];
      }
    }
    return indexes.sort((a, b) => {
      let sorted = 0;
      for (let prop in sortingFunc) {
        const cmp = sortingFunc[prop];
        const itemA = source[a];
        const itemB = source[b];
        sorted = cmp(prop, itemA, itemB);
        if (sorted) {
          break;
        }
      }
      return sorted;
    });
  }
  sortItems(source, sortingFunc) {
    return source.sort((a, b) => {
      let sorted = 0;
      for (let prop in sortingFunc) {
        const cmp = sortingFunc[prop];
        if (!cmp) {
          continue;
        }
        sorted = cmp(prop, a, b);
        if (sorted) {
          break;
        }
      }
      return sorted;
    });
  }
  getNextOrder(currentOrder) {
    switch (currentOrder) {
      case undefined:
        return 'asc';
      case 'asc':
        return 'desc';
      case 'desc':
        return undefined;
    }
  }
}
