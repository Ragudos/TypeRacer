import useRaceTime from "@/hooks/useRaceTime";
import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";

const Timer = React.memo(() => {
	const { isRaceFinished } = useRoomInfo();
	const time = useRaceTime();

	const timeInFriendlyFormat = React.useMemo(() => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;

		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	}, [time]);

	return (
		<div className="race-timer">
			{isRaceFinished && <div>The race has ended</div>}
			{!isRaceFinished && <time>{timeInFriendlyFormat}</time>}
		</div>
	);
});

Timer.displayName = "Timer";

export default Timer;
