import {VNode} from "@stencil/core";

export declare namespace RevoGrid {
  type DimensionTypeRow = 'row';
  type DimensionTypeCol = 'col';
  type DimensionColPin = 'colPinStart'|'colPinEnd';
  type DimensionRowPin = 'rowPinStart'|'rowPinEnd';
  type DimensionType = DimensionTypeCol|DimensionTypeRow;
  type DimensionCols = DimensionColPin|DimensionTypeCol;
  type DimensionRows = DimensionTypeRow|DimensionRowPin;
  type MultiDimensionType = DimensionType|DimensionColPin|DimensionRowPin;

  type ViewPortScrollEvent = {
    dimension: DimensionType;
    coordinate: number;
  };

  type ViewPortResizeEvent = {
    dimension: DimensionType;
    size: number;
  };

  type ColumnDataSchemaModel = {
    prop: ColumnProp;
    model: DataType;
    data: DataSource;
  };

  type ReadOnlyFormat = boolean | ((row: number, col: number) => boolean);

  interface ColumnDataSchemaBase {
    name?: DataFormat;
    readonly?: ReadOnlyFormat;
    size?: number;
    minSize?: number;
    cellTemplate?: Function;
  }

  interface ColumnDataSchemaGrouping {
    children: ColumnDataSchema[];
    name: DataFormat;
  }


  interface ColumnDataSchemaRegular extends ColumnDataSchemaBase {
    prop: ColumnProp;
    editor?: string;
    pin?: DimensionColPin;
  }

  type ColumnDataSchema = ColumnDataSchemaGrouping | ColumnDataSchemaRegular;

  type ColumnProp = string|number;
  type DataFormat = any;

  interface HyperFunc<T> {
    (sel: string, data?: object, text?: string): T;
  }

  type CellTemplateFunc<T> = (h: HyperFunc<T>, props: ColumnDataSchemaModel) => T;
  type ColumnData = ColumnDataSchema[];

  type DataType = { [T in ColumnProp]: DataFormat };
  type DataSource = DataType[];

  type Range = {
    start: number;
    end: number;
  };

  type ViewportStateItems = {
    items: VirtualPositionItem[];
  } & Range;

  interface ViewportState extends ViewportStateItems {
    realCount: number;
    virtualSize: number;
  }

  type ViewSettingSizeProp = { [index: string]: number };

  interface VirtualPositionItem extends PositionItem {
    size: number;
  }

  interface PositionItem {
    itemIndex: number;
    start: number;
    end: number;
  }

  interface DimensionSettingsState {
    indexes: number[];
    positionIndexes: number[];
    positionIndexToItem: { [position: number]: PositionItem };
    indexToItem: { [index: number]: PositionItem };
    sizes: ViewSettingSizeProp;
    frameOffset: number;
    realSize: number;
    originItemSize: number;
  }

  type InitialSettings = {
    defaultColumnSize: number;
    defaultRowSize: number;
    frameSize: number;
    readonly: boolean;
    range: boolean;
    resize: boolean;
  };
}


export declare namespace Selection {
  type RowIndex = number;
  type ColIndex = number;

  type RangeArea = {
    x: ColIndex;
    y: RowIndex;
    x1: ColIndex;
    y1: RowIndex;
  };

  interface Cell {
    x: ColIndex;
    y: RowIndex;
  }

  export type RangeAreaCss = {
    left: string;
    top: string;
    width: string;
    height: string;
  };

  interface SelectionStoreConnectorI {
    setEdit(val: string | boolean): void;

    register(y: number, x: number): Object;

    clearFocus(s: Object): void;

    change(changes: Partial<Cell>, isMulti?: boolean): void;

    unregister(store: Object): void;

    focus(store: Object, focus: Selection.Cell, end: Selection.Cell): void;
  }
}

export declare namespace Edition {
  import HyperFunc = RevoGrid.HyperFunc;
  type SaveData = string;
  type SaveDataDetails = {
    row: Selection.RowIndex;
    col: Selection.ColIndex;
    val: SaveData;
  };
  type BeforeSaveDataDetails = {
    model: RevoGrid.DataType;
    prop: RevoGrid.ColumnProp;
    val: SaveData;
  };

  interface EditCell extends Selection.Cell {
    model?: RevoGrid.DataType;
    val?: SaveData;
  }

  type Editors = {[name: string]: EditorCtr};

  interface EditorCtr {
    new (
        column: RevoGrid.ColumnDataSchemaRegular,
        editCallback?: (value: Edition.SaveData) => void,
    ): EditorBase;
  }

  interface EditorBase {
    element?: Element|null;
    editCell?: EditCell;
    componentDidRender?(): void;
    disconnectedCallback?(): void;
    render(h?: HyperFunc<VNode>): VNode|HTMLElement;
  }
}
