const socket_io = require("socket.io");
const dotenv = require("dotenv");

dotenv.config();

const { TypingGameServer } = require("./server.cjs");

const port = process.env.PORT || "8080";
const websocket_server = new socket_io.Server({
	cors: {
		methods: ["GET", "POST"],
	},
});

new TypingGameServer(websocket_server);

websocket_server.listen(+port);

