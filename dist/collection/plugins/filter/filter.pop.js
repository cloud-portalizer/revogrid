/*!
 * Built by Revolist
 */
import { Component, h, Host, Listen, Prop, State, Event, Method } from '@stencil/core';
import { AndOrButton, isFilterBtn, TrashButton } from './filter.button';
import { RevoButton } from '../../components/button/button';
import '../../utils/closestPolifill';
import debounce from 'lodash/debounce';
const defaultType = 'none';
const FILTER_LIST_CLASS = 'multi-filter-list';
const FILTER_LIST_CLASS_ACTION = 'multi-filter-list-action';
export class FilterPanel {
  constructor() {
    this.filterCaptionsInternal = {
      title: 'Filter by condition',
      save: 'Save',
      reset: 'Reset',
      cancel: 'Close',
    };
    this.isFilterIdSet = false;
    this.filterId = 0;
    this.currentFilterId = -1;
    this.currentFilterType = defaultType;
    this.filterItems = {};
    this.filterTypes = {};
    this.filterNames = {};
    this.filterEntities = {};
    this.disableDynamicFiltering = false;
    this.debouncedApplyFilter = debounce(() => {
      this.filterChange.emit(this.filterItems);
    }, 400);
  }
  onMouseDown(e) {
    if (this.changes && !e.defaultPrevented) {
      const el = e.target;
      if (this.isOutside(el) && !isFilterBtn(el)) {
        this.changes = undefined;
      }
    }
  }
  async show(newEntity) {
    this.changes = newEntity;
    if (this.changes) {
      this.changes.type = this.changes.type || defaultType;
    }
  }
  async getChanges() {
    return this.changes;
  }
  componentWillRender() {
    if (!this.isFilterIdSet) {
      this.isFilterIdSet = true;
      const filterItems = Object.keys(this.filterItems);
      for (const prop of filterItems) {
        // we set the proper filterId so there won't be any conflict when removing filters
        this.filterId += this.filterItems[prop].length;
      }
    }
  }
  renderSelectOptions(type, isDefaultTypeRemoved = false) {
    var _a;
    const options = [];
    const prop = (_a = this.changes) === null || _a === void 0 ? void 0 : _a.prop;
    if (!isDefaultTypeRemoved) {
      options.push(h("option", { selected: this.currentFilterType === defaultType, value: defaultType }, prop && this.filterItems[prop] && this.filterItems[prop].length > 0 ? 'Add more condition...' : this.filterNames[defaultType]));
    }
    for (let gIndex in this.filterTypes) {
      options.push(...this.filterTypes[gIndex].map(k => (h("option", { value: k, selected: type === k }, this.filterNames[k]))));
      options.push(h("option", { disabled: true }));
    }
    return options;
  }
  renderExtra(prop, index) {
    const currentFilter = this.filterItems[prop];
    if (!currentFilter)
      return '';
    if (this.filterEntities[currentFilter[index].type].extra !== 'input')
      return '';
    return (h("input", { id: `filter-input-${currentFilter[index].id}`, placeholder: "Enter value...", type: "text", value: currentFilter[index].value, onInput: this.onUserInput.bind(this, index, prop), onKeyDown: e => this.onKeyDown(e) }));
  }
  getFilterItemsList() {
    var _a;
    const prop = (_a = this.changes) === null || _a === void 0 ? void 0 : _a.prop;
    if (!(prop || prop === 0))
      return '';
    const propFilters = this.filterItems[prop] || [];
    return (h("div", { key: this.filterId },
      propFilters.map((d, index) => {
        let andOrButton;
        // hide toggle button if there is only one filter and the last one
        if (index !== this.filterItems[prop].length - 1) {
          andOrButton = (h("div", { onClick: () => this.toggleFilterAndOr(d.id) },
            h(AndOrButton, { isAnd: d.relation === 'and' })));
        }
        return (h("div", { key: d.id, class: FILTER_LIST_CLASS },
          h("div", { class: { 'select-input': true } },
            h("select", { class: "select-css select-filter", onChange: e => this.onFilterTypeChange(e, prop, index) }, this.renderSelectOptions(this.filterItems[prop][index].type, true)),
            h("div", { class: FILTER_LIST_CLASS_ACTION }, andOrButton),
            h("div", { onClick: () => this.onRemoveFilter(d.id) },
              h(TrashButton, null))),
          h("div", null, this.renderExtra(prop, index))));
      }),
      propFilters.length > 0 ? h("div", { class: "add-filter-divider" }) : ''));
  }
  render() {
    if (!this.changes) {
      return h(Host, { style: { display: 'none' } });
    }
    const style = {
      display: 'block',
      left: `${this.changes.x}px`,
      top: `${this.changes.y}px`,
    };
    const capts = Object.assign(this.filterCaptionsInternal, this.filterCaptions);
    return (h(Host, { style: style },
      h("label", null, capts.title),
      h("div", { class: "filter-holder" }, this.getFilterItemsList()),
      h("div", { class: "add-filter" },
        h("select", { id: "add-filter", class: "select-css", onChange: e => this.onAddNewFilter(e) }, this.renderSelectOptions(this.currentFilterType))),
      h("div", { class: "filter-actions" },
        this.disableDynamicFiltering &&
          h(RevoButton, { class: { red: true, save: true }, onClick: () => this.onSave() }, capts.save),
        h(RevoButton, { class: { red: true, reset: true }, onClick: () => this.onReset() }, capts.reset),
        h(RevoButton, { class: { light: true, cancel: true }, onClick: () => this.onCancel() }, capts.cancel))));
  }
  onFilterTypeChange(e, prop, index) {
    const el = e.target;
    const type = el.value;
    this.filterItems[prop][index].type = type;
    // this re-renders the input to know if we need extra input
    this.filterId++;
    // adding setTimeout will wait for the next tick DOM update then focus on input
    setTimeout(() => {
      const input = document.getElementById('filter-input-' + this.filterItems[prop][index].id);
      if (input)
        input.focus();
    }, 0);
    if (!this.disableDynamicFiltering)
      this.debouncedApplyFilter();
  }
  onAddNewFilter(e) {
    const el = e.target;
    const type = el.value;
    this.currentFilterType = type;
    this.addNewFilterToProp();
    // reset value after adding new filter
    const select = document.getElementById('add-filter');
    if (select) {
      select.value = defaultType;
      this.currentFilterType = defaultType;
    }
    if (!this.disableDynamicFiltering)
      this.debouncedApplyFilter();
  }
  addNewFilterToProp() {
    var _a;
    const prop = (_a = this.changes) === null || _a === void 0 ? void 0 : _a.prop;
    if (!(prop || prop === 0))
      return;
    if (!this.filterItems[prop]) {
      this.filterItems[prop] = [];
    }
    if (this.currentFilterType === 'none')
      return;
    this.filterId++;
    this.currentFilterId = this.filterId;
    this.filterItems[prop].push({
      id: this.currentFilterId,
      type: this.currentFilterType,
      value: '',
      relation: 'and',
    });
    // adding setTimeout will wait for the next tick DOM update then focus on input
    setTimeout(() => {
      const input = document.getElementById('filter-input-' + this.currentFilterId);
      if (input)
        input.focus();
    }, 0);
  }
  onUserInput(index, prop, event) {
    // update the value of the filter item
    this.filterItems[prop][index].value = event.target.value;
    if (!this.disableDynamicFiltering)
      this.debouncedApplyFilter();
  }
  onKeyDown(e) {
    if (e.key.toLowerCase() === 'enter') {
      const select = document.getElementById('add-filter');
      if (select) {
        select.value = defaultType;
        this.currentFilterType = defaultType;
        this.addNewFilterToProp();
        select.focus();
      }
      return;
    }
    // keep event local, don't escalate farther to dom
    e.stopPropagation();
  }
  onSave() {
    this.filterChange.emit(this.filterItems);
  }
  onCancel() {
    this.changes = undefined;
  }
  onReset() {
    this.assertChanges();
    delete this.filterItems[this.changes.prop];
    // this updates the DOM which is used by getFilterItemsList() key
    this.filterId++;
    this.filterChange.emit(this.filterItems);
  }
  onRemoveFilter(id) {
    this.assertChanges();
    // this is for reactivity issues for getFilterItemsList()
    this.filterId++;
    const prop = this.changes.prop;
    const items = this.filterItems[prop];
    if (!items)
      return;
    const index = items.findIndex(d => d.id === id);
    if (index === -1)
      return;
    items.splice(index, 1);
    // let's remove the prop if no more filters so the filter icon will be removed
    if (items.length === 0)
      delete this.filterItems[prop];
    if (!this.disableDynamicFiltering)
      this.debouncedApplyFilter();
  }
  toggleFilterAndOr(id) {
    this.assertChanges();
    // this is for reactivity issues for getFilterItemsList()
    this.filterId++;
    const prop = this.changes.prop;
    const items = this.filterItems[prop];
    if (!items)
      return;
    const index = items.findIndex(d => d.id === id);
    if (index === -1)
      return;
    items[index].relation = items[index].relation === 'and' ? 'or' : 'and';
    if (!this.disableDynamicFiltering)
      this.debouncedApplyFilter();
  }
  assertChanges() {
    if (!this.changes) {
      throw new Error('Changes required per edit');
    }
  }
  isOutside(e) {
    const select = document.getElementById('add-filter');
    if (select)
      select.value = defaultType;
    this.currentFilterType = defaultType;
    this.changes.type = defaultType;
    this.currentFilterId = -1;
    if (e.classList.contains(`[uuid="${this.uuid}"]`)) {
      return false;
    }
    return !(e === null || e === void 0 ? void 0 : e.closest(`[uuid="${this.uuid}"]`));
  }
  static get is() { return "revogr-filter-panel"; }
  static get originalStyleUrls() { return {
    "$": ["filter.style.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["filter.style.css"]
  }; }
  static get properties() { return {
    "uuid": {
      "type": "string",
      "mutable": true,
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
      "attribute": "uuid",
      "reflect": true
    },
    "filterItems": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "MultiFilterItem",
        "resolved": "{ [prop: string]: FilterData[]; }",
        "references": {
          "MultiFilterItem": {
            "location": "local"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "defaultValue": "{}"
    },
    "filterTypes": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Record<string, string[]>",
        "resolved": "{ [x: string]: string[]; }",
        "references": {
          "Record": {
            "location": "global"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "defaultValue": "{}"
    },
    "filterNames": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Record<string, string>",
        "resolved": "{ [x: string]: string; }",
        "references": {
          "Record": {
            "location": "global"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "defaultValue": "{}"
    },
    "filterEntities": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "Record<string, LogicFunction>",
        "resolved": "{ [x: string]: LogicFunction; }",
        "references": {
          "Record": {
            "location": "global"
          },
          "LogicFunction": {
            "location": "import",
            "path": "./filter.types"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "defaultValue": "{}"
    },
    "filterCaptions": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "FilterCaptions | undefined",
        "resolved": "{ title: string; save: string; reset: string; cancel: string; }",
        "references": {
          "FilterCaptions": {
            "location": "import",
            "path": "./filter.plugin"
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
    "disableDynamicFiltering": {
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
      "attribute": "disable-dynamic-filtering",
      "reflect": false,
      "defaultValue": "false"
    }
  }; }
  static get states() { return {
    "isFilterIdSet": {},
    "filterId": {},
    "currentFilterId": {},
    "currentFilterType": {},
    "changes": {}
  }; }
  static get events() { return [{
      "method": "filterChange",
      "name": "filterChange",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "MultiFilterItem",
        "resolved": "{ [prop: string]: FilterData[]; }",
        "references": {
          "MultiFilterItem": {
            "location": "local"
          }
        }
      }
    }]; }
  static get methods() { return {
    "show": {
      "complexType": {
        "signature": "(newEntity?: ShowData) => Promise<void>",
        "parameters": [{
            "tags": [],
            "text": ""
          }],
        "references": {
          "Promise": {
            "location": "global"
          },
          "ShowData": {
            "location": "local"
          }
        },
        "return": "Promise<void>"
      },
      "docs": {
        "text": "",
        "tags": []
      }
    },
    "getChanges": {
      "complexType": {
        "signature": "() => Promise<ShowData>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "ShowData": {
            "location": "local"
          }
        },
        "return": "Promise<ShowData>"
      },
      "docs": {
        "text": "",
        "tags": []
      }
    }
  }; }
  static get listeners() { return [{
      "name": "mousedown",
      "method": "onMouseDown",
      "target": "document",
      "capture": false,
      "passive": true
    }]; }
}
