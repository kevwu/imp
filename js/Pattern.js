module.exports = (Launchpad, pView) => {
	let View = require("./View.js")(Launchpad, pView)

	class Pattern extends View {
		// when pattern is added
		constructor() {
			super()
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
