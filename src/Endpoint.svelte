<script lang="ts">
  import { onMount } from "svelte";

  export let color: string;
  export let x: number;
  export let y: number;
  export let gridW: number;
  export let gridH: number;

  let cell: HTMLSpanElement;
  let origOffset: Point;
  let offset: Point = { x: 0, y: 0 };
  let pos: Point = { x: x * 44, y: y * 44 };
  let dragging = false;

  function clamp(num: number, min: number, max: number) {
    return num < min ? min : num > max ? max : num;
  }

  onMount(() => {
    let rect = cell.getBoundingClientRect();
    origOffset = {
      x: rect.left + window.pageXOffset - pos.x,
      y: rect.top + window.pageYOffset - pos.y,
    };
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  document.addEventListener("mousemove", (event) => {
    if (dragging) {
      event.preventDefault();
      pos = {
        x: clamp(
          Math.round(
            (event.clientX - offset.x - origOffset.x + window.pageXOffset) / 44
          ) * 44,
          0,
          (gridW - 1) * 44
        ),
        y: clamp(
          Math.round(
            (event.clientY - offset.y - origOffset.y + window.pageYOffset) / 44
          ) * 44,
          0,
          (gridH - 1) * 44
        ),
      };
    }
  });
</script>

<span
  class="cell"
  bind:this={cell}
  on:mousedown={(event) => {
    event.preventDefault();
    let rect = cell.getBoundingClientRect();
    offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    dragging = true;
  }}
  style="background-color: {color}; left: {pos.x}px; top: {pos.y}px;"
/>

<style>
  .cell {
    position: absolute;
    height: 32px;
    width: 32px;
    margin: 6px;
    border-radius: 50%;
    z-index: 10;
    cursor: pointer;
    transition-timing-function: cubic-bezier(0.64, 0.57, 0.67, 1.53);
    transition-duration: 0.1s;
  }
</style>
