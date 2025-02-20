/*!
 * Built by Revolist
 */
import { h, proxyCustomElement, HTMLElement, createEvent, Host } from '@stencil/core/internal/client';
import { n as getRange, C as ColumnService, o as isRangeSingleCell } from './columnService.js';
import { a as isCtrlKey, c as codesLetter, b as isClear, e as isEnterKey, f as isLetterKey, d as defineCustomElement$2 } from './revogr-edit2.js';
import { E as EDIT_INPUT_WR, C as CELL_HANDLER_CLASS, S as SELECTION_BORDER_CLASS } from './consts.js';
import { a as getCoordinate, i as isAfterLast, b as isBeforeFirst, c as getCell, d as getCurrentCell, e as getDirectionCoordinate, f as getLargestAxis, g as getElStyle } from './selection.utils.js';
import { t as timeout } from './utils.js';
import { d as debounce_1 } from './debounce.js';
import { e as each } from './each.js';
import { _ as _isIterateeCall, g as getSourceItem } from './data.store.js';
import { t as toInteger_1 } from './toInteger.js';
import { d as defineCustomElement$1 } from './revogr-order-editor2.js';

class SelectionStoreService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    this.store = store;
  }
  get edited() {
    return this.store.get('edit');
  }
  get focused() {
    return this.store.get('focus');
  }
  get ranged() {
    return this.store.get('range');
  }
  changeRange(range) {
    return this.config.changeRange(range);
  }
  focus(cell, isMulti = false) {
    if (!cell) {
      return false;
    }
    let end = cell;
    // range edit
    if (isMulti) {
      let start = this.store.get('focus');
      if (start) {
        return this.config.changeRange(getRange(start, end));
      }
    }
    // single focus
    return this.config.focus(cell, end);
  }
}

// is edit input
function isEditInput(el) {
  return !!(el === null || el === void 0 ? void 0 : el.closest(`.${EDIT_INPUT_WR}`));
}

class KeyboardService {
  constructor(sv) {
    this.sv = sv;
    this.ctrlDown = false;
  }
  async keyDown(e, canRange) {
    if (!this.sv.selectionStoreService.focused) {
      return;
    }
    if (isCtrlKey(e.keyCode, navigator.platform)) {
      this.ctrlDown = true;
    }
    // tab key means same as arrow right
    if (codesLetter.TAB === e.code) {
      this.keyChangeSelection(e, canRange);
      return;
    }
    /**
     *  IF EDIT MODE
     */
    if (this.sv.selectionStoreService.edited) {
      switch (e.code) {
        case codesLetter.ESCAPE:
          this.sv.doEdit(undefined, true);
          break;
      }
      return;
    }
    /**
     *  IF NOT EDIT MODE
     */
    // pressed clear key
    if (isClear(e.code)) {
      this.sv.clearCell();
      return;
    }
    // pressed enter
    if (isEnterKey(e.code)) {
      this.sv.doEdit();
      return;
    }
    // copy operation
    if (this.isCopy(e)) {
      return;
    }
    // paste operation
    if (this.isPaste(e)) {
      this.sv.internalPaste();
      return;
    }
    // pressed letter key
    if (isLetterKey(e.keyCode)) {
      this.sv.doEdit(e.key);
      return;
    }
    // pressed arrow, change selection position
    if (await this.keyChangeSelection(e, canRange)) {
      return;
    }
  }
  async keyChangeSelection(e, canRange) {
    const data = this.changeDirectionKey(e, canRange);
    if (!data) {
      return false;
    }
    await timeout();
    const range = this.sv.selectionStore.get('range');
    const focus = this.sv.selectionStore.get('focus');
    return this.keyPositionChange(data.changes, this.sv.getData(), range, focus, data.isMulti);
  }
  keyPositionChange(changes, eData, range, focus, isMulti = false) {
    if (!range || !focus) {
      return false;
    }
    const data = getCoordinate(range, focus, changes, isMulti);
    if (!data) {
      return false;
    }
    if (isMulti) {
      if (isAfterLast(data.end, eData) || isBeforeFirst(data.start)) {
        return false;
      }
      const range = getRange(data.start, data.end);
      return this.sv.selectionStoreService.changeRange(range);
    }
    return this.sv.selectionStoreService.focus(data.start);
  }
  keyUp(e) {
    if (isCtrlKey(e.keyCode, navigator.platform)) {
      this.ctrlDown = false;
    }
  }
  isCopy(e) {
    return this.ctrlDown && e.code == codesLetter.C;
  }
  isPaste(e) {
    return this.ctrlDown && e.code == codesLetter.V;
  }
  /** Monitor key direction changes */
  changeDirectionKey(e, canRange) {
    const isMulti = canRange && e.shiftKey;
    switch (e.code) {
      case codesLetter.TAB:
      case codesLetter.ARROW_UP:
      case codesLetter.ARROW_DOWN:
      case codesLetter.ARROW_LEFT:
      case codesLetter.ARROW_RIGHT:
        e.preventDefault();
        break;
    }
    switch (e.code) {
      case codesLetter.ARROW_UP:
        return { changes: { y: -1 }, isMulti };
      case codesLetter.ARROW_DOWN:
        return { changes: { y: 1 }, isMulti };
      case codesLetter.ARROW_LEFT:
        return { changes: { x: -1 }, isMulti };
      case codesLetter.TAB:
      case codesLetter.ARROW_RIGHT:
        return { changes: { x: 1 }, isMulti };
    }
  }
}

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

