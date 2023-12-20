import useRoomInfo from "@/hooks/useRoomInfo";
import React from "react";

/**
 * @typedef {Object} DisplayProps
 * @property {string} finishedSentence
 * @property {string} hiddenFinishedSentence
 * @property {boolean} didError
 */

export const Display = React.memo(
	/**
	 * @type {(props: DisplayProps) => JSX.Element}
	 */
	({ finishedSentence, hiddenFinishedSentence, didError }) => {
		const { roomInfo } = useRoomInfo();

		const paragraph = roomInfo.paragraph_to_type;

		return (
			<React.Fragment>
				<span className="game-screen__text__done">
					{paragraph.slice(0, hiddenFinishedSentence.length)}
				</span>
				<span
					className="game-screen__text__input"
					data-error={didError}
				>
					{paragraph.slice(
						hiddenFinishedSentence.length,
						finishedSentence.length,
					)}
				</span>
				{finishedSentence.length != paragraph.length && (
					<span className="game-screen__text__current">
						{paragraph.slice(
							finishedSentence.length,
							finishedSentence.length + 1,
						)}
					</span>
				)}
				<span className="game-screen__text__undone">
					{paragraph.slice(
						Math.min(paragraph.length, finishedSentence.length + 1),
					)}
				</span>
			</React.Fragment>
		);
	},
);

Display.displayName = "Display";
