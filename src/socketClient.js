// frontend/src/socketClient.js
import { io } from "socket.io-client";
const URL = "http://localhost:5000"; // change to your backend domain when live
const socket = io(URL, { autoConnect: true });
export default socket;
