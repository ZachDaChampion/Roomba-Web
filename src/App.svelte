<script>
	import Config from "./Config.svelte";
	import Grid from "./Grid.svelte";
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

<main>
	<h1>Roomba Control Panel</h1>
	<div style="display: flex; flex-direction: row">
		<Grid rows="15" cols="15" />
		<div style="margin: auto" />
		<Config />
	</div>
</main>
