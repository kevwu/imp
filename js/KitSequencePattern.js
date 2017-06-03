let Pattern = require("./Pattern")

module.exports = (Tone, Launchpad) => {
	class KitSequence extends Pattern {
		constructor() {
			super()

			this.view = {}
			this.view.measureOffset = 0
			this.view.noteZoom = 8
			this.view.sampleOffset = 0

			this.player = new Tone.MultiPlayer([
				"./kits/808/BD7575.WAV",
				"./kits/808/CB.WAV",
				"./kits/808/HT75.WAV",
				"./kits/808/SD7575.WAV",
			], () => {
				this.part = new Tone.Part((time, data) => {
					console.log(time)
					// this.player.start(Object.values(data.samples), time)
					for(let sample in data.samples) {
						this.player.start(sample, time)
					}
				})
				this.part.loop = true
				this.part.loopEnd = "1 * 1m"
				this.part.start("@1m")
			}).toMaster()
		}

		activate() {
			this.onHandlerId = Launchpad.on("noteon", (row, col) => {
				if (row === 9) {
					return
				}

				if (col === 9) {
					return
				}

				let sampleIndex = (row - 1) + this.view.sampleOffset

				let time = ((col - 1) + (this.view.measureOffset * this.view.noteZoom)) + " * " + this.view.noteZoom + "n"

				// extend part length if necessary
				let loopLength
				if (this.part.loopEnd === "1m") {
					loopLength = 1
				} else {
					loopLength = parseInt(this.part.loopEnd.replace("*1m", ""))
				}

				console.log(loopLength)
				if (loopLength < this.view.measureOffset + 1) {
					// extend part
					this.part.loopEnd = (this.view.measureOffset + 1) + "*1m"
				}

				if (this.part.at(time) === null) { // part at time doesn't exist, create it (and add the note, since that definitely did not exist)
					let samples = []
					samples[sampleIndex] = sampleIndex
					this.part.at(time, {
						samples: samples,
						measureTime: col, // position within the measure
						measureOffset: this.view.measureOffset, // grid position
					})
					Launchpad.setPad(row, col, "on", 19)
				} else { // part exists at this time, modify it
					let partAtTime = this.part.at(time).value

					if (typeof partAtTime.samples[sampleIndex] === "undefined") { // note doesn't exist, add it
						partAtTime.samples[sampleIndex] = sampleIndex
						Launchpad.setPad(row, col, "on", 19)
					} else { // sample is switched on, switch it off
						delete partAtTime.samples[sampleIndex]
						Launchpad.setPad(row, col, "off")

						if (partAtTime.samples.length === 0) { // if we were left with an empty array, delete the part
							this.part.remove(time)
						}
					}

					this.part.at(time, partAtTime)
				}
			})

			this.offHandlerId = Launchpad.on("noteoff", (row, col) => {
			})
		}

		deactivate() {
			Launchpad.off("noteon", this.onHandlerId)
			Launchpad.off("noteoff", this.offHandlerId)
		}
	}

	return KitSequence
}
