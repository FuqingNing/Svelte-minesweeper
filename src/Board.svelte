<script>
    import cssVars from 'svelte-css-vars'
    import Cell from './Cell.svelte'
    import { newBoard, checkStatus, stepInto, toggleFlag } from './lib/game'

    export let width = 15
    export let height = 12
    export let bombsCount = Math.floor(width * height * 0.05)
    let styleVars = { width, height }
    let status = 'running'
    let cells = newBoard(width, height, bombsCount)
    let showModal = false;

    
    $: styleVars = { ...styleVars, color: getBoardColor(status) }
    $: status = checkStatus(cells)
    $: if (status === 'win') showModal = true;


    function getBoardColor(status) {
        if (status === 'lost') return 'red'
        if (status === 'win') return '#06799F'
        return '#FFFFFF'
    }

    function handleRestart() {
        status = 'running'
        cells = newBoard(width, height, bombsCount)
    }
    
    function handleCellClick(event) {
        cells = stepInto(event.detail.id, { width, height, bombsCount, cells })
    }

    function handleToggleFlag(event) {
        cells = toggleFlag(event.detail.id, { width, height, bombsCount, cells })
    }

    const doNothing = () => {}
</script>

<div 
    class="board" 
    use:cssVars={styleVars} 
    on:contextmenu={e => e.preventDefault()}
>
    {#each cells as cell (cell.id)}
        <Cell
            {...cell}
            on:stepInto={status === 'running' ? handleCellClick : doNothing}
            on:toggleFlag={status === 'running' ? handleToggleFlag : doNothing}
        />
    {/each}
</div>
<div style="text-align: center;">    
    <button 
        on:click={ handleRestart } 
        disabled={ status === 'running' }
        class="restart-button"
    >
        Restart
    </button>
    <p>you can only restart the game after finishing a round</p>
</div>
{#if showModal}
<div class="modal">
    <div class="modal-content">
        <h2>Congratulations!</h2>
        <p>You have won the game!</p>
        <button on:click={() => showModal = false}>Close</button>
    </div>
</div>
{/if}


<style>
    .board {
        margin: 1em 0;
        display: grid;
        grid-template-columns: repeat(var(--width), 1.5em);
        grid-template-rows: repeat(var(--height), 1.5em);
        background-color: var(--color);
        width: min-content;
        
        border-radius: 1em;
        padding: 0.5em;
        transition: background-color 0.3s ease;
    }

    .restart-button {
        background-color: #FF2E63; 
        border: 2px solid #FFC0CB; 
        color: #FFFFFF; 
        padding: 10px 20px;
        font-family: 'Arial', sans-serif; 
        font-size: 1.1em;
        text-transform: uppercase; 
        letter-spacing: 2px; 
        box-shadow: 0 0 10px #FF2E63, 0 0 20px #FF2E63, 0 0 30px #FF2E63; /* 霓虹灯发光效果 */
        transition: all 0.3s ease;
        cursor: pointer;
        outline: none;
    }

    .restart-button:hover {
        background-color: #FF6088; 
        box-shadow: 0 0 15px #FF6088, 0 0 25px #FF6088, 0 0 35px #FF6088; /* 增强的霓虹灯发光效果 */
    }

    .restart-button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
    }
    .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
    text-align: center;
}

.modal-content button {
    margin-top: 20px;
    padding: 10px 20px;
    border: none;
    background-color: #06799F;
    color: #fff;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.modal-content button:hover {
    background-color: #055a7a;
}

</style>
