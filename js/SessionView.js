module.exports = (Tone, Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)
	let Selector = require("./Selector")(Launchpad, pView)
	let paper = require("paper")

	let ScaleSequencePattern = require("./ScaleSequencePattern")(Tone, Launchpad)
	let Bouncer = require("./BouncePattern")(Tone, Launchpad)
	let KitSequencePattern = require("./KitSequencePattern")(Tone, Launchpad)

	class SessionView extends View {
		constructor() {
			super()

			this.patterns = []

			// position-related data
			this.position = {}

			// text for the pattern selector
			this.patternTypeSelector = new Selector(
				[
					{
						label: "Kit pattern",
						value: "kitSequence"
					},
					{
						label: "Scale pattern",
						value: "scaleSequence",
					},
					{
						label: "Bouncer",
						value: "bounce"
					},
				],
				(choice, context) => {
					let patternKey = context.patternKey
					switch (choice.value) {
						case "kitSequence":
							this.patterns[patternKey] = new KitSequencePattern()
							break
						case "scaleSequence":
							this.patterns[patternKey] = new ScaleSequencePattern()
							break
						case "bounce":
							this.patterns[patternKey] = new Bouncer()
							break
						default:
							console.log("fatal error")
					}

					this.patterns[patternKey].activate({}, true)
				}
			)

			this.padOnHandler = (row, col) => {
				if (row === 9) {
					return
				}

				let patternKey = ((row - 1) * 8) + col

				if (patternKey in this.patterns) {
					// load into pattern
					this.patterns[patternKey].activate()
				} else {
					// new pattern
					Launchpad.setPad(row, col, "pulse", 60)
					this.patternTypeSelector.activate({patternKey: patternKey, origin: this}, false)
					this.patternTypeSelector.pGroup.position = pView.center
				}
			}

			this.padOffHandler = (row, col) => {

			}
		}

		render() {
			super.render()
			Launchpad.clearGrid()

			new paper.PointText({
				point: [160, 20],
				content: 'SESSION VIEW',
				fontSize: 22,
				justification: 'center',
			})

			Object.keys(this.patterns).forEach((key) => {
				let prow = Math.floor((key -1) / 8) + 1
				let pcol = key - ((prow - 1) * 8)

				let color
				switch(this.patterns[key].constructor.name) {
					case "KitSequence":
						color = 19
						break
					case "ScaleSequence":
						color = 49
						break
					case "Bouncer":
						color = 29
						break
				}

				if(this.patterns[key].part.state === "started") {
					Launchpad.setPad(prow, pcol, "flash", color)
				} else {
					Launchpad.setPad(prow, pcol, "on", color)
				}

			})
		}
	}

	return SessionView
}
