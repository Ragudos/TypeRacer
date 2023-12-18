// @ts-check

export class Timeout {
	/**
	 * @param {number} delay
	 * @param {() => void} cb
	 */
	constructor(delay, cb) {
		/**
		 * @private
		 * @type {number}
		 */
		this.delay = delay;
		/**

		 * @private
		 * @type {number | null}
		 */
		this.timeStarted = null;
		/**
		 * @private
		 * @type {boolean}
		 */
		this.running = false;
		/**
		 * @private
		 * @type {NodeJS.Timeout | undefined}
		 */
		this.timeout = undefined;
		/**
		 * @private
		 * @type {() => void}
		 */
		this.cb = cb;
	}

	/**
	 * @returns {boolean}
	 */
	isRunning() {
		return this.running;
	}

	/**
	 * @returns {void}
	 */
	start() {
		if (this.running) {
			return;
		}

		if (this.delay <= 0) {
			return;
		}

		this.running = true;
		this.timeStarted = Date.now();
		this.timeout = setTimeout(() => {
			this.running = false;
			this.timeout = undefined;
			this.cb();
		}, this.delay);
	}

	/**
	 * @returns {void}
	 */
	stop() {
		if (!this.running) {
			return;
		}

		if (!this.timeStarted) {
			return;
		}

		const currentTime = Date.now();
		const timeLeft = this.delay - (currentTime - this.timeStarted);

		this.delay = timeLeft;
		this.running = false;
		clearTimeout(this.timeout);
		this.timeout = undefined;
	}
}

export class Timer {
	/**
	 * @param {number} delay
	 * @param {number | undefined} ticks amount of ticks until zero
	 * @param {(currentTick: number | undefined, isFinished: boolean | undefined) => void} cb
	 */
	constructor(delay, ticks, cb) {
		if (this.ticks && this.ticks < 1) {
			console.error("Timer ticks must be greater than 0");
			this.ticks = 1;
		}

		/**
		 * @private
		 * @type {number}
		 */
		this.delay = delay;
		/**
		 * @private
		 * @type {boolean}
		 */
		this.running = false;
		/**
		 * @private
		 * @type {NodeJS.Timeout | undefined}
		 */
		this.timer = undefined;
		/**
		 * @private
		 * @type {(currentTick: number | undefined, isFinished: boolean | undefined) => void}
		 */
		this.cb = cb;
		/**
		 * @private
		 * @type {number | undefined}
		 */
		this.ticks = ticks;
	}

	/**
	 * @returns {boolean}
	 */
	isRunning() {
		return this.running;
	}

	/**
	 * @returns {void}
	 */
	start() {
		if (this.running) {
			return;
		}

		this.running = true;
		this.timer = setInterval(() => {
			if (this.ticks) {
				this.ticks -= 1;
			}

			if (this.ticks === 0) {
				this.stop();
			}

			this.cb(
				this.ticks,
				this.ticks != undefined ? this.ticks === 0 : undefined,
			);
		}, this.delay);
	}

	/**
	 * @returns {void}
	 */
	stop() {
		if (!this.running) {
			return;
		}

		this.running = false;
		clearInterval(this.timer);
		this.timer = undefined;
	}
}
