import { Writable, writable, Readable, derived } from "svelte/store";

export const grid: Writable<Grid<ui.Cell>> = writable(null);

// TODO: setter
export const selected: Writable<{
  row: number;
  col: number;
  dir: "r" | "d";
}> = writable(null);

export const selectedStrength: Readable<number | null> = derived(
  [grid, selected],
  ([$grid, $selected]) => {
    if ($selected === null) return null;
    if ($selected.dir === "r") return $grid[$selected.row][$selected.col].right;
    return $grid[$selected.row][$selected.col].down;
  }
);
