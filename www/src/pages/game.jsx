import React from "react";
import useUserInfo from "../hooks/useUserInfo";
import useRoomInfo from "../hooks/useRoomInfo";
import { SOCKET_ROOM_STATUS } from "../../../server/src/enums.mjs";
import WaitingScreen from "../components/waiting-screen";
import Loader from "../components/loader.jsx";

const GameScreen = React.lazy(() => import("../components/game-screen"));

export default function GamePage() {
	const roomInfo = useRoomInfo();
	const userInfo = useUserInfo();

	React.useEffect(() => {
		console.table("Room Info: ", roomInfo, "User Info: ", userInfo);
	}, [roomInfo, userInfo]);
	
	if (!roomInfo) {
		return null;
	}

	return (
		<div className="container">
			{roomInfo.room_status === SOCKET_ROOM_STATUS.WAITING && <WaitingScreen />}
			{roomInfo.room_status === SOCKET_ROOM_STATUS.IN_PROGRESS && (
				<React.Suspense fallback={<Loader textToShow="Loading screen..." />}>
					<GameScreen />
				</React.Suspense>
			)}
		</div>
	);
}

