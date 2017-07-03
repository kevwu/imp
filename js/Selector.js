// UI selection of one choice of many
module.exports = (Launchpad) => {
	class Selector {
		constructor(choices, pointText, onSelect) {
			this.choices = choices
			this.pointText = pointText

			this.pointText.content = choices[0]
		}
	}

	return Selector
}