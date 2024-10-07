<script>
  	import { onMount } from "svelte";
	import Notebooks from "./components/Notebooks.svelte";
	import Jobs from "./components/Jobs.svelte";
	import Header from "./components/Header.svelte";
  	import Models from "./components/Models.svelte";
	import {URI, WS_URI} from "./conf";
	export let name;

	let applicationState = 1;
	let applicationSubState = 0;
	let applicationSubSubState = 0;
	let notebooks = [];
	let isRegistered = false;
	let webSocket;
	let jobs = [];
	let newJob = null;
	let jobStarted = null;
	let deployedModel = null;
	let models = {};

	onMount(() => {
		let socket = new WebSocket(WS_URI);
		webSocket = socket;
		socket.onopen =  ev => {
			socket.send(JSON.stringify({event: "register_store"}));
		};

		socket.onmessage = ev => {
			const data = JSON.parse(ev.data);
			
			if (data && data.event && data.event === "register_store") {
				if (data.status === "OK") {
					isRegistered = true;
					deployedModel = data.deployedModel;
					contentSeq = data.story;
					preLoad(contentSeq)
				}
			}

			if (data && data.event && data.event === "new_notebook") {
				let found = false;
				for (let i = 0; i < notebooks.length; i++) {
					if (notebooks[i].id === data.id) {
						found = true;
						if (i === 0) {
							notebooks = notebooks.slice(1).concat([{id: data.id, status: data.status}]);
						} else if (i === notebooks.length - 1) {
							notebooks = notebooks.slice(0, notebooks.length - 1).concat([{id: data.id, status: data.status}]);
						} else {
							notebooks = notebooks.slice(0, i).concat(notebooks.slice(i + 1)).concat([{id: data.id, status: data.status}]);
						}
						break;
					}
				}

				if (!found) {
					notebooks = [...notebooks].concat([{id: data.id, status: data.status}]);
				}
			}

			if (data && data.event && data.event === "send_params") {
				newJob = {id: data.id, params: data.params};
			}

			if (data && data.event && data.event === "ack_start") {
				jobStarted = {id: data.id, type: "start"};
			}

			if (data && data.event && data.event === "notebook_disconnect") {
				const id = data.id;
				const index = findNotebookIndex(id);
				notebooks[index].status = false;
			}

			if (data && data.event && data.event === "notebook_removal" && data.status && data.status === "OK") {
				const id = data.id;
				const index = findNotebookIndex(id);
				
				if (index === 0) {
					notebooks = notebooks.slice(1);
				} else if (index === notebooks.length - 1) {
					notebooks = notebooks.slice(0, notebooks.length - 1);
				} else {
					notebooks = notebooks.slice(0, index).concat(notebooks.slice(index + 1))
				}

				newJob = null;
			}

			if (data && data.event && data.event === "job_param_done") {
				console.log("job param done")
				console.log(data)
			}

			if (data && data.event && data.event === "job_done") {
				jobStarted = {id: data.id, type: "done"};
			}

			if (data && data.event && data.event === "model_deployed") {
				if (data.deployedModel.model) {
					deployedModel = data.deployedModel;
				}
			}

			if (data && data.event && data.event === "new_modelstore") {
				if (Object.keys(data.modelStore).length) {
					models = data.modelStore;
				} else {
					models = {};
				}
			}
		};

		socket.onclose = ev => {
			let count = 0;
			let retryAttempts = 5;
			isRegistered = false;
			function reconnect() {
				setTimeout(() => {
					try {
						count++;
						socket = new WebSocket(WS_URI);
					} catch (e) {
						if (count < retryAttempts) {
						reconnect();
					}
					}
				}, 5000);
			}
			
			// reconnect();
		}
	});

	function findNotebookIndex(id) {
		for (let i = 0; i < notebooks.length; i++) {
			if (notebooks[i].id === id) {
				return i;
			}
		}
	}

	var contentSeq = [];
	let seqImg = null;
	let seqCont = null;
	let seqCrit = false;
	let seqImgClass = "box-img";
	let seqContClass = "box-content";
	let logo = "";

	function setSeq(seq) {
		if (!seq.img.length) {
			seqImg = null;
		} else if (seq.img.length === 1) {
			seqImgClass = seq.content === "" ? "box-img no-border" : "box-img";
			seqImg = seq.img[0];
		} else {
			seqImgClass = seq.content === "" ? "box-img hidden no-border" : "box-img hidden";
			seqImg = seq.img[0];
			setTimeout(() => {
				seqImgClass = seq.content === "" ? "box-img no-border" : "box-img";
			}, seq.d1);
			setTimeout(() => {
				seqImg = seq.img[1];
				seqImgClass = seq.content === "" ? "box-img hidden no-border" : "box-img hidden";
			}, seq.d1 + seq.d2);
		}
		if (seq.content === "") {
			seqCont = null;
		} else {
			if (seq.criteria) {
				seqContClass = "box-content hidden";
				seqCont = seq.content;
				setTimeout(() => {
					seqContClass = "box-content";
				}, seq.d1);
			} else {
				seqCont = seq.content;
			}
		}
		seqCrit = seq.criteria;
	}

	function playSeq(i) {
		if (i < contentSeq[applicationSubSubState].length) {
			const seq = contentSeq[applicationSubSubState][i];
			let delay = seq.delay ? seq.delay : 2500;
			if (seq.d1) {
				delay += seq.d1;
			}
			if (seq.d2) {
				delay += seq.d2;
			}

			setSeq(seq);
			setTimeout(() => {
				playSeq(i + 1);
			}, delay);
		} else {
			applicationState = 1;

			if (applicationSubSubState === 2) {
				logo = "wired-outline-2533-agile-hover-pinch.gif";
			}
			
			setTimeout(() => {
				applicationSubState = 1;
				applicationSubSubState++;
			}, 1000);
		}
	}

	function preLoad(seq) {
		let arr = [];
		let imgArr = [];

		for (let i = 0; i < seq.length; i++) {
			for (let j = 0; j < seq[i].length; j++) {
				for (let k = 0; k < seq[i][j].img.length; k++) {
					if (arr.indexOf(seq[i][j]["img"][k])) {
						arr.push(seq[i][j]["img"][k]);
					}
				}
			}
		}
		for (let i = 0; i < arr.length; i++) {
			let img = new Image();
			img.src = URI + "/images/" + arr[i];
			imgArr.push(img);
		}
		setTimeout(() => {
			imgArr = null;
		}, 5000);
	}

	$: if (applicationState === 0) {
		playSeq(0);
	}
