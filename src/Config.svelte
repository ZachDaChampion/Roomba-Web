<script lang="ts">
  import { grid, selected, selectedStrength } from "./ui-state";

  let slider: HTMLInputElement;
</script>

<style>
  #background {
    padding: 32px;
    background-color: #eee;
    border: 4px solid #666;
    border-radius: 12px;
  }

  input[type="range"] {
    width: 75%;
    margin: 0;
    padding: 0;
    border: none;
    background-color: transparent;
    -webkit-appearance: none;
  }
  input[type="range"]:focus {
    outline: none;
  }
  input[type="range"]::-webkit-slider-runnable-track {
    background: #666666;
    border: 0;
    border-radius: 4px;
    width: 100%;
    height: 4px;
    cursor: pointer;
  }
  input[type="range"]::-webkit-slider-thumb {
    margin-top: -4px;
    width: 12px;
    height: 12px;
    background: #bbbbbb;
    border: 2px solid #999999;
    border-radius: 12px;
    cursor: pointer;
    -webkit-appearance: none;
  }
  input[type="range"]::-moz-range-track {
    background: #666666;
    border: 0;
    border-radius: 4px;
    width: 100%;
    height: 4px;
    cursor: pointer;
  }
  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #bbbbbb;
    border: 2px solid #999999;
    border-radius: 12px;
    cursor: pointer;
  }
  input[type="range"]::-ms-track {
    background: transparent;
    border-color: transparent;
    border-width: 5px 0;
    color: transparent;
    width: 100%;
    height: 4px;
    cursor: pointer;
  }
  input[type="range"]::-ms-fill-lower {
    background: #050505;
    border: 0;
    border-radius: 8px;
  }
  input[type="range"]::-ms-fill-upper {
    background: #666666;
    border: 0;
    border-radius: 8px;
  }
  input[type="range"]::-ms-thumb {
    width: 12px;
    height: 12px;
    background: #bbbbbb;
    border: 2px solid #999999;
    border-radius: 12px;
    cursor: pointer;
    margin-top: 0px;
    /*Needed to keep the Edge thumb centred*/
  }
  input[type="range"]:focus::-ms-fill-lower {
    background: #666666;
  }
  input[type="range"]:focus::-ms-fill-upper {
    background: #c7c7c7;
  }
  @supports (-ms-ime-align: auto) {
    /* Pre-Chromium Edge only styles, selector taken from hhttps://stackoverflow.com/a/32202953/7077589 */
    input[type="range"] {
      margin: 0;
      /*Edge starts the margin from the thumb, not the track as other browsers do*/
    }
  }
</style>

<div id="background">
  <!-- do stuff idk -->
  <h2>Control</h2>
  <hr style="margin-bottom: 16px;" />
  <button style="width: 100%">Generate Path</button>
  <button style="width: 100%">Follow Path</button>

  <!-- connection manager -->
  <div
    style="visibility: {$selected === null ? 'hidden' : 'visible'}; margin-top: 64px;">
    <h2>Selected Connection</h2>
    <hr style="margin-bottom: 16px;" />
    <p>Travel cost: {(1 / $selectedStrength).toFixed(2)}</p>
    <p>Ease of travel: {Number($selectedStrength).toFixed(2)}</p>
    <input
      type="range"
      value={$selectedStrength}
      bind:this={slider}
      on:input={() => {
        if ($selected === null) return;
        else if ($selected.dir === 'r') $grid[$selected.row][$selected.col].right = Number(slider.value);
        else if ($selected.dir === 'd') $grid[$selected.row][$selected.col].down = Number(slider.value);
      }}
      min="0"
      max="1"
      step=".01"
      class="slider" />
  </div>
</div>
