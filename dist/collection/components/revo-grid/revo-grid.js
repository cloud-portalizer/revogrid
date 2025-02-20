/*!
 * Built by Revolist
 */
import { Component, Prop, h, Watch, Element, Listen, Event, Method, State, Host } from '@stencil/core';
import reduce from 'lodash/reduce';
import each from 'lodash/each';
import ColumnDataProvider from '../../services/column.data.provider';
import { DataProvider } from '../../services/data.provider';
import { getVisibleSourceItem } from '../../store/dataSource/data.store';
import DimensionProvider from '../../services/dimension.provider';
import ViewportProvider from '../../services/viewport.provider';
import ThemeService from '../../themeManager/themeService';
import { timeout } from '../../utils/utils';
import AutoSize from '../../plugins/autoSizeColumn';
import { columnTypes } from '../../store/storeTypes';
import FilterPlugin from '../../plugins/filter/filter.plugin';
import SortingPlugin from '../../plugins/sorting/sorting.plugin';
import ExportFilePlugin from '../../plugins/export/export.plugin';
import GroupingRowPlugin from '../../plugins/groupingRow/grouping.row.plugin';
import { RevoViewPort } from './viewport';
import ViewportService from './viewport.service';
import { ViewPortSections } from './viewport.section';
import GridScrollingService from './viewport.scrolling.service';
import { UUID } from '../../utils/consts';
import SelectionStoreConnector from '../../services/selection.store.connector';
import StretchColumn, { isStretchPlugin } from '../../plugins/stretchPlugin';
import ColumnPlugin from '../../plugins/moveColumn/columnDragPlugin';
export class RevoGridComponent {
  constructor() {
    /**
     * Defines how many rows/columns should be rendered outside visible area.
     */
    this.frameSize = 1;
    /**
     * Indicates default rgRow size.
     * By default 0, means theme package size will be applied
     */
    this.rowSize = 0;
    /** Indicates default column size. */
    this.colSize = 100;
    /** When true, user can range selection. */
    this.range = false;
    /** When true, grid in read only mode. */
    this.readonly = false;
    /** When true, columns are resizable. */
    this.resize = false;
    /** When true cell focus appear. */
    this.canFocus = true;
    /** When true enable clipboard. */
    this.useClipboard = true;
    /**
     * Columns - defines an array of grid columns.
     * Can be column or grouped column.
     */
    this.columns = [];
    /**
     * Source - defines main data source.
     * Can be an Object or 2 dimensional array([][]);
     * Keys/indexes referenced from columns Prop
     */
    this.source = [];
    /** Pinned top Source: {[T in ColumnProp]: any} - defines pinned top rows data source. */
    this.pinnedTopSource = [];
    /** Pinned bottom Source: {[T in ColumnProp]: any} - defines pinned bottom rows data source. */
    this.pinnedBottomSource = [];
    /** Row properies applied */
    this.rowDefinitions = [];
    /** Custom editors register */
    this.editors = {};
    /** Types
     *  Every type represent multiple column properties
     *  Types will be merged but can be replaced with column properties
     */
    this.columnTypes = {};
    /** Theme name */
    this.theme = 'default';
    /**
     * Row class property
     * Define this property in rgRow object and this will be mapped as rgRow class
     */
    this.rowClass = '';
    /**
     * Autosize config
     * Enable columns autoSize, for more details check @autoSizeColumn plugin
     * By default disabled, hence operation is not resource efficient
     * true to enable with default params (double header separator click for autosize)
     * or provide config
     */
    this.autoSizeColumn = false;
    /**
     * Enables filter plugin
     * Can be boolean
     * Can be filter collection
     */
    this.filter = false;
    /**
     * Enables column move plugin
     * Can be boolean
     */
    this.canMoveColumns = false;
    /**
     * Trimmed rows
     * Functionality which allows to hide rows from main data set
     * @trimmedRows are physical rgRow indexes to hide
     */
    this.trimmedRows = {};
    /**
     * Enables export plugin
     * Can be boolean
     * Can be export options
     */
    this.exporting = false;
    /**
     * Defines stretch strategy for columns with @StretchColumn plugin
     * if there are more space on the right last column size would be increased
     */
    this.stretch = true;
    // --------------------------------------------------------------------------
    //
    //  Private Properties
    //
    // --------------------------------------------------------------------------
    // for internal plugin usage
    this.extraElements = [];
    this.uuid = null;
    this.viewport = null;
    /**
     * Plugins
     * Define plugins collection
     */
    this.internalPlugins = [];
    this.subscribers = {};
  }
  // --------------------------------------------------------------------------
  //
  //  Methods
  //
  // --------------------------------------------------------------------------
  /**
   * Refreshes data viewport.
   * Can be specific part as rgRow or pinned rgRow or 'all' by default.
   */
  async refresh(type = 'all') {
    this.dataProvider.refresh(type);
  }
  /**  Scrolls view port to specified rgRow index */
  async scrollToRow(coordinate = 0) {
    const y = this.dimensionProvider.getViewPortPos({
      coordinate,
      dimension: 'rgRow',
    });
    await this.scrollToCoordinate({ y });
  }
  /** Scrolls view port to specified column index */
  async scrollToColumnIndex(coordinate = 0) {
    const x = this.dimensionProvider.getViewPortPos({
      coordinate,
      dimension: 'rgCol',
    });
    await this.scrollToCoordinate({ x });
  }
  /**  Scrolls view port to specified column prop */
  async scrollToColumnProp(prop) {
    const coordinate = this.columnProvider.getColumnIndexByProp(prop, 'rgCol');
    if (coordinate < 0) {
      // already on the screen
      return;
    }
    const x = this.dimensionProvider.getViewPortPos({
      coordinate,
      dimension: 'rgCol',
    });
    await this.scrollToCoordinate({ x });
  }
  /** Update columns */
  async updateColumns(cols) {
    this.columnProvider.updateColumns(cols);
  }
  /** Add trimmed by type */
  async addTrimmed(trimmed, trimmedType = 'external', type = 'rgRow') {
    const event = this.beforetrimmed.emit({
      trimmed,
      trimmedType,
      type,
    });
    if (event.defaultPrevented) {
      return event;
    }
    this.dataProvider.setTrimmed({ [trimmedType]: event.detail.trimmed }, type);
    this.aftertrimmed.emit();
    return event;
  }
  /**  Scrolls view port to coordinate */
  async scrollToCoordinate(cell) {
    var _a;
    (_a = this.viewport) === null || _a === void 0 ? void 0 : _a.scrollToCell(cell);
  }
  /**  Bring cell to edit mode */
  async setCellEdit(rgRow, prop, rowSource = 'rgRow') {
    var _a;
    const rgCol = ColumnDataProvider.getColumnByProp(this.columns, prop);
    if (!rgCol) {
      return;
    }
    await timeout();
    (_a = this.viewport) === null || _a === void 0 ? void 0 : _a.setEdit(rgRow, this.columnProvider.getColumnIndexByProp(prop, 'rgCol'), rgCol.pin || 'rgCol', rowSource);
  }
  /**
   * Register new virtual node inside of grid
   * Used for additional items creation such as plugin elements
   */
  async registerVNode(elements) {
    this.extraElements.push(...elements);
    this.extraElements = [...this.extraElements];
  }
  /**  Get data from source */
  async getSource(type = 'rgRow') {
    return this.dataProvider.stores[type].store.get('source');
  }
  /**
   * Get data from visible part of source
   * Trimmed/filtered rows will be excluded
   * @param type - type of source
   */
  async getVisibleSource(type = 'rgRow') {
    return getVisibleSourceItem(this.dataProvider.stores[type].store);
  }
  /**
   * Provides access to rows internal store observer
   * Can be used for plugin support
   * @param type - type of source
   */
  async getSourceStore(type = 'rgRow') {
    return this.dataProvider.stores[type].store;
  }
  /**
   * Provides access to column internal store observer
   * Can be used for plugin support
   * @param type - type of column
   */
  async getColumnStore(type = 'rgCol') {
    return this.columnProvider.stores[type].store;
  }
  /**
   * Update column sorting
   * @param column - full column details to update
   * @param index - virtual column index
   * @param order - order to apply
   */
  async updateColumnSorting(column, index, order, additive) {
    return this.columnProvider.updateColumnSorting(column, index, order, additive);
  }
  /**
   * Clears column sorting
   */
  async clearSorting() {
    this.columnProvider.clearSorting();
  }
  /**
   * Receive all columns in data source
   */
  async getColumns() {
    return this.columnProvider.getColumns();
  }
  /**
   * Clear current grid focus
   */
  async clearFocus() {
    var _a;
    const focused = await this.getFocused();
    const event = this.beforefocuslost.emit(focused);
    if (event.defaultPrevented) {
      return;
    }
    this.selectionStoreConnector.clearAll();
    (_a = this.viewport) === null || _a === void 0 ? void 0 : _a.clearFocused();
  }
  /**
   * Get all active plugins instances
   */
  async getPlugins() {
    return [...this.internalPlugins];
  }
  /**
   * Get the currently focused cell.
   */
  async getFocused() {
    var _a;
    return (_a = this.viewport) === null || _a === void 0 ? void 0 : _a.getFocused();
  }
  /**
   * Get the currently selected Range.
   */
  async getSelectedRange() {
    var _a;
    return (_a = this.viewport) === null || _a === void 0 ? void 0 : _a.getSelectedRange();
  }
  // --------------------------------------------------------------------------
  //
  //  Listeners outside scope
  //
  // --------------------------------------------------------------------------
  /** Clear data which is outside of grid container */
  handleOutsideClick({ target }) {
    if (!(target === null || target === void 0 ? void 0 : target.closest(`[${UUID}="${this.uuid}"]`))) {
      this.clearFocus();
    }
  }
  // --------------------------------------------------------------------------
  //
  //  Listeners
  //
  // --------------------------------------------------------------------------
  /** DRAG AND DROP */
  onRowDragStarted(e) {
    var _a;
    e.cancelBubble = true;
    const dragStart = this.rowdragstart.emit(e.detail);
    if (dragStart.defaultPrevented) {
      e.preventDefault();
      return;
    }
    (_a = this.orderService) === null || _a === void 0 ? void 0 : _a.start(this.element, Object.assign(Object.assign({}, e.detail), dragStart.detail));
  }
  onRowDragEnd() {
    var _a;
    (_a = this.orderService) === null || _a === void 0 ? void 0 : _a.end();
  }
  onRowDrag({ detail }) {
    var _a;
    (_a = this.orderService) === null || _a === void 0 ? void 0 : _a.move(detail);
  }
  onRowMouseMove(e) {
    var _a;
    e.cancelBubble = true;
    (_a = this.orderService) === null || _a === void 0 ? void 0 : _a.moveTip(e.detail);
  }
  async onBeforeEdit(e) {
    e.cancelBubble = true;
    const { defaultPrevented, detail } = this.beforeedit.emit(e.detail);
    await timeout();
    // apply data
    if (!defaultPrevented) {
      this.dataProvider.setCellData(detail);
      this.afteredit.emit(detail);
    }
  }
  onBeforeRangeEdit(e) {
    e.cancelBubble = true;
    const { defaultPrevented } = this.beforerangeedit.emit(e.detail);
    if (defaultPrevented) {
      e.preventDefault();
      return;
    }
    this.afteredit.emit(e.detail);
  }
  onRangeChanged(e) {
    e.cancelBubble = true;
    const beforeaange = this.beforeaange.emit(e.detail);
    if (beforeaange.defaultPrevented) {
      e.preventDefault();
    }
    const beforeFill = this.beforeautofill.emit(e.detail);
    if (beforeFill.defaultPrevented) {
      return;
    }
  }
  onRowDropped(e) {
    e.cancelBubble = true;
    const { defaultPrevented } = this.roworderchanged.emit(e.detail);
    if (defaultPrevented) {
      e.preventDefault();
    }
  }
  onHeaderClick(e) {
    const { defaultPrevented } = this.headerclick.emit(Object.assign(Object.assign({}, e.detail.column), { originalEvent: e.detail.originalEvent }));
    if (defaultPrevented) {
      e.preventDefault();
    }
  }
  onCellFocus(e) {
    e.cancelBubble = true;
    const { defaultPrevented } = this.beforecellfocus.emit(e.detail);
    if (!this.canFocus || defaultPrevented) {
      e.preventDefault();
    }
  }
  columnChanged(newVal = []) {
    this.dimensionProvider.drop();
    const columnGather = ColumnDataProvider.getColumns(newVal, 0, this.columnTypes);
    this.beforecolumnsset.emit(columnGather);
    for (let type of columnTypes) {
      const items = columnGather.columns[type];
      this.dimensionProvider.setRealSize(items.length, type);
      this.dimensionProvider.setColumns(type, ColumnDataProvider.getSizes(items), type !== 'rgCol');
    }
    this.beforecolumnapplied.emit(columnGather);
    const columns = this.columnProvider.setColumns(columnGather);
    this.aftercolumnsset.emit({
      columns,
      order: this.columnProvider.order,
    });
  }
  themeChanged(t) {
    this.themeService.register(t);
    this.dimensionProvider.setSettings({ originItemSize: this.themeService.rowSize, frameOffset: this.frameSize || 0 }, 'rgRow');
    this.dimensionProvider.setSettings({ originItemSize: this.colSize, frameOffset: this.frameSize || 0 }, 'rgCol');
  }
  dataChanged(source = []) {
    let newSource = [...source];
    const beforesourceset = this.beforesourceset.emit({
      type: 'rgRow',
      source: newSource,
    });
    newSource = beforesourceset.detail.source;
    newSource = this.dataProvider.setData(newSource, 'rgRow');
    this.aftersourceset.emit({
      type: 'rgRow',
      source: newSource,
    });
  }
  dataBottomChanged(newVal = []) {
    this.dataProvider.setData(newVal, 'rowPinEnd');
  }
  dataTopChanged(newVal = []) {
    this.dataProvider.setData(newVal, 'rowPinStart');
  }
  rowDefChanged(newVal = []) {
    if (!newVal.length) {
      return;
    }
    const rows = reduce(newVal, (r, v) => {
      if (!r[v.type]) {
        r[v.type] = {};
      }
      if (v.size) {
        if (!r[v.type].sizes) {
          r[v.type].sizes = {};
        }
        r[v.type].sizes[v.index] = v.size;
      }
      return r;
    }, {});
    each(rows, (r, k) => {
      if (r.sizes) {
        this.dimensionProvider.setDimensionSize(k, r.sizes);
      }
    });
  }
  trimmedRowsChanged(newVal = {}) {
    this.addTrimmed(newVal);
  }
  groupingChanged(newVal = {}) {
    let grPlugin;
    for (let p of this.internalPlugins) {
      const isGrouping = p;
      if (isGrouping.setGrouping) {
        grPlugin = isGrouping;
        break;
      }
    }
    if (!grPlugin) {
      return;
    }
    grPlugin.setGrouping(newVal || {});
  }
  applyStretch(isStretch) {
    if (isStretch === 'false') {
      isStretch = false;
    }
    let stretch = this.internalPlugins.filter(p => isStretchPlugin(p))[0];
    if (isStretch) {
      if (!stretch) {
        this.internalPlugins.push(new StretchColumn(this.element, this.dimensionProvider));
      }
      else {
        stretch.applyStretch(this.columnProvider.getRawColumns());
      }
    }
    else if (stretch) {
      const index = this.internalPlugins.indexOf(stretch);
      this.internalPlugins.splice(index, 1);
    }
  }
  connectedCallback() {
    this.viewportProvider = new ViewportProvider();
    this.themeService = new ThemeService({
      rowSize: this.rowSize,
    });
    this.dimensionProvider = new DimensionProvider(this.viewportProvider);
    this.columnProvider = new ColumnDataProvider();
    this.dataProvider = new DataProvider(this.dimensionProvider);
    this.uuid = `${new Date().getTime()}-rvgrid`;
    const pluginData = {
      data: this.dataProvider,
      column: this.columnProvider,
      dimension: this.dimensionProvider,
      viewport: this.viewportProvider,
      selection: this.selectionStoreConnector,
    };
    if (this.autoSizeColumn) {
      this.internalPlugins.push(new AutoSize(this.element, {
        dataProvider: this.dataProvider,
        columnProvider: this.columnProvider,
        dimensionProvider: this.dimensionProvider,
      }, typeof this.autoSizeColumn === 'object' ? this.autoSizeColumn : undefined));
    }
    if (this.filter) {
      this.internalPlugins.push(new FilterPlugin(this.element, this.uuid, typeof this.filter === 'object' ? this.filter : undefined));
    }
    if (this.exporting) {
      this.internalPlugins.push(new ExportFilePlugin(this.element));
    }
    this.internalPlugins.push(new SortingPlugin(this.element));
    if (this.plugins) {
      this.plugins.forEach(p => {
        this.internalPlugins.push(new p(this.element, pluginData));
      });
    }
    if (this.canMoveColumns) {
      this.internalPlugins.push(new ColumnPlugin(this.element, pluginData));
    }
    this.internalPlugins.push(new GroupingRowPlugin(this.element, {
      dataProvider: this.dataProvider,
      columnProvider: this.columnProvider,
    }));
    this.applyStretch(this.stretch);
    this.themeChanged(this.theme);
    this.columnChanged(this.columns);
    this.dataChanged(this.source);
    this.dataTopChanged(this.pinnedTopSource);
    this.dataBottomChanged(this.pinnedBottomSource);
    this.trimmedRowsChanged(this.trimmedRows);
    this.rowDefChanged(this.rowDefinitions);
    this.groupingChanged(this.grouping);
    this.selectionStoreConnector = new SelectionStoreConnector();
    this.scrollingService = new GridScrollingService((e) => {
      this.dimensionProvider.setViewPortCoordinate({
        coordinate: e.coordinate,
        type: e.dimension,
      });
      this.viewportscroll.emit(e);
    });
    this.subscribers = { 'click': this.handleOutsideClick.bind(this) };
    for (let type in this.subscribers) {
      document.addEventListener(type, this.subscribers[type]);
    }
  }
  disconnectedCallback() {
    // destroy plugins on element disconnect
    each(this.internalPlugins, p => p.destroy());
    this.internalPlugins = [];
    // clear events
    for (let type in this.subscribers) {
      document.removeEventListener(type, this.subscribers[type]);
      delete this.subscribers[type];
    }
  }
  render() {
    const contentHeight = this.dimensionProvider.stores['rgRow'].store.get('realSize');
    this.viewport = new ViewportService({
      columnProvider: this.columnProvider,
      dataProvider: this.dataProvider,
      dimensionProvider: this.dimensionProvider,
      viewportProvider: this.viewportProvider,
      uuid: this.uuid,
      scrollingService: this.scrollingService,
      orderService: this.orderService,
      selectionStoreConnector: this.selectionStoreConnector,
      resize: c => this.aftercolumnresize.emit(c)
    }, contentHeight);
    const views = [];
    if (this.rowHeaders) {
      const anyView = this.viewport.columns[0];
      views.push(h("revogr-row-headers", { height: contentHeight, resize: this.resize, dataPorts: anyView.dataPorts, headerProp: anyView.headerProp, uiid: anyView.prop[UUID], rowHeaderColumn: typeof this.rowHeaders === 'object' ? this.rowHeaders : undefined, onScrollViewport: ({ detail: e }) => this.scrollingService.onScroll(e, 'headerRow'), onElementToScroll: ({ detail: e }) => this.scrollingService.registerElement(e, 'headerRow') }));
    }
    views.push(h(ViewPortSections, { columnFilter: !!this.filter, resize: this.resize, readonly: this.readonly, range: this.range, rowClass: this.rowClass, editors: this.editors, useClipboard: this.useClipboard, columns: this.viewport.columns, onEdit: detail => {
        const event = this.beforeeditstart.emit(detail);
        if (!event.defaultPrevented) {
          this.selectionStoreConnector.setEdit(detail.isCancel ? false : detail.val);
        }
      }, registerElement: (e, k) => this.scrollingService.registerElement(e, k), onScroll: details => this.scrollingService.onScroll(details) }));
    return (h(Host, Object.assign({}, { [`${UUID}`]: this.uuid }),
      h(RevoViewPort, { viewports: this.viewportProvider.stores, dimensions: this.dimensionProvider.stores, orderRef: e => (this.orderService = e), registerElement: (e, k) => this.scrollingService.registerElement(e, k), nakedClick: () => this.viewport.clearEdit(), onScroll: details => this.scrollingService.onScroll(details) }, views),
      this.extraElements));
  }
  static get is() { return "revo-grid"; }
  static get originalStyleUrls() { return {
    "$": ["revo-grid-style.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["revo-grid-style.css"]
  }; }
  static get properties() { return {
    "rowHeaders": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "RevoGrid.RowHeaders | boolean",
        "resolved": "RowHeaders | boolean",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Excel like show rgRow indexe per rgRow"
      },
      "attribute": "row-headers",
      "reflect": false
    },
    "frameSize": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Defines how many rows/columns should be rendered outside visible area."
      },
      "attribute": "frame-size",
      "reflect": false,
      "defaultValue": "1"
    },
    "rowSize": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Indicates default rgRow size.\nBy default 0, means theme package size will be applied"
      },
      "attribute": "row-size",
      "reflect": false,
      "defaultValue": "0"
    },
    "colSize": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Indicates default column size."
      },
      "attribute": "col-size",
      "reflect": false,
      "defaultValue": "100"
    },
    "range": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "When true, user can range selection."
      },
      "attribute": "range",
      "reflect": false,
      "defaultValue": "false"
    },
    "readonly": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "When true, grid in read only mode."
      },
      "attribute": "readonly",
      "reflect": false,
      "defaultValue": "false"
    },
    "resize": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "When true, columns are resizable."
      },
      "attribute": "resize",
      "reflect": false,
      "defaultValue": "false"
    },
    "canFocus": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "When true cell focus appear."
      },
      "attribute": "can-focus",
      "reflect": false,
      "defaultValue": "true"
    },
    "useClipboard": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "When true enable clipboard."
      },
      "attribute": "use-clipboard",
      "reflect": false,
      "defaultValue": "true"
    },
    "columns": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "(RevoGrid.ColumnRegular | RevoGrid.ColumnGrouping)[]",
        "resolved": "(ColumnRegular | ColumnGrouping)[]",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Columns - defines an array of grid columns.\nCan be column or grouped column."
      },
      "defaultValue": "[]"
    },
    "source": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RevoGrid.DataType[]",
        "resolved": "DataType[]",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Source - defines main data source.\nCan be an Object or 2 dimensional array([][]);\nKeys/indexes referenced from columns Prop"
      },
      "defaultValue": "[]"
    },
    "pinnedTopSource": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RevoGrid.DataType[]",
        "resolved": "DataType[]",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Pinned top Source: {[T in ColumnProp]: any} - defines pinned top rows data source."
      },
      "defaultValue": "[]"
    },
    "pinnedBottomSource": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RevoGrid.DataType[]",
        "resolved": "DataType[]",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Pinned bottom Source: {[T in ColumnProp]: any} - defines pinned bottom rows data source."
      },
      "defaultValue": "[]"
    },
    "rowDefinitions": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RevoGrid.RowDefinition[]",
        "resolved": "RowDefinition[]",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Row properies applied"
      },
      "defaultValue": "[]"
    },
    "editors": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Edition.Editors",
        "resolved": "{ [name: string]: EditorCtr; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Custom editors register"
      },
      "defaultValue": "{}"
    },
    "plugins": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RevoPlugin.PluginClass[]",
        "resolved": "(typeof Plugin)[]",
        "references": {
          "RevoPlugin": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Custom grid plugins\nHas to be predefined during first grid init\nEvery plugin should be inherited from BasePlugin"
      }
    },
    "columnTypes": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "{ [name: string]: RevoGrid.ColumnType }",
        "resolved": "{ [name: string]: ColumnType; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Types\nEvery type represent multiple column properties\nTypes will be merged but can be replaced with column properties"
      },
      "defaultValue": "{}"
    },
    "theme": {
      "type": "string",
      "mutable": true,
      "complexType": {
        "original": "ThemeSpace.Theme",
        "resolved": "\"compact\" | \"darkCompact\" | \"darkMaterial\" | \"default\" | \"material\"",
        "references": {
          "ThemeSpace": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Theme name"
      },
      "attribute": "theme",
      "reflect": true,
      "defaultValue": "'default'"
    },
    "rowClass": {
      "type": "string",
      "mutable": false,
      "complexType": {
        "original": "string",
        "resolved": "string",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Row class property\nDefine this property in rgRow object and this will be mapped as rgRow class"
      },
      "attribute": "row-class",
      "reflect": true,
      "defaultValue": "''"
    },
    "autoSizeColumn": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean | AutoSizeColumnConfig",
        "resolved": "boolean | { mode?: ColumnAutoSizeMode; allColumns?: boolean; letterBlockSize?: number; preciseSize?: boolean; }",
        "references": {
          "AutoSizeColumnConfig": {
            "location": "import",
            "path": "../../plugins/autoSizeColumn"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Autosize config\nEnable columns autoSize, for more details check @autoSizeColumn plugin\nBy default disabled, hence operation is not resource efficient\ntrue to enable with default params (double header separator click for autosize)\nor provide config"
      },
      "attribute": "auto-size-column",
      "reflect": false,
      "defaultValue": "false"
    },
    "filter": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean | ColumnFilterConfig",
        "resolved": "boolean | { collection?: FilterCollection; include?: string[]; customFilters?: Record<string, CustomFilter>; localization?: FilterLocalization; multiFilterItems?: MultiFilterItem; disableDynamicFiltering?: boolean; }",
        "references": {
          "ColumnFilterConfig": {
            "location": "import",
            "path": "../../plugins/filter/filter.plugin"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Enables filter plugin\nCan be boolean\nCan be filter collection"
      },
      "attribute": "filter",
      "reflect": false,
      "defaultValue": "false"
    },
    "canMoveColumns": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Enables column move plugin\nCan be boolean"
      },
      "attribute": "can-move-columns",
      "reflect": false,
      "defaultValue": "false"
    },
    "trimmedRows": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Record<number, boolean>",
        "resolved": "{ [x: number]: boolean; }",
        "references": {
          "Record": {
            "location": "global"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [{
            "name": "trimmedRows",
            "text": "are physical rgRow indexes to hide"
          }],
        "text": "Trimmed rows\nFunctionality which allows to hide rows from main data set"
      },
      "defaultValue": "{}"
    },
    "exporting": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Enables export plugin\nCan be boolean\nCan be export options"
      },
      "attribute": "exporting",
      "reflect": false,
      "defaultValue": "false"
    },
    "grouping": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "GroupingOptions",
        "resolved": "{ props?: ColumnProp[]; expandedAll?: boolean; groupLabelTemplate?: GroupLabelTemplateFunc; }",
        "references": {
          "GroupingOptions": {
            "location": "import",
            "path": "../../plugins/groupingRow/grouping.row.types"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Group models by provided properties\nDefine properties to be groped by"
      }
    },
    "stretch": {
      "type": "any",
      "mutable": false,
      "complexType": {
        "original": "boolean | string",
        "resolved": "boolean | string",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Defines stretch strategy for columns with @StretchColumn plugin\nif there are more space on the right last column size would be increased"
      },
      "attribute": "stretch",
      "reflect": false,
      "defaultValue": "true"
    }
  }; }
  static get states() { return {
    "extraElements": {}
  }; }
  static get events() { return [{
      "method": "beforeedit",
      "name": "beforeedit",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before edit event.\nTriggered before edit data applied.\nUse e.preventDefault() to prevent edit data set and use you own.\nUse e.val = {your value} to replace edit result with your own."
      },
      "complexType": {
        "original": "Edition.BeforeSaveDataDetails",
        "resolved": "{ prop: ColumnProp; model: DataType; val?: string; rowIndex: number; type: DimensionRows; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforerangeedit",
      "name": "beforerangeedit",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before range edit event.\nTriggered before range data applied, when range selection happened.\nUse e.preventDefault() to prevent edit data set and use you own."
      },
      "complexType": {
        "original": "Edition.BeforeRangeSaveDataDetails",
        "resolved": "{ data: DataLookup; models: { [rowIndex: number]: DataType; }; type: DimensionRows; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "afteredit",
      "name": "afteredit",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "After edit.\nTriggered when after data applied or Range changeged."
      },
      "complexType": {
        "original": "Edition.BeforeSaveDataDetails | Edition.BeforeRangeSaveDataDetails",
        "resolved": "{ data: DataLookup; models: { [rowIndex: number]: DataType; }; type: DimensionRows; } | { prop: ColumnProp; model: DataType; val?: string; rowIndex: number; type: DimensionRows; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforeautofill",
      "name": "beforeautofill",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before autofill.\nTriggered before autofill applied.\nUse e.preventDefault() to prevent edit data apply."
      },
      "complexType": {
        "original": "Selection.ChangedRange",
        "resolved": "{ type: DimensionRows; newRange: RangeArea; oldRange: RangeArea; newProps: ColumnProp[]; oldProps: ColumnProp[]; newData: { [key: number]: DataType; }; }",
        "references": {
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforeaange",
      "name": "beforeaange",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before range apply.\nTriggered before range applied.\nUse e.preventDefault() to prevent range."
      },
      "complexType": {
        "original": "Selection.ChangedRange",
        "resolved": "{ type: DimensionRows; newRange: RangeArea; oldRange: RangeArea; newProps: ColumnProp[]; oldProps: ColumnProp[]; newData: { [key: number]: DataType; }; }",
        "references": {
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "afterfocus",
      "name": "afterfocus",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Triggered after focus render finished.\nCan be used to access a focus element through @event.target"
      },
      "complexType": {
        "original": "{ model: any; column: RevoGrid.ColumnRegular; }",
        "resolved": "{ model: any; column: ColumnRegular; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "roworderchanged",
      "name": "roworderchanged",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before rgRow order apply.\nUse e.preventDefault() to prevent rgRow order change."
      },
      "complexType": {
        "original": "{ from: number; to: number }",
        "resolved": "{ from: number; to: number; }",
        "references": {}
      }
    }, {
      "method": "beforesourcesortingapply",
      "name": "beforesourcesortingapply",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before source update sorting apply.\nUse this event if you intended to prevent sorting on data update.\nUse e.preventDefault() to prevent sorting data change during rows source update."
      },
      "complexType": {
        "original": "any",
        "resolved": "any",
        "references": {}
      }
    }, {
      "method": "beforesortingapply",
      "name": "beforesortingapply",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before sorting apply.\nUse e.preventDefault() to prevent sorting data change."
      },
      "complexType": {
        "original": "{\n    column: RevoGrid.ColumnRegular;\n    order: 'desc' | 'asc';\n    additive: boolean;\n  }",
        "resolved": "{ column: ColumnRegular; order: \"desc\" | \"asc\"; additive: boolean; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforesorting",
      "name": "beforesorting",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before sorting event.\nInitial sorting triggered, if this event stops no other event called.\nUse e.preventDefault() to prevent sorting."
      },
      "complexType": {
        "original": "{\n    column: RevoGrid.ColumnRegular;\n    order: 'desc' | 'asc';\n    additive: boolean;\n  }",
        "resolved": "{ column: ColumnRegular; order: \"desc\" | \"asc\"; additive: boolean; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "rowdragstart",
      "name": "rowdragstart",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Row order change started.\nUse e.preventDefault() to prevent rgRow order change.\nUse e.text = 'new name' to change item name on start."
      },
      "complexType": {
        "original": "{ pos: RevoGrid.PositionItem; text: string }",
        "resolved": "{ pos: PositionItem; text: string; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "headerclick",
      "name": "headerclick",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "On header click."
      },
      "complexType": {
        "original": "RevoGrid.ColumnRegular",
        "resolved": "ColumnRegular",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforecellfocus",
      "name": "beforecellfocus",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before cell focus changed.\nUse e.preventDefault() to prevent cell focus change."
      },
      "complexType": {
        "original": "Edition.BeforeSaveDataDetails",
        "resolved": "{ prop: ColumnProp; model: DataType; val?: string; rowIndex: number; type: DimensionRows; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforefocuslost",
      "name": "beforefocuslost",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before grid focus lost happened.\nUse e.preventDefault() to prevent cell focus change."
      },
      "complexType": {
        "original": "FocusedData|null",
        "resolved": "{ model: any; cell: Cell; colType: DimensionCols; rowType: DimensionRows; column?: ColumnRegular; }",
        "references": {
          "FocusedData": {
            "location": "import",
            "path": "./viewport.service"
          }
        }
      }
    }, {
      "method": "beforesourceset",
      "name": "beforesourceset",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before data apply.\nYou can override data source here"
      },
      "complexType": {
        "original": "{\n    type: RevoGrid.DimensionRows;\n    source: RevoGrid.DataType[];\n  }",
        "resolved": "{ type: DimensionRows; source: DataType[]; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "aftersourceset",
      "name": "aftersourceset",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "After rows updated"
      },
      "complexType": {
        "original": "{\n    type: RevoGrid.DimensionRows;\n    source: RevoGrid.DataType[];\n  }",
        "resolved": "{ type: DimensionRows; source: DataType[]; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforecolumnsset",
      "name": "beforecolumnsset",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before column update"
      },
      "complexType": {
        "original": "ColumnCollection",
        "resolved": "{ columns: ColumnItems; columnGrouping: ColumnGrouping; maxLevel: number; sort: Record<ColumnProp, ColumnRegular>; }",
        "references": {
          "ColumnCollection": {
            "location": "import",
            "path": "../../services/column.data.provider"
          }
        }
      }
    }, {
      "method": "beforecolumnapplied",
      "name": "beforecolumnapplied",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before column applied but after column set gathered and viewport updated"
      },
      "complexType": {
        "original": "ColumnCollection",
        "resolved": "{ columns: ColumnItems; columnGrouping: ColumnGrouping; maxLevel: number; sort: Record<ColumnProp, ColumnRegular>; }",
        "references": {
          "ColumnCollection": {
            "location": "import",
            "path": "../../services/column.data.provider"
          }
        }
      }
    }, {
      "method": "aftercolumnsset",
      "name": "aftercolumnsset",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Column updated"
      },
      "complexType": {
        "original": "{\n    columns: ColumnCollection;\n    order: Record<RevoGrid.ColumnProp, 'asc' | 'desc'>;\n  }",
        "resolved": "{ columns: ColumnCollection; order: Record<ColumnProp, \"desc\" | \"asc\">; }",
        "references": {
          "ColumnCollection": {
            "location": "import",
            "path": "../../services/column.data.provider"
          },
          "Record": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforefilterapply",
      "name": "beforefilterapply",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before filter applied to data source\nUse e.preventDefault() to prevent cell focus change\nUpdate @collection if you wish to change filters"
      },
      "complexType": {
        "original": "{ collection: FilterCollection }",
        "resolved": "{ collection: FilterCollection; }",
        "references": {
          "FilterCollection": {
            "location": "import",
            "path": "../../plugins/filter/filter.plugin"
          }
        }
      }
    }, {
      "method": "beforefiltertrimmed",
      "name": "beforefiltertrimmed",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before filter trimmed values\nUse e.preventDefault() to prevent value trimming and filter apply\nUpdate @collection if you wish to change filters\nUpdate @itemsToFilter if you wish to filter indexes of trimming"
      },
      "complexType": {
        "original": "{ collection: FilterCollection; itemsToFilter: Record<number, boolean> }",
        "resolved": "{ collection: FilterCollection; itemsToFilter: Record<number, boolean>; }",
        "references": {
          "FilterCollection": {
            "location": "import",
            "path": "../../plugins/filter/filter.plugin"
          },
          "Record": {
            "location": "global"
          }
        }
      }
    }, {
      "method": "beforetrimmed",
      "name": "beforetrimmed",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before trimmed values\nUse e.preventDefault() to prevent value trimming\nUpdate @trimmed if you wish to filter indexes of trimming"
      },
      "complexType": {
        "original": "{ trimmed: Record<number, boolean>; trimmedType: string; type: string }",
        "resolved": "{ trimmed: Record<number, boolean>; trimmedType: string; type: string; }",
        "references": {
          "Record": {
            "location": "global"
          }
        }
      }
    }, {
      "method": "aftertrimmed",
      "name": "aftertrimmed",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Notify trimmed applied"
      },
      "complexType": {
        "original": "any",
        "resolved": "any",
        "references": {}
      }
    }, {
      "method": "viewportscroll",
      "name": "viewportscroll",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Triggered when view port scrolled"
      },
      "complexType": {
        "original": "RevoGrid.ViewPortScrollEvent",
        "resolved": "{ dimension: DimensionType; coordinate: number; delta?: number; }",
        "references": {
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "beforeexport",
      "name": "beforeexport",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before export\nUse e.preventDefault() to prevent export\nReplace data in Event in case you want to modify it in export"
      },
      "complexType": {
        "original": "DataInput",
        "resolved": "{ data: DataType[]; } & ColSource",
        "references": {
          "DataInput": {
            "location": "import",
            "path": "../../plugins/export/types"
          }
        }
      }
    }, {
      "method": "beforeeditstart",
      "name": "beforeeditstart",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Before edit started\nUse e.preventDefault() to prevent edit"
      },
      "complexType": {
        "original": "Edition.BeforeSaveDataDetails",
        "resolved": "{ prop: ColumnProp; model: DataType; val?: string; rowIndex: number; type: DimensionRows; }",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "aftercolumnresize",
      "name": "aftercolumnresize",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "After column resize\nGet resized columns"
      },
      "complexType": {
        "original": "Record<RevoGrid.ColumnProp, RevoGrid.ColumnRegular>",
        "resolved": "{ [x: string]: ColumnRegular; [x: number]: ColumnRegular; }",
        "references": {
          "Record": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }]; }
  static get methods() { return {
    "refresh": {
      "complexType": {
        "signature": "(type?: RevoGrid.DimensionRows | 'all') => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Refreshes data viewport.\nCan be specific part as rgRow or pinned rgRow or 'all' by default.",
        "tags": []
      }
    },
    "scrollToRow": {
      "complexType": {
        "signature": "(coordinate?: number) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Scrolls view port to specified rgRow index",
        "tags": []
      }
    },
    "scrollToColumnIndex": {
      "complexType": {
        "signature": "(coordinate?: number) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Scrolls view port to specified column index",
        "tags": []
      }
    },
    "scrollToColumnProp": {
      "complexType": {
        "signature": "(prop: RevoGrid.ColumnProp) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Scrolls view port to specified column prop",
        "tags": []
      }
    },
    "updateColumns": {
      "complexType": {
        "signature": "(cols: RevoGrid.ColumnRegular[]) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Update columns",
        "tags": []
      }
    },
    "addTrimmed": {
      "complexType": {
        "signature": "(trimmed: Record<number, boolean>, trimmedType?: string, type?: RevoGrid.DimensionRows) => Promise<CustomEvent<{ trimmed: Record<number, boolean>; trimmedType: string; type: string; }>>",
        "parameters": [{
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "CustomEvent": {
            "location": "global"
          },
          "Record": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<CustomEvent<{ trimmed: Record<number, boolean>; trimmedType: string; type: string; }>>"
      },
      "docs": {
        "text": "Add trimmed by type",
        "tags": []
      }
    },
    "scrollToCoordinate": {
      "complexType": {
        "signature": "(cell: Partial<Selection.Cell>) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "Partial": {
            "location": "global"
          },
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Scrolls view port to coordinate",
        "tags": []
      }
    },
    "setCellEdit": {
      "complexType": {
        "signature": "(rgRow: number, prop: RevoGrid.ColumnProp, rowSource?: RevoGrid.DimensionRows) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }, {
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Bring cell to edit mode",
        "tags": []
      }
    },
    "registerVNode": {
      "complexType": {
        "signature": "(elements: VNode[]) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "VNode": {
            "location": "import",
            "path": "@stencil/core"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Register new virtual node inside of grid\nUsed for additional items creation such as plugin elements",
        "tags": []
      }
    },
    "getSource": {
      "complexType": {
        "signature": "(type?: RevoGrid.DimensionRows) => Promise<RevoGrid.DataType[]>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<DataType[]>"
      },
      "docs": {
        "text": "Get data from source",
        "tags": []
      }
    },
    "getVisibleSource": {
      "complexType": {
        "signature": "(type?: RevoGrid.DimensionRows) => Promise<any[]>",
        "parameters": [{
            "tags": [{
                "name": "param",
                "text": "type - type of source"
              }],
            "text": "- type of source"
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<any[]>"
      },
      "docs": {
        "text": "Get data from visible part of source\nTrimmed/filtered rows will be excluded",
        "tags": [{
            "name": "param",
            "text": "type - type of source"
          }]
      }
    },
    "getSourceStore": {
      "complexType": {
        "signature": "(type?: RevoGrid.DimensionRows) => Promise<RowSource>",
        "parameters": [{
            "tags": [{
                "name": "param",
                "text": "type - type of source"
              }],
            "text": "- type of source"
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RowSource": {
            "location": "import",
            "path": "../data/columnService"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<RowSource>"
      },
      "docs": {
        "text": "Provides access to rows internal store observer\nCan be used for plugin support",
        "tags": [{
            "name": "param",
            "text": "type - type of source"
          }]
      }
    },
    "getColumnStore": {
      "complexType": {
        "signature": "(type?: RevoGrid.DimensionCols) => Promise<ColumnSource>",
        "parameters": [{
            "tags": [{
                "name": "param",
                "text": "type - type of column"
              }],
            "text": "- type of column"
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "ColumnSource": {
            "location": "import",
            "path": "../data/columnService"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<ColumnSource>"
      },
      "docs": {
        "text": "Provides access to column internal store observer\nCan be used for plugin support",
        "tags": [{
            "name": "param",
            "text": "type - type of column"
          }]
      }
    },
    "updateColumnSorting": {
      "complexType": {
        "signature": "(column: RevoGrid.ColumnRegular, index: number, order: 'asc' | 'desc', additive: boolean) => Promise<RevoGrid.ColumnRegular>",
        "parameters": [{
            "tags": [{
                "name": "param",
                "text": "column - full column details to update"
              }],
            "text": "- full column details to update"
          }, {
            "tags": [{
                "name": "param",
                "text": "index - virtual column index"
              }],
            "text": "- virtual column index"
          }, {
            "tags": [{
                "name": "param",
                "text": "order - order to apply"
              }],
            "text": "- order to apply"
          }, {
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<ColumnRegular>"
      },
      "docs": {
        "text": "Update column sorting",
        "tags": [{
            "name": "param",
            "text": "column - full column details to update"
          }, {
            "name": "param",
            "text": "index - virtual column index"
          }, {
            "name": "param",
            "text": "order - order to apply"
          }]
      }
    },
    "clearSorting": {
      "complexType": {
        "signature": "() => Promise<void>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Clears column sorting",
        "tags": []
      }
    },
    "getColumns": {
      "complexType": {
        "signature": "() => Promise<RevoGrid.ColumnRegular[]>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoGrid": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<ColumnRegular[]>"
      },
      "docs": {
        "text": "Receive all columns in data source",
        "tags": []
      }
    },
    "clearFocus": {
      "complexType": {
        "signature": "() => Promise<void>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "Clear current grid focus",
        "tags": []
      }
    },
    "getPlugins": {
      "complexType": {
        "signature": "() => Promise<RevoPlugin.Plugin[]>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "RevoPlugin": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<Plugin[]>"
      },
      "docs": {
        "text": "Get all active plugins instances",
        "tags": []
      }
    },
    "getFocused": {
      "complexType": {
        "signature": "() => Promise<FocusedData | null>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "FocusedData": {
            "location": "import",
            "path": "./viewport.service"
          }
        },
        "return": "Promise<FocusedData>"
      },
      "docs": {
        "text": "Get the currently focused cell.",
        "tags": []
      }
    },
    "getSelectedRange": {
      "complexType": {
        "signature": "() => Promise<Selection.RangeArea | null>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        },
        "return": "Promise<RangeArea>"
      },
      "docs": {
        "text": "Get the currently selected Range.",
        "tags": []
      }
    }
  }; }
  static get elementRef() { return "element"; }
  static get watchers() { return [{
      "propName": "columns",
      "methodName": "columnChanged"
    }, {
      "propName": "theme",
      "methodName": "themeChanged"
    }, {
      "propName": "source",
      "methodName": "dataChanged"
    }, {
      "propName": "pinnedBottomSource",
      "methodName": "dataBottomChanged"
    }, {
      "propName": "pinnedTopSource",
      "methodName": "dataTopChanged"
    }, {
      "propName": "rowDefinitions",
      "methodName": "rowDefChanged"
    }, {
      "propName": "trimmedRows",
      "methodName": "trimmedRowsChanged"
    }, {
      "propName": "grouping",
      "methodName": "groupingChanged"
    }, {
      "propName": "stretch",
      "methodName": "applyStretch"
    }]; }
  static get listeners() { return [{
      "name": "internalRowDragStart",
      "method": "onRowDragStarted",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalRowDragEnd",
      "method": "onRowDragEnd",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalRowDrag",
      "method": "onRowDrag",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalRowMouseMove",
      "method": "onRowMouseMove",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalCellEdit",
      "method": "onBeforeEdit",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalRangeDataApply",
      "method": "onBeforeRangeEdit",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalSelectionChanged",
      "method": "onRangeChanged",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "initialRowDropped",
      "method": "onRowDropped",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "initialHeaderClick",
      "method": "onHeaderClick",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "internalFocusCell",
      "method": "onCellFocus",
      "target": undefined,
      "capture": false,
      "passive": false
    }]; }
}
