import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App.jsx";
import "./styles/globals.css";
import { RoomIdContextProvider } from "./contexts/room-id.jsx";
import { UserInfoContextProvider } from "./contexts/user-info.jsx";
import { SocketConnectionContextProvider } from "./contexts/socket-connection-context.jsx";
import ErrorCatcher from "./error-catcher.jsx";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<SocketConnectionContextProvider>
			<RoomIdContextProvider>
				<UserInfoContextProvider>
					<Toaster
						toastOptions={{
							position: "top-right",
							style: {
								backgroundColor: "var(--background)",
								color: "var(--foreground)",
								boxShadow:
									"0 4px 12px hsl(var(--foreground) / 0.075)",
							},
						}}
					/>
					<ErrorCatcher />
					<App />
				</UserInfoContextProvider>
			</RoomIdContextProvider>
		</SocketConnectionContextProvider>
	</React.StrictMode>,
);
