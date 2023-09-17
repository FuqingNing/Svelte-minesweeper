<script>
    import { createEventDispatcher } from 'svelte'

    export let id
    export let isHidden = true
    export let isBomb = false
    export let hasFlag = false
    export let bombsNearby = 0

    const dispatch = createEventDispatcher()
    
    function step() {
        if (!hasFlag) {
            dispatch('stepInto', { id })
        }
    }
    
    function flag(event) {
        event.preventDefault()
        if (isHidden) {
            dispatch('toggleFlag', { id })
        }
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div 
    class="cell"
    class:hidden={isHidden}
    on:click={step}
    on:contextmenu={flag}
>
    {#if isBomb && !isHidden}
        💥
    {:else if hasFlag}
        🚩
    {:else if !isHidden && bombsNearby > 0}
        {bombsNearby}
    {/if}
</div>

<style>
    :root {
        --cell-bg-color: rgba(120, 118, 122, 0.267);
        --cell-color: #333333;
        --hidden-bg-color: #024E68;
        --hidden-color: #DDDDDD;
    }

    .cell {
        background-color: var(--cell-bg-color);
        color: var(--cell-color);
        margin: 0.5px;
        display: flex;
        text-align: center;
        justify-content: center;
        align-content: center;
        flex-direction: column;
        user-select: none;
    }

    .cell.hidden {
        background-color: var(--hidden-bg-color);
        color: var(--hidden-color);
    }
</style>
