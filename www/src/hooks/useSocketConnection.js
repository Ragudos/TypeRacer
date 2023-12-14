import React from "react";
import { SocketConnectionContext } from "../contexts/socket-connection-context";

export default function useSocketConnection() {
	return React.useContext(SocketConnectionContext);
}

