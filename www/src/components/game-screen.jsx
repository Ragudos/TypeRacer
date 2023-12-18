import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";

import "@/styles/game-screen.css";

const GameScreen = React.memo(function () {
	const { roomInfo } = useRoomInfo();
	const [currentWordIdx, setCurrentWordIdx] = React.useState(0);
	const [input, setInput] = React.useState("");

	const tokenizedParagraph = React.useMemo(() => {
		return roomInfo.paragraph_to_type.split(" ");
	}, [roomInfo.paragraph_to_type]);

	const word_length = tokenizedParagraph.length;
	const currentWord = tokenizedParagraph[currentWordIdx];

	/**
	 * @param {React.ChangeEvent<HTMLInputElement>} e
	 */
	function onChange(e) {
		const value = e.target.value;
	}

	return (
		<div className="game-screen">
			<p className="game-screen__text">
				<span className="game-screen__text__done">
					{tokenizedParagraph
						.slice(0, currentWordIdx)
						.join(" ")}
				</span>
				&nbsp;
				<span>
					{tokenizedParagraph.slice(currentWordIdx).join(" ")}
				</span>
			</p>
		</div>
	);
});

GameScreen.displayName = "GameScreen";

export default GameScreen;
