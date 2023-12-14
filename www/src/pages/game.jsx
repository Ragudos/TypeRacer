import React from "react";
import useRoomInfo from "../hooks/useRoomInfo";
import { socket } from "../lib/socket";

export default function GamePage() {
	const roomInfo = useRoomInfo();

	React.useEffect(() => {
	}, []);

	if (!roomInfo) {
		return null;
	}

	return (
		<React.Fragment>
		</React.Fragment>
	);
}

