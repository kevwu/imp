let Pattern = require("./Pattern")

module.exports = (Tone, Launchpad) => {
	class BouncePattern extends Pattern {

		constructor() {
			super()

			// each column contains a bouncing note
			this.columns = []

			// left/right offset
			this.view = {}
			this.view.measureOffset = 0

			this.tick = new Tone.Loop((time) => {
				for (let col in this.columns) {
					col = parseInt(col)
					let bouncer = this.columns[col]

					// clear current height
					Launchpad.setPad(bouncer.height, (parseInt(col) + parseInt(this.view.measureOffset)), "off")

					let color = 29

					bouncer.height = Math.min(Math.max(bouncer.height + bouncer.direction, 1), bouncer.maxHeight);

					if (bouncer.height === 1 || bouncer.height === bouncer.maxHeight) {
						bouncer.direction *= -1
					}

					if (bouncer.height === 1) {
						bouncer.instrument.triggerAttackRelease(new Tone.Frequency("A4").transpose(col * 2), "16n")
						color = 36
					}

					Launchpad.setPad(bouncer.height, col + this.view.measureOffset, "on", color)
				}
			}, "32n").start(0)
		}

		activate() {
			this.onHandlerId = Launchpad.on("noteon", (row, col) => {
				if (row === 9 || col === 9) {
					return
				}

				for (let i = 1; i <= 8; i += 1) {
					Launchpad.setPad(i, col, "off")
				}

				// "true" column
				let bounceColumn = (col + this.view.measureOffset)

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
			})
		}

		deactivate() {
			Launchpad.off("noteon", this.onHandlerId)
		}
	}

	return BouncePattern
}