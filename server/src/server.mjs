// @ts-check

import { InMemoryStore } from "./adapters/in-memory.mjs";
import { SOCKET_ERRORS, SOCKET_ROOM_TYPES } from "./enums.mjs";
import { genRandomId } from "./lib/utils.mjs";

/**
 * @template T
 * @callback CallbackAcknowledgement
 * @param {(500 | 200)} status - Status of the acknowledgement.
 * @param {T | undefined} data - Data to be passed to the client.
 * @param {string} message - Message to be passed to the client.
 */

/**
 * @typedef {import("./enums.mjs").SocketError} SocketError
 * @typedef {import("./adapters/in-memory.mjs").Room} Room
 * @typedef {import("./adapters/in-memory.mjs").User} User
 */

/**
 * @global
 *
 * @typedef {CallbackAcknowledgement<Room | undefined>} RoomCreationAcknowledgement
 * @typedef {CallbackAcknowledgement<Room | undefined>} RoomJoinAcknowledgement
 *
 * @typedef {Object} ServerToClient
 * @property {(error: { name: SocketError; message: string; }) => void} error
 * @property {(user: User) => void} user_joined
 * @property {(user: User, new_host_id: string) => void} user_left
 * @property {(room_id: string) => void} room_created
 * @property {(room_id: string) => void} joined_room
 * @property {(user_id: string) => void} send_user_id
 * @property {(room_info: Room) => void} send_room_info
 *
 * @typedef {Object} ClientToServer
 * @property {(cb: RoomCreationAcknowledgement) => void} create_room
 * @property {(room_id: string, cb: RoomJoinAcknowledgement)=> void} join_room
 * @property {(room_id: string) => void} leave_room
 * @property {(room_id: string) => void} request_room_info
 * @property {(room_id: string) => void} request_list_of_players_in_room
 *
 * @typedef {import("socket.io").Socket<ClientToServer, ServerToClient>} Socket
 * @typedef {import("socket.io").Server<ClientToServer, ServerToClient>} Server
 */

class TypingGameServer {
	/**
	 * @param {Server} server
	 */
	constructor(server) {
		this.store = new InMemoryStore(server);

		server.use(this.middleware);
		server.on("connection", this.onConnection.bind(this));
	}

	/**
	 * @param {Socket} socket
	 */
	onConnection(socket) {
		socket.emit("send_user_id", socket.user_id);

		socket.on("error", (error) => {
			this.onError(socket, error);
		});
		socket.on("create_room", (cb) => {
			this.onCreateRoom(socket, socket.user_id, cb);
		});
		socket.on("join_room", (room_id, cb) => {
			this.onJoinRoom(socket, room_id, cb);
		});
		socket.on("leave_room", (room_id) => {
			this.onLeaveRoom(socket, room_id);
		});
		socket.on("disconnecting", (reason) => {
			this.onDisconnecting(socket, reason);
		});
		socket.on("request_room_info", (room_id) => {
			this.onRequestRoomInfo(socket, room_id);
		});
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 */
	onRequestRoomInfo(socket, room_id) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			socket.emit("error", {
				name: SOCKET_ERRORS.ROOM_NOT_FOUND,
				message: `Room with id ${room_id} not found.`,
			});
			return;
		}

		socket.emit("send_room_info", room);
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 */
	onLeaveRoom(socket, room_id) {
		this.store.leaveRoom(socket, socket.user_id, room_id);
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 * @param {CallbackAcknowledgement<Room | undefined>} cb
	 */
	onJoinRoom(socket, room_id, cb) {
		this.store.joinRoom(socket, socket.user_id, room_id, cb);
	}

	/**
	 * @param {Socket} socket
	 * @param {string} host_id
	 * @param {RoomCreationAcknowledgement} cb
	 */
	onCreateRoom(socket, host_id, cb) {
		this.store
			.createRoom(socket, host_id, SOCKET_ROOM_TYPES.PRIVATE)
			.then((room) => {
				if (!room) {
					return;
				}

				console.log(
					`User ${socket.user_id} with a username of ${socket.username} created a room with an id of ${room.room_id}`,
				);

				cb(200, room, "Successfully created room.");
			})
			.catch((err) => {
				console.error(err);
				cb(500, undefined, err);
			});
	}

	/**
	 * @param {Socket} socket
	 * @param {string} reason
	 */
	onDisconnecting(socket, reason) {
		console.log(
			`User ${socket.user_id} with a username of ${socket.username} is disconnecting: ${reason}`,
		);

		for (const room_id of socket.rooms.values()) {
			this.store.leaveRoom(socket, socket.user_id, room_id);
		}

		this.store.deleteUser(socket.user_id);
	}

	/**
	 * @param {Socket} socket
	 * @param {Error} error
	 */
	onError(socket, error) {
		console.error(error);
		socket.emit("error", {
			name: SOCKET_ERRORS.ERROR,
			message: error.message,
		});
	}

	/**
	 * @private
	 * @param {Socket} socket
	 * @param {(err?: Error | undefined) => void} next
	 */
	middleware = async (socket, next) => {
		const auth_handshake = socket.handshake.auth;

		try {
			const user_id = await genRandomId();

			socket.avatar = auth_handshake.avatar;
			socket.username = auth_handshake.username;
			socket.user_id = user_id;
			this.store.addUser(socket.user_id, socket.username, socket.avatar);
			next();
		} catch (err) {
			next(err);
		}
	};
}

export { TypingGameServer };
