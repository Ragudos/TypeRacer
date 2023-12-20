import { RaceTimeContext } from "@/contexts/race-timer";
import React from "react";

export default function useRaceTime() {
	return React.useContext(RaceTimeContext);
}
