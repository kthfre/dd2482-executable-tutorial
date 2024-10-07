<script>
    export let notebooks;
    export let newJob;
    export let socket;

    function getParams(id, status) {
        if (status) {
            socket.send(JSON.stringify({event: "get_params", id}));
        } else {
            newJob = {id, removal: true};
        }
        
    }
</script>

<div class="container">
    <h2>Notebooks - {notebooks.length}</h2>
    {#if notebooks.length}
        {#each notebooks as notebook}
            <div class="notebook">
                <button class={notebook.status ? "btn-notebook online" : "btn-notebook offline"} on:click={() => getParams(notebook.id, notebook.status)}>notebook: {notebook.id}</button>
            </div>
        {/each}
    {/if}
</div>

<style>
    .container {
        display: flex;
        justify-content: flex-start;
        flex: 1;
        flex-direction: column;
        align-items: center;
    }

    .container h2 {
        border-bottom: rgb(157, 209, 255) 4px solid;
        width: 75%;
        padding-bottom: 0.4rem;
	}

    .notebook {
        display: flex;
        justify-content: center;
        align-items: center;
        align-content: center;
        align-self: center;
        width: 25rem;
        margin: 0.1rem;
    }

    .btn-notebook {
        cursor: pointer;
        font-variant: small-caps;
        padding: 0.5rem;
        background-color: #FFF;
        border: #000 1px solid;
        border: none;
        width: 100%;
        height: 100%;
    }

    .btn-notebook.online {
        background-color: lightgreen;
    }

    .btn-notebook.offline {
        background-color: lightsalmon;
    }

    .btn-notebook:hover {
        background-color:aliceblue;
    }

    h2 {
        font-variant: small-caps;
    }
</style>