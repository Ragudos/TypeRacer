// @ts-check

import { Server } from "socket.io";
import dotenv from "dotenv";
import { memoryUsage } from "process";
import { TypingGameServer } from "./server.mjs";
import { SOCKET_ERRORS } from "./enums.mjs";
dotenv.config();

const port = process.env.PORT || "8080";
/**
 * @type {Server<import("./server.mjs").ClientToServer, import("./server.mjs").ServerToClient>}
 */
const websocket_server = new Server({
	cors: {
		methods: ["GET", "POST"],
		origin: "https://aaron-typeracer.netlify.app"
	},
});

new TypingGameServer(websocket_server);

websocket_server.listen(+port);

process.on("SIGINT", () => {
	websocket_server.emit("error", {
		name: SOCKET_ERRORS.SERVER_SHUTDOWN,
		message:
			"The server has been shut down. We apologize for the convenience.",
	});
	websocket_server.close();
	process.exit(0);
});

process.on("SIGTERM", () => {
	websocket_server.emit("error", {
		name: SOCKET_ERRORS.SERVER_SHUTDOWN,
		message:
			"The server has been shut down. We apologize for the convenience.",
	});
	websocket_server.close();
	process.exit(0);
});

if (process.env.NODE_ENV === "development") {
	setInterval(() => {
		const memory_usage = Object.entries(memoryUsage()).reduce(
			(acc, [key, value]) => {
				acc[key] = (value / 1024 / 1024).toFixed(2) + " MB";
				return acc;
			},
			{},
		);
		console.log("--- Memory usage ---\n");
		console.table(memory_usage);
	}, 20_000);
}
