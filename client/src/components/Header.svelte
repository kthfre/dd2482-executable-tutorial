<script>
    import {URI} from "../conf";

    export let isRegistered;
    export let applicationState;
    export let applicationSubState;
    export let applicationSubSubState;
    export let placeholder;
    export let deployedModel;
    let state = 0;
    let placeholderState = 0;
    let block = false;
    let content = ["Don't click me, please.", "All dizzy now. Behave!", "Lay off! I dare you to go on."];

    $: if (placeholder) {
        content[0] = "So long.";

        setTimeout(() => {
            content[0] = "Sayonara.";
        }, 2000);
        setTimeout(() => {
            content[0] = "Tjingeling.";
        }, 4000);
        setTimeout(() => {
            placeholderState = 1;
        }, 6000);
    }

    function handleClick(ev) {
        if (!block) {
            if (applicationSubState && applicationSubSubState) {
                if (applicationSubSubState === 1) {
                    if ((ev.x > 57 && ev.x < 70) && (ev.y > 76 && ev.y < 89)) {
                        block = true;
                        content[0] = "That's my right eye, you dummy!.";
                        setTimeout(() => {
                            content[0] = "Don't click me, please.";
                            block = false;
                        }, 3000);
                        return;
                    }

                    if ((ev.x > 95 && ev.x < 108) && (ev.y > 76 && ev.y < 89)) {
                        applicationSubState = 0;
                        handleClick(ev);
                        return;
                    }

                    block = true;
                    content[0] = "Fool you once, shame on me. Fool you twice, shame on you.";
                    setTimeout(() => {
                        content[0] = "PS. get the fly out of my left eye, and I'll make you scratch your head.";
                    }, 3000);
                    setTimeout(() => {
                        content[0] = "Don't click me, please.";
                        block = false;
                    }, 6000);
                }
                
                if (applicationSubSubState === 2) {
                    if ((ev.x > 62 && ev.x < 102) && (ev.y > 50 && ev.y < 66)) {
                        applicationSubState = 0;
                        handleClick(ev);
                        return;
                    }

                    block = true;
                    content[0] = "Fool you once, shame on me. Fool you thrice, shame on us both.";
                    setTimeout(() => {
                        content[0] = "Scratch my forehead, will ya?";
                    }, 3000);
                    setTimeout(() => {
                        content[0] = "Don't click me, please.";
                        block = false;
                    }, 6000);
                }  
            } else {
                if (state < 2) {
                    state++;
                } else {
                    applicationState = 0;
                }
            }
        }
    }
</script>
<div class="container">
    <div class="container-inner-start">
        {#if placeholderState === 0}
            <button on:click={handleClick}><img src="{URI}/images/smile{state}.png" alt="banan" /></button>
            <div class="bubble left mini grow sc margin">{content[state]}</div>
        {:else}
            <img src="{URI}/images/{placeholder}" alt="banan" />
        {/if}
    </div>
    <div class="container-inner">
        <h1>yo-peter-notebooks</h1>
        <h3>{isRegistered ? "connected" : "disconnected"} | Deployed - {#if deployedModel && deployedModel.model}<button>{deployedModel.model}</button>{:else}none{/if}</h3>
    </div>
    <div class="container-inner-end">
        <div class="attribution">Attribution, some icons are: “Animated icons by Lordicon.com”</div>
        {#if applicationSubSubState}
            <div class="count">
                <span>{"[ " + applicationSubSubState + " ]"}</span>
                <img class="e-count" src="{URI}/images/wired-outline-596-eggs-hover-pinch.gif" alt="banan" />
            </div>
        {/if}
    </div>
</div>

<style>
    button {
        background-color: #FFF;
        border-color: rgb(157, 209, 255);
        cursor: pointer;
    }

    button:hover {
        border-color: rgb(54, 161, 255);
    }

    img {
        width: 100px;
        height: 100px;
    }

    h1 {
        margin: 1rem;
    }

    h3 {
        margin: 0;
    }

    .container {
        display: flex;
    }

    button {
        margin-bottom: 0;
        font-size: 12px;
    }

    .container-inner-start {
        display: flex;
        justify-content: flex-start;
        flex: 1 1 30%;
    }

    .container-inner {
        display: flex;
        flex-direction: column;
        justify-content: center;
        flex: 1 1 40%;
    }

    .container-inner-end {
        display: flex;
        justify-content: flex-end;
        flex: 1 1 30%;
        flex-direction: column;
        justify-content: space-between;
    }

    .attribution {
        font-size: 10px;
    }

    .count {
        display: flex;
        justify-content: center;
        align-content: center;
        align-items: center;
    }

    .count span {
        padding: 0 1rem;
        font-variant: small-caps;
        font-size: 24px;
    }

    h1 {
        font-variant: small-caps;
    }

    .bubble.sc {
        font-variant: small-caps;
    }

    .bubble.margin {
        margin-left: 2rem;
    }

.bubble {
  position: relative;
  display: inline-block;
  margin: 20px;
  text-align: center;
  font-family: "Press Start 2P", cursive;
  font-size: 16px;
  line-height: 1.3em;
  background-color: #fff;
  color: #000;
  padding: 12px;
  box-shadow: 0 -4px #fff, 0 -8px #000, 4px 0 #fff, 4px -4px #000, 8px 0 #000, 0 4px #fff, 0 8px #000, -4px 0 #fff, -4px 4px #000, -8px 0 #000, -4px -4px #000, 4px 4px #000;
  box-sizing: border-box;
  width: 200px;
}
.bubble::after {
  content: "";
  display: block;
  position: absolute;
  box-sizing: border-box;
}
.bubble.shadow {
  box-shadow: 0 -4px #fff, 0 -8px #000, 4px 0 #fff, 4px -4px #000, 8px 0 #000, 0 4px #fff, 0 8px #000, -4px 0 #fff, -4px 4px #000, -8px 0 #000, -4px -4px #000, 4px 4px #000, 4px 12px rgba(0, 0, 0, 0.1), 12px 4px rgba(0, 0, 0, 0.1), 8px 8px rgba(0, 0, 0, 0.1);
}
.bubble.mini {
  width: 110px;
  font-size: 16px;
  padding: 4px;
  font-family: monospace;
}
.bubble.medium {
  width: 350px;
}
.bubble.large {
  width: 560px;
  font-size: 24px;
  text-align: left;
  text-transform: uppercase;
}
.bubble.grow {
  width: initial;
}

.bubble.left::after {
  height: 4px;
  width: 4px;
  top: 20px;
  left: -8px;
  background: white;
  box-shadow: -4px -4px #fff, -4px 0 #fff, -8px 0 #fff, 0 -8px #fff, -4px 4px #000, -8px 4px #000, -12px 4px #000, -16px 4px #000, -12px 0 #000, -8px -4px #000, -4px -8px #000, 0 -4px #fff;
}

.e-count {
    height: 75px;
    width: 75px;
}
</style>