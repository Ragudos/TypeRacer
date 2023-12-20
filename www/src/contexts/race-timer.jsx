import { socket } from "@/lib/socket";
import { RACE_TIMER_COUNT } from "@server/consts.mjs";
import React from "react";

export const RaceTimeContext = React.createContext(RACE_TIMER_COUNT);

export default function RaceTimerContextProvider({ children }) {
	const [time, setTime] = React.useState(RACE_TIMER_COUNT);

	React.useEffect(() => {
		socket.on("race_time_left", setTime);
		return () => {
			socket.off("race_time_left", setTime);
		};
	}, []);

	return (
		<RaceTimeContext.Provider value={time}>
			{children}
		</RaceTimeContext.Provider>
	);
}
