let paper = require("paper")

module.exports = (Launchpad, pView) => {
	class View {
		constructor() {
			this.padOnHandler = null
			this.padOffHandler = null

			this.pLayer = new paper.Layer()
		}

		// when pView is switched into
		// bind event handlers, render previous state to Launchpad, etc
		activate(context = {}, hideOther = true) {
			// deactivate other patterns

			// give this view its own layer and switch into it
			if(hideOther) {
				paper.project.activeLayer.visible = false
			}
			this.pLayer.visible = true
			this.pLayer.activate()

			// clear launchpad bindings
			Launchpad.unbind()

			// activate this pattern

			this.padOnHandlerId = Launchpad.on("noteon", this.padOnHandler)
			this.padOffHandlerId = Launchpad.on("noteoff", this.padOffHandler)

			this.context = context

			this.render()
		}

		// (re)draw everything, both to Paper and Launchpad as necessary
		render() {

		}
	}

	return View
}
