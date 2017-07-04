module.exports = (Tone, Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)
	let Selector = require("./Selector")(Launchpad, pView)
	let paper = require("paper")

	let ScaleSequencePattern = require("./ScaleSequencePattern")(Tone, Launchpad)
	let BouncePattern = require("./BouncePattern")(Tone, Launchpad)
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
				new paper.Group({
					style: {
						fillColor: '#000'
					},
				}),
				(choice, context) => {
					console.log(choice)

					let patternKey = context.patternKey
					switch(choice.value) {
						case "kitSequence":
							this.patterns[patternKey] = new KitSequencePattern()
							break
						case "scaleSequence":
							this.patterns[patternKey] = new ScaleSequencePattern()
							break
						case "bounce":
							this.patterns[patternKey] = new BouncePattern()
							break
						default:
							console.log("fatal error")
					}

					console.log(this.patterns[patternKey])

					this.patterns[patternKey].activate({}, true)
				}
			)
			// must be set after initialization
			this.patternTypeSelector.pGroup.position = pView.center

			this.padOnHandler = (row, col) => {
				if (row === 9) {
					return
				}

				let patternKey = ((row - 1) * 8) + col
				console.log(patternKey)

				if (patternKey in this.patterns) {
					// load into pattern
					this.patterns[patternKey].activate()
				} else {
					// new pattern
						Launchpad.setPad(row, col, "pulse", 60)
						this.patternTypeSelector.activate({patternKey: patternKey}, false)
				}
			}

			this.padOffHandler = (row, col) => {

			}
		}

		render() {
			new paper.PointText({
				point: [160, 20],
				content: 'SESSION VIEW',
				fontSize: 22,
				justification: 'center',
			})
		}
	}

	return SessionView
}
