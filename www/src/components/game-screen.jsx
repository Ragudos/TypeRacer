import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";

import "@/styles/game-screen.css";

const GameScreen = React.memo(function () {
	const { roomInfo } = useRoomInfo();
	// The whole already accepted input without the currently shown input
	const [hiddenFinishedSentence, setHiddenFinishedSentence] = React.useState("");
	// The whole input value including the currently shown input
	const [finishedSentence, setFinishedSentence] = React.useState("");
	// For visual, the contents of the input el
	const [input, setInput] = React.useState("");

	const paragraph = roomInfo.paragraph_to_type;

	const didError = paragraph.slice(0, finishedSentence.length) !== finishedSentence;

	/**
	 * @type {React.MutableRefObject<HTMLInputElement>}
	 */
	const inputRef = React.useRef(null);

	/**
	 * @param {React.ChangeEvent<HTMLInputElement>} e
	 */
	function onChange(e) {
		const value = e.target.value;

		setInput(value);
		setFinishedSentence((prevSentence) => {
			const didBackspace = e.nativeEvent.inputType === "deleteContentBackward";

			if (didBackspace) {
				if (prevSentence[prevSentence.length - 1] === " " && !didError) {
					return prevSentence;
				} else {
					return prevSentence.slice(0, prevSentence.length - 1);
				}
			} else {
				return prevSentence + (value[value.length - 1] || "");
			}
		});

		if (value[value.length - 1] === " " && !didError) {
			if (finishedSentence.length != paragraph.length - 1 && paragraph[finishedSentence.length] === " ") {
				setHiddenFinishedSentence((prevSentence) => prevSentence + value);
				setInput("");
			}
		}
	}

	console.log("Hidden sentence ", hiddenFinishedSentence, "Finished sentence ", finishedSentence, "Input ", input, "didError ", didError);

	function focusInput() {
		if (!inputRef.current) {
			return;
		}

		inputRef.current.focus();
	}

	return (
		<div className="game-screen" onClick={focusInput}>
			<p className="game-screen__text">
				<span className="game-screen__text__done">
					{paragraph.slice(0, hiddenFinishedSentence.length)}
				</span>
				<span className="game-screen__text__input" data-error={didError}>
					{paragraph.slice(hiddenFinishedSentence.length, finishedSentence.length)}
				</span>
				{finishedSentence.length != paragraph.length && (
					<span className="game-screen__text__current">
						{paragraph.slice(finishedSentence.length, finishedSentence.length + 1)}
					</span>
				)}
				<span className="game-screen__text__undone">
					{paragraph.slice(Math.min(paragraph.length, finishedSentence.length + 1))}
				</span>
			</p>
			<input
				type="text"
				ref={inputRef}
				value={input}
				onChange={onChange}
				placeholder="Type here..."
				autoFocus
			/>
		</div>
	);
});

GameScreen.displayName = "GameScreen";

export default GameScreen;
