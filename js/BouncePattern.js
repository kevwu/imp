module.exports = (Tone, Launchpad, pView) => {
	let Pattern = require("./Pattern")(Launchpad, pView)

	class BouncePattern extends Pattern {

		constructor() {
			super()

			// each column contains a bouncing note
			this.columns = []

			// left/right offset
			this.position = {}
			this.position.measureOffset = 0

			this.tick = new Tone.Loop((time) => {
				for (let col in this.columns) {
					col = parseInt(col)
					let bouncer = this.columns[col]

					// clear current height
					Launchpad.setPad(bouncer.height, (parseInt(col) + parseInt(this.position.measureOffset)), "off")

					let color = 29

					bouncer.height = Math.min(Math.max(bouncer.height + bouncer.direction, 1), bouncer.maxHeight);

					if (bouncer.height === 1 || bouncer.height === bouncer.maxHeight) {
						bouncer.direction *= -1
					}

					if (bouncer.height === 1) {
						bouncer.instrument.triggerAttackRelease(new Tone.Frequency("A4").transpose(col * 2), "16n")
						color = 36
					}

					Launchpad.setPad(bouncer.height, col + this.position.measureOffset, "on", color)
				}
			}, "32n")
			this.tick.start(0)

			this.onHandler = (row, col) => {
				if (row === 9 || col === 9) {
					return
				}

				for (let i = 1; i <= 8; i += 1) {
					Launchpad.setPad(i, col, "off")
				}

				// "true" column
				let bounceColumn = (col + this.position.measureOffset)

				// either delete or create a bouncer with period 1
				if (row === 1 && this.columns[bounceColumn]) {
					delete this.columns[bounceColumn]
					return
				}

				let bouncer = {
					maxHeight: row, // initial height is max height
					height: row,
					instrument: new Tone.Synth().toMaster(),
					direction: -1,
				}

				this.columns[bounceColumn] = bouncer
			}

			this.offHandler = (row, col) => {

			}
		}
	}

	return BouncePattern
}