import React from "react";
import Progress from "../ui/progress";
import usePlayersProgress from "@/hooks/usePlayersProgress";
import useUserInfo from "@/hooks/useUserInfo";
import useRoomInfo from "@/hooks/useRoomInfo";

export const PlayersProgress = React.memo(() => {
	const { userId } = useUserInfo();
	const { roomInfo } = useRoomInfo();
	const playersProgress = usePlayersProgress();

	return (
		<div className="list-of-progress">
			{playersProgress.map((playerProgress) => {
				const didPlayerLeave = !roomInfo.users.some(
					(user) => user.user_id === playerProgress.user_id,
				);

				return (
					<div
						className="list-of-progress__child"
						style={didPlayerLeave ? { opacity: 0.5 } : undefined}
						key={playerProgress.user_id}
					>
						<small>
							{playerProgress.username}{" "}
							{playerProgress.user_id === userId && "(you)"}{" "}
							{didPlayerLeave && "(left)"}
						</small>
						<Progress
							maximumValue={100}
							currentValue={playerProgress.progress}
							label={
								playerProgress.username +
								"'s progress in typing"
							}
						/>
						<small>
							<span>WPM: {playerProgress.wpm}</span>

							<span>
								Accuracy:{" "}
								{(playerProgress.accuracy * 100).toFixed(2)}%
							</span>
						</small>
					</div>
				);
			})}
		</div>
	);
});

PlayersProgress.displayName = "PlayersProgress";

export default PlayersProgress;
