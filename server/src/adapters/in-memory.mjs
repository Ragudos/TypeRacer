// @ts-check

import { Timer } from "../Timer.mjs";
import { COUNTDOWN_SPEED } from "../consts.mjs";
import {
	SOCKET_ROOM_TYPES,
	SOCKET_ROOM_STATUS,
	TIMER_SUFFIXES,
} from "../enums.mjs";
import { generate_sentence } from "../lib/random-sentence.mjs";
import { genRandomId } from "../lib/utils.mjs";

const MAX_ALLOWED_ROOMS = 1;

/**
 * @global
 *
 * @typedef {Object} Progress
 * @property {string} typed_word
 * @property {number} progress
 * @property {number} wpm
 * @property {number} accuracy
 *
 * @typedef {Object} Room
 * @property {string} room_id
 * @property {User[]} users
 * @property {string} host_id
 * @property {number} max_users
 * @property {import("../enums.mjs").SocketRoomType} room_type
 * @property {import("../enums.mjs").SocketRoomStatus} room_status
 * @property {string} paragraph_to_type
 *
 * @typedef {Object} User
 * @property {string} user_id
 * @property {string} username
 * @property {string} avatar
 * @property {boolean} is_finished
 *
 * @typedef {Object} Chat
 * @property {string} user_id
 * @property {string} username
 * @property {string} message
 * @property {number} created_at
 *
 * @typedef {Chat[]} Chats
 */

class InMemoryStore {
	/**
	 * @param {import("../server.mjs").Server} server
	 */
	constructor(server) {
		/**
		 * @private
		 * @type {Map<string, Room>}
		 */
		this.rooms = new Map();
		/**
		 * @private
		 * @type {Map<string, User>}
		 */
		this.users = new Map();
		/**
		 * @private
		 * @type {Map<string, Chats>}
		 */
		this.chats = new Map();
		/**
		 * @private
		 * @type {Map<string, Timer>}
		 */
		this.timers = new Map();
		/**
		 * @private
		 * @type {import("../server.mjs").Server}
		 */
		this.server = server;
	}

	/**
	 * @param {string} room_id
	 * @param {number} duration in seconds
	 * @param {import("../enums.mjs").TimerSuffix} id_suffix
	 * @param {(currentTick: number | undefined, isFinished: boolean | undefined) => void} operation
	 */
	startCountdown(room_id, duration, id_suffix, operation) {
		const id = room_id + id_suffix;
		const timer = new Timer(COUNTDOWN_SPEED, duration, operation);

		this.timers.set(id, timer);
		timer.start();
		console.debug(
			`Started countdown in room ${room_id}. Current state: `,
			this.timers,
		);
	}

	/**
	 * @param {string} room_id
	 * @param {User} user
	 * @param {string} message
	 * @returns {Chat}
	 */
	addChat(room_id, user, message) {
		const chat = {
			user_id: user.user_id,
			username: user.username,
			message,
			created_at: Date.now(),
		};

		if (!this.chats.has(room_id)) {
			this.chats.set(room_id, []);
		}

		const chats = this.chats.get(room_id);

		if (!chats) {
			console.error(
				`Chats for room ${room_id} not found despite creating one.`,
			);
			return chat;
		}

		chats.push(chat);

		if (chats.length > 10) {
			chats.shift();
		}

		console.debug(
			`Added chat in room ${room_id}. Current state: `,
			this.chats,
		);

		return chat;
	}

	/**
	 * @param {string} user_id
	 * @param {string} username
	 * @param {string} avatar
	 */
	addUser(user_id, username, avatar) {
		this.users.set(user_id, {
			user_id,
			username,
			avatar,
			is_finished: false,
		});
		console.debug(`Added user ${user_id}. Current state: `, this.users);
	}

