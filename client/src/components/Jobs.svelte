<script>
  import { run } from "svelte/internal";
  import Dropzone from "svelte-file-dropzone";
  import {URI} from "../conf";

    export let newJob;
    export let jobStarted;
    export let socket;
    let runningJobs = [];

    $: if (jobStarted) {
        setTimeout(() => {
            jobStarted = null;
        }, 3000);

        if (newJob && jobStarted.type === "start" && jobStarted.id === newJob.id) {
            let found = false;
            for (let i = 0; i < runningJobs.length; i++) {
                if (runningJobs[i].id === data.id) {
                    found = true;
                    if (i === 0) {
                        runningJobs = runningJobs.slice(1).concat([{id: data.id, status: data.status}]);
                    } else if (i === runningJobs.length - 1) {
                        runningJobs = runningJobs.slice(0, runningJobs.length - 1).concat([{id: data.id, status: data.status}]);
                    } else {
                        runningJobs = runningJobs.slice(0, i).concat(runningJobs.slice(i + 1)).concat([{id: data.id, status: data.status}]);
                    }
                    break;
                }
            }
            runningJobs = [...runningJobs].concat([{id: newJob.id, params: newJob.params}]);
            newJob = null;
        }

        if (jobStarted.type === "done") {
            const id = jobStarted.id;
            for (let i = 0; i < runningJobs.length; i++) {
                if (runningJobs[i].id === id) {
                    if (i === 0) {
                        runningJobs = runningJobs.slice(1);
                    } else if (i === runningJobs.length - 1) {
                        runningJobs = runningJobs.slice(0, runningJobs.length - 1);
                    } else {
                        runningJobs = runningJobs.slice(0, i).concat(runningJobs.slice(i + 1));
                    }
                }
            }
        }
    }

    function enqueueJob(id) {

    }

    function startJob(id) {
        socket.send(JSON.stringify({event: "start_job", id}));
    }

    function removeNotebook(id) {
        socket.send(JSON.stringify({event: "remove_notebook", id}));
    }

    let files = {
    accepted: [],
    rejected: []
    };

    async function handleFilesSelect(e) {
        const { acceptedFiles, fileRejections } = e.detail;
        files.accepted = [...files.accepted, ...acceptedFiles];
        files.rejected = [...files.rejected, ...fileRejections];
        const fileType = e.detail.acceptedFiles[0].type;

        if (fileType === "application/json") {
            const buffer = await e.detail.acceptedFiles[0].arrayBuffer();
            const enc = new TextDecoder("utf-8");
            socket.send(JSON.stringify({event: "update_params", id: newJob.id, params: JSON.parse(enc.decode(buffer))}));
        }
    }
</script>

<div class="container">
    <h2>Jobs</h2>    
    {#if newJob}
        {#if newJob.removal}
            <h3>Remove notebook</h3>
            <div class="job-summary">
                <div class="job-details">
                    notebook: {newJob.id}
                </div>
                <div class="job-details">
                    <button class="btn-run" on:click={() => removeNotebook(newJob.id)}>
                        <img src="{URI}/images/wired-outline-1941-trash-disposal-hover-pinch.gif" alt="banan" />
                    </button>
                </div>
            </div>
        {:else}
            <h3>Job details</h3>
            <div class="job-summary">
                <Dropzone containerStyles="background-color: bisque; width: 20rem; margin-bottom: 0.5rem; color: #000; font-variant: small-caps;" on:drop={handleFilesSelect}>
                    <p>Drop hyperparameter .json here to reconfigure.</p>
                </Dropzone>
                <div class="job-details">
                    notebook: {newJob.id}
                </div>
                <div class="job-details">
                    epochs: {newJob.params.EPOCHS}
                </div>
                <div class="job-details">
                    batch size: {newJob.params.BATCH_SIZE}
                </div>
                <div class="job-details">
                    optimizer: {newJob.params.OPTIMIZER}
                </div>
                <div class="job-details">
                    loss function: {newJob.params.LOSS_FN}
                </div>
                <div class="job-details">
                    learning rate: {newJob.params.LEARNING_RATE}
                </div>
                <div class="job-details">
                    kernel size: {newJob.params.KERNEL_SIZE}
                </div>
                <div class="job-details">
                    number of filters: {newJob.params.NUM_FILTERS}
                </div>
                <div class="job-details">
                    dense width: {newJob.params.DENSE_WIDTH} nodes
                </div>
                <div class="job-details">
                    total runs: {newJob.params.LEARNING_RATE.length * newJob.params.KERNEL_SIZE.length * newJob.params.NUM_FILTERS.length * newJob.params.DENSE_WIDTH.length}
                </div>
                <div class="job-details">
                    <button class="btn-run" on:click={() => startJob(newJob.id)}>
                        <img src="{URI}/images/wired-outline-503-run-hover-running.gif" alt="banan" />
                    </button>
                </div>
            </div>
        {/if}
    {/if}

    {#if runningJobs.length}
        <div class="job-container">
        {#each runningJobs as job}
            <div class="job">
                notebook: {job.id}
            </div>
        {/each}
        </div>
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

    .dropzone {
        background-color: bisque;
        width: 5rem;
    }

    .job-summary {
        display: flex;
        flex-direction: column;
    }

    .job-details {
        display: flex;
        font-variant: small-caps;
        justify-content: center;
    }

    .job-notification {
        font-variant: small-caps;
        padding: 2rem;
    }

    .job-notification.start, .job {
        background-color: darkseagreen;
    }

    .job-notification.stop {
        background-color: darksalmon;
    }

    .job-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 25rem;
    }

    .job {
        padding: 0.75rem;
        margin: 0.1rem 0;
        font-variant: small-caps;
    }
    
    .btn-run {
        margin: 0.75rem 0.1rem;
        height: 5rem;
        width: 10rem;
        padding: 0.25rem;
        background-color: #FFF;
        cursor: pointer;

    }

    .btn-run:hover {
        border: rgb(157, 209, 255) 4px solid;
    }

    .btn-run img {
        max-width: 3rem;
        max-height: 3rem;
    }

    h2 {
        font-variant: small-caps;
    }
</style>