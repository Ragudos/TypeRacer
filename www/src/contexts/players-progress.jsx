// @ts-check

import useRoomInfo from "@/hooks/useRoomInfo";
import { socket } from "@/lib/socket";
import { calculateNormalizedValue } from "@/lib/utils";
import React from "react";

const WPM_WEIGHT = 0.8;
const ACCURACY_WEIGHT = 0.2;

/**
 * @typedef {Array<Omit<import("./room-info").UserInfo, "is_finished"> & Omit<import("@server/adapters/in-memory.mjs").Progress, "typed_word">>} ProgressContext
 */

export const PlayersProgressContext = React.createContext(
	/** @type {ProgressContext} */ ([]),
);

/**
 * @typedef {Object} Props
 * @prop {React.ReactNode} children
 */
export default function PlayersProgressProvider({ children }) {
	const { roomInfo } = useRoomInfo();

	/**
	 * @type {[ProgressContext, React.Dispatch<React.SetStateAction<ProgressContext>>]}
	 */
	const [playersProgress, setPlayersProgress] = React.useState(
		roomInfo.users.map((user) => {
			return {
				wpm: 0,
				avatar: user.avatar,
				user_id: user.user_id,
				username: user.username,
				progress: 0,
				accuracy: 1,
			};
		}),
	);

	const storeProgress = React.useCallback(
		/**
		 * @param {string} user_id
		 * @param {import("@server/adapters/in-memory.mjs").Progress} progress
		 */
		(user_id, progress) => {
			const storedProgress = sessionStorage.getItem(
				"typeracer-players-progress",
			);
			/**
			 * @type {(Omit<import("./room-info").UserInfo, "is_finished"> & { progress_status: import("@server/adapters/in-memory.mjs").Progress[] })[]}
			 */
			let progressToBeStored;

			if (!storedProgress) {
				progressToBeStored = playersProgress.map((playerProgress) => {
					if (playerProgress.user_id === user_id) {
						return {
							user_id: user_id,
							username: playerProgress.username,
							avatar: playerProgress.avatar,
							progress_status: [
								{
									typed_word: progress.typed_word,
									progress: progress.progress,
									wpm: progress.wpm,
									accuracy: progress.accuracy,
								},
							],
						};
					}

					return {
						user_id: playerProgress.user_id,
						username: playerProgress.username,
						avatar: playerProgress.avatar,
						progress_status: [
							{
								typed_word: "",
								progress: 0,
								wpm: 0,
								accuracy: 1,
							},
						],
					};
				});
			} else {
				/**
				 * @type {typeof progressToBeStored}
				 */
				const parsedStoredProgress = JSON.parse(storedProgress);
				progressToBeStored = parsedStoredProgress.map(
					(playerProgress) => {
						if (playerProgress.user_id === user_id) {
							return {
								user_id: user_id,
								username: playerProgress.username,
								avatar: playerProgress.avatar,
								progress_status: [
									...playerProgress.progress_status,
								],
							};
						}

						return playerProgress;
					},
				);
			}

			sessionStorage.setItem(
				"typeracer-players-progress",
				JSON.stringify(progressToBeStored),
			);
		},
		[playersProgress],
	);

	const updateProgress = React.useCallback(
		/**
		 * @param {string} user_id
		 * @param {import("@server/adapters/in-memory.mjs").Progress} progress
		 */
		(user_id, progress) => {
			storeProgress(user_id, progress);
			setPlayersProgress((curr) => {
				const wpmOfPlayers = curr.map((playerProgress) => {
					if (playerProgress.user_id === user_id) {
						return progress.wpm;
					}

					return playerProgress.wpm === 0 ? 1 : playerProgress.wpm;
				});
				const maxWpm = Math.max(...wpmOfPlayers);
				const minWpm = Math.min(...wpmOfPlayers);

				const accuracyOfPlayers = curr.map((playerProgress) => {
					if (playerProgress.user_id === user_id) {
						return progress.accuracy;
					}

					return playerProgress.accuracy;
				});

				const maxAccuracy = Math.max(...accuracyOfPlayers);
				const minAccuracy = Math.min(...accuracyOfPlayers);

				const newArr = curr
					.map((playerProgress) => {
						if (playerProgress.user_id === user_id) {
							return {
								...playerProgress,
								progress: progress.progress,
								wpm: progress.wpm,
								accuracy: progress.accuracy,
							};
						}

						return playerProgress;
					})
					.sort((a, b) => {
						const aNormalizedWpmAccuracy =
							calculateNormalizedValue(
								a.wpm === 0 ? 1 : a.wpm,
								minWpm,
								maxWpm,
							) *
								WPM_WEIGHT +
							calculateNormalizedValue(
								a.accuracy,
								minAccuracy,
								maxAccuracy,
							) *
								ACCURACY_WEIGHT;
						const bNormalizedWpmAccuracy =
							calculateNormalizedValue(
								b.wpm === 0 ? 1 : b.wpm,
								minWpm,
								maxWpm,
							) *
								WPM_WEIGHT +
							calculateNormalizedValue(
								b.accuracy,
								minAccuracy,
								maxAccuracy,
							) *
								ACCURACY_WEIGHT;

						if (aNormalizedWpmAccuracy > bNormalizedWpmAccuracy) {
							return -1;
						}

						if (aNormalizedWpmAccuracy < bNormalizedWpmAccuracy) {
							return 1;
						}

						return 0;
					});

				return newArr;
			});
		},
		[storeProgress],
	);

	React.useEffect(() => {
		socket.on("send_user_progress", updateProgress);
		return () => {
			socket.off("send_user_progress", updateProgress);
		};
	}, [updateProgress]);

	return (
		<PlayersProgressContext.Provider value={playersProgress}>
			{children}
		</PlayersProgressContext.Provider>
	);
}
