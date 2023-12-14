import React from "react";
import { RoomIdContext } from "../contexts/room-id";

export default function useRoomId() {
	return React.useContext(RoomIdContext);
}
