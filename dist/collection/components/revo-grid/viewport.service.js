/*!
 * Built by Revolist
 */
import { EMPTY_INDEX } from '../../services/selection.store.connector';
import { getSourceItem, getVisibleSourceItem } from '../../store/dataSource/data.store';
import { columnTypes, rowTypes } from '../../store/storeTypes';
import { UUID } from '../../utils/consts';
import { CONTENT_SLOT, FOOTER_SLOT, getLastCell, HEADER_SLOT } from './viewport.helpers';
import { reduce } from 'lodash';
export default class ViewportService {
  constructor(sv, contentHeight) {
    var _a, _b;
    this.sv = sv;
    this.storesByType = {};
    this.storesXToType = {};
    this.storesYToType = {};
    (_a = this.sv.selectionStoreConnector) === null || _a === void 0 ? void 0 : _a.beforeUpdate();
    this.columns = this.getViewportColumnData(contentHeight);
    (_b = this.sv.scrollingService) === null || _b === void 0 ? void 0 : _b.unregister();
  }
  onColumnResize(type, e, store) {
    var _a;
    (_a = this.sv.dimensionProvider) === null || _a === void 0 ? void 0 : _a.setDimensionSize(type, e.detail);
    const changedItems = reduce(e.detail || {}, (r, size, index) => {
      const item = getSourceItem(store, parseInt(index, 10));
      if (item) {
        r[item.prop] = Object.assign(Object.assign({}, item), { size });
      }
      return r;
    }, {});
    this.sv.resize(changedItems);
  }
  /**
   * Transform data from stores and apply it to different components
   */
  getViewportColumnData(contentHeight) {
    const columns = [];
    let x = 0; // we increase x only if column present
    columnTypes.forEach(val => {
      const colStore = this.sv.columnProvider.stores[val].store;
      // only columns that have data show
      if (!colStore.get('items').length) {
        return;
      }
      const column = {
        colType: val,
        position: { x, y: 1 },
        contentHeight,
        fixWidth: val !== 'rgCol',
        uuid: `${this.sv.uuid}-${x}`,
        viewports: this.sv.viewportProvider.stores,
        dimensions: this.sv.dimensionProvider.stores,
        rowStores: this.sv.dataProvider.stores,
        colStore,
        onHeaderresize: e => this.onColumnResize(val, e, colStore)
      };
      if (val === 'rgCol') {
        column.onResizeViewport = (e) => { var _a; return (_a = this.sv.viewportProvider) === null || _a === void 0 ? void 0 : _a.setViewport(e.detail.dimension, { virtualSize: e.detail.size }); };
      }
      const colData = this.gatherColumnData(column);
      const columnSelectionStore = this.registerCol(colData.position.x, val);
      // render per each column data collections vertically
      const dataPorts = this.dataViewPort(column).reduce((r, rgRow) => {
        // register selection store for Segment
        const segmentSelection = this.registerSegment(rgRow.position);
        segmentSelection.setLastCell(rgRow.lastCell);
        // register selection store for Row
        const rowSelectionStore = this.registerRow(rgRow.position.y, rgRow.type);
        const rowDef = Object.assign(Object.assign({}, rgRow), { rowSelectionStore, segmentSelectionStore: segmentSelection.store, ref: (e) => this.sv.selectionStoreConnector.registerSection(e), onSetRange: e => segmentSelection.setRangeArea(e.detail), onSetTempRange: e => segmentSelection.setTempArea(e.detail), onFocusCell: e => {
            segmentSelection.clearFocus();
            this.sv.selectionStoreConnector.focus(segmentSelection, e.detail);
          } });
        r.push(rowDef);
        return r;
      }, []);
      columns.push(Object.assign(Object.assign({}, colData), { columnSelectionStore,
        dataPorts }));
      x++;
    });
    return columns;
  }
  /** register selection store for Segment */
  registerSegment(position) {
    return this.sv.selectionStoreConnector.register(position);
  }
  /** register selection store for Row */
  registerRow(y, type) {
    // link to position
    this.storesByType[type] = y;
    this.storesYToType[y] = type;
    return this.sv.selectionStoreConnector.registerRow(y).store;
  }
  /** register selection store for Column */
  registerCol(x, type) {
    // link to position
    this.storesByType[type] = x;
    this.storesXToType[x] = type;
    return this.sv.selectionStoreConnector.registerColumn(x).store;
  }
  /** Collect Column data */
  gatherColumnData(data) {
    const parent = data.uuid;
    const realSize = data.dimensions[data.colType].store.get('realSize');
    const prop = {
      contentWidth: realSize,
      class: data.colType,
      [`${UUID}`]: data.uuid,
      contentHeight: data.contentHeight,
      key: data.colType,
      onResizeViewport: data.onResizeViewport,
    };
    if (data.fixWidth) {
      prop.style = { minWidth: `${realSize}px` };
    }
    const headerProp = {
      parent,
      colData: getVisibleSourceItem(data.colStore),
      dimensionCol: data.dimensions[data.colType].store,
      groups: data.colStore.get('groups'),
      groupingDepth: data.colStore.get('groupingDepth'),
      onHeaderresize: data.onHeaderresize,
    };
    return {
      prop,
      position: data.position,
      headerProp,
      parent,
      viewportCol: data.viewports[data.colType].store,
    };
  }
  /** Collect Row data */
  dataViewPort(data) {
    const slots = {
      rowPinStart: HEADER_SLOT,
      rgRow: CONTENT_SLOT,
      rowPinEnd: FOOTER_SLOT,
    };
    // y position for selection
    let y = 0;
    return rowTypes.reduce((r, type) => {
      // filter out empty sources, we still need to return source to keep slot working
      const isPresent = data.viewports[type].store.get('realCount') || type === 'rgRow';
      const rgCol = Object.assign(Object.assign({}, data), { position: Object.assign(Object.assign({}, data.position), { y: isPresent ? y : EMPTY_INDEX }) });
      r.push(this.dataPartition(rgCol, type, slots[type], type !== 'rgRow'));
      if (isPresent) {
        y++;
      }
      return r;
    }, []);
  }
  dataPartition(data, type, slot, fixed) {
    return {
      colData: data.colStore,
      viewportCol: data.viewports[data.colType].store,
      viewportRow: data.viewports[type].store,
      lastCell: getLastCell(data, type),
      slot,
      type,
      canDrag: !fixed,
      position: data.position,
      uuid: `${data.uuid}-${data.position.x}-${data.position.y}`,
      dataStore: data.rowStores[type].store,
      dimensionCol: data.dimensions[data.colType].store,
      dimensionRow: data.dimensions[type].store,
      style: fixed ? { height: `${data.dimensions[type].store.get('realSize')}px` } : undefined,
    };
  }
  scrollToCell(cell) {
    for (let key in cell) {
      const coordinate = cell[key];
      this.sv.scrollingService.onScroll({ dimension: key === 'x' ? 'rgCol' : 'rgRow', coordinate });
    }
  }
  /**
   * Clear current grid focus
   */
  clearFocused() {
    this.sv.selectionStoreConnector.clearAll();
  }
  clearEdit() {
    this.sv.selectionStoreConnector.setEdit(false);
  }
  getFocused() {
    const focused = this.sv.selectionStoreConnector.focusedStore;
    if (!focused) {
      return null;
    }
    const colType = this.storesXToType[focused.position.x];
    const column = this.sv.columnProvider.getColumn(focused.cell.x, colType);
    const rowType = this.storesYToType[focused.position.x];
    const model = this.sv.dataProvider.getModel(focused.cell.x, rowType);
    return {
      column,
      model,
      cell: focused.cell,
      colType,
      rowType
    };
  }
  getSelectedRange() {
    return this.sv.selectionStoreConnector.selectedRange;
  }
  setEdit(rowIndex, colIndex, colType, rowType) {
    var _a;
    const stores = this.storesByType;
    const storeCoordinate = {
      x: stores[colType],
      y: stores[rowType],
    };
    (_a = this.sv.selectionStoreConnector) === null || _a === void 0 ? void 0 : _a.setEditByCell(storeCoordinate, { x: colIndex, y: rowIndex });
  }
}
