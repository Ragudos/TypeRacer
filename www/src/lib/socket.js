import socket_io from "socket.io-client";

/**
 * @global
 * @typedef {import("../../../server/src/server.mjs").ClientToServer} ClientToServer
 * @typedef {import("../../../server/src/server.mjs").ServerToClient} ServerToClient
 */

/**
 * @type {import("socket.io-client").Socket<ServerToClient, ClientToServer>}
 */
export const socket = socket_io(import.meta.NODE_ENV === "development" ? "http://localhost:8A080" : "https://typeracer.fly.dev", {
	autoConnect: false,
});
