import React from "react";
import { socket } from "./lib/socket";
import useSocketConnection from "./hooks/useSocketConnection";
import { SOCKET_ERRORS } from "../../server/src/enums.mjs";
import { toast } from "react-hot-toast";
import useRoomInfo from "./hooks/useRoomInfo";
import useRoomId from "./hooks/useRoomId";
import useUserInfo from "./hooks/useUserInfo";

export default function ErrorCatcher() {
	const { setIsConnected } = useSocketConnection();
	const { setRoomInfo } = useRoomInfo();
	const { setRoomId } = useRoomId();
	const { setUserId, setUsername } = useUserInfo();

	/**
	 * @type {(error: { name: import("@server/enums.mjs").SocketError, message: string }) => void}
	 */
	const handleError = React.useCallback(
		(error) => {
			if (
				error.name === SOCKET_ERRORS.ERROR ||
				error.name === SOCKET_ERRORS.ROOM_FULL ||
				error.name === SOCKET_ERRORS.ROOM_NOT_FOUND ||
				error.name === SOCKET_ERRORS.ROOM_CLOSED ||
				error.name === SOCKET_ERRORS.SERVER_FULL ||
				error.name === SOCKET_ERRORS.SERVER_SHUTDOWN
			) {
				console.error(error.message);
				toast.error(error.message);
				socket.disconnect();
				setIsConnected(false);
				setRoomInfo(undefined);

				const searchParams = new URLSearchParams(
					window.location.search,
				);
				const roomId = searchParams.get("roomId");
				setRoomId(roomId);
				setUserId("");
				setUsername("");
			}
		},
		[setIsConnected, setRoomInfo, setRoomId, setUserId, setUsername],
	);

	React.useEffect(() => {
		socket.on("error", handleError);
		return () => {
			socket.off("error", handleError);
		};
	}, [handleError]);

	return null;
}