	/**
	 * Deletes all related storage of a room.
	 * @param {string} room_id
	 */
	cleanup(room_id) {
		for (const timer_suffix_key in TIMER_SUFFIXES) {
			const timer_suffix = TIMER_SUFFIXES[timer_suffix_key];
			const timer_id = room_id + timer_suffix;
			const timer = this.getTimer(timer_id);

			if (!timer) {
				continue;
			}

			timer.stop();
			this.deleteTimer(timer_id);
		}

		this.deleteChat(room_id);
		this.deleteRoom(room_id);
	}

	/**
	 * @param {string} room_id
	 */
	getChats(room_id) {
		return this.chats.get(room_id);
	}

	/**
	 * @param {string} room_id
	 * @returns {Room | undefined}
	 */
	getRoom(room_id) {
		return this.rooms.get(room_id);
	}

	/**
	 * @param {string} user_id
	 * @returns {User | undefined}
	 */
	getUser(user_id) {
		return this.users.get(user_id);
	}

	/**
	 * @param {string} timer_id
	 */
	getTimer(timer_id) {
		return this.timers.get(timer_id);
	}

	/**
	 * @param {string} timer_id
	 */
	deleteTimer(timer_id) {
		this.timers.delete(timer_id);
		console.log(`Deleted timer ${timer_id}. Current state: `, this.timers);
	}

	/**
	 * @param {string} chat_id
	 */
	deleteChat(chat_id) {
		this.chats.delete(chat_id);
		console.log(
			`Deleted chat data in room ${chat_id}. Current state: `,
			this.chats,
		);
	}

	/**
	 * @param {string} room_id
	 */
	deleteRoom(room_id) {
		this.rooms.delete(room_id);
		console.log(`Deleted room ${room_id}. Current state: `, this.rooms);
	}

	/**
	 * @param {string} user_id
	 */
	deleteUser(user_id) {
		this.users.delete(user_id);
		console.log(`Deleted user ${user_id}. Current state: `, this.users);
	}

	/**
	 * @param {import("../server.mjs").Socket} socket
	 * @param {string} user_id
	 * @param {import("../server.mjs").CallbackAcknowledgement<Room | undefined>} cb
	 */
	joinNextAvailableRoom(socket, user_id, cb) {
		const user = this.getUser(user_id);

		if (!user) {
			cb(500, undefined, "Something went wrong.");
			return;
		}

		if (this.rooms.size === 0) {
			this.createRoom(socket, user_id, SOCKET_ROOM_TYPES.PUBLIC)
				.then((room) => {
					if (!room) {
						return;
					}

					console.log(
						`User ${user_id} created room ${room.room_id}. Current state: `,
						this.rooms,
					);

					cb(
						200,
						room,
						"Created a room since there are no available public rooms.",
					);
				})
				.catch((err) => {
					console.error(err);
					cb(500, undefined, err);
				});
			return;
		}

		const availableRooms = this.rooms.values();

		for (const room of availableRooms) {
			if (
				room.room_type != SOCKET_ROOM_TYPES.PUBLIC ||
				room.room_status != SOCKET_ROOM_STATUS.WAITING ||
				room.users.length >= room.max_users
			) {
				continue;
			}

			room.users.push(user);
			this.server.to(room.room_id).emit("user_joined", user);
			socket.join(room.room_id);
			cb(200, room, "Successfully joined room.");
			console.log(
				`User ${user_id} joined room ${room.room_id}. Current state: `,
				this.rooms,
			);

			return;
		}

		this.createRoom(socket, user_id, SOCKET_ROOM_TYPES.PUBLIC)
			.then((room) => {
				if (!room) {
					return;
				}

				console.log(
					`User ${user_id} created room ${room.room_id}. Current state: `,
					this.rooms,
				);

				cb(
					200,
					room,
					"Created a room since there are no available public rooms.",
				);
			})
			.catch((err) => {
				console.error(err);
				cb(500, undefined, err);
			});
	}

