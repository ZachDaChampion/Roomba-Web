<script>
	import Config from "./Config.svelte";
	import Endpoint from "./Endpoint.svelte";
	import Grid from "./Grid.svelte";
	import { draggingStart, draggingGoal } from "./ui-state";
</script>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<main
	on:mouseup={() => {
		$draggingStart = false;
		$draggingGoal = false;
	}}>
	<h1>Roomba Control Panel</h1>
	<div style="display: flex; flex-direction: row; position: relative;">
		<Grid rows="15" cols="15" />
		<Endpoint
			color="#0f0"
			draggingvar={draggingStart}
			x="0"
			y="0"
			gridW="15"
			gridH="15" />
		<Endpoint
			color="#f00"
			draggingvar={draggingGoal}
			x="14"
			y="14"
			gridW="15"
			gridH="15" />
		<div style="margin: auto" />
		<Config />
	</div>
</main>
