// @ts-check

const { InMemoryStore } = require("./adapters/in-memory.cjs");
const { genRandomId } = require("./lib/utils.cjs");

/**
 * @global
 * @typedef {Object} ServerToClient
 * @property {(error: Error) => void} error
 * @property {(user: import("./adapters/in-memory.cjs").User) => void} user_joined
 * @property {(user: import("./adapters/in-memory.cjs").User) => void} user_left
 * @property {(room_id: string) => void} room_created
 *
 * @typedef {Object} ClientToServer
 * @property {() => void} create_room
 * @property {(room_id: string) => void} join_room
 * @property {(room_id: string) => void} leave_room
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
		this.__socket = socket;

		socket.on("error", this.onError.bind(this));
		socket.on("create_room", this.onCreateRoom.bind(this));
		socket.on("join_room", this.onJoinRoom.bind(this));
		socket.on("leave_room", this.onLeaveRoom.bind(this));
		socket.on("disconnecting", this.onDisconnecting.bind(this));
	}

	/**
	 * @param {string} room_id
	 */
	onLeaveRoom(room_id) {
		if (!this.__socket) {
			console.error(
				"This is an event listener callback. It should not be called directly.",
			);
			return;
		}

		this.store.leaveRoom(this.__socket, this.__socket.user_id, room_id);
	}

	/**
	 * @param {string} room_id
	 */
	onJoinRoom(room_id) {
		if (!this.__socket) {
			console.error(
				"This is an event listener callback. It should not be called directly.",
			);
			return;
		}

		this.store.joinRoom(this.__socket, this.__socket.user_id, room_id);
	}

	/**
	 * @param {string} host_id
	 */
	onCreateRoom(host_id) {
		if (!this.__socket) {
			console.error(
				"This is an event listener callback. It should not be called directly.",
			);
			return;
		}

		this.store
			.createRoom(this.__socket, host_id)
			.then((room) => {
				if (!this.__socket) {
					return;
				}

				if (!room) {
					return;
				}

				console.log(
					`User ${this.__socket.user_id} with a username of ${this.__socket.username} created a room with an id of ${room.room_id}`,
				);
			})
			.catch(console.error);
	}

	/**
	 * @param {string} reason
	 */
	onDisconnecting(reason) {
		if (!this.__socket) {
			console.error(
				"This is an event listener callback. It should not be called directly.",
			);
			return;
		}

		console.log(
			`User ${this.__socket.user_id} with a username of ${this.__socket.username} is disconnecting: ${reason}`,
		);

		for (const room_id of this.__socket.rooms.values()) {
			this.store.leaveRoom(this.__socket, this.__socket.user_id, room_id);
		}

		this.store.deleteUser(this.__socket.user_id);
	}

	/**
	 * @param {Error} error
	 */
	onError(error) {
		if (!this.__socket) {
			console.error(
				"This is an event listener callback. It should not be called directly.",
			);
			return;
		}

		console.error(error);
		this.__socket.emit("error", error);
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

module.exports = { TypingGameServer };
