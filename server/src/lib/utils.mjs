import crypto from "node:crypto";

/**
 *@returns {Promise<string>}
 */
function genRandomId() {
	return new Promise((resolve, reject) => {
		crypto.randomBytes(3, (err, buf) => {
			if (err) {
				reject(err);
			}
			resolve(buf.toString("hex"));
		});
	});
}

/**
 * @param {number} duration Duration to wait in milliseconds
 */
function sleep(duration) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, duration);
	});
}

export { genRandomId, sleep };
