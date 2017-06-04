let remote = require("electron").remote
let Pattern = require("./Pattern")

module.exports = (Tone, Launchpad) => {
	class KitSequence extends Pattern {
		constructor(kitName) {
			super()

			let kit = remote.getCurrentWindow().kits.children.find((el, ind, arr) => {
				return el.name === kitName
			})

			let kitSamples = kit.children.map((el, ind, arr) => {
					return "./" + el.path
			})

			this.player = new Tone.MultiPlayer(kitSamples, () => {
				this.part = new Tone.Part((time, data) => {
					for (let sample in data.samples) {
						this.player.start(sample, time)
					}
				})
				this.part.loop = true
				this.part.loopEnd = "1 * 1m"
				this.part.start("@1m")
			}).toMaster()

			// explained in ScaleSequencePattern.js
			this.view = {}
			this.view.measureOffset = 0
			this.view.noteZoom = 8
			this.view.sampleOffset = 0
		}

		activate() {
			this.onHandlerId = Launchpad.on("noteon", (row, col) => {
				if (row === 9) {
					switch (col) {
						case 1:
							// sample set up
							this.view.sampleOffset += 8
							break;
						case 2:
							// sample set down
							this.view.sampleOffset = Math.max(0, this.view.sampleOffset + 8)
							break;
						case 3:
							// measure left
							this.view.measureOffset = Math.max(0, this.view.measureOffset - 1)
							break;
						case 4:
							// measure right
							this.view.measureOffset += 1
							break;
					}

					this._render()
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
				if (loopLength < this.view.measureOffset + 1) {
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


		// draw scene to Launchpad from scratch
		_render() {
			console.log("Render")
			console.log("Samples: " + this.view.sampleOffset)
			console.log("Measure: " + this.view.measureOffset)

			// turn off the grid
			for (let i = 1; i <= 8; i += 1) {
				for (let j = 1; j <= 8; j += 1) {
					Launchpad.setPad(i, j, "off")
				}
			}

			// get all events
			this.part._events.forEach((event) => {
				let eventData = event.value

				// we only need to draw the events on this measure grid
				if(eventData.measureOffset === this.view.measureOffset) {
					eventData.samples.forEach((sample) => {
						let samplePos = sample + 1 + this.view.sampleOffset
						if(samplePos >= 1 && samplePos <= 8) {
							Launchpad.setPad(sample + 1 + this.view.sampleOffset, eventData.measureTime, "on", 19)
						}
					})
				}
			})
		}
	}

	return KitSequence
}
