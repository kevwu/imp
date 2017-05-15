let Tone = require("tone")
let WebMidi = require("webmidi")

let Launchpad = {}

Launchpad.padOn = function(row, col, color) {
	this.output.playNote((10 * row) + col, 1, {
		rawVelocity: true,
		velocity: color
	})
}

Launchpad.padOff = function(row, col) {
	this.output.stopNote((10*row) + col)
}

Launchpad.clearAll = function() {
	for(let i = 0; i < 128; i += 1) {
		Launchpad.output.stopNote(i)
	}
}

let metroPos

WebMidi.enable((err) => {
	if(err) {
		console.log("Unable to start WebMidi: " + err)
	} else {
		Launchpad.output = WebMidi.getOutputByName("Launchpad MK2 MIDI 1")
		Launchpad.input = WebMidi.getInputByName("Launchpad MK2 MIDI 1")

		console.log(Launchpad)

		Launchpad.clearAll()
		// for(let i = 1; i <= 8; i += 1){
		// 	for(let j = 1; j <= 8; j += 1){
		// 		Launchpad.padOn(i, j, (8 * i) + j)
		// 	}
		// }

		Launchpad.clearAll()

		Tone.Transport.bpm.value = 60

		// tone.js loop
		metroPos = 1
		Tone.Transport.scheduleRepeat((time) => {
			metroPos += 1
			if(metroPos > 8) {
				metroPos = 1
			}
			console.log(metroPos)
			Launchpad.padOff(metroPos > 1 ? metroPos - 1 : 8, 9, 3)
			Launchpad.padOn(metroPos, 9, 3)
		}, "8n")

		// Tone.Transport.scheduleRepeat((time) => {
		// 	for(let i = 1; i <= 8; i += 1){
		// 		for(let j = 1; j <= 8; j += 1){
		// 			Launchpad.padOn(i, j, Math.floor(Math.random()*(127-1+1)+1))
		// 		}
		// 	}
		// }, "8n")

		Tone.Transport.start()

		let sequence = new SequencePattern()

		Launchpad.input.on("noteon", "all", (event) => {
			let column =  event.note.number % 10
			let row = parseInt(event.note.number / 10)

			// root note: A4
			sequence.addNote(Tone.Frequency("A4").transpose(row - 1), column)
		})
	}
}, true)

window.onbeforeunload = function() {
	Launchpad.clearAll()
}

class Pattern {
	constructor() {
		this.instrument = null
	}

	addNote(note, position) {

	}

	removeNote(note, position) {

	}
}

class SequencePattern extends Pattern{
	constructor() {
		super()
		this.instrument = new Tone.Synth().toMaster()
		this.sequence = []

		Tone.Transport.scheduleRepeat((time) => {
			console.log(this.sequence[metroPos])

			for(let note in this.sequence[metroPos]) {
				this.instrument.triggerAttackRelease(note, "8n")
			}
		}, "8n")

		// TODO add all listeners required by this type of pattern

		// TODO allow for arbitrary length patterns
	}

	addNote(note, position) {
		if(typeof this.sequence[position] === "undefined") {
			this.sequence[position] = {}
		}
		this.sequence[position][note.toNote()] = note

		let noteRow = note.toMidi() - Tone.Frequency("A4").toMidi() + 1

		Launchpad.padOn(noteRow, position, 45)

		console.log(position)
		console.log(note)
	}

	removeNote(note, position) {

	}
}