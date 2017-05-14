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
		let metroPos = 1
		Tone.Transport.scheduleRepeat((time) => {
			Launchpad.padOff(metroPos > 1 ? metroPos - 1 : 8, 9, 3)
			Launchpad.padOn(metroPos, 9, 3)
			metroPos += 1
			if(metroPos > 8) {
				metroPos = 1
			}
		}, "8n")

		Tone.Transport.scheduleRepeat((time) => {
			for(let i = 1; i <= 8; i += 1){
				for(let j = 1; j <= 8; j += 1){
					Launchpad.padOn(i, j, Math.floor(Math.random()*(127-1+1)+1))
				}
			}
		}, "8n")

		Tone.Transport.start()

		let pattern = []

		Launchpad.input.on("noteon", "all", (event) => {
			console.log("Column: " + (event.note.number % 10))
			console.log("Row: " + parseInt(event.note.number / 10))
		})
	}
}, true)

window.onbeforeunload = function() {
	Launchpad.clearAll()
}
