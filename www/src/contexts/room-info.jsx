// @ts-check
import React from "react";
import { socket } from "@/lib/socket";
import { toast } from "react-hot-toast";
import { SOCKET_ROOM_STATUS } from "@server/enums.mjs";

/**
 * @typedef {import("@server/adapters/in-memory.mjs").User} UserInfo
 * @typedef {import("@server/adapters/in-memory.mjs").Room} RoomInfo
 *
 * @typedef {Object} RoomInfoContextType
 * @property {RoomInfo | undefined} roomInfo
 * @property {React.Dispatch<React.SetStateAction<RoomInfo | undefined>>} setRoomInfo
 */

/**
 * @type {React.Context<RoomInfoContextType>}
 */
export const RoomInfoContext = React.createContext(
	/** @type {RoomInfoContextType} */ ({
		roomInfo: undefined,
		setRoomInfo: () => {},
	}),
);

/**
 * @param {{ children: React.ReactNode }} props
 */
export const RoomInfoContextProvider = (props) => {
	/**
	 * @type {[RoomInfo | undefined, React.Dispatch<React.SetStateAction<RoomInfo | undefined>>]}
	 */
	const [roomInfo, setRoomInfo] = React.useState();

	/**
	 * @type {(userInfo: UserInfo) => void}
	 */
	const onUserJoined = React.useCallback((userInfo) => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				users: [...prevRoomInfo.users, userInfo],
			};
		});

		toast(`${userInfo.username} joined the room.`);
	}, []);

	/**
	 * @type {(userWhoLeft: UserInfo, newHostUserId: string) => void} userId
	 */
	const onUserLeft = React.useCallback((userWhoLeft, newHostUserId) => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				users: prevRoomInfo.users.filter(
					(user) => user.user_id !== userWhoLeft.user_id,
				),
				host_id: newHostUserId,
			};
		});

		toast(`${userWhoLeft.username} left the room.`);
	}, []);

	/**
	 * @type {(roomType: import("@server/enums.mjs").SocketRoomType) => void}
	 */
	const receiveRoomTypeChanged = React.useCallback((roomType) => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				room_type: roomType,
			};
		});
	}, []);

	/**
	 * @type {(maxPlayers: number) => void}
	 */
	const receiveMaxPlayersChanged = React.useCallback((maxPlayers) => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				max_users: maxPlayers,
			};
		});
	}, []);

	const resetRoom = React.useCallback(() => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				room_status: SOCKET_ROOM_STATUS.WAITING,
			};
		});
		toast("Resetting room since you are the only one left.");
	}, []);

	const gameStarted = React.useCallback(() => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				room_status: SOCKET_ROOM_STATUS.COUNTDOWN,
			};
		});
	}, []);

	const countdownFinished = React.useCallback(() => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				room_status: SOCKET_ROOM_STATUS.PLAYING,
			};
		});
	}, []);

	const raceFinished = React.useCallback(() => {
		setRoomInfo((prevRoomInfo) => {
			if (!prevRoomInfo) {
				return undefined;
			}

			return {
				...prevRoomInfo,
				room_status: SOCKET_ROOM_STATUS.RESULTS,
			};
		});
	}, []);

	React.useEffect(() => {
		socket.on("max_players_changed", receiveMaxPlayersChanged);
		socket.on("room_type_changed", receiveRoomTypeChanged);
		socket.on("user_joined", onUserJoined);
		socket.on("user_left", onUserLeft);
		socket.on("send_room_info", setRoomInfo);
		socket.on("reset_room", resetRoom);
		socket.on("game_started", gameStarted);
		socket.on("countdown_finished", countdownFinished);
		socket.on("race_finished", raceFinished);
		return () => {
			socket.off("max_players_changed", receiveMaxPlayersChanged);
			socket.off("room_type_changed", receiveRoomTypeChanged);
			socket.off("user_joined", onUserJoined);
			socket.off("user_left", onUserLeft);
			socket.off("send_room_info", setRoomInfo);
			socket.off("reset_room", resetRoom);
			socket.off("game_started", gameStarted);
			socket.off("countdown_finished", countdownFinished);
			socket.off("race_finished", raceFinished);
		};
	}, [
		onUserJoined,
		onUserLeft,
		receiveRoomTypeChanged,
		receiveMaxPlayersChanged,
		resetRoom,
		gameStarted,
		countdownFinished,
		raceFinished,
	]);

	return (
		<RoomInfoContext.Provider value={{ roomInfo, setRoomInfo }}>
			{props.children}
		</RoomInfoContext.Provider>
	);
};
