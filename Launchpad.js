class Launchpad {
	constructor(output, input) {
		if(!(output) || !(input)) {
			throw "Could not connect to Launchpad."
		}

		this.output = output
		this.input = input
	}

	setPad(row, col, state, color=0) {
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
}

module.exports = Launchpad
