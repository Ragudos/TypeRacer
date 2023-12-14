// @ts-check
const { genRandomId } = require("../lib/utils.cjs");

/**
 * @global
 *
 * @typedef {Object} Room
 * @property {string} room_id
 * @property {User[]} users
 * @property {string} host_id
 * @property {number} max_users
 *
 * @typedef {Object} User
 * @property {string} user_id
 * @property {string} username
 * @property {string} avatar
 */

class InMemoryStore {
	/**
	 * @param {import("../server.cjs").Server} server
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
		 * @type {import("../server.cjs").Server}
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
		console.debug(
			`Added user ${user_id}. Current state: `,
			this.users,
		);
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
	 * @param {import("../server.cjs").Socket} socket
	 * @param {string} user_id
	 * @param {string} room_id
	 */
	joinRoom(socket, user_id, room_id) {
		const user = this.getUser(user_id);

		if (!user) {
			return;
		}

		const room = this.getRoom(room_id);

		if (!room) {
			return;
		}

		room.users.push(user);
		this.server.to(room_id).emit("user_joined", user);
		socket.join(room_id);
	}

	/**
	 * @param {import("../server.cjs").Socket} socket
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
		socket.leave(room_id);
		this.server.to(room_id).emit("user_left", user);
		
		console.log(`User ${user_id} left room ${room_id}. Current state: `, this.rooms);
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
	 * @param {import("../server.cjs").Socket} socket
	 * @param {string} host_id
	 * @returns {Promise<Room | undefined>}
	 */
	async createRoom(socket, host_id) {
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
				max_users: 4,
			};

			this.rooms.set(room_id, room);

			socket.join(room_id);
			socket.emit("room_created", room_id);
			return room;
		} catch (err) {
			console.error(err);
			socket.emit("error", new Error("Something went wrong."));
			throw err;
		}
	}
}

module.exports = { InMemoryStore };
