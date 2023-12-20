import useRoomInfo from "@/hooks/useRoomInfo";
import { socket } from "@/lib/socket";
import React from "react";

/**
 * @typedef {Array<import("./room-info").UserInfo & Omit<import("@server/adapters/in-memory.mjs").Progress, "typed_word">>} ProgressContext
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

	const updateProgress = React.useCallback(
		/**
		 * @param {string} user_id
		 * @param {import("@server/adapters/in-memory.mjs").Progress} progress
		 */
		(user_id, progress) => {
			setPlayersProgress((curr) => {
				return curr.map((playerProgress) => {
					if (playerProgress.user_id === user_id) {
						return {
							...playerProgress,
							progress: progress.progress,
							wpm: progress.wpm,
							accuracy: progress.accuracy,
						};
					}

					return playerProgress;
				});
			});
		},
		[],
	);

	React.useEffect(() => {
		socket.on("send_user_progress", updateProgress);
		return () => {
			socket.off("send_user_progress", updateProgress);
		};
	}, [updateProgress]);

	React.useEffect(() => {
		setPlayersProgress((curr) => {
			return curr.filter((progress) => {
				return roomInfo.users.some((user) => {
					return user.user_id === progress.user_id;
				});
			});
		});
	}, [roomInfo]);

	return (
		<PlayersProgressContext.Provider value={playersProgress}>
			{children}
		</PlayersProgressContext.Provider>
	);
}
