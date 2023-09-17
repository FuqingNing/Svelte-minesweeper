<script>
	import Board from './Board.svelte'
</script>

<main>
	<h1>Minesweeper</h1>
	<div class="controls">
		<h2>Controls:</h2>
		<ul>
			<li><b>Left click</b>: uncover</li>
			<li><b>Right click</b>: toggle flag</li>
		</ul>
	</div>
	<p>Click on the board to start the game.</p>
	<p class="rules">Rules: You can flag or uncover a cell of the board once, and you cannot click the cell after you flag it.</p>
	<Board width={20} height={17} />  
	<p class="restart-note">You can only restart the game after finishing a round.</p>
</main>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&display=swap');

	main {
		margin: auto;
		width: fit-content;
		font-family: 'Roboto', sans-serif;
		color: #333;
		padding: 20px;
		background-color: #f7f7f7;
		border-radius: 10px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
	}

	h1 {
		font-family: 'Open Sans', sans-serif;
		font-size: 2em;
		text-align: center;
		color: #2C3E50;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
		margin-bottom: 20px;
	}

	.controls {
		background-color: #EAEDED;
		padding: 10px 20px;
		border-radius: 5px;
		margin-bottom: 20px;
	}

	.controls h2 {
		font-size: 1.2em;
		margin-top: 0;
	}

	.rules {
		background-color: #FFEB3B;
		padding: 10px;
		border-radius: 5px;
		font-style: italic;
	}

	p {
		margin-bottom: 20px;
	}

	.restart-note {
		font-style: italic;
		color: #555;
	}
</style>
