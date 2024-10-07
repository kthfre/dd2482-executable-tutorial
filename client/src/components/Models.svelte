<script>
    import ModelEntry from "./ModelEntry.svelte";
    import {URI} from "../conf";

    export let models;
    export let deployedModel;
    export let socket;
    let jobsSorted = []; // by max test accuracy of all models in grid search
    let modelsSorted = []; // models by max test accuracy specific to a particular job

    $: if (models) {
        if (Object.keys(models).length) {
            let jobAccuracy = [];
            let modelAccuracy = [];
            let i = 0;
            for (let key of Object.keys(models)) {
                let maxVal = 0;
                modelAccuracy.push([]);
                for (let inKey of Object.keys(models[key])) {
                    const test_acc = models[key][inKey].test_acc;
                    const obj = {model: inKey, test_acc, params: models[key][inKey]};
                    delete obj.params.test_acc;
                    modelAccuracy[i].push(obj);
                    if (test_acc > maxVal) {
                        maxVal = test_acc;
                    }
                }
                jobAccuracy.push({job: key, maxVal});
                i++;
            }

            let index = findOrderedIndices(jobAccuracy, "maxVal")
            sortByKey(jobAccuracy, "maxVal");
            modelAccuracy.forEach(arr => sortByKey(arr, "test_acc"));
            jobsSorted = jobAccuracy;
            modelsSorted = swapByIndex(modelAccuracy, index);
        } 
    }

    function findOrderedIndices(arr, key) {
        let index = [];
        let maxVal = 0;
        let maxIndex;
        for (let i = 0; i < arr.length; i++) {
            maxVal = 0;
            maxIndex = -4;
            for (let j = 0; j < arr.length; j++) {
                if (arr[j][key] > maxVal && index.indexOf(j) === -1) {
                    maxVal = arr[j][key];
                    maxIndex = j;
                } 
            } 
            index.push(maxIndex);
        }

        return index;
    }

    function sortByKey(arr, key) {
        for (let i = 0; i < arr.length; i++) {
            for (let j = i; j > 0 && arr[j - 1][key] < arr[j][key]; j--) {
                let temp = arr[j];
                arr[j] = arr[j - 1]
                arr[j - 1] = temp;
            }
        }
    }

    function swapByIndex(arr, index) {
        let newArray = [];
        for (let i = 0; i < index.length; i++) {
            newArray.push(arr[index[i]]);
        }
        
        return newArray;
    }

    function removeState() {
        socket.send(JSON.stringify({event: "remove_state"}));
    }
</script>

<div class="container">
    <h2>Models</h2>
    {#if jobsSorted.length}
        <div class="models-clear">
            Removes all models from the model store and deployed model state (application model remains).
        </div>
        <div class="models-clear">
            <button class="btn-remove" on:click={() => removeState()}>
                <img src="{URI}/images/wired-outline-1941-trash-disposal-hover-pinch.gif" alt="banan" />
            </button>
        </div>        
    {/if}
    {#if jobsSorted.length}
        {#each jobsSorted as job, i}
            <ModelEntry job={job} models={modelsSorted[i]} bind:deployedModel socket={socket} />
        {/each}
    {/if}
</div>

<style>
    .container {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex: 1;
        flex-direction: column;
    }

    .container h2 {
        border-bottom: rgb(157, 209, 255) 4px solid;
        width: 75%;
        padding-bottom: 0.4rem;
        height:fit-content;
	}

    .models-clear {
        font-variant: small-caps;
        width: 90%;
    }

    .btn-remove {
        margin: 0.75rem 0.1rem;
        height: 5rem;
        width: 10rem;
        padding: 0.25rem;
        background-color: #FFF;
        cursor: pointer;

    }

    .btn-remove:hover {
        border: rgb(157, 209, 255) 4px solid;
    }

    .btn-remove img {
        max-width: 3rem;
        max-height: 3rem;
    }

    h2 {
        font-variant: small-caps;
    }
</style>