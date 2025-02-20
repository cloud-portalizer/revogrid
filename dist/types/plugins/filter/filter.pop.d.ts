import { EventEmitter, VNode } from '../../stencil-public-runtime';
import { FilterType } from './filter.service';
import { RevoGrid } from '../../interfaces';
import '../../utils/closestPolifill';
import { LogicFunction } from './filter.types';
import { FilterCaptions } from './filter.plugin';
/**
 * @typedef FilterItem
 * @type {object}
 * @property {ColumnProp} prop - column id
 * @property {FilterType} type - filter type definition
 * @property {any} value - value for additional filtering, text value or some id
 */
export declare type FilterItem = {
  prop?: RevoGrid.ColumnProp;
  type?: FilterType;
  value?: any;
};
export declare type FilterData = {
  id: number;
  type: FilterType;
  value?: any;
  relation: 'and' | 'or';
};
export declare type MultiFilterItem = {
  [prop: string]: FilterData[];
};
export declare type ShowData = {
  x: number;
  y: number;
} & FilterItem;
export declare class FilterPanel {
  private filterCaptionsInternal;
  isFilterIdSet: boolean;
  filterId: number;
  currentFilterId: number;
  currentFilterType: FilterType;
  changes: ShowData | undefined;
  uuid: string;
  filterItems: MultiFilterItem;
  filterTypes: Record<string, string[]>;
  filterNames: Record<string, string>;
  filterEntities: Record<string, LogicFunction>;
  filterCaptions: FilterCaptions | undefined;
  disableDynamicFiltering: boolean;
  filterChange: EventEmitter<MultiFilterItem>;
  onMouseDown(e: MouseEvent): void;
  show(newEntity?: ShowData): Promise<void>;
  getChanges(): Promise<ShowData>;
  componentWillRender(): void;
  renderSelectOptions(type: FilterType, isDefaultTypeRemoved?: boolean): VNode[];
  renderExtra(prop: RevoGrid.ColumnProp, index: number): any;
  getFilterItemsList(): any;
  render(): any;
  private onFilterTypeChange;
  private debouncedApplyFilter;
  private onAddNewFilter;
  private addNewFilterToProp;
  private onUserInput;
  private onKeyDown;
  private onSave;
  private onCancel;
  private onReset;
  private onRemoveFilter;
  private toggleFilterAndOr;
  private assertChanges;
  private isOutside;
}
