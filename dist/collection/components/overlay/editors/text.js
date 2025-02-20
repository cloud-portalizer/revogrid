/*!
 * Built by Revolist
 */
import { h } from '@stencil/core';
import { isEnterKey, isTab } from '../../../utils/keyCodes.utils';
import { timeout } from '../../../utils/utils';
export class TextEditor {
  constructor(column, saveCallback) {
    this.column = column;
    this.saveCallback = saveCallback;
    this.element = null;
    this.editCell = null;
  }
  async componentDidRender() {
    var _a;
    if (this.editInput) {
      await timeout();
      (_a = this.editInput) === null || _a === void 0 ? void 0 : _a.focus();
    }
  }
  onKeyDown(e) {
    const isEnter = isEnterKey(e.code);
    const isKeyTab = isTab(e.code);
    if ((isKeyTab || isEnter) && e.target && this.saveCallback && !e.isComposing) {
      // blur is needed to avoid autoscroll
      this.editInput.blur();
      // request callback which will close cell after all
      this.saveCallback(e.target.value, isKeyTab);
    }
  }
  // required
  render() {
    var _a;
    return (h("input", { type: "text", value: ((_a = this.editCell) === null || _a === void 0 ? void 0 : _a.val) || '', ref: el => {
        this.editInput = el;
      }, onKeyDown: e => this.onKeyDown(e) }));
  }
}
