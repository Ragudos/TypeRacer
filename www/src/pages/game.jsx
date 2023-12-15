import React from "react";
import useUserInfo from "../hooks/useUserInfo";
import useRoomInfo from "../hooks/useRoomInfo";
import { SOCKET_ROOM_STATUS } from "../../../server/src/enums.mjs";
import WaitingScreen from "../components/waiting-screen";
import Loader from "../components/loader.jsx";
import "../styles/game.css";
import GameTooltip from "../components/game-tooltip.jsx";

const GameScreen = React.lazy(() => import("../components/game-screen"));
const CountdownScreen = React.lazy(
	() => import("../components/countdown-screen"),
);

export default function GamePage() {
	const { roomInfo } = useRoomInfo();
	const userInfo = useUserInfo();

	React.useEffect(() => {
		console.table("Room Info: ", roomInfo, "User Info: ", userInfo);
	}, [roomInfo, userInfo]);

	if (!roomInfo) {
		return null;
	}

	return (
		<div className="container">
			<div className="main-screen">
				{roomInfo.room_status === SOCKET_ROOM_STATUS.WAITING && (
					<WaitingScreen />
				)}
				{roomInfo.room_status === SOCKET_ROOM_STATUS.COUNTDOWN && (
					<React.Suspense
						fallback={
							<Loader textToShow="Loading countdown screen..." />
						}
					>
						<CountdownScreen />
					</React.Suspense>
				)}
				{roomInfo.room_status === SOCKET_ROOM_STATUS.IN_PROGRESS && (
					<React.Suspense
						fallback={
							<Loader textToShow="Loading game screen..." />
						}
					>
						<GameScreen />
					</React.Suspense>
				)}
			</div>

			<div className="list-of-players">
				<GameTooltip />
				<ul>
					{roomInfo.users.map((user) => (
						<li key={user.user_id} className="player">
							{user.avatar && (
								<img
									src={user.avatar}
									alt={`${user.username}'s avatar`}
									className="icon"
									loading="eager"
								/>
							)}
							<span
								style={{
									marginLeft: "0.5rem",
									display: "flex",
									gap: "0.5rem",
								}}
							>
								{user.user_id === roomInfo.host_id && (
									<small>👑</small>
								)}
								{user.user_id === userInfo.userId && (
									<small style={{ wordBreak: "keep-all" }}>
										&#40;you&#41;
									</small>
								)}
								{user.username}
							</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
