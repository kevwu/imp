let Tone = require("tone")
let WebMidi = require("webmidi")

let Launchpad
let metronomePos

let Pattern = require("./js/Pattern")

WebMidi.enable((err) => {
	if(err) {
		console.log("Unable to start WebMidi: " + err)
	} else {
		Launchpad = new(require("./js/Launchpad"))(
			WebMidi.getOutputByName("Launchpad MK2 MIDI 1"),
			WebMidi.getInputByName("Launchpad MK2 MIDI 1")
		)

		Tone.Transport.bpm.value = 60
		// Tone.Transport.loop = true
		// Tone.Transport.loopStart = 0
		// Tone.Transport.loopEnd = "1m"

		// metronome loop
		// the metronome starts at zero and counts on [1,8].
		metronomePos = 0
		Tone.Transport.scheduleRepeat((time) => {
			metronomePos += 1
			if(metronomePos > 8) {
				metronomePos = 1
			}
			for(let i = 1; i <= 8; i += 1) {
				Launchpad.setPad(i, 9, "off")
			}
			Launchpad.setPad(metronomePos, 9, "on", 22)

				// console.log(Tone.Transport.height)
				// console.log(metronomePos)
		}, "8n")

		// midi clock to synchronize pulse animation
		Tone.Transport.scheduleRepeat((time) => {
			Launchpad.output.sendClock()
		}, "4n / 24")


		Tone.Transport.start()

		// party()

		// let sequence = new SequencePattern()
		// sequence.activate()

		let bounce = new BouncePattern()
		bounce.activate()
	}
}, true)


class SequencePattern extends Pattern{
	constructor() {
		super()
		// synth must support polyphony
		this.instrument = new Tone.PolySynth(6, Tone.Synth).toMaster()
		this.sequence = []

		this.holdTime = "16n"
		// eventually this can be set from higher, e.g. at the project level
		this.baseNote = Tone.Frequency("A4")

		this.view = {}

		// what section of the pattern the LP is currently focusing on (in 32n)
		this.view.positionOffset = 0
		// note shift up/down relative to the base note
		this.view.noteOffset = 0
		// note "resolution" of the LP view (e.g. each grid is a 32nd note, 16th note, etc)
		// this is turned into Tone's representaiton of a note
		// just use 4 for 4n, 8 for 8n, etc.
		this.view.noteZoom = 8

		// the note value, relative to the baseNote,
		this.part = new Tone.Part((time, data) => {
			console.log("Triggered!")
			console.log(data)
			this.instrument.triggerAttackRelease(Object.values(data.notes), this.holdTime)
		})
		this.part.loop = true
		this.part.start("@1m")
	}

	activate() {
		this.onHandlerId = Launchpad.on("noteon", (row, col) => {
			if(col === 9 || row === 9) {
				return
			}

			// get note from row
			let note = new Tone.Frequency((row - 1) + this.baseNote.toMidi() + this.view.noteOffset, "midi")

			// get height from col
			let time = ((col - 1) + this.view.positionOffset) + " * " + this.view.noteZoom + "n"

			console.log("Note: " + note.toNote())
			console.log("Position: " + time)


			if(this.part.at(time) === null) {
				// part at time doesn't exist, create it (and add the note, since that definitely did not exist)
				console.log("Creating part.")
				let notesObj = []
				notesObj[note.toMidi()] = note
				this.part.at(time, {
					notes: notesObj,
					hold: [this.holdTime],
				})
				Launchpad.setPad(row, col, "on", 49)
			} else {
				// part exists at this time, modify it
				let partAtTime = this.part.at(time).value

				if(!partAtTime.notes[note.toMidi()]) {
					// note doesn't exist, add it
					partAtTime.notes[note.toMidi()] = note
					Launchpad.setPad(row, col, "on", 49)
				} else {
					// note exists, remove it
					delete partAtTime.notes[note.toMidi()]
					Launchpad.setPad(row, col, "off")

					// if we were left with an empty array, delete the part
					if(partAtTime.notes.length === 0) {
						this.part.remove(time)
					}
				}

				this.part.at(time, partAtTime)
			}

			console.log(this.part.at(time))
		})

		this.offHandlerId = Launchpad.on("noteoff", (row, col) => {
			// console.log("Note off handler")
		})

	}

	deactivate() {
		// remove event handlers
		Launchpad.off("noteon", this.onHandlerId)
		Launchpad.off("noteoff", this.offHandlerId)
	}
}

class BouncePattern extends Pattern {
	constructor() {
		super()

		// each column contains a bouncing note
		this.columns = []

		// left/right offset
		this.view = {}
		this.view.positionOffset = 0

		this.tick =  new Tone.Loop((time) => {
			for(let col in this.columns) {
				col = parseInt(col)
				let bouncer = this.columns[col]

				// clear current height
				Launchpad.setPad(bouncer.height, (parseInt(col) + parseInt(this.view.positionOffset)), "off")

				let color = 29

				// very messy, looks like an 8 year old wrote it
				if(bouncer.falling) {
					if(bouncer.height === 1) {
						bouncer.falling = false
						bouncer.height = Math.min(bouncer.height + 1, bouncer.maxHeight)
					} else {
						bouncer.height = Math.max(bouncer.height - 1, 1)
					}
				} else {
					if(bouncer.height === bouncer.maxHeight) {
						bouncer.falling = true
						bouncer.height = Math.max(bouncer.height - 1, 1)
					} else {
						bouncer.height = Math.min(bouncer.height + 1, bouncer.maxHeight)
					}
				}

				if(bouncer.height === 1) {
					bouncer.instrument.triggerAttackRelease(new Tone.Frequency("A4").transpose(col), "16n")
					color = 36
				}

				Launchpad.setPad(bouncer.height, col + this.view.positionOffset, "on", color)
			}
		}, "32n").start(0)
	}

	activate() {
		this.onHandlerId = Launchpad.on("noteon", (row, col) => {
			if(row === 9 || col === 9) {
				return
			}

			for(let i = 1; i <= 8; i += 1) {
				Launchpad.setPad(i, col, "off")
			}

			// "true" column
			let bounceColumn = (col + this.view.positionOffset)

			// either delete or create a bouncer with period 1
			if(row === 1 && this.columns[bounceColumn]) {
				delete this.columns[bounceColumn]
				return
			}

			let bouncer = {
				maxHeight: row, // initial height is max height
				height: row,
				instrument: new Tone.Synth().toMaster(),
				falling: true, // if it is not falling, it is rising
			}

			this.columns[bounceColumn] = bouncer
		})
	}

	deactivate() {
		Launchpad.off("noteon", this.onHandlerId)
	}
}

window.onbeforeunload = function() {
	Launchpad.clearAll()
}

function party() {
	Tone.Transport.scheduleRepeat((time) => {
		for(let i = 1; i <= 9; i += 1){
			for(let j = 1; j <= 9; j += 1){
				Launchpad.setPad(i, j, "on", Math.floor(Math.random()*(127-1+1)+1))
			}
		}
	}, "8n")
 }