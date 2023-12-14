// @ts-check

import { SOCKET_ERRORS, SOCKET_ROOM_TYPES, SOCKET_ROOM_STATUS } from "../enums.mjs";
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
		 * @type {import("../server.mjs").Server}
		 */
		this.server = server;
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
	 */
	joinNextAvailableRoom(socket, user_id) {
		const user = this.getUser(user_id);

		if (!user) {
			return;
		}

		if (this.rooms.size === 0) {
			this.createRoom(socket, user_id, SOCKET_ROOM_TYPES.PUBLIC).then(
				(room) => {
					if (!room) {
						return;
					}

					console.log(
						`User ${user_id} created room ${room.room_id}. Current state: `,
						this.rooms,
					);
				},
			);
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
			socket.emit("room_created", room.room_id);
			console.log(`User ${user_id} joined room ${room.room_id}. Current state: `, this.rooms);

			return;
		}

		this.createRoom(socket, user_id, SOCKET_ROOM_TYPES.PUBLIC).then(
			(room) => {
				if (!room) {
					return;
				}

				console.log(
					`User ${user_id} created room ${room.room_id}. Current state: `,
					this.rooms,
				);
			},
		);
	}

	/**
	 * @param {import("../server.mjs").Socket} socket
	 * @param {string} user_id
	 * @param {string} room_id
	 */
	joinRoom(socket, user_id, room_id) {
		const user = this.getUser(user_id);

		if (!user) {
			return;
		}

		if (!room_id) {
			this.joinNextAvailableRoom(socket, user_id);
			return;
		}

		const room = this.getRoom(room_id);

		if (!room) {
			socket.emit("error", {
				name: SOCKET_ERRORS.ROOM_NOT_FOUND,
				message: `Room ${room_id} not found.`,
			});
			return;
		}

		if (room.users.length >= room.max_users) {
			socket.emit("error", {
				name: SOCKET_ERRORS.ROOM_FULL,
				message: `Room ${room_id} is full.`,
			});
			return;
		}

		if (room.room_status != SOCKET_ROOM_STATUS.WAITING || room.room_type ===	SOCKET_ROOM_TYPES.CLOSED) {
			socket.emit("error", {
				name: SOCKET_ERRORS.ROOM_CLOSED,
				message: `Room ${room_id} is closed. Please try another room.`,
			});
			return;
		}

		if (room.users.some((user) => user.user_id === user_id)) {
			socket.emit("error", {
				name: SOCKET_ERRORS.ERROR,
				message: `User ${user_id} is already in room ${room_id}.`,
			});
			return;
		}

		room.users.push(user);
		this.server.to(room_id).emit("user_joined", user);
		socket.join(room_id);
		socket.emit("joined_room", room_id);
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
			socket.emit("error", {
				name: SOCKET_ERRORS.SERVER_FULL,
				message: "Server is full. Please try again later.",
			});
			return;
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
			socket.emit("room_created", room_id);

			return room;
		} catch (err) {
			console.error(err);
			socket.emit("error", {
				name: SOCKET_ERRORS.ERROR,
				message: "Something went wrong",
			});
			throw err;
		}
	}
}

export { InMemoryStore };