</script>

<main>
	{#if applicationState}
	<Header isRegistered={isRegistered} bind:applicationState bind:applicationSubState applicationSubSubState={applicationSubSubState} placeholder={logo} deployedModel={deployedModel} />
	<div class="container">
		<div class="col">
			<Notebooks bind:notebooks socket={webSocket} bind:newJob />
			<Jobs newJob={newJob} jobStarted={jobStarted} socket={webSocket} />
		</div>
		<div class="col">
			<Models models={models} bind:deployedModel socket={webSocket} />
		</div>
	</div>
	{:else}
		<div class="container-seq">
			<div class="box">
				{#if seqImg}
				<div class={seqImgClass}>
					<img src="{URI}/images/{seqImg}" alt="banan" />
				</div>
				{/if}
				{#if seqCont}
				<div class={seqContClass}>
				 	{#if seqCrit}<span class="brackets">{"{ "} </span>{/if}<span class="content">{seqCont}</span>{#if seqCrit}<span class="brackets"> {" }"}</span>{/if}
				</div>
				{/if}
			</div>
		</div>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	.container {
		display: flex;
		justify-content: flex-start;
		flex: 1;
	}

	.col {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		flex: 1;
	}

	.container-seq {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		height: 95vh;
	}

	.box {
		display: flex;
		border: rgb(157, 209, 255) 2px solid;
		width: 40rem;
		height: 10rem;
		padding: 4rem;
	}

	.box-img {
		display: flex;
		flex: 1 1 33%;
		justify-content: center;
		align-content: center;
		align-self: center;
		border-right: rgb(157, 209, 255) 1px solid;
		padding-right: 2rem;
	}

	.box-img.no-border {
		border: none;
	}

	.box-img img {
		height: 100px;
		width: 100px;
	}

	.box-content.hidden img {
		visibility: hidden;
	}

	.box-content {
		display: flex;
		justify-content: center;
		align-content: center;
		align-self: center;
		flex: 1 1 67%;
		font-variant: small-caps;
		font-size: 24px;
		text-align: center;
		vertical-align: middle;
	}

	.box-content.hidden span.content {
		visibility: hidden;
	}

	.box-content span.brackets {
		font-size: 24px;
		padding: 0 2rem;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>