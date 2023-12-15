// @ts-check
import React from "react";
import { socket } from "../lib/socket";
import { toast } from "react-hot-toast";

/**
 * @typedef {import("../../../server/src/adapters/in-memory.mjs").User} UserInfo
 * @typedef {import("../../../server/src/adapters/in-memory.mjs").Room} RoomInfo
 *
 * @typedef {Object} RoomInfoContextType
 * @property {RoomInfo | undefined} roomInfo
 * @property {React.Dispatch<React.SetStateAction<RoomInfo | undefined>>} setRoomInfo
 */

/**
 * @type {React.Context<RoomInfoContextType>}
 */
export const RoomInfoContext = React.createContext(/** @type {RoomInfoContextType} */({
	roomInfo: undefined,
	setRoomInfo: () => {}
}));

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

				return {
					...prevRoomInfo,
					users: [...prevRoomInfo.users, userInfo]
				};
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

				return {
					...prevRoomInfo,
					users: prevRoomInfo.users.filter((user) => user.user_id !== userWhoLeft.user_id),
					host_id: newHostUserId
				};
			});

			toast(`${userWhoLeft.username} left the room.`);
		},
		[]
	);

	React.useEffect(() => {
		socket.on("user_joined", onUserJoined);
		socket.on("user_left", onUserLeft);
		return () => {
			socket.off("user_joined", onUserJoined);
			socket.off("user_left", onUserLeft);
		};
	}, [onUserJoined, onUserLeft]);

	return (
		<RoomInfoContext.Provider value={{ roomInfo, setRoomInfo }}>
			{props.children}
		</RoomInfoContext.Provider>
	);
};

