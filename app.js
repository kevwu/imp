let Tone = require("tone")
let WebMidi = require("webmidi")

let Launchpad
let metronomePos

WebMidi.enable((err) => {
	if(err) {
		console.log("Unable to start WebMidi: " + err)
	} else {
		Launchpad = new(require("./Launchpad"))(
			WebMidi.getOutputByName("Launchpad MK2 MIDI 1"),
			WebMidi.getInputByName("Launchpad MK2 MIDI 1")
		)

		Tone.Transport.bpm.value = 60

		// metronome loop
		// the metronome counts on [0,31].
		metronomePos = 1
		Tone.Transport.scheduleRepeat((time) => {
			metronomePos += 1
			if(metronomePos > 32) {
				metronomePos = 1
			}
		}, "32n")


		Tone.Transport.start()

		let sequence = new SequencePattern()
		sequence.activate()
	}
}, true)

window.onbeforeunload = function() {
	Launchpad.clearAll()
}

class Pattern {
	// when pattern is added
	constructor() {
		this.instrument = null
	}

	// when pattern is switched into
	// bind event handlers, render previous state to Launchpad, etc
	activate() {

	}

	// runs when switching away from pattern
	// clear event handlers, reset Launchpad, etc
	deactivate() {

	}

	// start up the pattern (usually quantized)
	play() {

	}

	// stop the pattern (usually quantized)
	stop() {

	}
}

class SequencePattern extends Pattern{
	constructor() {
		super()
		this.instrument = new Tone.Synth().toMaster()
		this.sequence = []

		this.releaseTime = "16n"
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
		this.part = new Tone.Part((time, note) => {
			this.instrument.triggerAttackRelease(note, this.releaseTime)
		})
	}

	activate() {
		this.onHandlerId = Launchpad.on("noteon", (row, col) => {
			// get note from row
			let note = new Tone.Frequency((row - 1) + this.baseNote.toMidi() + this.view.noteOffset, "midi")

			// get position from col
			let time = ((col - 1) + this.view.positionOffset) + " * " + this.view.noteZoom + "n"

			console.log("Note: " + note.toNote())
			console.log("Position: " + time)


			if(this.part.at(time) === null) {
				this.part.at(time, note)
				Launchpad.setPad(row, col, "on", 49)
			} else {
				this.part.remove(time)
				Launchpad.setPad(row, col, "off")
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

	toggleNote(note, position) {
		if(typeof this.sequence[position] === "undefined") {
			this.sequence[position] = {}
		}
		this.sequence[position][note.toNote()] = note

		let noteRow = note.toMidi() - Tone.Frequency("A4").toMidi() + 1

		Launchpad.setPad(noteRow, position, "pulse", 45)

		// console.log(position)
		// console.log(note)
	}
}

// function party() {
// 	Tone.Transport.scheduleRepeat((time) => {
// 		for(let i = 1; i <= 9; i += 1){
// 			for(let j = 1; j <= 9; j += 1){
// 				Launchpad.setPad(i, j, "on", Math.floor(Math.random()*(127-1+1)+1))
// 			}
// 		}
// 	}, "8n")
//  }