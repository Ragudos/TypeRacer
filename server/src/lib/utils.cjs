const crypto = require("node:crypto");

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

module.exports = { genRandomId };
