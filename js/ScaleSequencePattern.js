let teoria = require("teoria")
let Pattern = require("./Pattern")

module.exports = (Tone, Launchpad) => {
	class ScaleSequence extends Pattern {
		constructor() {
			super()
			// synth must support polyphony
			this.instrument = new Tone.PolySynth(6, Tone.Synth).toMaster()
			this.sequence = []

			// default time to hold the note before releasing. Can be overriden
			this.holdTime = "16n"
			// eventually this can be set from higher, e.g. at the project level
			this.baseNote = new teoria.note.fromString("Bb4")

			// pView-related variables
			this.position = {}
			this.position.measureOffset = 0 // what section of the pattern the LP is currently focusing on (in 32n)
			// note "resolution" of the LP pView (e.g. each grid is a 32nd note, 16th note, etc)
			// this is turned into Tone's representation of a note
			// just use 4 for 4n, 8 for 8n, etc.
			this.position.noteZoom = 8

			this.part = new Tone.Part((time, data) => {
				this.instrument.triggerAttackRelease(Object.values(data.notes), this.holdTime, time)
			})
			this.part.loop = true
			this.part.loopEnd = "1 * 1m"
			this.part.start("@1m")

			this.scaleType = "major"
		}

		activate() {
			this.onHandlerId = Launchpad.on("noteon", (row, col) => {
				if (row === 9) {
					switch (col) {
						case 1:
							// octave up
							// this.position.octaveOffset += 12
							this.baseNote = this.baseNote.interval("P8")
							break;
						case 2:
							// octave down
							// this.position.octaveOffset -= 12
							this.baseNote = this.baseNote.interval("P-8")
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

					this._render()
					return
				}

				if (col === 9) {
					// right side round buttons don't do anything yet
					return
				}

				// get note from row
				let scale = new teoria.scale(this.baseNote, this.scaleType)
				// we don't need to do row-1 because teoria.scale.get() starts at 1
				let note = scale.get(row).scientific()

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
					let notesArr = []
					notesArr[note] = note
					this.part.at(time, {
						notes: notesArr,
						hold: [this.holdTime],
						measureTime: col, // position within the measure
						measureOffset: this.position.measureOffset, // grid position
					})
					Launchpad.setPad(row, col, "on", 49)
				} else { // part exists at this time, modify it
					let partAtTime = this.part.at(time).value

					if (!partAtTime.notes[note]) { // note doesn't exist, add it
						partAtTime.notes[note] = note
						Launchpad.setPad(row, col, "on", 49)
					} else { // note exists, remove it
						delete partAtTime.notes[note]
						Launchpad.setPad(row, col, "off")

						if (partAtTime.notes.length === 0) { // if we were left with an empty array, delete the part
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
			// remove event handlers
			Launchpad.off("noteon", this.onHandlerId)
			Launchpad.off("noteoff", this.offHandlerId)
		}

		// draw scene to Launchpad from scratch
		_render() {
			console.log("Render")
			console.log("Octave: " + this.baseNote.octave())
			console.log("Measure: " + this.position.measureOffset)

			// turn off the grid
			for (let i = 1; i <= 8; i += 1) {
				for (let j = 1; j <= 8; j += 1) {
					Launchpad.setPad(i, j, "off")
				}
			}

			let scale = new teoria.scale(this.baseNote, this.scaleType)
			let scaleNotes = scale.notes().map((note) => {
				return note.scientific()
			})

			// get all events
			this.part._events.forEach((e) => {
				let eventData = e.value

				if (eventData.measureOffset === this.position.measureOffset) {
					for (let n in eventData.notes) {
						let scalePos = scaleNotes.indexOf(n)
						if (scalePos !== -1) {
							Launchpad.setPad((scalePos + 1), eventData.measureTime, "on", 49)
						}
					}
				}
			})
		}
	}

	return ScaleSequence
}