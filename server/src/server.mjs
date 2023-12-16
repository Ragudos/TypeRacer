// @ts-check

import { InMemoryStore } from "./adapters/in-memory.mjs";
import { SOCKET_ERRORS, SOCKET_ROOM_TYPES } from "./enums.mjs";
import { genRandomId } from "./lib/utils.mjs";
import { MAX_USERNAME_LENGTH } from "../../www/src/consts.js";

/**
 * @template T
 * @callback CallbackAcknowledgement
 * @param {(500 | 403 | 404 | 400 | 200)} status - Status of the acknowledgement.
 * @param {T | undefined} data - Data to be passed to the client.
 * @param {string} [message] - Message to be passed to the client.
 */

/**
 * @typedef {import("./enums.mjs").SocketError} SocketError
 * @typedef {import("./adapters/in-memory.mjs").Room} Room
 * @typedef {import("./adapters/in-memory.mjs").User} User
 * @typedef {import("./adapters/in-memory.mjs").Chat} Chat
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
 * @property {(user: User) => void} send_user_info
 * @property {(room_info: Room) => void} send_room_info
 * @property {(chat: Chat) => void} user_sent_message
 * @property {(new_type: import("./enums.mjs").SocketRoomType) => void} room_type_changed
 * @property {(new_max: number) => void} max_players_changed
 *
 * @typedef {Object} ClientToServer
 * @property {(cb: RoomCreationAcknowledgement) => void} create_room
 * @property {(room_id: string, cb: RoomJoinAcknowledgement)=> void} join_room
 * @property {(room_id: string) => void} leave_room
 * @property {(room_id: string, cb: CallbackAcknowledgement<Room | undefined>) => void} request_room_info
 * @property {(room_id: string, cb: CallbackAcknowledgement<import("./adapters/in-memory.mjs").Chats | undefined>) => void} request_chats_in_room
 * @property {(room_id: string, user_id: string, message: string, cb: CallbackAcknowledgement<Chat>) => void} send_message
 * @property {(room_id: string, user_id: string, new_type: import("./enums.mjs").SocketRoomType, cb: CallbackAcknowledgement<undefined>) => void} change_room_type
 * @property {(room_id: string, user_id: string, new_max: number, cb: CallbackAcknowledgement<undefined>) => void} change_max_players
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
		socket.emit("send_user_info", {
			user_id: socket.user_id,
			username: socket.username,
			avatar: socket.avatar,
		});

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
		socket.on("request_room_info", this.onRequestRoomInfo.bind(this));
		socket.on(
			"request_chats_in_room",
			this.onRequestChatsInRoom.bind(this),
		);
		socket.on("send_message", (room_id, user_id, message, cb) => {
			this.onSendMessage(socket, room_id, user_id, message, cb);
		});
		socket.on("change_room_type", (room_id, user_id, new_type, cb) => {
			this.onChangeRoomType(socket, room_id, user_id, new_type, cb);
		});
		socket.on("change_max_players", (room_id, user_id, new_max, cb) => {
			this.onChangeMaxPlayers(socket, room_id, user_id, new_max, cb);
		});
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 * @param {string} user_id
	 * @param {number} new_max
	 * @param {CallbackAcknowledgement<undefined>} cb
	 */
	onChangeMaxPlayers(socket, room_id, user_id, new_max, cb) {
		if (new_max < 2) {
			cb(400, undefined, "Max players must be at least 2.");
			return;
		} else if (new_max > 6) {
			cb(400, undefined, "Max players must be at most 6.");
			return;
		}

		const room = this.store.getRoom(room_id);

		if (!room) {
			console.error(
				`Room with id ${room_id} not found in store when it changed max players.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		if (room.users.length > new_max) {
			cb(
				400,
				undefined,
				"New room capacity cannot be less than the current number of users in the room.",
			);
			return;
		}

		const user = this.store.getUser(user_id);

		if (!user) {
			console.error(
				`User with id ${user_id} not found in store when it changed max players.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		if (room.host_id !== user_id) {
			console.error(
				`User with id ${user_id} tried to change the max players of room with id ${room_id} but they are not the host.`,
			);
			cb(403, undefined, "You are not the host of this room.");
			return;
		}

		socket.broadcast.to(room_id).emit("max_players_changed", new_max);
		room.max_users = new_max;
		cb(200, undefined, "Successfully changed max players.");
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 * @param {string} user_id
	 * @param {import("./enums.mjs").SocketRoomType} new_type
	 * @param {CallbackAcknowledgement<undefined>} cb
	 */
	onChangeRoomType(socket, room_id, user_id, new_type, cb) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			console.error(
				`Room with id ${room_id} not found in store when it changed types.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		const user = this.store.getUser(user_id);

		if (!user) {
			console.error(
				`User with id ${user_id} not found in store when it changed types.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		if (room.host_id !== user_id) {
			console.error(
				`User with id ${user_id} tried to change the room type of room with id ${room_id} but they are not the host.`,
			);
			cb(403, undefined, "You are not the host of this room.");
			return;
		}

		socket.broadcast.to(room_id).emit("room_type_changed", new_type);
		room.room_type = new_type;
		cb(200, undefined, "Successfully changed room type.");
	}

	/**
	 * @param {Socket} socket
	 * @param {string} room_id
	 * @param {string} user_id
	 * @param {string} message
	 * @param {CallbackAcknowledgement<Chat>} cb
	 */
	onSendMessage(socket, room_id, user_id, message, cb) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			console.error(
				`Room with id ${room_id} not found in store when it received a message.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		const user = this.store.getUser(user_id);

		if (!user) {
			console.error(
				`User with id ${user_id} not found in store when it sent a message.`,
			);
			cb(500, undefined, "Internal Server Error");
			return;
		}

		const chat = this.store.addChat(room_id, user, message);

		cb(200, chat);
		socket.broadcast.to(room_id).emit("user_sent_message", chat);
	}

	/**
	 * @param {string} room_id
	 * @param {CallbackAcknowledgement<import("./adapters/in-memory.mjs").Chats | undefined>} cb
	 */
	onRequestChatsInRoom(room_id, cb) {
		const chats = this.store.getChats(room_id);

		cb(200, chats);
	}

	/**
	 * @param {string} room_id
	 * @param {CallbackAcknowledgement<Room | undefined>} cb
	 */
	onRequestRoomInfo(room_id, cb) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			cb(404, undefined, "Room not found.");
			return;
		}

		cb(200, room);
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

		if (!auth_handshake.username) {
			next(new Error("Username is required."));
		}

		if (auth_handshake.username.length >= MAX_USERNAME_LENGTH) {
			next(
				new Error(
					`Username must be less than ${MAX_USERNAME_LENGTH} characters.`,
				),
			);
		}

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
