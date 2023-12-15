/**
 * @typedef {Object} LoaderProps
 * @property {string} textToShow
 */

/**
 * @param {LoaderProps} props
 */
export default function Loader(props) {
	return (
		<div className="loader-container">
			<span className="rotating-loader" />
			<div>{props.textToShow}</div>
		</div>
	);
}
