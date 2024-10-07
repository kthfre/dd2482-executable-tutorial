<script>
export let job;
export let models;
export let deployedModel;
export let socket;
let exposeModels = false;
let exposeDetails = false;
let modelInJob = false;

$: if (models && deployedModel && deployedModel.model) {
    modelInJob = false;
    
    for (let i = 0; i < models.length; i++) {
        if (models[i].model === deployedModel.model) {
            modelInJob = true;
            break;
        }
    }
}

function toggle() {
    exposeModels = !exposeModels;
}

function showDetails(i) {
    if (i === exposeDetails) {
        exposeDetails = null;
    } else {
        exposeDetails = i;
    } 
}

function deployModel(h) {
    if (deployedModel.model === h) {
        return;
    }

    socket.send(JSON.stringify({event: "deploy_model", hash: h}));
}

function removeJob(h) {
    socket.send(JSON.stringify({event: "remove_job", hash: h}));
}

</script>

<div class="container">
    <button class={modelInJob ? "btn-job deployed" : "btn-job"} on:click={toggle}><span class="normal">{job.job}</span> | <span class="bold">{(job.maxVal * 100).toFixed(2)}%</span></button>
    {#if exposeModels}
        {#each models as model, i}
            <div class="container-inner">
                <button class={model.model === deployedModel.model ? "btn-model deployed" : "btn-model"} on:click={() => showDetails(i)}><span class="normal">{model.model}</span> | <span class="bold">{(model.test_acc * 100).toFixed(2)}%</span></button>
                {#if (exposeDetails || exposeDetails === 0) && exposeDetails === i}
                    <div class="details">
                        <div class="param">Learning rate: {model.params.LEARNING_RATE}</div>
                        <div class="param">Kernel size: {model.params.KERNEL_SIZE} x {model.params.KERNEL_SIZE}</div>
                        <div class="param">Number of filters: {model.params.NUM_FILTERS}</div>
                        <div class="param">Dense width: {model.params.DENSE_WIDTH}</div>
                        <button class="btn-deploy" on:click={() => deployModel(model.model)}><span class="bold">Deploy</span></button>
                    </div>
                {/if}
                
            </div>
        {/each}
        {#if false}<button class="btn-deploy" on:click={() => removeJob(job.job)}><span class="bold">Remove job</span></button>{/if}
    {/if}
</div>

<style>
    .container {
        display: flex;
        width: 75%;
        flex-direction: column;
        justify-content: center;
        align-content: center;
        align-items: center;
        padding: 0.5rem 0;
    }

    .container-inner {
        display:flex;
        flex-direction: column;
        align-content: center;
        align-items: center;
        width: 90%;
    }

    .details {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.5rem;
        width: 90%;
        background-color: antiquewhite;
        padding: 0.25rem 0;
    }

    .param {
        font-variant: small-caps;
    }

    .btn-job {
        background-color: burlywood;
    }

    .btn-model {
        background-color: bisque;
    }

    .btn-deploy {
        margin-top: 0.25rem;
        background-color:bisque;
        width: 10rem;
        align-self: center;
        cursor: pointer;
        font-variant: small-caps;
    }

    .btn-deploy:hover {
        background-color: burlywood;
    }

    .deployed {
        background-color: lightgreen!important;
    }

    .btn-job, .btn-model {
        border: none;
        cursor: pointer;
        font-variant: small-caps;
        width: 90%;
        font-size: 14px;
    }

    span.normal {
        font-variant: normal;
    }

    span.bold {
        font-weight: 600;
    }
</style>