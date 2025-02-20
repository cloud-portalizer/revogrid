/*!
 * Built by Revolist
 */
import { Component, Event, h, Host, Listen, Prop, Element, Watch } from '@stencil/core';
import ColumnService from '../data/columnService';
import SelectionStoreService from '../../store/selection/selection.store.service';
import { codesLetter } from '../../utils/keyCodes';
import { SELECTION_BORDER_CLASS } from '../../utils/consts';
import { isRangeSingleCell } from '../../store/selection/selection.helpers';
import { getCurrentCell, getElStyle } from './selection.utils';
import { isEditInput } from './editors/edit.utils';
import { KeyboardService } from './keyboard.service';
import { AutoFillService } from './autofill.service';
import { ClipboardService } from './clipboard.service';
export class OverlaySelection {
  constructor() {
    this.keyboardService = null;
    this.autoFillService = null;
    this.clipboardService = null;
  }
  // --------------------------------------------------------------------------
  //
  //  Listeners
  //
  // --------------------------------------------------------------------------
  onMouseMove(e) {
    if (this.selectionStoreService.focused) {
      this.autoFillService.selectionMouseMove(e);
    }
  }
  /** Pointer left document, clear any active operation */
  onMouseOut() {
    this.autoFillService.clearAutoFillSelection();
  }
  /** Action finished inside of the document */
  onMouseUp() {
    this.autoFillService.clearAutoFillSelection();
  }
  /** Row drag started */
  onCellDrag(e) {
    var _a;
    (_a = this.orderEditor) === null || _a === void 0 ? void 0 : _a.dragStart(e.detail);
  }
  /** Recived keyboard down from element */
  onKeyUp(e) {
    var _a;
    (_a = this.keyboardService) === null || _a === void 0 ? void 0 : _a.keyUp(e);
  }
  /** Recived keyboard down from element */
  onKeyDown(e) {
    var _a;
    if (e.defaultPrevented) {
      return;
    }
    (_a = this.keyboardService) === null || _a === void 0 ? void 0 : _a.keyDown(e, this.range);
  }
  /** Create selection store */
  selectionServiceSet(s) {
    this.selectionStoreService = new SelectionStoreService(s, {
      changeRange: range => { var _a; return !((_a = this.setRange.emit(range)) === null || _a === void 0 ? void 0 : _a.defaultPrevented); },
      focus: (focus, end) => {
        var _a;
        const focused = { focus, end };
        const { defaultPrevented } = this.internalFocusCell.emit(this.columnService.getSaveData(focus.y, focus.x));
        if (defaultPrevented) {
          return false;
        }
        return !((_a = this.focusCell.emit(focused)) === null || _a === void 0 ? void 0 : _a.defaultPrevented);
      },
    });
    this.keyboardService = new KeyboardService({
      selectionStoreService: this.selectionStoreService,
      selectionStore: s,
      doEdit: (v, c) => this.doEdit(v, c),
      clearCell: () => this.clearCell(),
      getData: () => this.getData(),
      internalPaste: () => this.internalPaste.emit()
    });
    this.createAutoFillService();
    this.createClipboardService();
  }
  createAutoFillService() {
    this.autoFillService = new AutoFillService({
      selectionStoreService: this.selectionStoreService,
      dimensionRow: this.dimensionRow,
      dimensionCol: this.dimensionCol,
      columnService: this.columnService,
      dataStore: this.dataStore,
      setTempRange: (e) => this.setTempRange.emit(e),
      internalSelectionChanged: (e) => this.internalSelectionChanged.emit(e),
      internalRangeDataApply: (e) => this.internalRangeDataApply.emit(e),
      setRange: (e) => this.setRange.emit(e),
      getData: () => this.getData(),
    });
  }
  columnServiceSet() {
    var _a;
    (_a = this.columnService) === null || _a === void 0 ? void 0 : _a.destroy();
    this.columnService = new ColumnService(this.dataStore, this.colData);
    this.createAutoFillService();
    this.createClipboardService();
  }
  createClipboardService() {
    this.clipboardService = new ClipboardService({
      selectionStoreService: this.selectionStoreService,
      columnService: this.columnService,
      dataStore: this.dataStore,
      onRangeApply: (d, r) => this.autoFillService.onRangeApply(d, r),
      internalCopy: () => this.internalCopy.emit()
    });
  }
  connectedCallback() {
    this.columnServiceSet();
    this.selectionServiceSet(this.selectionStore);
  }
  disconnectedCallback() {
    var _a;
    (_a = this.columnService) === null || _a === void 0 ? void 0 : _a.destroy();
  }
  renderRange(range) {
    const style = getElStyle(range, this.dimensionRow.state, this.dimensionCol.state);
    return [h("div", { class: SELECTION_BORDER_CLASS, style: style })];
  }
  renderEditCell() {
    // if can edit
    const editCell = this.selectionStore.get('edit');
    if (this.readonly || !editCell) {
      return;
    }
    const val = editCell.val || this.columnService.getCellData(editCell.y, editCell.x);
    const editable = Object.assign(Object.assign({}, editCell), this.columnService.getSaveData(editCell.y, editCell.x, val));
    const style = getElStyle(Object.assign(Object.assign({}, editCell), { x1: editCell.x, y1: editCell.y }), this.dimensionRow.state, this.dimensionCol.state);
    return (h("revogr-edit", { onCellEdit: e => this.onCellEdit(e.detail), onCloseEdit: e => this.closeEdit(e), editCell: editable, column: this.columnService.columns[editCell.x], editor: this.columnService.getCellEditor(editCell.y, editCell.x, this.editors), style: style }));
  }
  render() {
    const range = this.selectionStoreService.ranged;
    const selectionFocus = this.selectionStoreService.focused;
    const els = [];
    if ((range || selectionFocus) && this.useClipboard) {
      els.push(this.clipboardService.renderClipboard());
    }
    if (range) {
      els.push(...this.renderRange(range));
    }
    const editCell = this.renderEditCell();
    if (editCell) {
      els.push(editCell);
    }
    if (selectionFocus && !this.readonly && !editCell && this.range) {
      els.push(this.autoFillService.renderAutofill(range, selectionFocus));
    }
    if (this.canDrag) {
      els.push(h("revogr-order-editor", { ref: e => (this.orderEditor = e), dataStore: this.dataStore, dimensionRow: this.dimensionRow, dimensionCol: this.dimensionCol, parent: this.element, onInternalRowDragStart: e => this.onRowDragStart(e) }));
    }
    return (h(Host, { onDblClick: () => this.doEdit(), onMouseDown: (e) => this.onElementMouseDown(e) },
      els,
      h("slot", { name: "data" })));
  }
  onElementMouseDown(e) {
    // Ignore focus if clicked input
    if (isEditInput(e.target)) {
      return;
    }
    const data = this.getData();
    if (e.defaultPrevented) {
      return;
    }
    // Regular cell click
    const focusCell = getCurrentCell({ x: e.x, y: e.y }, data);
    this.selectionStoreService.focus(focusCell, this.range && e.shiftKey);
    // Initiate autofill selection
    if (this.range) {
      this.autoFillService.selectionStart(e, data);
    }
  }
  doEdit(val = '', isCancel = false) {
    var _a;
    if (this.canEdit()) {
      const editCell = this.selectionStore.get('focus');
      const data = this.columnService.getSaveData(editCell.y, editCell.x);
      (_a = this.setEdit) === null || _a === void 0 ? void 0 : _a.emit(Object.assign(Object.assign({}, data), { isCancel,
        val }));
    }
  }
  closeEdit(e) {
    this.doEdit(undefined, true);
    if (e === null || e === void 0 ? void 0 : e.detail) {
      this.focusNext();
    }
  }
  async focusNext() {
    const canFocus = await this.keyboardService.keyChangeSelection(new KeyboardEvent('keydown', {
      code: codesLetter.ARROW_DOWN,
    }), this.range);
    if (!canFocus) {
      this.closeEdit();
    }
  }
  clearCell() {
    if (this.selectionStoreService.ranged && !isRangeSingleCell(this.selectionStoreService.ranged)) {
      const data = this.columnService.getRangeStaticData(this.selectionStoreService.ranged, '');
      this.autoFillService.onRangeApply(data, this.selectionStoreService.ranged);
    }
    else if (this.canEdit()) {
      const focused = this.selectionStoreService.focused;
      this.onCellEdit({ rgRow: focused.y, rgCol: focused.x, val: '' }, true);
    }
  }
  /** Edit finished, close cell and save */
  onCellEdit(e, clear = false) {
    const dataToSave = this.columnService.getSaveData(e.rgRow, e.rgCol, e.val);
    this.internalCellEdit.emit(dataToSave);
    // if not clear navigate to next cell after edit
    if (!clear && !e.preventFocus) {
      this.focusNext();
    }
  }
  onRowDragStart({ detail }) {
    detail.text = this.columnService.getCellData(detail.cell.y, detail.cell.x);
  }
  /** Check if edit possible */
  canEdit() {
    var _a;
    if (this.readonly) {
      return false;
    }
    const editCell = this.selectionStoreService.focused;
    return editCell && !((_a = this.columnService) === null || _a === void 0 ? void 0 : _a.isReadOnly(editCell.y, editCell.x));
  }
  /** Collect data from element */
  getData() {
    return {
      el: this.element,
      rows: this.dimensionRow.state,
      cols: this.dimensionCol.state,
      lastCell: this.lastCell,
    };
  }
  static get is() { return "revogr-overlay-selection"; }
  static get originalStyleUrls() { return {
    "$": ["revogr-overlay-style.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["revogr-overlay-style.css"]
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
        "text": ""
      },
      "attribute": "use-clipboard",
      "reflect": false
    },
    "selectionStore": {
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
        "text": "Dynamic stores"
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
    "dimensionCol": {
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
    "dataStore": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<DataSourceState<RevoGrid.DataType, RevoGrid.DimensionRows>>",
        "resolved": "ObservableMap<DataSourceState<DataType, DimensionRows>>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
          "DataSourceState": {
            "location": "import",
            "path": "../../store/dataSource/data.store"
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
        "text": "Static stores, not expected to change during component lifetime"
      }
    },
    "colData": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Observable<DataSourceState<RevoGrid.ColumnRegular, RevoGrid.DimensionCols>>",
        "resolved": "ObservableMap<DataSourceState<ColumnRegular, DimensionCols>>",
        "references": {
          "Observable": {
            "location": "import",
            "path": "../../interfaces"
          },
          "DataSourceState": {
            "location": "import",
            "path": "../../store/dataSource/data.store"
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
    "lastCell": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Selection.Cell",
        "resolved": "Cell",
        "references": {
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
        "text": "Last cell position"
      }
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
      }
    }
  }; }
  static get events() { return [{
      "method": "internalCopy",
      "name": "internalCopy",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "any",
        "resolved": "any",
        "references": {}
      }
    }, {
      "method": "internalPaste",
      "name": "internalPaste",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "any",
        "resolved": "any",
        "references": {}
      }
    }, {
      "method": "internalCellEdit",
      "name": "internalCellEdit",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
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
      "method": "internalFocusCell",
      "name": "internalFocusCell",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
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
      "method": "setEdit",
      "name": "setEdit",
      "bubbles": false,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "Edition.BeforeEdit",
        "resolved": "{ isCancel: boolean; } & BeforeSaveDataDetails",
        "references": {
          "Edition": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "setRange",
      "name": "setRange",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "Selection.RangeArea",
        "resolved": "{ x: number; y: number; x1: number; y1: number; }",
        "references": {
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "setTempRange",
      "name": "setTempRange",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "Selection.TempRange | null",
        "resolved": "{ type: string; area: RangeArea; }",
        "references": {
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "focusCell",
      "name": "focusCell",
      "bubbles": false,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "Selection.FocusedCells",
        "resolved": "{ focus: Cell; end: Cell; }",
        "references": {
          "Selection": {
            "location": "import",
            "path": "../../interfaces"
          }
        }
      }
    }, {
      "method": "internalSelectionChanged",
      "name": "internalSelectionChanged",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Selection range changed"
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
      "method": "internalRangeDataApply",
      "name": "internalRangeDataApply",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": "Range data apply"
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
    }]; }
  static get elementRef() { return "element"; }
  static get watchers() { return [{
      "propName": "selectionStore",
      "methodName": "selectionServiceSet"
    }, {
      "propName": "dimensionRow",
      "methodName": "createAutoFillService"
    }, {
      "propName": "dimensionCol",
      "methodName": "createAutoFillService"
    }, {
      "propName": "dataStore",
      "methodName": "columnServiceSet"
    }, {
      "propName": "colData",
      "methodName": "columnServiceSet"
    }]; }
  static get listeners() { return [{
      "name": "mousemove",
      "method": "onMouseMove",
      "target": "document",
      "capture": false,
      "passive": true
    }, {
      "name": "mouseleave",
      "method": "onMouseOut",
      "target": "document",
      "capture": false,
      "passive": true
    }, {
      "name": "mouseup",
      "method": "onMouseUp",
      "target": "document",
      "capture": false,
      "passive": true
    }, {
      "name": "dragStartCell",
      "method": "onCellDrag",
      "target": undefined,
      "capture": false,
      "passive": false
    }, {
      "name": "keyup",
      "method": "onKeyUp",
      "target": "document",
      "capture": false,
      "passive": false
    }, {
      "name": "keydown",
      "method": "onKeyDown",
      "target": "document",
      "capture": false,
      "passive": false
    }]; }
}
