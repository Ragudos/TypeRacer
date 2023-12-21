import "@/styles/results.css";
import React from "react";

import usePlayersProgress from "@/hooks/usePlayersProgress";
import useUserInfo from "@/hooks/useUserInfo";
import useRoomInfo from "@/hooks/useRoomInfo";

const BackToLobbyButton = React.lazy(() => import("./back-to-lobby-button"));

export default function ResultsScreen() {
	const { isRaceFinished, roomInfo } = useRoomInfo();
	const { userId } = useUserInfo();
	const playersProgress = usePlayersProgress();

	const isCurrentUserHost = userId === roomInfo.host_id;

	const ownProgress = React.useMemo(() => {
		return playersProgress.find((progress) => userId === progress.user_id);
	}, [playersProgress, userId]);

	return (
		<React.Fragment>
			{isRaceFinished && isCurrentUserHost && (
				<React.Suspense>
					<BackToLobbyButton />
				</React.Suspense>
			)}

			{isRaceFinished && !isCurrentUserHost && (
				<p>Waiting for the room owner to reset the room...</p>
			)}
			<section className="results-screen">
				<table role="table">
					<caption role="caption">Race Results</caption>
					<thead>
						<tr role="row">
							<th role="columnheader">Placement</th>
							<th role="columnheader">Name</th>
							<th role="columnheader">WPM</th>
							<th role="columnheader">Accuracy</th>
						</tr>
					</thead>
					<tbody>
						{playersProgress.map((playerProgress, idx) => {
							return (
								<tr role="row" key={playerProgress.user_id}>
									<td
										aria-readonly="true"
										role="cell"
										data-cell="placement"
									>
										{idx + 1}
									</td>
									<td
										aria-readonly="true"
										role="cell"
										data-cell="name"
									>
										<span>
											{playerProgress.username}
											{playerProgress.user_id ===
												userId && (
												<small>&#40;you&#41;</small>
											)}
										</span>
									</td>
									<td
										aria-readonly="true"
										role="cell"
										data-cell="words per minute"
									>
										{playerProgress.wpm}
									</td>
									<td
										aria-readonly="true"
										role="cell"
										data-cell="accuracy"
									>
										{(
											playerProgress.accuracy * 100
										).toFixed(2)}
										%
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</section>
		</React.Fragment>
	);
}
