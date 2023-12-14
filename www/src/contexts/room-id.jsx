// @ts-check

import React from "react";

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
	}, []);

	return (
		<RoomIdContext.Provider value={roomId}>
			{props.children}
		</RoomIdContext.Provider>
	);
};

