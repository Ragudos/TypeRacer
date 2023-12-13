const socket_io = require("socket.io");
const http = require("http");
const dotenv = require("dotenv");

dotenv.config();

const { TypingGameServer } = require("./server.cjs");

const port = process.env.PORT || "3000";
const server = http.createServer();
const websocket_server = new socket_io.Server(server, {
	cors: {
		methods: ["GET", "POST"],
	},
});

new TypingGameServer(websocket_server);

server.listen(+port, () => {
	console.log(`Server started on *:${port}`);
});
websocket_server.listen(server);
