// @ts-check

/**
 * @readonly
 */
const SOCKET_ERRORS = /** @type {const} */ ({
	SERVER_FULL: "ServerFull",
	ROOM_FULL: "RoomFull",
	ROOM_NOT_FOUND: "RoomNotFound",
	ROOM_CLOSED: "RoomClosed",
	ERROR: "Error",
	SERVER_SHUTDOWN: "ServerShutdown",
});

const SOCKET_ROOM_TYPES = /** @type {const} */ ({
	PRIVATE: "private",
	PUBLIC: "public",
	CLOSED: "closed",
});

const SOCKET_ROOM_STATUS = /** @type {const} */ ({
	PLAYING: "playing",
	WAITING: "waiting",
	COUNTDOWN: "countdown",
	RESULTS: "results",
});

const TIMER_SUFFIXES = /** @type {const} */ ({
	COUNTDOWN: "-countdown",
	GAME: "-game",
});

/**
 * @global
 * @typedef {typeof SOCKET_ERRORS[keyof typeof SOCKET_ERRORS]} SocketError
 * @typedef {typeof SOCKET_ROOM_TYPES[keyof typeof SOCKET_ROOM_TYPES]} SocketRoomType
 * @typedef {typeof SOCKET_ROOM_STATUS[keyof typeof SOCKET_ROOM_STATUS]} SocketRoomStatus
 * @typedef {typeof TIMER_SUFFIXES[keyof typeof TIMER_SUFFIXES]} TimerSuffix
 */

export { SOCKET_ERRORS, SOCKET_ROOM_TYPES, SOCKET_ROOM_STATUS, TIMER_SUFFIXES };
