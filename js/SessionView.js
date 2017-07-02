module.exports = (Launchpad) => {
	let View = require("./View")(Launchpad)
	let paper = require("paper")

	class SessionView extends View {
		constructor(pView) {
			super(pView)
		}

		activate() {
			this.pView.draw(new paper.PointText({
				point: [0, 20],
				content: 'Session view',
				fontSize: 22,
			}))
		}

		deactivate() {

		}

		render() {

		}
	}

	return SessionView
}
