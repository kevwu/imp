let paper = require("paper")

// UI selection of one choice of many
module.exports = (Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)

	class Selector extends View {
		constructor(choices, onSelect) {
			super()

			this.choices = choices
			this.currentChoiceKey = 0

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

				// left arrow (cancel)
				if(col === 3) {
					this.context.origin.activate()
				}

				// right arrow
				if(col === 4) {
					this.onSelect(this.choices[this.currentChoiceKey], this.context)
				}

				this.pointText.content = this.choices[this.currentChoiceKey].label
			}

			this.padOffHandler = (row, col) => {

			}
		}

		activate(context, hideOthers = false) {
			super.activate(context, hideOthers)

			this.pLayer.removeChildren()

			this.pGroup = new paper.Group()

			this.pGroup.children.push(new paper.PointText({
				content: this.choices[0].label,
				justification: 'center',
				visible: false,
			}))
			this.pointText = this.pGroup.children[0]

			this.pointText.content = this.choices[0].label

			this.pointText.visible = true
		}
	}

	return Selector
}