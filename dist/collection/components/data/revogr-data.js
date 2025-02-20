/*!
 * Built by Revolist
 */
import { Component, Element, Event, Prop, h } from '@stencil/core';
import { Watch } from '@stencil/core/internal';
import ColumnService from './columnService';
import { DATA_COL, DATA_ROW } from '../../utils/consts';
import { getSourceItem } from '../../store/dataSource/data.store';
import CellRenderer from './cellRenderer';
import RowRenderer, { PADDING_DEPTH } from './rowRenderer';
import GroupingRowRenderer from '../../plugins/groupingRow/grouping.row.renderer';
import { isGrouping } from '../../plugins/groupingRow/grouping.service';
export class RevogrData {
  onStoreChange() {
    var _a;
    (_a = this.columnService) === null || _a === void 0 ? void 0 : _a.destroy();
    this.columnService = new ColumnService(this.dataStore, this.colData);
  }
  connectedCallback() {
    this.onStoreChange();
  }
  disconnectedCallback() {
    var _a;
    (_a = this.columnService) === null || _a === void 0 ? void 0 : _a.destroy();
  }
  render() {
    var _a;
    const rows = this.viewportRow.get('items');
    const cols = this.viewportCol.get('items');
    if (!this.columnService.columns.length || !rows.length || !cols.length) {
      return '';
    }
    const range = (_a = this.rowSelectionStore) === null || _a === void 0 ? void 0 : _a.get('range');
    const rowsEls = [];
    const depth = this.dataStore.get('groupingDepth');
    const groupingCustomRenderer = this.dataStore.get('groupingCustomRenderer');
    for (let rgRow of rows) {
      const dataRow = getSourceItem(this.dataStore, rgRow.itemIndex);
      /** grouping */
      if (isGrouping(dataRow)) {
        rowsEls.push(h(GroupingRowRenderer, Object.assign({}, rgRow, { model: dataRow, groupingCustomRenderer: groupingCustomRenderer, hasExpand: this.columnService.hasGrouping })));
        continue;
      }
      /** grouping end */
      const cells = [];
      let rowClass = this.rowClass ? this.columnService.getRowClass(rgRow.itemIndex, this.rowClass) : '';
      if (range && rgRow.itemIndex >= range.y && rgRow.itemIndex <= range.y1) {
        rowClass += ' focused-rgRow';
      }
      for (let rgCol of cols) {
        cells.push(this.getCellRenderer(rgRow, rgCol, this.canDrag, /** grouping apply*/ this.columnService.hasGrouping ? depth : 0));
      }
      rowsEls.push(h(RowRenderer, { rowClass: rowClass, size: rgRow.size, start: rgRow.start }, cells));
    }
    return rowsEls;
  }
  getCellRenderer(rgRow, rgCol, draggable = false, depth = 0) {
    const model = this.columnService.rowDataModel(rgRow.itemIndex, rgCol.itemIndex);
    const defaultProps = {
      [DATA_COL]: rgCol.itemIndex,
      [DATA_ROW]: rgRow.itemIndex,
      style: {
        width: `${rgCol.size}px`,
        transform: `translateX(${rgCol.start}px)`,
      },
    };
    if (depth && !rgCol.itemIndex) {
      defaultProps.style.paddingLeft = `${PADDING_DEPTH * depth}px`;
    }
    const props = this.columnService.mergeProperties(rgRow.itemIndex, rgCol.itemIndex, defaultProps);
    const custom = this.columnService.customRenderer(rgRow.itemIndex, rgCol.itemIndex, model);
    // if custom render
    if (typeof custom !== 'undefined') {
      return h("div", Object.assign({}, props), custom);
    }
    // something is wrong with data
    if (!model.column) {
      console.error('Investigate column problem');
      return;
    }
    // if regular render
    return (h("div", Object.assign({}, props),
      h(CellRenderer, { model: model, canDrag: draggable, onDragStart: e => this.dragStartCell.emit(e) })));
  }
  static get is() { return "revogr-data"; }
  static get originalStyleUrls() { return {
    "$": ["revogr-data-style.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["revogr-data-style.css"]
  }; }
  static get properties() { return {
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
        "text": ""
      },
      "attribute": "readonly",
      "reflect": false
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
        "text": ""
      },
      "attribute": "range",
      "reflect": false
    },
    "canDrag": {
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
        "text": ""
      },
      "attribute": "can-drag",
      "reflect": false
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
        "text": ""
      },
      "attribute": "row-class",
      "reflect": false
    },
    "rowSelectionStore": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<Selection.SelectionStoreState>",
        "resolved": "ObservableMap<SelectionStoreState>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "viewportRow": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<RevoGrid.ViewportState>",
        "resolved": "ObservableMap<ViewportState>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
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
        "text": ""
      }
    },
    "viewportCol": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<RevoGrid.ViewportState>",
        "resolved": "ObservableMap<ViewportState>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
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
        "text": ""
      }
    },
    "dimensionRow": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<RevoGrid.DimensionSettingsState>",
        "resolved": "ObservableMap<DimensionSettingsState>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
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
        "text": ""
      }
    },
    "colData": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "ColumnSource",
        "resolved": "ObservableMap<DataSourceState<ColumnRegular, DimensionCols>>",
        "references": {
          "ColumnSource": {
            "location": "import",
            "path": "./columnService"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Static stores, not expected to change during component lifetime"
      }
    },
    "dataStore": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "RowSource",
        "resolved": "ObservableMap<DataSourceState<DataType, DimensionRows>>",
        "references": {
          "RowSource": {
            "location": "import",
            "path": "./columnService"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    }
  }; }
  static get events() { return [{
      "method": "dragStartCell",
      "name": "dragStartCell",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "MouseEvent",
        "resolved": "MouseEvent",
        "references": {
          "MouseEvent": {
            "location": "global"
          }
        }
      }
    }]; }
  static get elementRef() { return "element"; }
  static get watchers() { return [{
      "propName": "dataStore",
      "methodName": "onStoreChange"
    }, {
      "propName": "colData",
      "methodName": "onStoreChange"
    }]; }
}
