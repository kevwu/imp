let Tone = require("tone")
let WebMidi = require("webmidi")
let teoria = require("teoria")

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

		Tone.Transport.bpm.value = 120
		// Tone.Transport.loop = true
		// Tone.Transport.loopStart = 0
		// Tone.Transport.loopEnd = "1m"

		// metronome loop
		// the metronome starts at zero and counts on [1,8].
		metronomePos = 0
		Tone.Transport.scheduleRepeat((time) => {
			if(metronomePos > 0) {
				Launchpad.setPad(metronomePos, 9, "off")
			}
			metronomePos += 1
			if(metronomePos > 8) {
				metronomePos = 1
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

		let sequence = new SequencePattern()
		sequence.activate()

		// let bounce = new BouncePattern()
		// bounce.activate()

		// let scale = new teoria.scale('A4', 'major')
		// console.log(scale)
		// console.log(scale.get(1).scientific())
	}
}, true)


class SequencePattern extends Pattern{
	constructor() {
		super()
		// synth must support polyphony
		this.instrument = new Tone.PolySynth(6, Tone.Synth).toMaster()
		this.sequence = []

		// default time to hold the note before releasing. Can be overriden
		this.holdTime = "16n"
		// eventually this can be set from higher, e.g. at the project level
		this.baseNote = new teoria.note.fromString("Bb4")

		// view-related variables
		this.view = {}

		// what section of the pattern the LP is currently focusing on (in 32n)
		this.view.measureOffset = 0

		// note "resolution" of the LP view (e.g. each grid is a 32nd note, 16th note, etc)
		// this is turned into Tone's representation of a note
		// just use 4 for 4n, 8 for 8n, etc.
		this.view.noteZoom = 8

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
			if(row === 9) {
				switch(col) {
					case 1:
						// octave up
						// this.view.octaveOffset += 12
						this.baseNote = this.baseNote.interval("P8")
						break;
					case 2:
						// octave down
						// this.view.octaveOffset -= 12
						this.baseNote = this.baseNote.interval("P-8")
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

			if(col === 9) {
				// right side round buttons don't do anything yet
				return
			}

			// get note from row
			let scale = new teoria.scale(this.baseNote, this.scaleType)
			// we don't need to do row-1 because teoria.scale.get() starts at 1
			let note = scale.get(row).scientific()

			let time = ((col - 1) + (this.view.measureOffset * this.view.noteZoom)) + " * " + this.view.noteZoom + "n"

			// extend part length if necessary
			let loopLength
			if(this.part.loopEnd === "1m") {
				loopLength = 1
			} else {
				loopLength = parseInt(this.part.loopEnd.replace("*1m", ""))
			}

			console.log(loopLength)
			if(loopLength < this.view.measureOffset + 1) {
				// extend part
				console.log("Extending part.")
				this.part.loopEnd = (this.view.measureOffset+1) + "*1m"
			}

			if(this.part.at(time) === null) { // part at time doesn't exist, create it (and add the note, since that definitely did not exist)
				let notesArr = []
				notesArr[note] = note
				this.part.at(time, {
					notes: notesArr,
					hold: [this.holdTime],
					measureTime: col, // position within the measure
					measureOffset: this.view.measureOffset, // grid position
				})
				Launchpad.setPad(row, col, "on", 49)
			} else { // part exists at this time, modify it
				let partAtTime = this.part.at(time).value

				if(!partAtTime.notes[note]) { // note doesn't exist, add it
					partAtTime.notes[note] = note
					Launchpad.setPad(row, col, "on", 49)
				} else { // note exists, remove it
					delete partAtTime.notes[note]
					Launchpad.setPad(row, col, "off")

					if(partAtTime.notes.length === 0) { // if we were left with an empty array, delete the part
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
		console.log("Measure: " + this.view.measureOffset)

		// turn off the grid
		for(let i = 1; i <= 8; i += 1) {
			for(let j = 1; j <= 8; j += 1) {
				Launchpad.setPad(i, j, "off")
			}
		}

		let scale = new teoria.scale(this.baseNote, this.scaleType)
		let scaleNotes = scale.notes().map((note) => {
			return note.scientific()
		})

		// get all events
		for(let e in this.part._events){
			let eventData = this.part._events[e].value
			if(eventData.measureOffset === this.view.measureOffset) {

				for(let n in eventData.notes) {
					let scalePos = scaleNotes.indexOf(n)
					if(scalePos !== -1) {
						Launchpad.setPad((scalePos + 1), eventData.measureTime, "on", 49)
					}
				}
			}
		}
	}
}

class BouncePattern extends Pattern {
	constructor() {
		super()

		// each column contains a bouncing note
		this.columns = []

		// left/right offset
		this.view = {}
		this.view.measureOffset = 0

		this.tick =  new Tone.Loop((time) => {
			for(let col in this.columns) {
				col = parseInt(col)
				let bouncer = this.columns[col]

				// clear current height
				Launchpad.setPad(bouncer.height, (parseInt(col) + parseInt(this.view.measureOffset)), "off")

				let color = 29

				bouncer.height = Math.min(Math.max(bouncer.height + bouncer.direction, 1), bouncer.maxHeight);

				if(bouncer.height === 1 || bouncer.height === bouncer.maxHeight) {
					bouncer.direction *= -1
				}

				if(bouncer.height === 1) {
					bouncer.instrument.triggerAttackRelease(new Tone.Frequency("A4").transpose(col * 2), "16n")
					color = 36
				}

				Launchpad.setPad(bouncer.height, col + this.view.measureOffset, "on", color)
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
			let bounceColumn = (col + this.view.measureOffset)

			// either delete or create a bouncer with period 1
			if(row === 1 && this.columns[bounceColumn]) {
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