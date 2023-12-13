const crypto = require("node:crypto");

function genRandomId() {
	return new Promise((resolve, reject) => {
		crypto.(8, (err, buf) => {
			if (err) {
				reject(err);
			}
			resolve(buf.toString('hex'));
		});
	});
}

