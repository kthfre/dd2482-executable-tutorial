import asyncio
import websockets
import torch
import json
import pickle
import hashlib
import struct
import os
import shutil

DEPLOY_PATH = "../server-app/model/model.pt"

async def serve(websocket):
    data = await websocket.recv()

    # json data
    if type(data) == str:
        obj = json.loads(data)

        if obj["event"] == "deploy_model":
            h = obj["hash"]
            shutil.copy(f"../server/models/{h}.pt", DEPLOY_PATH)
            await websocket.send(json.dumps({"event": "deployed", "hash": obj["hash"]}))
    # model params
    elif type(data) == bytes:
        m = hashlib.sha1()
        m.update(data)
        digest = m.hexdigest()

        with open(f'../server/models/{digest}.pt', "wb") as f:
            f.write(data)

        await websocket.send(json.dumps({"hash": digest}))

async def main():
    print("WS: Listening on port 8766...")
    async with websockets.serve(serve, "localhost", 8766, max_size=10000000):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
