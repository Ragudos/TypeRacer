// @ts-check
import React from "react";
import { socket } from "../lib/socket";
import { toast } from "react-hot-toast";

/**
 * @typedef {import("../../../server/src/adapters/in-memory.mjs").User} UserInfo
 * @typedef {import("../../../server/src/adapters/in-memory.mjs").Room} RoomInfo
 *
 * @typedef {RoomInfo | undefined} RoomInfoContextType
 */

/**
 * @type {React.Context<RoomInfoContextType>}
 */
export const RoomInfoContext = React.createContext(/** @type {RoomInfoContextType | undefined} */(undefined));

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
	const onUserJoined = React.useCallback(
		(userInfo) => {
			setRoomInfo((prevRoomInfo) => {
				if (!prevRoomInfo) {
					return undefined;
				}

				prevRoomInfo.users.push(userInfo);
				return prevRoomInfo;
			});
			
			toast(`${userInfo.username} joined the room.`);
		},
		[]
	);

	/**
	 * @type {(userWhoLeft: UserInfo, newHostUserId: string) => void} userId
	 */
	const onUserLeft = React.useCallback(
		(userWhoLeft, newHostUserId) => {
			setRoomInfo((prevRoomInfo) => {
				if (!prevRoomInfo) {
					return undefined;
				}

				prevRoomInfo.users.splice(prevRoomInfo.users.findIndex((user) => user.user_id === userWhoLeft.user_id), 1);
				prevRoomInfo.host_id = newHostUserId;
				return prevRoomInfo;
			});

			toast(`${userWhoLeft.username} left the room.`);
		},
		[]
	);

	/**
	 * @type {(roomId: string) => void}
	 */
	const onRoomConnection = React.useCallback(
		(roomId) => {
			if (roomInfo) {
				console.log("Requesting room info more than once.");
				return;
			}

			if (!roomId) {
				return;
			}

			socket.emit("request_room_info", roomId);
		},
		[roomInfo]
	);

	/**
	 * @type {(roomInfo: RoomInfo) => void}
	 */
	const receiveRoomInfo = React.useCallback(
		(roomInfo) => {
			setRoomInfo(roomInfo);	
		},
		[]
	);

	React.useEffect(() => {
		socket.on("joined_room", onRoomConnection);
		socket.on("room_created", onRoomConnection);
		socket.on("send_room_info", receiveRoomInfo);
		socket.on("user_joined", onUserJoined);
		socket.on("user_left", onUserLeft);
		return () => {
			socket.off("joined_room", onRoomConnection);
			socket.off("room_created", onRoomConnection);
			socket.off("send_room_info", receiveRoomInfo);
			socket.off("user_joined", onUserJoined);
			socket.off("user_left", onUserLeft);
		};
	}, [receiveRoomInfo, onRoomConnection, onUserJoined, onUserLeft]);

	return (
		<RoomInfoContext.Provider value={roomInfo}>
			{props.children}
		</RoomInfoContext.Provider>
	);
};

