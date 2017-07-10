let Tone = require("tone")
let WebMidi = require("webmidi")

let paper = require("paper")

let SessionView

let Launchpad

let packageMeta = require("./package.json")

WebMidi.enable((err) => {
	if(err) {
		console.log("Unable to start WebMidi: " + err)
	} else {
		Launchpad = new(require("./js/Launchpad"))(
			WebMidi.getOutputByName("Launchpad MK2 MIDI 1"),
			WebMidi.getInputByName("Launchpad MK2 MIDI 1")
		)

		paper.setup(document.getElementById('mainCanvas'))

		SessionView = require("./js/SessionView")(Tone, Launchpad, paper.view)

		Tone.Transport.bpm.value = 120

		// midi clock to synchronize pulse animation
		// I'm 90% sure the resulting flash isn't actually on-beat
		Tone.Transport.scheduleRepeat((time) => {
			Launchpad.output.sendClock()
		}, "4n / 24")

		Tone.Transport.start()

		// "Metronome" pulse light, timing provided by midi clock callback above
		// Launchpad.setPad(9, 8, "flash", 1)

		// set up Paper canvas
		paper.project.currentStyle = {
			fontFamily: 'Dosis',
			fontSize: '20',
		}

		new paper.PointText({
			point: [10, 230],
			content: 'imp v' + packageMeta.version,
			fontSize: 14
		})

		let sessionView = new SessionView(paper.view)
		sessionView.activate({}, false)

		Launchpad.globalOnHandler = (row, col) => {
			// session button
			if(row === 9 && col === 5) {
				sessionView.activate({}, true)
			}
		}
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