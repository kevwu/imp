module.exports = (Launchpad, pView) => {
	class View {
		constructor() {
			this.padOnHandler = null
			this.padOffHandler = null
			this.active = false
		}

		// when pView is switched into
		// bind event handlers, render previous state to Launchpad, etc
		activate(context = {}) {
			this.active = true
			this.padOnHandlerId = Launchpad.on("noteon", this.padOnHandler)
			this.padOffHandlerId = Launchpad.on("noteoff", this.padOffHandler)
			this.render()
		}

		// runs when switching away from pView
		// clear event handlers, reset Launchpad, etc
		deactivate() {
			this.active = false
			Launchpad.off("noteon", this.padOnHandlerId)
			Launchpad.off("noteoff", this.padOffHandlerId)
		}

		// (re)draw everything, both to Paper and Launchpad as necessary
		render() {

		}
	}

	return View
}
