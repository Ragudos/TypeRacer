import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";

import "@/styles/game-screen.css";
import { Display } from "./display";
import { socket } from "@/lib/socket";
import useUserInfo from "@/hooks/useUserInfo";
import { calculateAccuracy, calculateAverageWordLength, calculateGrossWPM, calculateRate } from "@/lib/utils";
import { RACE_TIMER_COUNT } from "@server/consts.mjs";
import useRaceTime from "@/hooks/useRaceTime";

const GameScreen = React.memo(function () {
	const { roomInfo } = useRoomInfo();
	const { userId } = useUserInfo();
	const time = useRaceTime();
	// The whole already accepted input without the currently shown input
	const [hiddenFinishedSentence, setHiddenFinishedSentence] =
		React.useState("");
	// The whole input value including the currently shown input
	const [finishedSentence, setFinishedSentence] = React.useState("");
	// For visual, the contents of the input el
	const [input, setInput] = React.useState("");
	const [errors, setErrors] = React.useState(0);

	const paragraph = roomInfo.paragraph_to_type;

	const didError = React.useMemo(() => {
		return paragraph.slice(0, finishedSentence.length) !== finishedSentence;
	}, [paragraph, finishedSentence]);

	/**
	 * @param {string} word
	 */
	function processProgress(word) {
		const entriesLength = paragraph.length;
		const typedEntry = hiddenFinishedSentence + word + " ";
		const typedEntriesLength = typedEntry.length;

		const progress = calculateRate(typedEntriesLength, entriesLength);
		const wpm = calculateGrossWPM(
			typedEntriesLength,
			calculateAverageWordLength(typedEntry),
			RACE_TIMER_COUNT - time,
		);
		const accuracy = calculateAccuracy(paragraph.length, errors);

		/**
		 * @type {import("@server/adapters/in-memory.mjs").Progress}
		 */
		const result = {
			typed_word: word,
			wpm,
			progress,
			accuracy,
		};

		if (paragraph === hiddenFinishedSentence) {
			socket.emit("send_progress", roomInfo.room_id, userId, result);
		} else {
			socket.volatile.emit(
				"send_progress",
				roomInfo.room_id,
				userId,
				result,
			);
		}
	}

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
			const didBackspace =
				e.nativeEvent.inputType === "deleteContentBackward";

			if (didBackspace) {
				if (
					prevSentence[prevSentence.length - 1] === " " &&
					!didError
				) {
					return prevSentence;
				} else {
					return prevSentence.slice(0, prevSentence.length - 1);
				}
			} else {
				return prevSentence + (value[value.length - 1] || "");
			}
		});

		if (value[value.length - 1] === " " && !didError) {
			if (
				finishedSentence.length != paragraph.length - 1 &&
				paragraph[finishedSentence.length] === " "
			) {
				setHiddenFinishedSentence((prevSentence) => {
					const newValue = prevSentence + value;
					processProgress(value.trim());

					return newValue;
				});
				setInput("");
			}
		}
	}

	function focusInput() {
		if (!inputRef.current) {
			return;
		}

		inputRef.current.focus();
	}

	React.useEffect(() => {
		if (didError) {
			setErrors((prevErrors) => prevErrors + 1);
		}
	}, [didError]);

	return (
		<React.Fragment>
			<div className="game-screen" onClick={focusInput}>
				<p className="game-screen__text">
					<Display
						finishedSentence={finishedSentence}
						hiddenFinishedSentence={hiddenFinishedSentence}
						didError={didError}
					/>
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
		</React.Fragment>
	);
});

GameScreen.displayName = "GameScreen";

export default GameScreen;
