import React from "react";
import HomePage from "./pages/home";
import useSocketConnection from "./hooks/useSocketConnection";
import { RoomInfoContextProvider } from "./contexts/room-info";
import Loader from "./components/ui/loader";

const GamePage = React.lazy(() => import("./pages/game"));

export default function App() {
	const { isConnected } = useSocketConnection();

	return (
		<React.Fragment>
			<main>
				<h1>Type Racer</h1>
				<RoomInfoContextProvider>
					{!isConnected && <HomePage />}
					{isConnected && (
						<React.Suspense
							fallback={
								<Loader textToShow="Loading waiting screen..." />
							}
						>
							<GamePage />
						</React.Suspense>
					)}
				</RoomInfoContextProvider>
			</main>
		</React.Fragment>
	);
}
