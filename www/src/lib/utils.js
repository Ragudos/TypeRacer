/**
 * Calculate the overall WPM of a user without the mistakes/errors
 * @param {number} typedEntriesLength
 * @param {number} averageWordLength
 * @param {number} timeElapsedInSeconds
 */
export function calculateGrossWPM(
	typedEntriesLength,
	averageWordLength,
	timeElapsedInSeconds,
) {
	const minutes = timeElapsedInSeconds / 60;
	return Math.floor(typedEntriesLength / averageWordLength / minutes);
}

/**
 * Calculate the typing accuracy of a user
 * @param {number} entriesLength
 * @param {number} numberOfErrors
 */
export function calculateAccuracy(entriesLength, numberOfErrors) {
	const accuracy = (entriesLength - numberOfErrors) / entriesLength;
	return parseFloat(accuracy.toFixed(4));
}

/**
 * Calculate the rate of how much a percentage covers its base
 * @param {number} percentage
 * @param {number} base
 */
export function calculateRate(percentage, base) {
	return Math.floor((percentage / base) * 100);
}

/**
 * Calculate the average length of each word in the typed entry
 * @param {string} typedEntry
 */
export function calculateAverageWordLength(typedEntry) {
	const wordsInTypedEntry = typedEntry.split(" ");
	return Math.floor(
		wordsInTypedEntry.reduce((acc, word) => {
			return acc + word.length;
		}, 0) / wordsInTypedEntry.length,
	);
}

