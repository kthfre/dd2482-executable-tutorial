import { io } from 'socket.io-client';

const URI = "35.192.8.77:5000" // "http://35.192.8.77:5000";

export const socket = io(URI, {maxHttpBufferSize: 1e7});