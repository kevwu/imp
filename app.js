let Tone = require("tone")
let WebMidi = require("webmidi")

let Launchpad = {}

Launchpad.setPad = function(row, col, state, color=0) {
	if(row > 9 || row < 1 || col > 9 || col < 1) {
		console.log("Invalid row/col: " + row + "," + col)
		return
	}
	// the Launchpad uses three channels for different states of lights
	let channel = 0

	switch(state) {
		case "on":
			channel = 1;
			break;
		case "flash":
			channel = 2;
			break;
		case "pulse":
			channel = 3;
			break;
		case "off":
			channel = "all"
			color = 0;
			break;
		default:
			console.log("Invalid state: " + state)
			return
	}

	// the top row of round buttons is handled differently
	if(row === 9) {
		Launchpad.output.sendControlChange(col + 103, color, channel)
	} else {
		let note = (10 * row) + col;
		this.output.playNote((10 * row) + col, channel, {
			rawVelocity: true,
			velocity: color
		})
	}
}

Launchpad.clearAll = function() {
	for(let i = 0; i < 128; i += 1) {
		Launchpad.output.stopNote(i)
	}

	// clear top buttons
	for(let i = 104; i <= 111; i += 1) {
		Launchpad.output.sendControlChange(i, 0, "all")
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

		Tone.Transport.bpm.value = 60

		// tone.js loop
		metroPos = 1
		Tone.Transport.scheduleRepeat((time) => {
			metroPos += 1
			if(metroPos > 8) {
				metroPos = 1
			}
			console.log(metroPos)
			Launchpad.setPad(metroPos > 1 ? metroPos - 1 : 8, 9, "off", 3)
			Launchpad.setPad(metroPos, 9, "on", 3)
		}, "8n")

		// Tone.Transport.scheduleRepeat((time) => {
		// 	for(let i = 1; i <= 9; i += 1){
		// 		for(let j = 1; j <= 9; j += 1){
		// 			Launchpad.setPad(i, j, "on", Math.floor(Math.random()*(127-1+1)+1))
		// 		}
		// 	}
		// }, "8n")

		Tone.Transport.start()

		let sequence = new SequencePattern()
		sequence.activate()
	}
}, true)

window.onbeforeunload = function() {
	Launchpad.clearAll()
}

class Pattern {
	constructor() {
		this.instrument = null
	}

	activate() {

	}

	addNote(note, position) {

	}

	removeNote(note, position) {

	}

	toggleNote(note, position) {

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

	activate() {
		Launchpad.input.on("noteon", "all", (event) => {
			let column =  event.note.number % 10
			let row = parseInt(event.note.number / 10)

			// root note: A4
			sequence.toggleNote(Tone.Frequency("A4").transpose(row - 1), column)
		})
	}

	toggleNote(note, position) {
		if(typeof this.sequence[position] === "undefined") {
			this.sequence[position] = {}
		}
		this.sequence[position][note.toNote()] = note

		let noteRow = note.toMidi() - Tone.Frequency("A4").toMidi() + 1

		Launchpad.setPad(noteRow, position, "pulse", 45)

		console.log(position)
		console.log(note)
	}
}