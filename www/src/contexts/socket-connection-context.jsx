import React from "react";
import { socket } from "../lib/socket";

/**
 * @typedef {Object} SocketConnectionContextType
 * @property {boolean} isConnected
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setIsConnected
 */

/**
 * @type {React.Context<SocketConnectionContextType>}
 */
export const SocketConnectionContext = React.createContext({
	isConnected: socket.connected,
	setIsConnected: (_isConnected) => {},
});

/**
 * @param {{ children: React.ReactNode }} props
 */
export const SocketConnectionContextProvider = (props) => {
	const [isConnected, setIsConnected] = React.useState(socket.connected);

	return (
		<SocketConnectionContext.Provider
			value={{
				isConnected,
				setIsConnected,
			}}
		>
			{props.children}
		</SocketConnectionContext.Provider>
	);
};

