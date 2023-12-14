// @ts-check

import React from "react";
import { socket } from "../lib/socket";

/**
 * @type {React.Context<string>}
 */
export const RoomIdContext = React.createContext("");

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
		socket.on("room_created", setRoomId);
		socket.on("joined_room", setRoomId);
		return () => {
			socket.off("room_created", setRoomId);
			socket.off("joined_room", setRoomId);
		};
	}, []);

	return (
		<RoomIdContext.Provider value={roomId}>
			{props.children}
		</RoomIdContext.Provider>
	);
};

