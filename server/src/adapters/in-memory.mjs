// @ts-check

import { SOCKET_ROOM_TYPES, SOCKET_ROOM_STATUS } from "../enums.mjs";
import { genRandomId } from "../lib/utils.mjs";

const MAX_ALLOWED_ROOMS = 1;

/**
 * @global
 *
 *
 * @typedef {Object} Room
 * @property {string} room_id
 * @property {User[]} users
 * @property {string} host_id
 * @property {number} max_users
 * @property {import("../enums.mjs").SocketRoomType} room_type
 * @property {import("../enums.mjs").SocketRoomStatus} room_status
 *
 * @typedef {Object} User
 * @property {string} user_id
 * @property {string} username
 * @property {string} avatar
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
		 * @type {import("../server.mjs").Server}
		 */
		this.server = server;
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

		this.chats.get(room_id)?.push(chat);

		return chat;
	}

	/**
	 * @param {string} room_id
	 */
	getChats(room_id) {
		return this.chats.get(room_id);
	}

	/**
	 * @param {string} user_id
	 * @param {string} username
	 * @param {string} avatar
	 */
	addUser(user_id, username, avatar) {
		this.users.set(user_id, { user_id, username, avatar });
		console.debug(`Added user ${user_id}. Current state: `, this.users);
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
	leaveRoom(socket, user_id, room_id) {
		const user = this.getUser(user_id);

		if (!user) {
			return;
		}

		const room = this.getRoom(room_id);

		if (!room) {
			return;
		}

		if (room.users.length === 1) {
			this.deleteRoom(room_id);

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

		console.log(
			`User ${user_id} left room ${room_id}. Current state: `,
			this.rooms,
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
