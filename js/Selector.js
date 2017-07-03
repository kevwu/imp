// UI selection of one choice of many
module.exports = (Launchpad, pView) => {
	let View = require("./View")(Launchpad, pView)

	class Selector extends View {
		constructor(choices, pointText, onSelect) {
			super()
			this.choices = choices
			this.currentChoice = 0
			this.pointText = pointText

			this.pointText.content = choices[0]

			this.onHandler = (row, col) => {
				if(row !== 9) {
					return
				}

				console.log(this.currentChoice)
				if(col === 1) {
					this.currentChoice = (this.currentChoice + 1 < this.choices.length) ? this.currentChoice + 1 : 0
				}
				if(col === 2) {
					this.currentChoice = (this.currentChoice - 1 >= 0) ? this.currentChoice - 1 : this.choices.length -1
				}

				console.log(this.currentChoice)

				this.pointText.content = this.choices[this.currentChoice]
			}

			this.offHandler = (row, col) => {

			}
		}

		activate() {
			super.activate()
			this.pointText.visible = true
		}

		deactivate() {
			super.deactivate()
			this.pointText.visible = false
		}
	}

	return Selector
}