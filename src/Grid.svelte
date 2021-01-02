<script lang="ts">
  import { grid } from "./store";

  export let rows: number;
  export let cols: number;

  let selected: { row: number; col: number; dir: "r" | "d" } = null;

  // generate grid
  const result: Grid<ui.Cell> = Array(Array(0));
  for (let i = 0; i < rows; ++i) {
    result.push(Array(0));
    for (let j = 0; j < cols; ++j) {
      result[i].push({
        x: i,
        y: j,
        down: i < rows - 1 ? i / rows : null,
        right: j < cols - 1 ? i / rows : null,
      });
    }
  }
  $grid = result;

  // derive color of path
  function derivePathColor(weight: number) {
    if (weight < 0) weight = 0;
    if (weight > 1) weight = 1;
    let val = Math.round(weight * 255);
    return `rgb(${val}, ${val}, ${val})`;
  }
</script>

<style>
  .cell {
    height: 24px;
    width: 24px;
    margin: 10px;
    background-color: #bbb;
    border-radius: 50%;
    display: inline-block;
  }

  .connection-right {
    position: absolute;
    margin-top: 20px;
    margin-left: 36px;
    height: 4px;
    width: 16px;
    border-radius: 2px;
    display: inline-block;
  }

  .connection-right:hover {
    margin-left: 34px;
    margin-top: 18px;
    border: 2px solid #bbb;
    border-radius: 4px;
  }

  .connection-right.highlighted {
    margin-left: 34px;
    margin-top: 18px;
    border: 2px solid #6ea3f4;
    border-radius: 4px;
  }

  .connection-bottom {
    position: absolute;
    margin-top: 36px;
    margin-left: 20px;
    height: 16px;
    width: 4px;
    border-radius: 2px;
    display: inline-block;
  }

  .connection-bottom:hover {
    margin-top: 34px;
    margin-left: 18px;
    border: 2px solid #bbb;
    border-radius: 4px;
  }

  .connection-bottom.highlighted {
    margin-top: 34px;
    margin-left: 18px;
    border: 2px solid #6ea3f4;
    border-radius: 4px;
  }
</style>

<div>
  <div
    style="display: flex; flex-direction: column; position: absolute; z-index: 1;">
    {#each { length: rows } as _, row}
      <div style="display: flex; flex-direction: row;">
        {#each { length: cols } as _, col}
          {#if $grid[row][col].right !== null}
            <span
              class="connection-right{selected !== null && selected.row === row && selected.col === col && selected.dir === 'r' ? ' highlighted' : ''}"
              on:click={() => {
                selected = { row: row, col: col, dir: 'r' };
              }}
              style="left: {col * 44}px; top: {row * 44}px; background-color: {derivePathColor($grid[row][col].right)}" />
          {/if}
          {#if $grid[row][col].down !== null}
            <span
              class="connection-bottom{selected !== null && selected.row === row && selected.col === col && selected.dir === 'd' ? ' highlighted' : ''}"
              on:click={() => {
                selected = { row: row, col: col, dir: 'd' };
              }}
              style="left: {col * 44}px; top: {row * 44}px; background-color: {derivePathColor($grid[row][col].down)}" />
          {/if}
        {/each}
      </div>
    {/each}
  </div>
  <div style="display: flex; flex-direction: column; position: absolute;">
    {#each { length: rows } as _, row}
      <div style="display: flex; flex-direction: row;">
        {#each { length: cols } as _, col}<span class="cell" />{/each}
      </div>
    {/each}
  </div>
</div>
