/*!
 * Built by Revolist
 */
import { h } from '@stencil/core';
export const FILTER_BUTTON_CLASS = 'rv-filter';
export const FILTER_BUTTON_ACTIVE = 'active';
export const FILTER_PROP = 'hasFilter';
export const AND_OR_BUTTON = 'and-or-button';
export const TRASH_BUTTON = 'trash-button';
export const FilterButton = ({ column }) => {
  return (h("span", null,
    h("button", { class: {
        [FILTER_BUTTON_CLASS]: true,
        [FILTER_BUTTON_ACTIVE]: column && !!column[FILTER_PROP],
      } },
      h("svg", { class: "filter-img", viewBox: "0 0 64 64" },
        h("g", { stroke: "none", "stroke-width": "1", fill: "none", "fill-rule": "evenodd" },
          h("path", { d: "M43,48 L43,56 L21,56 L21,48 L43,48 Z M53,28 L53,36 L12,36 L12,28 L53,28 Z M64,8 L64,16 L0,16 L0,8 L64,8 Z", fill: "currentColor" }))))));
};
export const TrashButton = () => {
  return (h("div", { class: { [TRASH_BUTTON]: true } },
    h("svg", { class: "trash-img", viewBox: "0 0 24 24" },
      h("path", { fill: "currentColor", d: "M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z" }))));
};
export const AndOrButton = ({ isAnd }) => {
  return h("button", { class: { [AND_OR_BUTTON]: true, 'light revo-button': true } }, isAnd ? 'and' : 'or');
};
export function isFilterBtn(e) {
  if (e.classList.contains(FILTER_BUTTON_CLASS)) {
    return true;
  }
  return e === null || e === void 0 ? void 0 : e.closest(`.${FILTER_BUTTON_CLASS}`);
}
