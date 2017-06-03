let Tone = require("tone")
let WebMidi = require("webmidi")

let Launchpad
let metronomePos

let SequencePattern
let BouncePattern

WebMidi.enable((err) => {
	if(err) {
		console.log("Unable to start WebMidi: " + err)
	} else {
		Launchpad = new(require("./js/Launchpad"))(
			WebMidi.getOutputByName("Launchpad MK2 MIDI 1"),
			WebMidi.getInputByName("Launchpad MK2 MIDI 1")
		)

		SequencePattern = require("./js/SequencePattern")(Tone, Launchpad)
		BouncePattern = require("./js/BouncePattern")(Tone, Launchpad)
		DrumkitPattern = require("./js/DrumkitPattern")(Tone, Launchpad)

		Tone.Transport.bpm.value = 120
		// Tone.Transport.loop = true
		// Tone.Transport.loopStart = 0
		// Tone.Transport.loopEnd = "1m"

		// midi clock to synchronize pulse animation
		Tone.Transport.scheduleRepeat((time) => {
			Launchpad.output.sendClock()
		}, "4n / 24")

		Tone.Transport.start()

		// "Metronome" pulse light
		Launchpad.setPad(9, 8, "pulse", 1)

		// party()

		// let sequence = new SequencePattern()
		// sequence.activate()

		// let bounce = new BouncePattern()
		// bounce.activate()

		let drumkit = new DrumkitPattern()
		drumkit.activate()

		// let scale = new teoria.scale('A4', 'major')
		// console.log(scale)
		// console.log(scale.get(1).scientific())
	}
}, true)

window.onbeforeunload = function() {
	Launchpad.clearAll()
}

function party() {
	Tone.Transport.scheduleRepeat((time) => {
		for(let i = 1; i <= 9; i += 1){
			for(let j = 1; j <= 9; j += 1){
				if(!(i === 9 && j === 9)) {
					Launchpad.setPad(i, j, "on", Math.floor(Math.random()*(127-1+1)+1))
				}
			}
		}
	}, "8n")
 }