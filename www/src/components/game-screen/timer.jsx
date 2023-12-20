import useRaceTime from "@/hooks/useRaceTime";
import React from "react";

const Timer = React.memo(() => {
	const time = useRaceTime();

	const timeInFriendlyFormat = React.useMemo(() => {
		const minutes = Math.floor(time / 60);
		const seconds = time % 60;

		return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
	}, [time]);

	return (
		<div className="race-timer">
			<time>{timeInFriendlyFormat}</time>
		</div>
	);
});

Timer.displayName = "Timer";

export default Timer;
