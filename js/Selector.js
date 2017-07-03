let paper = require("paper")

// UI selection of one choice of many
module.exports = (Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)

	class Selector extends View {
		constructor(choices, pGroup, onSelect) {
			super()

			this.choices = choices
			this.currentChoiceKey = 0
			this.pGroup = pGroup

			this.pGroup.children.push(new paper.PointText({
				content: choices[0].label,
				justification: 'center',
				visible: false,
			}))
			this.pointText = this.pGroup.children[0]

			this.pointText.content = choices[0].label

			this.onSelect = onSelect

			// activation-specific metadata
			this.context = {}

			this.padOnHandler = (row, col) => {
				if(row !== 9) {
					return
				}

				console.log(this.currentChoiceKey)
				// up arrow
				if(col === 1) {
					this.currentChoiceKey = (this.currentChoiceKey + 1 < this.choices.length) ? this.currentChoiceKey + 1 : 0
				}
				// down arrow
				if(col === 2) {
					this.currentChoiceKey = (this.currentChoiceKey - 1 >= 0) ? this.currentChoiceKey - 1 : this.choices.length -1
				}
				// right arrow
				if(col === 4) {
					this.onSelect(this.choices[this.currentChoiceKey], this.context)
				}

				console.log(this.choices[this.currentChoiceKey])

				this.pointText.content = this.choices[this.currentChoiceKey].label
			}

			this.padOffHandler = (row, col) => {

			}
		}

		activate(context) {
			super.activate()
			this.pointText.visible = true
			this.context = context
		}

		deactivate() {
			super.deactivate()
			this.pointText.visible = false
		}
	}

	return Selector
}