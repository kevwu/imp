let View = require("./View.js")

class Pattern extends View{
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

module.exports = Pattern