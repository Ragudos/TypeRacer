import React from "react";
import HomePage from "./pages/home";
import useSocketConnection from "./hooks/useSocketConnection";
import { RoomInfoContextProvider } from "./contexts/room-info";

const GamePage = React.lazy(() => import("./pages/game"));

export default function App() {
	const { isConnected } = useSocketConnection();
	return (
		<React.Fragment>
			<main>
				<h1>Type Racer</h1>
				{ !isConnected && <HomePage /> }
				<RoomInfoContextProvider>
					{ isConnected && (
						<React.Suspense fallback={<p>Loading...</p>}>
							<GamePage />
						</React.Suspense>
					)}
				</RoomInfoContextProvider>
			</main>
		</React.Fragment>
	);
}

