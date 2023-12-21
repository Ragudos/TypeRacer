import "@/styles/progress.css";

/**
 * @typedef {Object} ProgressProps
 * @property {number} maximumValue
 * @property {number} currentValue
 * @property {string} label
 */
export default function Progress({ maximumValue, currentValue, label }) {
	return (
		<div className="progress">
			<div
				aria-label={label}
				role="progressbar"
				aria-valuenow={currentValue}
				aria-valuemax={maximumValue}
				className="progress__bar"
				style={{
					"--_x": `${
						Math.floor((currentValue / maximumValue) * 100) - 100
					}%`,
				}}
			/>
		</div>
	);
}
