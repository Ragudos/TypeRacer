import { Server } from "socket.io";
import dotenv from "dotenv";
import { TypingGameServer } from "./server.mjs";

dotenv.config();


const port = process.env.PORT || "8080";
const websocket_server = new Server({
	cors: {
		methods: ["GET", "POST"],
	},
});

new TypingGameServer(websocket_server);

websocket_server.listen(+port);