var _baseSlice = baseSlice;

/**
 * Creates a slice of `array` from `start` up to, but not including, `end`.
 *
 * **Note:** This method is used instead of
 * [`Array#slice`](https://mdn.io/Array/slice) to ensure dense arrays are
 * returned.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Array
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function slice(array, start, end) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  if (end && typeof end != 'number' && _isIterateeCall(array, start, end)) {
    start = 0;
    end = length;
  }
  else {
    start = start == null ? 0 : toInteger_1(start);
    end = end === undefined ? length : toInteger_1(end);
  }
  return _baseSlice(array, start, end);
}

var slice_1 = slice;

var AutoFillType;
(function (AutoFillType) {
  AutoFillType["selection"] = "Selection";
  AutoFillType["autoFill"] = "AutoFill";
})(AutoFillType || (AutoFillType = {}));
class AutoFillService {
  constructor(sv) {
    this.sv = sv;
    this.autoFillType = null;
    this.autoFillInitial = null;
    this.autoFillStart = null;
    this.autoFillLast = null;
  }
  /**
   * Render autofill box
   * @param range
   * @param selectionFocus
   */
  renderAutofill(range, selectionFocus) {
    let handlerStyle;
    if (range) {
      handlerStyle = getCell(range, this.sv.dimensionRow.state, this.sv.dimensionCol.state);
    }
    else {
      handlerStyle = getCell(Object.assign(Object.assign({}, selectionFocus), { x1: selectionFocus.x, y1: selectionFocus.y }), this.sv.dimensionRow.state, this.sv.dimensionCol.state);
    }
    return (h("div", { class: CELL_HANDLER_CLASS, style: { left: `${handlerStyle.right}px`, top: `${handlerStyle.bottom}px` }, onMouseDown: (e) => this.selectionStart(e, this.sv.getData(), AutoFillType.autoFill) }));
  }
  get isAutoFill() {
    return !!this.autoFillType;
  }
  /** Process mouse move events */
  selectionMouseMove(e) {
    // initiate mouse move debounce if not present
    if (!this.onMouseMoveAutofill) {
      this.onMouseMoveAutofill = debounce_1((e, data) => this.doAutofillMouseMove(e, data), 5);
    }
    if (this.isAutoFill) {
      this.onMouseMoveAutofill(e, this.sv.getData());
    }
  }
  getFocus() {
    let focus = this.sv.selectionStoreService.focused;
    const range = this.sv.selectionStoreService.ranged;
    if (range) {
      focus = { x: range.x, y: range.y };
    }
    if (!focus && !range) {
      return null;
    }
    return focus;
  }
  /**
   * Autofill logic:
   * on mouse move apply based on previous direction (if present)
   */
  doAutofillMouseMove({ x, y }, data) {
    if (!this.autoFillInitial) {
      return;
    }
    let current = getCurrentCell({ x, y }, data);
    let direction;
    if (this.autoFillLast) {
      direction = getDirectionCoordinate(this.autoFillStart, this.autoFillLast);
    }
    // first time or direction equal to start(same as first time)
    if (!this.autoFillLast || !direction) {
      direction = getLargestAxis(this.autoFillStart, current);
      if (!this.autoFillLast) {
        this.autoFillLast = this.autoFillStart;
      }
    }
    // nothing changed
    if (!direction) {
      return;
    }
    each(direction, (v, k) => {
      if (v) {
        current = Object.assign(Object.assign({}, this.autoFillLast), { [k]: current[k] });
      }
    });
    // check if not the latest
    if (isAfterLast(current, data)) {
      return;
    }
    this.autoFillLast = current;
    this.sv.setTempRange({
      area: getRange(this.autoFillInitial, this.autoFillLast),
      type: this.autoFillType,
    });
  }
  /**
   * Range selection started
   * Mode @param type:
   * Can be triggered from MouseDown selection on element
   * Or can be triggered on corner square drag
   */
  selectionStart(e, data, type = AutoFillType.selection) {
    /** Get cell by autofill element */
    const { top, left } = e.target.getBoundingClientRect();
    this.autoFillInitial = this.getFocus();
    this.autoFillType = type;
    this.autoFillStart = getCurrentCell({ x: left, y: top }, data);
    e.preventDefault();
  }
  /** Clear current range selection */
  clearAutoFillSelection() {
    // Apply autofill values on mouse up
    if (this.autoFillInitial) {
      // Get latest
      this.autoFillInitial = this.getFocus();
      if (this.autoFillType === AutoFillType.autoFill) {
        this.applyRangeWithData(this.autoFillInitial, this.autoFillLast);
      }
      else {
        this.applyRangeOnly(this.autoFillInitial, this.autoFillLast);
      }
    }
    this.autoFillType = null;
    this.autoFillInitial = null;
    this.autoFillLast = null;
    this.autoFillStart = null;
  }
  /** Trigger range apply events and handle responses */
  onRangeApply(data, range) {
    const models = {};
    for (let rowIndex in data) {
      models[rowIndex] = getSourceItem(this.sv.dataStore, parseInt(rowIndex, 10));
    }
    const dataEvent = this.sv.internalRangeDataApply({
      data,
      models,
      type: this.sv.dataStore.get('type'),
    });
    if (!dataEvent.defaultPrevented) {
      this.sv.columnService.applyRangeData(data);
    }
    this.sv.setRange(range);
  }
  /** Apply range and copy data during range application */
  applyRangeWithData(start, end) {
    // no changes to apply
    if (!start || !end) {
      return;
    }
    const oldRange = this.sv.selectionStoreService.ranged;
    const newRange = getRange(start, end);
    const columns = [...this.sv.columnService.columns];
    const rangeData = {
      type: this.sv.dataStore.get('type'),
      newData: {},
      newRange,
      oldRange,
      newProps: slice_1(columns, newRange.x, newRange.x1 + 1).map(v => v.prop),
      oldProps: slice_1(columns, oldRange.x, oldRange.x1 + 1).map(v => v.prop),
    };
    rangeData.newData = this.sv.columnService.getRangeData(rangeData);
    const selectionEndEvent = this.sv.internalSelectionChanged(rangeData);
    if (selectionEndEvent.defaultPrevented) {
      this.sv.setTempRange(null);
      return;
    }
    this.onRangeApply(rangeData.newData, newRange);
  }
  /** Update range selection ony, no data change (mouse selection) */
  applyRangeOnly(start, end) {
    // no changes to apply
    if (!start || !end) {
      return;
    }
    const newRange = getRange(start, end);
    this.sv.setRange(newRange);
  }
}