	/**
	 * @param {import("../server.mjs").Socket} socket
	 * @param {string} user_id
	 * @param {string} room_id
	 * @param {import("../server.mjs").RoomJoinAcknowledgement} cb
	 */
	joinRoom(socket, user_id, room_id, cb) {
		const user = this.getUser(user_id);

		if (!user) {
			cb(500, undefined, "Something went wrong.");
			return;
		}

		if (!room_id) {
			this.joinNextAvailableRoom(socket, user_id, cb);
			return;
		}

		const room = this.getRoom(room_id);

		if (!room) {
			cb(500, undefined, "Room not found.");
			return;
		}

		if (room.users.length >= room.max_users) {
			cb(500, undefined, "Room is full.");
			return;
		}

		if (
			room.room_status != SOCKET_ROOM_STATUS.WAITING ||
			room.room_type === SOCKET_ROOM_TYPES.CLOSED
		) {
			cb(500, undefined, "Room is not accepting any player.");
			return;
		}

		if (room.users.some((user) => user.user_id === user_id)) {
			cb(500, undefined, "User is already in this room.");
			return;
		}

		room.users.push(user);
		this.server.to(room_id).emit("user_joined", user);
		socket.join(room_id);
		cb(200, room, "Successfully joined room.");
	}

	/**
	 * @param {import("../server.mjs").Socket} socket
	 * @param {string} user_id
	 * @param {string} room_id
	 */
	async leaveRoom(socket, user_id, room_id) {
		const user = this.getUser(user_id);

		if (!user) {
			return;
		}

		const room = this.getRoom(room_id);

		if (!room) {
			return;
		}

		if (room.users.length === 1) {
			this.cleanup(room_id);

			return;
		}

		const user_idx = room.users.findIndex(
			(user) => user.user_id === user_id,
		);

		if (user_idx === -1) {
			console.error(
				"User does not exist in room that they're trying to leave from.",
			);
			return;
		}

		room.users.splice(user_idx, 1);

		if (user_id === room.host_id) {
			room.host_id = room.users[0].user_id;
		}

		socket.leave(room_id);
		this.server.to(room_id).emit("user_left", user, room.host_id);

		if (
			room.users.length === 1 &&
			room.room_status != SOCKET_ROOM_STATUS.WAITING &&
			room.room_status != SOCKET_ROOM_STATUS.RESULTS
		) {
			let timer_id;

			try {
				if (room.room_status === SOCKET_ROOM_STATUS.PLAYING) {
					timer_id = room_id + TIMER_SUFFIXES.GAME;
					room.paragraph_to_type = await generate_sentence();
				} else if (room.room_status === SOCKET_ROOM_STATUS.COUNTDOWN) {
					timer_id = room_id + TIMER_SUFFIXES.COUNTDOWN;
				}

				if (timer_id) {
					this.getTimer(timer_id)?.stop();
					this.deleteTimer(timer_id);
				}

				room.room_status = SOCKET_ROOM_STATUS.WAITING;
				this.server
					.to(room_id)
					.emit("reset_room", room.paragraph_to_type);
			} catch (err) {}
		}

		console.log(
			`User ${user_id} left room ${room_id}. Current state: `,
			this.rooms,
		);
	}

	/**
	 * @param {import("../server.mjs").Socket} socket
	 * @param {string} host_id
	 * @param {import("../enums.mjs").SocketRoomType} room_type
	 * @returns {Promise<Room | undefined>}
	 */
	async createRoom(socket, host_id, room_type) {
		if (this.rooms.size >= MAX_ALLOWED_ROOMS) {
			throw "Server is full. Please try again later";
		}

		const user = this.users.get(host_id);

		if (!user) {
			console.log("User does not exist despite trying to create a room.");
			return;
		}

		try {
			const room_id = await genRandomId();
			/**
			 * @type {Room}
			 */
			const room = {
				room_id,
				users: [user],
				host_id,
				max_users: 2,
				room_type,
				room_status: SOCKET_ROOM_STATUS.WAITING,
				paragraph_to_type: await generate_sentence(),
			};

			this.rooms.set(room_id, room);
			socket.join(room_id);

			return room;
		} catch (err) {
			console.error(err);
			throw "Something went wrong.";
		}
	}
}

export { InMemoryStore };
