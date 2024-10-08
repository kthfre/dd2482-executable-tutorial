const express = require('express');
const http = require('http');
const ws = require('ws');
const io = require('socket.io-client');
const fs = require('node:fs');

const app = express();

app.use(express.static('public'));

const port = 3001;


const server = http.createServer(app).listen(port, () => {
  console.log(`HTTP: listen on port ${port}`)
});

const socketServer = new ws.WebSocketServer({server});

let story = [];
fs.readFile('./story.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    story = [[{img:["smile0.png"],content:"Hello.",criteria:false}], [{img:["smile0.png"],content:"Scratch away!.",criteria:false}], [{img:["smile0.png"], content:"Hello.", criteria:false}]];
    return;
  }
  console.log("read story successfully");
  story = JSON.parse(data);
});

let deployedModel = {model: null, test_acc: 0};
let idSendingModel = null;
let sendingModelParams = null;
let toCreateHash = null;
const sockets = {};
let modelStore = {};
const currentJobs = {};
let modelReverseDictionary = {};
readState();
socketServer.on("connection", socket => {
  console.log("SOCKET: connection")

  socket.on("message", (msg, isBinary) => {
    if (isBinary) {
      console.log("FILE handle model")
      let wsHelper = new ws.WebSocket("ws://localhost:8766");
      wsHelper.on('error', console.error);

      wsHelper.on('open', function open() {
        wsHelper.send(msg);
      });

      wsHelper.on('message', function message(data) {
        const obj = JSON.parse(data);
        
        if (obj.hash) {
            const h = obj.hash;

            if (!currentJobs[idSendingModel]) {
              currentJobs[idSendingModel] = h;
              modelStore[h] = {}; 
            }

            modelStore[currentJobs[idSendingModel]][h] = sendingModelParams;
            modelReverseDictionary[h] = currentJobs[idSendingModel];

            if (sockets.modelStore) {
              sockets.modelStore.send(JSON.stringify({event: "new_modelstore", modelStore}));
            }

            const test_acc = sendingModelParams.test_acc;

            if (test_acc > deployedModel.test_acc && sockets.modelStore) {
              wsHelper = new ws.WebSocket("ws://localhost:8766");
              wsHelper.on('open', function open() {
                wsHelper.send(JSON.stringify({event: "deploy_model", hash: h}));
              });
              wsHelper.on('message', function message(data) {
                const obj = JSON.parse(data);
                deployedModel.model = h;
                deployedModel.test_acc = test_acc;
                if (sockets.modelStore) {
                  sockets.modelStore.send(JSON.stringify({event: "model_deployed", deployedModel}));
                }
                
              });
              wsHelper.on('error', console.error);

              let sockApp = io("http://localhost:5000");
              sockApp.emit("load_model", modelStore[modelReverseDictionary[h]][h]);
            }
            idSendingModel = null;
            sendingModelParams = null;
        }
        
        if (obj.event && obj.event === "deployed") {
          deployedModel.model = obj.deployedModel;
        }
      });

      wsHelper.on("close", (code, buffer) => {
        // ...
      });
    } else {
      let msgObj = JSON.parse(msg);
    
      if (msgObj.event === "register_store") {
        sockets.modelStore = socket;
        socket.send(JSON.stringify({event: "register_store", status: "OK", deployedModel, story}));
        let numNotebooks = Object.keys(sockets).length - 1;

        if (numNotebooks > 0 && sockets.modelStore) {
          for (let key of Object.keys(sockets)) {
            if (key !== "modelStore") {
              const status = sockets[key] ? true : false;
              sockets.modelStore.send(JSON.stringify({event: "new_notebook", id: key, status}));
            }
          }
        }

        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "model_deployed", deployedModel}));
        }

        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "new_modelstore", modelStore}));
        }
      }
  
      if (msgObj.event === "register_exec") {
        let id;

        if (msgObj.id && (Object.keys(sockets).indexOf(msgObj.id) === -1 || msgObj.force)) {
          id = msgObj.id;
        } else {
          id = Math.floor(Math.random() * 100);
  
          while (Object.keys(sockets).indexOf(String(id)) !== -1) {
            id = Math.floor(Math.random() * 100);
          }
        }
        
  
        sockets[id] = socket;
        socket.send(JSON.stringify({status: "OK", id}));
        
        let numNotebooks = Object.keys(sockets).length - 1;
        if (numNotebooks > 0 && sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "new_notebook", id, status: true}));
        }
      }
  
      if (msgObj.event === "register_job") {
        socket.send("OK");
      }
  
      if (msgObj.event === "get_params") {
        const id = msgObj.id;
        sockets[id].send(JSON.stringify({event: "get_params"}))
      }
  
      if (msgObj.event === "send_params") {
        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify(msgObj));
        }
      }
  
      if (msgObj.event === "start_job") {
        const id = msgObj.id;
        sockets[id].send(JSON.stringify({event: "start_job"}));
      }
  
      if (msgObj.event === "ack_start") {
        const id = msgObj.id;
        sockets.modelStore.send(JSON.stringify({event: "ack_start", id}));
      }
  
      if (msgObj.event === "send_trainstatus") {
        const id = msgObj.id;
        sockets.modelStore.send(JSON.stringify({event: "send_trainstatus", id}));
      }

      if (msgObj.event === "job_param_done") {
        const id = msgObj.id;
        const count = msgObj.count;
        idSendingModel = id;

        sendingModelParams = msgObj.param;
        sendingModelParams.test_acc = msgObj.test_accuracy;
        sockets.modelStore.send(JSON.stringify({event: "job_param_done", id, param: msgObj.param}));
      }
  
      if (msgObj.event === "job_done") {
        const id = msgObj.id;
        sockets.modelStore.send(JSON.stringify({event: "job_done", id}));
        setTimeout(() => {
          currentJobs[id] = null;
        }, 5000);
      }

      if (msgObj.event === "remove_notebook") {
        const id = msgObj.id;

        if ((Object.keys(sockets)).indexOf(id) !== -1) {
          delete sockets[id];
        }

        sockets.modelStore.send(JSON.stringify({event: "notebook_removal", id, status: "OK"}));
      }

      if (msgObj.event === "remove_job") {
        const id = msgObj.hash;
        if (modelStore.hasOwnProperty(id)) {
          for (let key of Object.keys(modelStore[id])) {
            if (deployedModel.model === key) {
              let wsHelper = new ws.WebSocket("ws://localhost:8766");
              wsHelper.on('error', console.error);

              wsHelper.on('open', function open() {
                wsHelper.send(JSON.stringify({event: "random_model"}));
              });

              wsHelper.on('message', function message(data) {
                deployedModel.model = null;
                deployedModel.test_acc = 0;
                if (sockets.modelStore) {
                  sockets.modelStore.send(JSON.stringify({event: "model_deployed", deployedModel}));
                }
                
              });
            }
          }
          delete modelStore[id];
        }

        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "new_modelstore", modelStore}));
        }
      }

      if (msgObj.event === "deploy_model") {
        const h = msgObj.hash;
        let wsHelper = new ws.WebSocket("ws://localhost:8766");
        wsHelper.on('error', console.error);

        wsHelper.on('open', function open() {
          wsHelper.send(JSON.stringify({event: "deploy_model", hash: h}));
        });

        wsHelper.on('message', function message(data) {
          const obj = JSON.parse(data);
          const test_acc = modelStore[modelReverseDictionary[obj.hash]][obj.hash].test_acc;
          deployedModel.model = obj.hash;
          deployedModel.test_acc = test_acc;
          if (sockets.modelStore) {
            sockets.modelStore.send(JSON.stringify({event: "model_deployed", deployedModel}));
          }
        });

        let sockApp = io("http://localhost:5000");
        sockApp.emit("load_model", modelStore[modelReverseDictionary[h]][h]);
      }

      if (msgObj.event === "remove_state") {
        removeState();
        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "new_modelstore", modelStore}));
        }
      }

      if (msgObj.event === "update_params") {
        const id = msgObj.id;
        sockets[id].send(JSON.stringify({event: "update_params", params: msgObj.params}));
      }

      if (msgObj.event === "params_updated") {
        const id = msgObj.id;
        if (sockets.modelStore) {
          sockets.modelStore.send(JSON.stringify({event: "params_updated", id, params: msgObj.params}));
        }
      }
    }
  });

  socket.on("close", () => {
    const socketStatus = handleDisconnect(socket);
    
    if (socketStatus && socketStatus.isNotebook && sockets.modelStore) {
      setTimeout(() => {
        currentJobs[socketStatus.key] = null;
      }, 5000);

      sockets.modelStore.send(JSON.stringify({event: "notebook_disconnect", id: socketStatus.key}));
    }
  });
});

setInterval(() => {
  writeState();
}, 10000);

function handleDisconnect(socket) {
  for (let key of Object.keys(sockets)) {
    if (sockets.hasOwnProperty(key)) {
      if (sockets[key] === socket) {
        sockets[key] = null;
        return key === "modelStore" ? {isNotebook: false, key} : {isNotebook: true, key};
      }
    }
  }
}

function readState() {
  fs.readFile('./state.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("read state successfully");
    data = JSON.parse(data);

    modelStore = data.modelStore;
    modelReverseDictionary = data.modelReverseDictionary;
    deployedModel = data.deployedModel;
  });
}

function writeState(reset=false) {
  const content = reset ? JSON.stringify({modelStore: {}, deployedModel: {model: null, test_acc: 0}, modelReverseDictionary: {}}) : JSON.stringify({modelStore, deployedModel, modelReverseDictionary});
  fs.writeFile('./state.json', content, err => {
    if (err) {
      console.error(err);
    } else {
      console.log("state saved successfully");
    }
  });
}

function removeState() {
  modelStore = {};
  deployedModel = {model: null, test_acc: 0};
  modelReverseDictionary = {};
  writeState(reset=true);
}