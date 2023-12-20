import { PlayersProgressContext } from "@/contexts/players-progress";
import React from "react";

export default function usePlayersProgress() {
	return React.useContext(PlayersProgressContext);
}
