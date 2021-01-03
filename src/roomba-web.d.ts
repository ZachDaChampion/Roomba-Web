type Grid<t> = Array<Array<t>>;

interface Point {
  x: number;
  y: number;
}

declare namespace ui {
  enum CellType {
    NORMAL,
    BLANK,
    START,
    GOAL,
  }

  export interface Cell {
    row: number;
    col: number;
    down: number | null;
    right: number | null;
  }
}
