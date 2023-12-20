import useRaceTime from "@/hooks/useRaceTime";
import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";
import { SOCKET_ROOM_STATUS } from "@server/enums.mjs";

const Timer = React.memo(() => {
	const { roomInfo } = useRoomInfo();
	const time = useRaceTime();

	const timeInFriendlyFormat = React.useMemo(() => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;

		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	}, [time]);

	return (
		<div className="race-timer">
			{roomInfo.room_status === SOCKET_ROOM_STATUS.RESULTS && (
				<div>Game finished.</div>
			)}
			{roomInfo.room_status === SOCKET_ROOM_STATUS.PLAYING && (
				<time>{timeInFriendlyFormat}</time>
			)}
		</div>
	);
});

Timer.displayName = "Timer";

export default Timer;
