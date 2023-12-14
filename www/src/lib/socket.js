import socket_io from "socket.io-client";

/**
 * @global
 * @typedef {import("../../../server/src/server.cjs").ClientToServer} ClientToServer
 * @typedef {import("../../../server/src/server.cjs").ServerToClient} ServerToClient
 */

/**
 * @type {import("socket.io-client").Socket<ServerToClient, ClientToServer>}
 */
export const socket = socket_io("http://localhost:8080", {
	autoConnect: false
});

