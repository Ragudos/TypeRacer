import React from "react";
import useRoomInfo from "../hooks/useRoomInfo";

const WaitingScreen = React.memo(function () {
	const { roomInfo } = useRoomInfo();

	return <div>hi</div>;
});

WaitingScreen.displayName = "WaitingScreen";

export default WaitingScreen;
