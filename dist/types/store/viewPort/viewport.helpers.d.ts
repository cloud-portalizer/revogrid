import { RevoGrid } from '../../interfaces';
export declare type DimensionDataViewport = Pick<RevoGrid.DimensionSettingsState, 'indexes' | 'positionIndexes' | 'positionIndexToItem' | 'sizes' | 'originItemSize' | 'realSize' | 'frameOffset'>;
declare type ItemsToUpdate = Pick<RevoGrid.ViewportStateItems, 'items' | 'start' | 'end'>;
/**
 * Update items based on new scroll position
 * If viewport wasn't changed fully simple recombination of positions
 * Otherwise rebuild viewport items
 */
export declare function getUpdatedItemsByPosition<T extends ItemsToUpdate>(pos: number, items: T, realCount: number, virtualSize: number, dimension: DimensionDataViewport): ItemsToUpdate;
export declare function updateMissingAndRange(items: RevoGrid.VirtualPositionItem[], missing: RevoGrid.VirtualPositionItem[], range: RevoGrid.Range): void;
export declare function addMissingItems<T extends ItemsToUpdate>(firstItem: RevoGrid.PositionItem, realCount: number, virtualSize: number, existingCollection: T, dimension: Pick<RevoGrid.DimensionSettingsState, 'sizes' | 'originItemSize'>): RevoGrid.VirtualPositionItem[];
export declare function getItems(opt: {
  startIndex: number;
  start: number;
  origSize: number;
  maxSize: number;
  maxCount: number;
  sizes?: RevoGrid.ViewSettingSizeProp;
}, currentSize?: number): RevoGrid.VirtualPositionItem[];
/**
 * Do batch items recombination
 * If items not overlapped with existing viewport returns null
 */
export declare function recombineByOffset(offset: number, data: {
  positiveDirection: boolean;
} & ItemsToUpdate & Pick<RevoGrid.DimensionSettingsState, 'sizes' | 'realSize' | 'originItemSize'>): ItemsToUpdate | null;
export declare function isActiveRange(pos: number, item: RevoGrid.PositionItem | undefined): boolean;
export declare function getFirstItem(s: ItemsToUpdate): RevoGrid.VirtualPositionItem | undefined;
export declare function getLastItem(s: ItemsToUpdate): RevoGrid.VirtualPositionItem;
export {};
