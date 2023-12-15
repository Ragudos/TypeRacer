import React from "react";
import Chat from "./chat";

export default function GameTooltip() {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "flex-end",
				gap: "0.175rem",
			}}
		>
			<Chat />
		</div>
	);
}
