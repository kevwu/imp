module.exports = (Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)
	let Selector = require("./Selector")(Launchpad, pView)
	let paper = require("paper")

	class SessionView extends View {
		constructor() {
			super()

			this.patterns = []

			// position-related data
			this.position = {}

			// text for the pattern selector
			this.patternTypeSelection = new Selector(
				[
					{
						label: "Kit pattern",
						value: "kitsequence"
					},
					{
						label: "Scale pattern",
						value: "scalepattern",
					},
					{
						label: "Bouncer",
						value: "bouncepattern"
					},
				],
				new paper.PointText({
					point: [200, 20],
					visible: false,
				}),
				(choice) => {
					console.log(choice)
				}
			)

			this.onHandler = (row, col) => {
				if (row === 9) {
					return
				}

				let patternKey = ((row - 1) * 8) + col
				console.log(patternKey)

				if (patternKey in this.patterns) {
					// load into pattern
					this.deactivate()
					this.patterns[patternKey].activate()
				} else {
					// new pattern
					this.patternTypeSelection.activate()
				}
			}

			this.offHandler = (row, col) => {

			}
		}

		render() {
			new paper.PointText({
				point: [0, 20],
				content: 'Session view',
				fontSize: 22,
			})
		}
	}

	return SessionView
}
