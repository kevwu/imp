class Pattern {
	// when pattern is added
	constructor() {
		this.instrument = null
	}

	// when pattern is switched into
	// bind event handlers, render previous state to Launchpad, etc
	activate() {

	}

	// runs when switching away from pattern
	// clear event handlers, reset Launchpad, etc
	deactivate() {

	}

	// start up the pattern (usually quantized)
	play() {

	}

	// stop the pattern (usually quantized)
	stop() {

	}
}

module.exports = Pattern