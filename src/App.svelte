<script>
	import Board from './Board.svelte'
</script>

<main>
	<h1>Minesweeper</h1>
	Controls:
	<ul>
		<li><b>Left click</b>: uncover</li>
		<li><b>Right click</b>: toggle flag</li>
	</ul>
	<p>Click on the board to start the game.</p>
	<p>rules:you can flag or uncover a cell of the board once,and you can not click the cell after you flag it.</p>
	<Board width={20} height={17} />  
	
</main>

<style>
	main {
		margin: auto;
		width: fit-content;
		font-family: Arial, Helvetica, sans-serif;
	}
</style>