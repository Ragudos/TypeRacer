import React from "react";
import "../styles/copy-box.css";

/**
 * @param {Object} props
 * @param {string} props.stringToCopy
 */
export default function CopyBox(props) {
	const [didCopy, setDidCopy] = React.useState();

	/**
	 * @type {React.MutableRefObject<NodeJS.Timeout | null>}
	 */
	const timer = React.useRef(null);

	// Reset didCopy when stringToCopy changes.
	React.useEffect(() => {
		setDidCopy(false);
	}, [props.stringToCopy]);

	return (
		<div className="copy-box">
			<small className="copy-box__text">{props.stringToCopy}</small>
			<button
				className="btn-ghost btn-icon copy-box__button"
				onClick={() => {
					navigator.clipboard.writeText(props.stringToCopy);
					setDidCopy(true);

					if (timer.current) {
						clearTimeout(timer.current);
						timer.current = null;
					}

					timer.current = setTimeout(() => {
						setDidCopy(false);
					}, 2000);
				}}
				aria-label="Click to copy room id to clipboard"
				title={didCopy ? "Copied!" : "Copy to clipboard"}
			>
				{!didCopy && (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						className="icon"
					>
						<path
							fillRule="evenodd"
							d="M13.887 3.182c.396.037.79.08 1.183.128C16.194 3.45 17 4.414 17 5.517V16.75A2.25 2.25 0 0114.75 19h-9.5A2.25 2.25 0 013 16.75V5.517c0-1.103.806-2.068 1.93-2.207.393-.048.787-.09 1.183-.128A3.001 3.001 0 019 1h2c1.373 0 2.531.923 2.887 2.182zM7.5 4A1.5 1.5 0 019 2.5h2A1.5 1.5 0 0112.5 4v.5h-5V4z"
							clipRule="evenodd"
						/>
					</svg>
				)}
				{didCopy && (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						className="icon"
					>
						<path
							fillRule="evenodd"
							d="M18 5.25a2.25 2.25 0 00-2.012-2.238A2.25 2.25 0 0013.75 1h-1.5a2.25 2.25 0 00-2.238 2.012c-.875.092-1.6.686-1.884 1.488H11A2.5 2.5 0 0113.5 7v7h2.25A2.25 2.25 0 0018 11.75v-6.5zM12.25 2.5a.75.75 0 00-.75.75v.25h3v-.25a.75.75 0 00-.75-.75h-1.5z"
							clipRule="evenodd"
						/>
						<path
							fillRule="evenodd"
							d="M3 6a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V7a1 1 0 00-1-1H3zm6.874 4.166a.75.75 0 10-1.248-.832l-2.493 3.739-.853-.853a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.154-.114l3-4.5z"
							clipRule="evenodd"
						/>
					</svg>
				)}
			</button>
		</div>
	);
}
