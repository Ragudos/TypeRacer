// @ts-check

import React from "react";
import { socket } from "../lib/socket";

/**
 * @typedef {Object} RoomIdContext
 * @property {string} roomId
 * @property {React.Dispatch<React.SetStateAction<string>>} setRoomId
 */

/**
 * @type {React.Context<RoomIdContext>}
 */
export const RoomIdContext = React.createContext({
	roomId: "",
	setRoomId: () => {}
});

/**
 * @param {{ children: React.ReactNode }} props
 */
export const RoomIdContextProvider = (props) => {
	const [roomId, setRoomId] = React.useState("");

	React.useEffect(() => {
		const url = new URL(window.location.href);
		const roomId = url.searchParams.get("roomID");
		if (roomId) {
			setRoomId(roomId);
		}
	}, []);

	return (
		<RoomIdContext.Provider value={{ roomId, setRoomId }}>
			{props.children}
		</RoomIdContext.Provider>
	);
};

