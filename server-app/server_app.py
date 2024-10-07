from flask import Flask, request
from flask_socketio import SocketIO, emit
from PIL import Image
import torch
import torchvision
import json
import hashlib
import io
import pickle

app = Flask(__name__)
socketio = SocketIO(app)

classes = ('plane', 'car', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck')

class CNN(torch.nn.Module):
    def __init__(self, num_channels, num_classes, kernel_size, num_filters, dense_width):
        super(CNN, self).__init__()

        self.conv1 = torch.nn.Conv2d(in_channels=num_channels, out_channels=num_filters, kernel_size=(kernel_size, kernel_size))
        self.relu1 = torch.nn.ReLU()
        self.maxpool1 = torch.nn.MaxPool2d(kernel_size=(2, 2), stride=(2, 2))

        self.conv2 = torch.nn.Conv2d(in_channels=num_filters, out_channels=num_filters, kernel_size=(kernel_size, kernel_size))
        self.relu2 = torch.nn.ReLU()
        self.maxpool2 = torch.nn.MaxPool2d(kernel_size=(2, 2), stride=(2, 2))

        self.adaptiveavgpool = torch.nn.AdaptiveAvgPool2d((16, 16))

        self.fc1 = torch.nn.Linear(in_features=(16*16*num_filters), out_features=dense_width)
        self.relu3 = torch.nn.ReLU()

        self.fc2 = torch.nn.Linear(in_features=dense_width, out_features=num_classes)
        self.logSoftmax = torch.nn.LogSoftmax(dim=1)

    def forward(self, x):
        x = self.conv1(x)
        x = self.relu1(x)
        x = self.maxpool1(x)

        x = self.conv2(x)
        x = self.relu2(x)
        x = self.maxpool2(x)

        x = self.adaptiveavgpool(x)

        x = torch.flatten(x, 1)

        x = self.fc1(x)
        x = self.relu3(x)

        x = self.fc2(x)
        output = self.logSoftmax(x)

        return output

model = CNN(3, len(classes), 3, 20, 256)

def load_image_to_tensor(img):
    img = torchvision.transforms.functional.pil_to_tensor(img)
    transform = torchvision.transforms.Compose([torchvision.transforms.ToPILImage(), torchvision.transforms.ToTensor()]) # 
    return transform(img)

@app.route('/')
def home():
    return app.send_static_file('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')

    with open('./model/model.pt', "rb") as f:
        read_data = f.read()

    m = hashlib.sha1()
    m.update(read_data)
    h = m.hexdigest()
    socketio.emit("new_model", h)
    return "hello"

@socketio.on('message')
def handle_message(data):
    print("message")

@socketio.on('image')
def handle_image(data):
    img = Image.open(io.BytesIO(data))
    img = load_image_to_tensor(img)
    if img.shape[0] == 4:
        img = img[:3]
    img = img.unsqueeze(0)
    preds = model.forward(img)
    print("preds", preds[0], torch.argmax(preds[0]))
    socketio.emit("prediction", torch.argmax(preds[0]).item())

@socketio.on('load_model')
def handle_model(data):
    with open('./model/model.pt', "rb") as f:
        read_data = f.read()

    m = hashlib.sha1()
    m.update(read_data)
    h = m.hexdigest()
    global model
    model = CNN(3, len(classes), data["KERNEL_SIZE"], data["NUM_FILTERS"], data["DENSE_WIDTH"])
    state_dict = pickle.loads(read_data)
    model.load_state_dict(state_dict)
    socketio.emit("new_model", h)

if __name__ == "__main__":
    # app.run()
    socketio.run(app, host="0.0.0.0", allow_unsafe_werkzeug=True)