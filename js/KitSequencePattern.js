let remote = require("electron").remote

module.exports = (Tone, Launchpad, pView) => {
	let Pattern = require("./Pattern")(Launchpad, pView)

	class KitSequence extends Pattern {
		constructor() {
			super()

			// TODO choose this via modal
			let kitName = '808'

			let kit = remote.getCurrentWindow().kits.children.find((el, ind, arr) => {
				return el.name === kitName
			})

			let kitSamples = kit.children.map((el, ind, arr) => {
					return "./" + el.path
			})
			this.numSamples = kitSamples.length

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
			this.position = {}
			this.position.measureOffset = 0
			this.position.noteZoom = 8
			this.position.sampleOffset = 0

			this.onHandler = (row, col) => {
				if (row === 9) {
					switch (col) {
						case 1:
							// sample set up
							this.position.sampleOffset += 8
							break;
						case 2:
							// sample set down
							this.position.sampleOffset = Math.max(0, this.position.sampleOffset - 8)
							break;
						case 3:
							// measure left
							this.position.measureOffset = Math.max(0, this.position.measureOffset - 1)
							break;
						case 4:
							// measure right
							this.position.measureOffset += 1
							break;
					}

					this.render()
					return
				}

				if (col === 9) {
					return
				}

				let sampleIndex = (row - 1) + this.position.sampleOffset

				if(sampleIndex >= this.numSamples) {
					console.log("Sample out of range: " + sampleIndex)
					return
				}

				let time = ((col - 1) + (this.position.measureOffset * this.position.noteZoom)) + " * " + this.position.noteZoom + "n"

				// extend part length if necessary
				let loopLength
				if (this.part.loopEnd === "1m") {
					loopLength = 1
				} else {
					loopLength = parseInt(this.part.loopEnd.replace("*1m", ""))
				}
				if (loopLength < this.position.measureOffset + 1) {
					this.part.loopEnd = (this.position.measureOffset + 1) + "*1m"
				}

				if (this.part.at(time) === null) { // part at time doesn't exist, create it (and add the note, since that definitely did not exist)
					let samples = []
					samples[sampleIndex] = sampleIndex
					this.part.at(time, {
						samples: samples,
						measureTime: col, // position within the measure
						measureOffset: this.position.measureOffset, // grid position
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
			}

			this.offHandler = (row, col) => {
			}
		}

		// draw scene to Launchpad from scratch
		render() {
			// turn off the grid
			Launchpad.clearGrid()


			// at first render, this.part might not exists
			if(typeof this.part !== "undefined") {
				// get all events
				this.part._events.forEach((event) => {
					let eventData = event.value

					// we only need to draw the events on this measure grid
					if(eventData.measureOffset === this.position.measureOffset) {
						console.log(eventData.samples)
						eventData.samples.forEach((sample) => {
							let samplePos = sample + 1 - this.position.sampleOffset
							if(samplePos >= 1 && samplePos <= 8) {
								Launchpad.setPad(sample + 1 - this.position.sampleOffset, eventData.measureTime, "on", 19)
							}
						})
					}
				})
			}
		}
	}

	return KitSequence
}
