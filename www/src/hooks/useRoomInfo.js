import React from "react";
import { RoomInfoContext } from "../contexts/room-info";

export default function useRoomInfo() {
	return React.useContext(RoomInfoContext);
}