class ClipboardService {
  constructor(sv) {
    this.sv = sv;
  }
  onCopy(e) {
    const canCopy = this.sv.internalCopy();
    if (canCopy.defaultPrevented) {
      return false;
    }
    let focus = this.sv.selectionStoreService.focused;
    let range = this.sv.selectionStoreService.ranged;
    let data;
    if (!range) {
      range = getRange(focus, focus);
    }
    if (range) {
      const columns = [...this.sv.columnService.columns];
      const props = slice_1(columns, range.x, range.x1 + 1).map(v => v.prop);
      data = this.sv.columnService.copyRangeArray(range, props, this.sv.dataStore);
    }
    this.clipboard.doCopy(e, data);
    return true;
  }
  renderClipboard() {
    return h("revogr-clipboard", { onCopyRegion: e => this.onCopy(e.detail), ref: e => (this.clipboard = e), onPasteRegion: e => this.onPaste(e.detail) });
  }
  onPaste(data) {
    const focus = this.sv.selectionStoreService.focused;
    const isEditing = this.sv.selectionStoreService.edited !== null;
    if (!focus || isEditing) {
      return;
    }
    const { changed, range } = this.sv.columnService.getTransformedDataToApply(focus, data);
    this.sv.onRangeApply(changed, range);
  }
}

