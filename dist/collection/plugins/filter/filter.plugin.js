/*!
 * Built by Revolist
 */
import { h } from '@stencil/core';
import BasePlugin from '../basePlugin';
import { FILTER_PROP, isFilterBtn } from './filter.button';
import { filterEntities, filterNames, filterTypes } from './filter.service';
export const FILTER_TRIMMED_TYPE = 'filter';
export default class FilterPlugin extends BasePlugin {
  constructor(revogrid, uiid, config) {
    var _a;
    super(revogrid);
    this.revogrid = revogrid;
    this.filterCollection = {};
    this.multiFilterItems = {};
    this.possibleFilters = Object.assign({}, filterTypes);
    this.possibleFilterNames = Object.assign({}, filterNames);
    this.possibleFilterEntities = Object.assign({}, filterEntities);
    if (config) {
      this.initConfig(config);
    }
    const headerclick = (e) => this.headerclick(e);
    const aftersourceset = async () => {
      const filterCollectionProps = Object.keys(this.filterCollection);
      if (filterCollectionProps.length > 0) {
        // handle old way of filtering by reworking FilterCollection to new MultiFilterItem
        filterCollectionProps.forEach((prop, index) => {
          if (!this.multiFilterItems[prop]) {
            this.multiFilterItems[prop] = [
              {
                id: index,
                type: this.filterCollection[prop].type,
                value: this.filterCollection[prop].value,
                relation: 'and',
              },
            ];
          }
        });
      }
      await this.runFiltering();
    };
    this.addEventListener('headerclick', headerclick);
    this.addEventListener('aftersourceset', aftersourceset);
    this.revogrid.registerVNode([
      h("revogr-filter-panel", { uuid: `filter-${uiid}`, filterItems: this.multiFilterItems, filterNames: this.possibleFilterNames, filterEntities: this.possibleFilterEntities, filterCaptions: (_a = config === null || config === void 0 ? void 0 : config.localization) === null || _a === void 0 ? void 0 : _a.captions, onFilterChange: e => this.onFilterChange(e.detail), disableDynamicFiltering: config === null || config === void 0 ? void 0 : config.disableDynamicFiltering, ref: e => (this.pop = e) }),
    ]);
  }
  initConfig(config) {
    if (config.collection) {
      this.filterCollection = Object.assign({}, config.collection);
    }
    if (config.multiFilterItems) {
      this.multiFilterItems = Object.assign({}, config.multiFilterItems);
    }
    if (config.customFilters) {
      for (let cType in config.customFilters) {
        const cFilter = config.customFilters[cType];
        if (!this.possibleFilters[cFilter.columnFilterType]) {
          this.possibleFilters[cFilter.columnFilterType] = [];
        }
        this.possibleFilters[cFilter.columnFilterType].push(cType);
        this.possibleFilterEntities[cType] = cFilter.func;
        this.possibleFilterNames[cType] = cFilter.name;
      }
    }
    /**
     * which filters has to be included/excluded
     * convinient way to exclude system filters
     */
    if (config.include) {
      const filters = {};
      for (let t in this.possibleFilters) {
        // validate filters, if appropriate function present
        const newTypes = this.possibleFilters[t].filter(f => config.include.indexOf(f) > -1);
        if (newTypes.length) {
          filters[t] = newTypes;
        }
      }
      // if any valid filters provided show them
      if (Object.keys(filters).length > 0) {
        this.possibleFilters = filters;
      }
    }
    if (config.localization) {
      if (config.localization.filterNames) {
        Object.entries(config.localization.filterNames).forEach(([k, v]) => {
          if (this.possibleFilterNames[k] != void 0) {
            this.possibleFilterNames[k] = v;
          }
        });
      }
    }
  }
  async headerclick(e) {
    var _a;
    const el = (_a = e.detail.originalEvent) === null || _a === void 0 ? void 0 : _a.target;
    if (!isFilterBtn(el)) {
      return;
    }
    e.preventDefault();
    // close if same
    const changes = await this.pop.getChanges();
    if (changes && (changes === null || changes === void 0 ? void 0 : changes.prop) === e.detail.prop) {
      this.pop.show();
      return;
    }
    // filter button clicked, open filter dialog
    const gridPos = this.revogrid.getBoundingClientRect();
    const buttonPos = el.getBoundingClientRect();
    const prop = e.detail.prop;
    this.pop.filterTypes = this.getColumnFilter(e.detail.filter);
    this.pop.show(Object.assign(Object.assign({}, this.filterCollection[prop]), { x: buttonPos.x - gridPos.x, y: buttonPos.y - gridPos.y + buttonPos.height, prop }));
  }
  getColumnFilter(type) {
    let filterType = 'string';
    if (!type) {
      return { [filterType]: this.possibleFilters[filterType] };
    }
    // if custom column filter
    if (this.isValidType(type)) {
      filterType = type;
      // if multiple filters applied
    }
    else if (typeof type === 'object' && type.length) {
      return type.reduce((r, multiType) => {
        if (this.isValidType(multiType)) {
          r[multiType] = this.possibleFilters[multiType];
        }
        return r;
      }, {});
    }
    return { [filterType]: this.possibleFilters[filterType] };
  }
  isValidType(type) {
    return !!(typeof type === 'string' && this.possibleFilters[type]);
  }
  // called on internal component change
  async onFilterChange(filterItems) {
    this.multiFilterItems = filterItems;
    this.runFiltering();
  }
  /**
   * Triggers grid filtering
   */
  async doFiltering(collection, items, columns, filterItems) {
    const columnsToUpdate = [];
    columns.forEach(rgCol => {
      const column = Object.assign({}, rgCol);
      const hasFilter = filterItems[column.prop];
      if (column[FILTER_PROP] && !hasFilter) {
        delete column[FILTER_PROP];
        columnsToUpdate.push(column);
      }
      if (!column[FILTER_PROP] && hasFilter) {
        columnsToUpdate.push(column);
        column[FILTER_PROP] = true;
      }
    });
    const itemsToFilter = this.getRowFilter(items, filterItems);
    // check is filter event prevented
    const { defaultPrevented, detail } = this.emit('beforefiltertrimmed', { collection, itemsToFilter, source: items, filterItems });
    if (defaultPrevented) {
      return;
    }
    // check is trimmed event prevented
    const isAddedEvent = await this.revogrid.addTrimmed(detail.itemsToFilter, FILTER_TRIMMED_TYPE);
    if (isAddedEvent.defaultPrevented) {
      return;
    }
    // applies the hasFilter to the columns to show filter icon
    await this.revogrid.updateColumns(columnsToUpdate);
    this.emit('afterFilterApply');
  }
  async clearFiltering() {
    this.multiFilterItems = {};
    await this.runFiltering();
  }
  async runFiltering() {
    const collection = {};
    // handle old filterCollection to return the first filter only (if any) from multiFilterItems
    const filterProps = Object.keys(this.multiFilterItems);
    for (const prop of filterProps) {
      // check if we have any filter for a column
      if (this.multiFilterItems[prop].length > 0) {
        const firstFilterItem = this.multiFilterItems[prop][0];
        collection[prop] = {
          filter: filterEntities[firstFilterItem.type],
          type: firstFilterItem.type,
          value: firstFilterItem.value,
        };
      }
    }
    this.filterCollection = collection;
    const { source, columns } = await this.getData();
    const { defaultPrevented, detail } = this.emit('beforefilterapply', { collection: this.filterCollection, source, columns, filterItems: this.multiFilterItems });
    if (defaultPrevented) {
      return;
    }
    this.doFiltering(detail.collection, detail.source, detail.columns, detail.filterItems);
  }
  async getData() {
    const source = await this.revogrid.getSource();
    const columns = await this.revogrid.getColumns();
    return {
      source,
      columns,
    };
  }
  getRowFilter(rows, filterItems) {
    const propKeys = Object.keys(filterItems);
    const trimmed = {};
    let propFilterSatisfiedCount = 0;
    let lastFilterResults = [];
    // each rows
    rows.forEach((model, rowIndex) => {
      // working on all props
      for (const prop of propKeys) {
        const propFilters = filterItems[prop];
        propFilterSatisfiedCount = 0;
        lastFilterResults = [];
        // testing each filter for a prop
        for (const [filterIndex, filterData] of propFilters.entries()) {
          // the filter LogicFunction based on the type
          const filter = this.possibleFilterEntities[filterData.type];
          // THE MAGIC OF FILTERING IS HERE
          if (filterData.relation === 'or') {
            lastFilterResults = [];
            if (filter(model[prop], filterData.value)) {
              continue;
            }
            propFilterSatisfiedCount++;
          }
          else {
            // 'and' relation will need to know the next filter
            // so we save this current filter to include it in the next filter
            lastFilterResults.push(!filter(model[prop], filterData.value));
            // check first if we have a filter on the next index to pair it with this current filter
            const nextFilterData = propFilters[filterIndex + 1];
            // stop the sequence if there is no next filter or if the next filter is not an 'and' relation
            if (!nextFilterData || nextFilterData.relation !== 'and') {
              // let's just continue since for sure propFilterSatisfiedCount cannot be satisfied
              if (lastFilterResults.indexOf(true) === -1) {
                lastFilterResults = [];
                continue;
              }
              // we need to add all of the lastFilterResults since we need to satisfy all
              propFilterSatisfiedCount += lastFilterResults.length;
              lastFilterResults = [];
            }
          }
        } // end of propFilters forEach
        // add to the list of removed/trimmed rows of filter condition is satisfied
        if (propFilterSatisfiedCount === propFilters.length)
          trimmed[rowIndex] = true;
      } // end of for-of propKeys
    });
    return trimmed;
  }
}
