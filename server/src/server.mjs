// @ts-check

import { InMemoryStore } from "./adapters/in-memory.mjs";
import {
	SOCKET_ERRORS,
	SOCKET_ROOM_STATUS,
	SOCKET_ROOM_TYPES,
	TIMER_SUFFIXES,
} from "./enums.mjs";
import { genRandomId } from "./lib/utils.mjs";
import {
	COUNTDOWN_COUNT,
	MAX_PLAYERS_IN_ROOM,
	MAX_USERNAME_LENGTH,
	RACE_TIMER_COUNT,
} from "./consts.mjs";

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
 * @typedef {Object} ClientToServerEventNameToCbMap
 * @property {(cb: RoomCreationAcknowledgement) => void} create_room
 * @property {(room_id: string, cb: RoomJoinAcknowledgement)=> void} join_room
 * @property {(room_id: string) => void} leave_room
 * @property {(room_id: string, cb: CallbackAcknowledgement<Room | undefined>) => void} request_room_info
 * @property {(room_id: string, cb: CallbackAcknowledgement<import("./adapters/in-memory.mjs").Chats | undefined>) => void} request_chats_in_room
 * @property {(room_id: string, user_id: string, message: string, cb: CallbackAcknowledgement<Chat>) => void} send_message
 * @property {(room_id: string, user_id: string, new_type: import("./enums.mjs").SocketRoomType, cb: CallbackAcknowledgement<undefined>) => void} change_room_type
 * @property {(room_id: string, user_id: string, new_max: number, cb: CallbackAcknowledgement<undefined>) => void} change_max_players
 * @property {(room_id: string, user_id: string, cb: CallbackAcknowledgement<undefined>) => void} start_game
 * @property {(room_id: string, user_id: string, progress: import("./adapters/in-memory.mjs").Progress, is_finished: boolean) => void} send_progress
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
 * @property {() => void} game_started
 * @property {(current_tick: number) => void} countdown
 * @property {() => void} reset_room
 * @property {() => void} countdown_finished
 * @property {(user_id: string, progress: import("./adapters/in-memory.mjs").Progress) => void} send_user_progress
 * @property {(current_tick: number) => void} race_time_left
 * @property {() => void} race_finished
 *
 * @typedef {Object} ClientToServer
 * @property {ClientToServerEventNameToCbMap["create_room"]} create_room
 * @property {ClientToServerEventNameToCbMap["join_room"]} join_room
 * @property {ClientToServerEventNameToCbMap["leave_room"]} leave_room
 * @property {ClientToServerEventNameToCbMap["request_room_info"]} request_room_info
 * @property {ClientToServerEventNameToCbMap["request_chats_in_room"]} request_chats_in_room
 * @property {ClientToServerEventNameToCbMap["send_message"]} send_message
 * @property {ClientToServerEventNameToCbMap["change_room_type"]} change_room_type
 * @property {ClientToServerEventNameToCbMap["change_max_players"]} change_max_players
 * @property {ClientToServerEventNameToCbMap["start_game"]} start_game
 * @property {ClientToServerEventNameToCbMap["send_progress"]} send_progress
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
		this.server = server;

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
		socket.on("start_game", (room_id, user_id, cb) => {
			this.onStartGame(socket, room_id, user_id, cb);
		});
		socket.on("send_progress", this.onSendProgress.bind(this));
		socket.onAny(this.logger.bind(this));
	}

	/**
	 * @param {string} room_id
	 * @param {string} user_id
	 * @param {import("./adapters/in-memory.mjs").Progress} progress
	 * @param {boolean} is_finished
	 */
	onSendProgress(room_id, user_id, progress, is_finished) {
		this.server.to(room_id).emit("send_user_progress", user_id, progress);

		if (!is_finished) {
			return;
		}

		const room = this.store.getRoom(room_id);

		if (!room) {
			console.error(
				`Room with id ${room_id} not found in store when a user sent progress.`,
			);
			return;
		}

		const user = room.users.find((user) => user.user_id === user_id);

		if (!user) {
			console.error(
				`User with id ${user_id} not found in room with id ${room_id} when a user sent progress.`,
			);
			return;
		}

		user.is_finished = true;

		const is_everyone_finished = room.users.every((user) => user.is_finished);

		if (is_everyone_finished) {
			this.server.to(room_id).emit("race_finished");
			
			const timer_id = room_id + TIMER_SUFFIXES.GAME;

			this.store.getTimer(timer_id)?.stop();
			this.store.deleteTimer(timer_id);
		}
	}

	/**
	 * @template {keyof ClientToServerEventNameToCbMap} K
	 * @param {K} eventName
	 * @param {Parameters<ClientToServerEventNameToCbMap[K]>} args
	 */
	logger(eventName, ...args) {
		console.debug("Received event: ", eventName, "| Arguments: ", ...args);
	}

	/**
	 * @param {string} room_id
	 */
	startTimerOnRace(room_id) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			console.error(
				`Room with id ${room_id} not found in store when a game started after its countdown.`,
			);
			return;
		}

		this.store.startCountdown(
			room_id,
			RACE_TIMER_COUNT,
			TIMER_SUFFIXES.GAME,
			(currentTick, isFinished) => {
				const id = room_id + TIMER_SUFFIXES.GAME;

				if (currentTick != undefined) {
					this.server.to(room_id).emit("race_time_left", currentTick);
				}

				if (!isFinished) {
					return;
				}

				this.store.deleteTimer(id);
				this.server.to(room_id).emit("race_finished");

				const room = this.store.getRoom(room_id);

				if (!room) {
					console.error(
						`Room with id ${room_id} not found in store when a race finished.`,
					);
					return;
				}

				room.room_type = SOCKET_ROOM_TYPES.FINISHED;
			},
		);
	}

	/**
	 * We have a cb to tell the client that we acknowledged their request, and sent this information to other connected clients in the room, so they all have the same starting points.
	 * @param {Socket} socket
	 * @param {string} room_id
	 * @param {string} user_id
	 * @param {CallbackAcknowledgement<undefined>} cb
	 */
	onStartGame(socket, room_id, user_id, cb) {
		const room = this.store.getRoom(room_id);

		if (!room) {
			cb(500, undefined, "Internal Server Error");
			console.error(
				`Room with id ${room_id} not found in store when it tried to start the game.`,
			);
			return;
		}

		const user = this.store.getUser(user_id);

		if (!user) {
			cb(500, undefined, "Internal Server Error");
			console.error(
				`User with id ${user_id} not found in store when it tried to start the game.`,
			);
			return;
		}

		if (room.host_id !== user_id) {
			cb(403, undefined, "You are not the host of this room.");
			console.error(
				`User with id ${user_id} tried to start the game in room with id ${room_id} but they are not the host.`,
			);
			return;
		}

		if (room.users.length < 2) {
			cb(400, undefined, "There must be at least 2 players to start.");
			console.error(
				`User with id ${user_id} tried to start the game in room with id ${room_id} but there are not enough players.`,
			);
			return;
		}

		room.room_status = SOCKET_ROOM_STATUS.COUNTDOWN;
		socket.to(room_id).emit("game_started");
		cb(200, undefined, "Game started.");
		this.store.startCountdown(
			room_id,
			COUNTDOWN_COUNT,
			TIMER_SUFFIXES.COUNTDOWN,
			(currentTick, isFinished) => {
				const id = room_id + TIMER_SUFFIXES.COUNTDOWN;
				if (currentTick != undefined) {
					this.server.to(room_id).emit("countdown", currentTick);
				}

				if (!isFinished) {
					return;
				}

				this.store.deleteTimer(id);
				this.server.to(room_id).emit("countdown_finished");

				const room = this.store.getRoom(room_id);

				if (!room) {
					console.error(
						`Room ${room_id} not found when countdown has finished.`,
					);
					return;
				}

				room.room_status = SOCKET_ROOM_STATUS.PLAYING;
				this.startTimerOnRace(room_id);
			},
		);
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
		} else if (new_max > MAX_PLAYERS_IN_ROOM) {
			cb(
				400,
				undefined,
				`Max players must be at most ${MAX_PLAYERS_IN_ROOM}.`,
			);
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
		cb(200, undefined, "Successfully changed room capacity.");
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
