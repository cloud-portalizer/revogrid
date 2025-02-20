/*!
 * Built by Revolist
 */
import reduce from 'lodash/reduce';
import each from 'lodash/each';
import find from 'lodash/find';
import DataStore, { getSourceItem, getSourceItemVirtualIndexByProp, setSourceByVirtualIndex } from '../store/dataSource/data.store';
import { columnTypes } from '../store/storeTypes';
import GroupingColumnPlugin, { isColGrouping } from '../plugins/groupingColumn/grouping.col.plugin';
export default class ColumnDataProvider {
  constructor() {
    this.sorting = null;
    this.dataSources = reduce(columnTypes, (sources, k) => {
      sources[k] = new DataStore(k);
      return sources;
    }, {});
  }
  get order() {
    return reduce(this.sorting, (r, c, prop) => {
      r[prop] = c.order;
      return r;
    }, {});
  }
  get stores() {
    return this.dataSources;
  }
  column(c, pin) {
    return this.getColumn(c, pin || 'rgCol');
  }
  getColumn(virtualIndex, type) {
    return getSourceItem(this.dataSources[type].store, virtualIndex);
  }
  getRawColumns() {
    return reduce(this.dataSources, (result, item, type) => {
      result[type] = item.store.get('source');
      return result;
    }, {
      rgCol: [],
      colPinStart: [],
      colPinEnd: []
    });
  }
  getColumns(type = 'all') {
    if (type !== 'all') {
      return this.dataSources[type].store.get('source');
    }
    return columnTypes.reduce((r, t) => {
      r.push(...this.dataSources[t].store.get('source'));
      return r;
    }, []);
  }
  getColumnIndexByProp(prop, type) {
    return getSourceItemVirtualIndexByProp(this.dataSources[type].store, prop);
  }
  getColumnByProp(prop, type) {
    const items = this.dataSources[type].store.get('source');
    return find(items, { prop });
  }
  refreshByType(type) {
    this.dataSources[type].refresh();
  }
  setColumns(data) {
    each(columnTypes, k => {
      // set columns data
      this.dataSources[k].updateData(data.columns[k], {
        // max depth level
        depth: data.maxLevel,
        // groups
        groups: reduce(data.columnGrouping[k], (res, g) => {
          if (!res[g.level]) {
            res[g.level] = [];
          }
          res[g.level].push(g);
          return res;
        }, {}),
      });
    });
    this.sorting = data.sort;
    return data;
  }
  updateColumns(cols) {
    // collect column by type and propert
    const columnByKey = cols.reduce((res, c) => {
      const type = ColumnDataProvider.getColumnType(c);
      if (!res[type]) {
        res[type] = {};
      }
      res[type][c.prop] = c;
      return res;
    }, {});
    // find indexes in source
    const colByIndex = {};
    each(columnByKey, (colsToUpdate, type) => {
      const items = this.dataSources[type].store.get('source');
      colByIndex[type] = items.reduce((result, rgCol, index) => {
        const colToUpdateIfExists = colsToUpdate[rgCol.prop];
        if (colToUpdateIfExists) {
          result[index] = colToUpdateIfExists;
        }
        return result;
      }, {});
    });
    each(colByIndex, (colsToUpdate, type) => setSourceByVirtualIndex(this.dataSources[type].store, colsToUpdate));
  }
  updateColumn(column, index) {
    const type = ColumnDataProvider.getColumnType(column);
    setSourceByVirtualIndex(this.dataSources[type].store, { [index]: column });
  }
  updateColumnSorting(column, index, sorting, additive) {
    if (!additive) {
      this.clearSorting();
    }
    column.order = sorting;
    this.sorting[column.prop] = column;
    this.updateColumn(column, index);
    return column;
  }
  clearSorting() {
    const types = reduce(this.sorting, (r, c) => {
      const k = ColumnDataProvider.getColumnType(c);
      r[k] = true;
      return r;
    }, {});
    each(types, (_, type) => {
      const cols = this.dataSources[type].store.get('source');
      each(cols, (c) => (c.order = undefined));
      this.dataSources[type].setData({ source: [...cols] });
    });
    this.sorting = {};
  }
  static getSizes(cols) {
    return reduce(cols, (res, c, i) => {
      if (c.size) {
        res[i] = c.size;
      }
      return res;
    }, {});
  }
  static getColumnByProp(columns, prop) {
    return find(columns, c => {
      if (isColGrouping(c)) {
        return ColumnDataProvider.getColumnByProp(c.children, prop);
      }
      return c.prop === prop;
    });
  }
  // columns processing
  static getColumns(columns, level = 0, types) {
    return reduce(columns, (res, colData) => {
      /** Grouped column */
      if (isColGrouping(colData)) {
        return GroupingColumnPlugin.gatherGroup(res, colData, ColumnDataProvider.getColumns(colData.children, level + 1, types), level);
      }
      /** Regular column */
      const regularColumn = Object.assign(Object.assign({}, (colData.columnType && types && types[colData.columnType])), colData);
      // not pin
      if (!regularColumn.pin) {
        res.columns.rgCol.push(regularColumn);
        // pin
      }
      else {
        res.columns[regularColumn.pin].push(regularColumn);
      }
      if (regularColumn.order) {
        res.sort[regularColumn.prop] = regularColumn;
      }
      // trigger setup hook if present
      regularColumn.beforeSetup && regularColumn.beforeSetup(regularColumn);
      return res;
    }, {
      columns: {
        rgCol: [],
        colPinStart: [],
        colPinEnd: [],
      },
      columnGrouping: {
        rgCol: [],
        colPinStart: [],
        colPinEnd: [],
      },
      maxLevel: level,
      sort: {},
    });
  }
  static getColumnType(rgCol) {
    if (rgCol.pin) {
      return rgCol.pin;
    }
    return 'rgCol';
  }
}
