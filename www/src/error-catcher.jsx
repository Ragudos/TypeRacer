import React from "react";
import { socket } from "./lib/socket";
import useSocketConnection from "./hooks/useSocketConnection";
import { SOCKET_ERRORS } from "../../server/src/enums.mjs";
import { toast } from "react-hot-toast";

export default function ErrorCatcher() {
	const { setIsConnected } = useSocketConnection();

	/**
	 * @type {(error: { name: import("../../server/src/enums.mjs").SocketError, message: string }) => void}
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
			}
		},
		[setIsConnected],
	);

	React.useEffect(() => {
		socket.on("error", handleError);
		return () => {
			socket.off("error", handleError);
		};
	}, [handleError]);

	return null;
}
