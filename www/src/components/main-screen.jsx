import React from "react";

import useRoomInfo from "@/hooks/useRoomInfo";

import { SOCKET_ROOM_STATUS } from "@server/enums.mjs";

import Loader from "@/components/ui/loader";
import WaitingScreen from "./waiting-screen";
import CountdownScreen from "./countdown-screen";
import GameScreen from "./game-screen";
import PlayersProgressProvider from "@/contexts/players-progress";
import RaceTimerContextProvider from "@/contexts/race-timer";
import Timer from "./game-screen/timer";

const PlayersProgress = React.lazy(
	() => import("./game-screen/players-progress"),
);

export default function MainScreen() {
	const { roomInfo } = useRoomInfo();

	return (
		<React.Fragment>
			{roomInfo.room_status === SOCKET_ROOM_STATUS.WAITING && (
				<div className="main-screen">
					<WaitingScreen />
				</div>
			)}
			{(roomInfo.room_status === SOCKET_ROOM_STATUS.PLAYING ||
				roomInfo.room_status === SOCKET_ROOM_STATUS.RESULTS) && (
				<PlayersProgressProvider>
					<React.Suspense>
						<PlayersProgress />
					</React.Suspense>
					<RaceTimerContextProvider>
						<div className="main-screen">
							<Timer />
							{roomInfo.room_status ===
								SOCKET_ROOM_STATUS.PLAYING && (
									<GameScreen />
							)}
						</div>
					</RaceTimerContextProvider>
				</PlayersProgressProvider>
			)}
			{roomInfo.room_status === SOCKET_ROOM_STATUS.COUNTDOWN && (
				<div className="main-screen">
					<CountdownScreen />
				</div>
			)}
		</React.Fragment>
	);
}
