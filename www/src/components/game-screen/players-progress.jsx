import React from "react";
import Progress from "../ui/progress";
import usePlayersProgress from "@/hooks/usePlayersProgress";

export const PlayersProgress = React.memo(() => {
	const playersProgress = usePlayersProgress();

	return (
		<div className="list-of-progress">
			{playersProgress.map((playerProgress) => {
				return (
					<div
						className="list-of-progress__child"
						key={playerProgress.user_id}
					>
						<div>{playerProgress.username}</div>
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
