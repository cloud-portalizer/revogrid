import DataStore from '../store/dataSource/data.store';
import { ColumnItems } from './dimension.provider';
import { RevoGrid } from '../interfaces';
import ColumnRegular = RevoGrid.ColumnRegular;
import DimensionCols = RevoGrid.DimensionCols;
import ColumnProp = RevoGrid.ColumnProp;
import { ColumnGrouping } from '../plugins/groupingColumn/grouping.col.plugin';
export declare type ColumnCollection = {
  columns: ColumnItems;
  columnGrouping: ColumnGrouping;
  maxLevel: number;
  sort: Record<ColumnProp, ColumnRegular>;
};
export declare type ColumnDataSources = Record<DimensionCols, DataStore<ColumnRegular, DimensionCols>>;
declare type Sorting = Record<ColumnProp, ColumnRegular>;
declare type SortingOrder = Record<ColumnProp, 'asc' | 'desc'>;
export default class ColumnDataProvider {
  private readonly dataSources;
  sorting: Sorting | null;
  get order(): SortingOrder;
  get stores(): ColumnDataSources;
  constructor();
  column(c: number, pin?: RevoGrid.DimensionColPin): ColumnRegular | undefined;
  getColumn(virtualIndex: number, type: DimensionCols): ColumnRegular | undefined;
  getRawColumns(): ColumnItems;
  getColumns(type?: DimensionCols | 'all'): RevoGrid.ColumnRegular[];
  getColumnIndexByProp(prop: ColumnProp, type: DimensionCols): number;
  getColumnByProp(prop: ColumnProp, type: DimensionCols): ColumnRegular | undefined;
  refreshByType(type: DimensionCols): void;
  setColumns(data: ColumnCollection): ColumnCollection;
  updateColumns(cols: ColumnRegular[]): void;
  updateColumn(column: ColumnRegular, index: number): void;
  updateColumnSorting(column: ColumnRegular, index: number, sorting: 'asc' | 'desc', additive: boolean): ColumnRegular;
  clearSorting(): void;
  static getSizes(cols: ColumnRegular[]): RevoGrid.ViewSettingSizeProp;
  static getColumnByProp(columns: RevoGrid.ColumnData, prop: ColumnProp): ColumnRegular | undefined;
  static getColumns(columns: RevoGrid.ColumnData, level?: number, types?: RevoGrid.ColumnTypes): ColumnCollection;
  static getColumnType(rgCol: ColumnRegular): DimensionCols;
}
export {};
