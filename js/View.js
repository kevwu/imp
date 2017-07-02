class View {
	constructor(pView) {
		this.pView = pView
	}

	// when pView is switched into
	// bind event handlers, render previous state to Launchpad, etc
	activate() {

	}

	// runs when switching away from pView
	// clear event handlers, reset Launchpad, etc
	deactivate() {

	}
}

module.exports = View