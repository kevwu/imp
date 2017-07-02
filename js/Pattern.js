module.exports = (Launchpad) => {
	let View = require("./View.js")(Launchpad)

	class Pattern extends View {
		// when pattern is added
		constructor(pView) {
			super(pView)
			this.instrument = null
		}

		// start up the pattern (usually quantized)
		start() {

		}

		// stop the pattern (usually quantized)
		stop() {

		}
	}

	return Pattern
}
