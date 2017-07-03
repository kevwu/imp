module.exports = (Launchpad, pView) => {
	class View {
		constructor() {
			this.onHandler = null
			this.offHandler = null
		}

		// when pView is switched into
		// bind event handlers, render previous state to Launchpad, etc
		activate() {
			this.onHandlerId = Launchpad.on("noteon", this.onHandler)
			this.offHandlerId = Launchpad.on("noteoff", this.offHandler)
			this.render()
		}

		// runs when switching away from pView
		// clear event handlers, reset Launchpad, etc
		deactivate() {
			Launchpad.off("noteon", this.onHandlerId)
			Launchpad.off("noteoff", this.offHandlerId)
		}

		// (re)draw everything, both to Paper and Launchpad as necessary
		render() {

		}
	}

	return View
}