const revogrOverlayStyleCss = ".revo-drag-icon{-webkit-mask-image:url(\"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg viewBox='0 0 438 383' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg%3E%3Cpath d='M421.875,70.40625 C426.432292,70.40625 430.175781,68.9414062 433.105469,66.0117188 C436.035156,63.0820312 437.5,59.3385417 437.5,54.78125 L437.5,54.78125 L437.5,15.71875 C437.5,11.1614583 436.035156,7.41796875 433.105469,4.48828125 C430.175781,1.55859375 426.432292,0.09375 421.875,0.09375 L421.875,0.09375 L15.625,0.09375 C11.0677083,0.09375 7.32421875,1.55859375 4.39453125,4.48828125 C1.46484375,7.41796875 0,11.1614583 0,15.71875 L0,15.71875 L0,54.78125 C0,59.3385417 1.46484375,63.0820312 4.39453125,66.0117188 C7.32421875,68.9414062 11.0677083,70.40625 15.625,70.40625 L15.625,70.40625 L421.875,70.40625 Z M421.875,226.65625 C426.432292,226.65625 430.175781,225.191406 433.105469,222.261719 C436.035156,219.332031 437.5,215.588542 437.5,211.03125 L437.5,211.03125 L437.5,171.96875 C437.5,167.411458 436.035156,163.667969 433.105469,160.738281 C430.175781,157.808594 426.432292,156.34375 421.875,156.34375 L421.875,156.34375 L15.625,156.34375 C11.0677083,156.34375 7.32421875,157.808594 4.39453125,160.738281 C1.46484375,163.667969 0,167.411458 0,171.96875 L0,171.96875 L0,211.03125 C0,215.588542 1.46484375,219.332031 4.39453125,222.261719 C7.32421875,225.191406 11.0677083,226.65625 15.625,226.65625 L15.625,226.65625 L421.875,226.65625 Z M421.875,382.90625 C426.432292,382.90625 430.175781,381.441406 433.105469,378.511719 C436.035156,375.582031 437.5,371.838542 437.5,367.28125 L437.5,367.28125 L437.5,328.21875 C437.5,323.661458 436.035156,319.917969 433.105469,316.988281 C430.175781,314.058594 426.432292,312.59375 421.875,312.59375 L421.875,312.59375 L15.625,312.59375 C11.0677083,312.59375 7.32421875,314.058594 4.39453125,316.988281 C1.46484375,319.917969 0,323.661458 0,328.21875 L0,328.21875 L0,367.28125 C0,371.838542 1.46484375,375.582031 4.39453125,378.511719 C7.32421875,381.441406 11.0677083,382.90625 15.625,382.90625 L15.625,382.90625 L421.875,382.90625 Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg viewBox='0 0 438 383' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg%3E%3Cpath d='M421.875,70.40625 C426.432292,70.40625 430.175781,68.9414062 433.105469,66.0117188 C436.035156,63.0820312 437.5,59.3385417 437.5,54.78125 L437.5,54.78125 L437.5,15.71875 C437.5,11.1614583 436.035156,7.41796875 433.105469,4.48828125 C430.175781,1.55859375 426.432292,0.09375 421.875,0.09375 L421.875,0.09375 L15.625,0.09375 C11.0677083,0.09375 7.32421875,1.55859375 4.39453125,4.48828125 C1.46484375,7.41796875 0,11.1614583 0,15.71875 L0,15.71875 L0,54.78125 C0,59.3385417 1.46484375,63.0820312 4.39453125,66.0117188 C7.32421875,68.9414062 11.0677083,70.40625 15.625,70.40625 L15.625,70.40625 L421.875,70.40625 Z M421.875,226.65625 C426.432292,226.65625 430.175781,225.191406 433.105469,222.261719 C436.035156,219.332031 437.5,215.588542 437.5,211.03125 L437.5,211.03125 L437.5,171.96875 C437.5,167.411458 436.035156,163.667969 433.105469,160.738281 C430.175781,157.808594 426.432292,156.34375 421.875,156.34375 L421.875,156.34375 L15.625,156.34375 C11.0677083,156.34375 7.32421875,157.808594 4.39453125,160.738281 C1.46484375,163.667969 0,167.411458 0,171.96875 L0,171.96875 L0,211.03125 C0,215.588542 1.46484375,219.332031 4.39453125,222.261719 C7.32421875,225.191406 11.0677083,226.65625 15.625,226.65625 L15.625,226.65625 L421.875,226.65625 Z M421.875,382.90625 C426.432292,382.90625 430.175781,381.441406 433.105469,378.511719 C436.035156,375.582031 437.5,371.838542 437.5,367.28125 L437.5,367.28125 L437.5,328.21875 C437.5,323.661458 436.035156,319.917969 433.105469,316.988281 C430.175781,314.058594 426.432292,312.59375 421.875,312.59375 L421.875,312.59375 L15.625,312.59375 C11.0677083,312.59375 7.32421875,314.058594 4.39453125,316.988281 C1.46484375,319.917969 0,323.661458 0,328.21875 L0,328.21875 L0,367.28125 C0,371.838542 1.46484375,375.582031 4.39453125,378.511719 C7.32421875,381.441406 11.0677083,382.90625 15.625,382.90625 L15.625,382.90625 L421.875,382.90625 Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\");width:11px;height:7px;background-size:cover;background-repeat:no-repeat}.revo-alt-icon{-webkit-mask-image:url(\"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg viewBox='0 0 384 383' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg%3E%3Cpath d='M192.4375,383 C197.424479,383 201.663411,381.254557 205.154297,377.763672 L205.154297,377.763672 L264.25,318.667969 C270.234375,312.683594 271.605794,306.075846 268.364258,298.844727 C265.122721,291.613607 259.51237,287.998047 251.533203,287.998047 L251.533203,287.998047 L213.382812,287.998047 L213.382812,212.445312 L288.935547,212.445312 L288.935547,250.595703 C288.935547,258.57487 292.551107,264.185221 299.782227,267.426758 C307.013346,270.668294 313.621094,269.296875 319.605469,263.3125 L319.605469,263.3125 L378.701172,204.216797 C382.192057,200.725911 383.9375,196.486979 383.9375,191.5 C383.9375,186.513021 382.192057,182.274089 378.701172,178.783203 L378.701172,178.783203 L319.605469,119.6875 C313.621094,114.201823 307.013346,112.955078 299.782227,115.947266 C292.551107,118.939453 288.935547,124.42513 288.935547,132.404297 L288.935547,132.404297 L288.935547,170.554688 L213.382812,170.554688 L213.382812,95.0019531 L251.533203,95.0019531 C259.51237,95.0019531 264.998047,91.3863932 267.990234,84.1552734 C270.982422,76.9241536 269.735677,70.3164062 264.25,64.3320312 L264.25,64.3320312 L205.154297,5.23632812 C201.663411,1.74544271 197.424479,0 192.4375,0 C187.450521,0 183.211589,1.74544271 179.720703,5.23632812 L179.720703,5.23632812 L120.625,64.3320312 C114.640625,70.3164062 113.269206,76.9241536 116.510742,84.1552734 C119.752279,91.3863932 125.36263,95.0019531 133.341797,95.0019531 L133.341797,95.0019531 L171.492188,95.0019531 L171.492188,170.554688 L95.9394531,170.554688 L95.9394531,132.404297 C95.9394531,124.42513 92.3238932,118.814779 85.0927734,115.573242 C77.8616536,112.331706 71.2539062,113.703125 65.2695312,119.6875 L65.2695312,119.6875 L6.17382812,178.783203 C2.68294271,182.274089 0.9375,186.513021 0.9375,191.5 C0.9375,196.486979 2.68294271,200.725911 6.17382812,204.216797 L6.17382812,204.216797 L65.2695312,263.3125 C71.2539062,268.798177 77.8616536,270.044922 85.0927734,267.052734 C92.3238932,264.060547 95.9394531,258.57487 95.9394531,250.595703 L95.9394531,250.595703 L95.9394531,212.445312 L171.492188,212.445312 L171.492188,287.998047 L133.341797,287.998047 C125.36263,287.998047 119.876953,291.613607 116.884766,298.844727 C113.892578,306.075846 115.139323,312.683594 120.625,318.667969 L120.625,318.667969 L179.720703,377.763672 C183.211589,381.254557 187.450521,383 192.4375,383 Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\");mask-image:url(\"data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg viewBox='0 0 384 383' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg%3E%3Cpath d='M192.4375,383 C197.424479,383 201.663411,381.254557 205.154297,377.763672 L205.154297,377.763672 L264.25,318.667969 C270.234375,312.683594 271.605794,306.075846 268.364258,298.844727 C265.122721,291.613607 259.51237,287.998047 251.533203,287.998047 L251.533203,287.998047 L213.382812,287.998047 L213.382812,212.445312 L288.935547,212.445312 L288.935547,250.595703 C288.935547,258.57487 292.551107,264.185221 299.782227,267.426758 C307.013346,270.668294 313.621094,269.296875 319.605469,263.3125 L319.605469,263.3125 L378.701172,204.216797 C382.192057,200.725911 383.9375,196.486979 383.9375,191.5 C383.9375,186.513021 382.192057,182.274089 378.701172,178.783203 L378.701172,178.783203 L319.605469,119.6875 C313.621094,114.201823 307.013346,112.955078 299.782227,115.947266 C292.551107,118.939453 288.935547,124.42513 288.935547,132.404297 L288.935547,132.404297 L288.935547,170.554688 L213.382812,170.554688 L213.382812,95.0019531 L251.533203,95.0019531 C259.51237,95.0019531 264.998047,91.3863932 267.990234,84.1552734 C270.982422,76.9241536 269.735677,70.3164062 264.25,64.3320312 L264.25,64.3320312 L205.154297,5.23632812 C201.663411,1.74544271 197.424479,0 192.4375,0 C187.450521,0 183.211589,1.74544271 179.720703,5.23632812 L179.720703,5.23632812 L120.625,64.3320312 C114.640625,70.3164062 113.269206,76.9241536 116.510742,84.1552734 C119.752279,91.3863932 125.36263,95.0019531 133.341797,95.0019531 L133.341797,95.0019531 L171.492188,95.0019531 L171.492188,170.554688 L95.9394531,170.554688 L95.9394531,132.404297 C95.9394531,124.42513 92.3238932,118.814779 85.0927734,115.573242 C77.8616536,112.331706 71.2539062,113.703125 65.2695312,119.6875 L65.2695312,119.6875 L6.17382812,178.783203 C2.68294271,182.274089 0.9375,186.513021 0.9375,191.5 C0.9375,196.486979 2.68294271,200.725911 6.17382812,204.216797 L6.17382812,204.216797 L65.2695312,263.3125 C71.2539062,268.798177 77.8616536,270.044922 85.0927734,267.052734 C92.3238932,264.060547 95.9394531,258.57487 95.9394531,250.595703 L95.9394531,250.595703 L95.9394531,212.445312 L171.492188,212.445312 L171.492188,287.998047 L133.341797,287.998047 C125.36263,287.998047 119.876953,291.613607 116.884766,298.844727 C113.892578,306.075846 115.139323,312.683594 120.625,318.667969 L120.625,318.667969 L179.720703,377.763672 C183.211589,381.254557 187.450521,383 192.4375,383 Z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E\");width:11px;height:11px;background-size:cover;background-repeat:no-repeat}.arrow-down{position:absolute;right:5px;top:0}.arrow-down svg{width:8px;margin-top:5px;margin-left:5px;opacity:0.4}.cell-value-wrapper{margin-right:10px;overflow:hidden;text-overflow:ellipsis}.revo-button{position:relative;overflow:hidden;color:#fff;background-color:#6200ee;height:34px;line-height:34px;padding:0 15px;outline:0;border:0;border-radius:7px;box-sizing:border-box;cursor:pointer}.revo-button.green{background-color:#2ee072;border:1px solid #20d565}.revo-button.red{background-color:#E0662E;border:1px solid #d55920}.revo-button:disabled,.revo-button[disabled]{cursor:not-allowed !important;filter:opacity(0.35) !important}.revo-button.light{border:2px solid #cedefa;line-height:32px;background:none;color:#4876ca;box-shadow:none}revogr-overlay-selection{display:block;position:relative;width:100%}revogr-overlay-selection .autofill-handle{position:absolute;width:10px;height:10px;background:#0d63e8;margin-left:-9px;margin-top:-9px;border:1px solid white;box-sizing:border-box;z-index:10;cursor:crosshair}revogr-overlay-selection .selection-border-range{position:absolute;pointer-events:none;z-index:9}revogr-overlay-selection .selection-border-range{box-shadow:-1px 0 0 #0d63e8 inset, 1px 0 0 #0d63e8 inset, 0 -1px 0 #0d63e8 inset, 0 1px 0 #0d63e8 inset}revogr-overlay-selection revogr-edit{z-index:10}";

