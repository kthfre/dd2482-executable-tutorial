import logo from './logo.svg';
import './App.css';
import { socket } from "./socket";
import {useDropzone} from 'react-dropzone';
import React, { useState, useEffect, useCallback } from "react";

function App() {
  const [disallowedFile, setDisallowedFile] = useState(false);
  const [label, setLabel] = useState(null);
  const labels = ['A sloping plane.', 'cartoon.', 'Nice birdie.', 'cat /etc/passwd.', 'Oh deer.', 'So dogmatic.', 'All froggy.', 'horseshit.', 'ship it.', 'truck me.'];

const [isConnected, setIsConnected] = useState(socket.connected);
const [h, setH] = useState(null);

useEffect(() => {
  function onConnect() {
    setIsConnected(true);
  }

  function onDisconnect() {
    setIsConnected(false);
  }

  function onDeployEvent(h) {
    setH(h);
  }

  function onPredictionEvent(prediction) {
    showPrediction(prediction);
  }

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('new_model', onDeployEvent);
  socket.on("prediction", onPredictionEvent);

  return () => {
    socket.off('connect', onConnect);
    socket.off('disconnect', onDisconnect);
    socket.off('foo', onDeployEvent);
  };
}, []);

  const onDrop = useCallback(async file => {
    if (file.length) {
      const fileType = file[0].type.split("/");

      if (fileType[0] === "image" && (fileType[1] === "png" || fileType[1] === "jpg" || fileType[1] === "jpeg")) {
        const buffer = await file[0].arrayBuffer();
        socket.emit("image", buffer);       
      } else {
        setDisallowedFile(true);
        setTimeout(() => {
          setDisallowedFile(false);
        }, 3000);
      }
    }
  }, []);
  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  function showPrediction(prediction) {
    setLabel(labels[prediction]); // Math.floor(Math.random() * 10)
    setTimeout(() => {
      setLabel(null);
    }, 5000);
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {h && <h6>{"[ " + h + " ]"}</h6>}
        <h1>Execute me.</h1>
      </header>
      <main className="main">
        <h2>{label ? label : "[ 'plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck' ]"}</h2>
        <div className="dropzone" {...getRootProps()}>
          <input {...getInputProps()} />
          {disallowedFile ? 
            <p>Only .png files please...</p> : isDragActive ?
            <p>Drop it! Do it!</p> :
            <p>Drop image or click here...</p>}
        </div>
      </main>
    </div>
  );
}

export default App;
