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