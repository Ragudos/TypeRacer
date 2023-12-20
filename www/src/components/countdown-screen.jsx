import { socket } from "@/lib/socket";
import { COUNTDOWN_COUNT, COUNTDOWN_SPEED } from "@server/consts.mjs";
import React from "react";

import "@/styles/countdown.css";

const CountdownScreen = React.memo(function () {
	/**
	 * @type {[number, React.Dispatch<React.SetStateAction<number>>]}
	 */
	const [count, setCount] = React.useState(COUNTDOWN_COUNT);

	React.useEffect(() => {
		socket.on("countdown", setCount);
		return () => {
			socket.off("countdown", setCount);
		};
	}, []);

	return (
		<div className="countdown__container">
			<div
				className="countdown"
				style={{ animationDuration: `${COUNTDOWN_SPEED}ms` }}
			>
				{count}
			</div>
		</div>
	);
});

CountdownScreen.displayName = "CountdownScreen";

export default CountdownScreen;
