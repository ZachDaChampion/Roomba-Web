import { Writable, writable } from "svelte/store";

export const grid: Writable<Grid<ui.Cell>> = writable(null);
