let shortid = require("shortid")

// Launchpad MIDI I/O Abstraction
class Launchpad {
	constructor(output, input) {
		if(!(output) || !(input)) {
			throw "Could not connect to Launchpad."
		}

		this.output = output
		this.input = input

		// stores functions to run when notes are pressed/released
		this.noteOnHandlers = {}
		this.noteOffHandlers = {}

		this.input.addListener("noteon", "all", (event) => {
			let column =  event.note.number % 10
			let row = parseInt(event.note.number / 10)
			this._handleNoteOn(row, column)
		})

		this.input.addListener("noteoff", "all", (event) => {
			let column =  event.note.number % 10
			let row = parseInt(event.note.number / 10)
			this._handleNoteOff(row, column)
		})

		this.input.addListener("controlchange", "all", (event) => {
			console.log(event)
			if(event.value === 0) {
				this._handleNoteOff(9, event.controller.number - 103)
			} else if(event.value === 127) {
				this._handleNoteOn(9, event.controller.number - 103)
			} else {
				throw "Launchpad sent invalid control change message."
			}
		})
	}

	// simplifies setting color/state by row/col and unifies top row with the rest of the buttons
	setPad(row, col, color = 0, state = "on") {
		// row and cols go 1-9 inclusive. There is no button at (9,9).
		if(row > 9 || row < 1 || col > 9 || col < 1 || (row === 9 && col === 9)) {
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
			this.output.sendControlChange(col + 103, color, channel)
		} else {
			let note = (10 * row) + col;
			this.output.playNote((10 * row) + col, channel, {
				rawVelocity: true,
				velocity: color
			})
		}
	}

	clearAll() {
		for(let i = 0; i < 128; i += 1) {
			this.output.stopNote(i)
		}

		// clear top buttons
		for(let i = 104; i <= 111; i += 1) {
			this.output.sendControlChange(i, 0, "all")
		}
	}

	_handleNoteOn(row, col) {
		console.log("Note on: " + row + "," + col)

		for(let h in this.noteOnHandlers) {
			let handler = this.noteOnHandlers[h]
			if(typeof handler === "function") {
				handler(row, col)
			}
		}
	}

	_handleNoteOff(row, col) {
		console.log("Note off: " + row + "," + col)

		for(let h in this.noteOffHandlers) {
			let handler = this.noteOffHandlers[h]
			if(typeof handler === "function") {
				handler(row, col)
			}
		}
	}

	on(event, handler) {
		if(event === "noteon") {
			this.noteOnHandlers[(shortid.generate())] = handler
		} else if(event === "noteoff") {
			this.noteOffHandlers[(shortid.generate())] = handler
		} else {
			throw "Invalid event: " + event
		}
	}

	off(event, handlerId) {

	}
}

module.exports = Launchpad