const OverlaySelection = /*@__PURE__*/ proxyCustomElement(class extends HTMLElement {
  constructor() {
    super();
    this.__registerHost();
    this.internalCopy = createEvent(this, "internalCopy", 7);
    this.internalPaste = createEvent(this, "internalPaste", 7);
    this.internalCellEdit = createEvent(this, "internalCellEdit", 7);
    this.internalFocusCell = createEvent(this, "internalFocusCell", 7);
    this.setEdit = createEvent(this, "setEdit", 3);
    this.setRange = createEvent(this, "setRange", 7);
    this.setTempRange = createEvent(this, "setTempRange", 7);
    this.focusCell = createEvent(this, "focusCell", 3);
    this.internalSelectionChanged = createEvent(this, "internalSelectionChanged", 7);
    this.internalRangeDataApply = createEvent(this, "internalRangeDataApply", 7);
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
    return (h(Host, { onDblClick: () => this.doEdit(), onMouseDown: (e) => this.onElementMouseDown(e) }, els, h("slot", { name: "data" })));
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
  get element() { return this; }
  static get watchers() { return {
    "selectionStore": ["selectionServiceSet"],
    "dimensionRow": ["createAutoFillService"],
    "dimensionCol": ["createAutoFillService"],
    "dataStore": ["columnServiceSet"],
    "colData": ["columnServiceSet"]
  }; }
  static get style() { return revogrOverlayStyleCss; }
}, [4, "revogr-overlay-selection", {
    "readonly": [4],
    "range": [4],
    "canDrag": [4, "can-drag"],
    "useClipboard": [4, "use-clipboard"],
    "selectionStore": [16],
    "dimensionRow": [16],
    "dimensionCol": [16],
    "dataStore": [16],
    "colData": [16],
    "lastCell": [16],
    "editors": [16]
  }, [[5, "mousemove", "onMouseMove"], [5, "mouseleave", "onMouseOut"], [5, "mouseup", "onMouseUp"], [0, "dragStartCell", "onCellDrag"], [4, "keyup", "onKeyUp"], [4, "keydown", "onKeyDown"]]]);
function defineCustomElement() {
  if (typeof customElements === "undefined") {
    return;
  }
  const components = ["revogr-overlay-selection", "revogr-edit", "revogr-order-editor"];
  components.forEach(tagName => { switch (tagName) {
    case "revogr-overlay-selection":
      if (!customElements.get(tagName)) {
        customElements.define(tagName, OverlaySelection);
      }
      break;
    case "revogr-edit":
      if (!customElements.get(tagName)) {
        defineCustomElement$2();
      }
      break;
    case "revogr-order-editor":
      if (!customElements.get(tagName)) {
        defineCustomElement$1();
      }
      break;
  } });
}
defineCustomElement();

export { OverlaySelection as O, defineCustomElement as d };
