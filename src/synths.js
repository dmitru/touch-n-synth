
let teoria = require('teoria');
require('../node_modules/theresas-sound-world/dist/tsw.js');
let _ = require('underscore');


export class Notes {
    static color(note) {
        return (_.contains(['#', 'b'], note.accidental()))? 'black': 'white';
    }

    static range(firstNote, lastNote) {
        if (typeof(firstNote) === 'string') {
            firstNote = teoria.note(firstNote);
        }
        if (typeof(lastNote) === 'string') {
            lastNote = teoria.note(lastNote);
        }
        let result = [];
        for (let midi = firstNote.midi(); midi < lastNote.midi(); ++midi) {
            result.push(teoria.note.fromMIDI(midi));
        }
        return result;
    }
}


class Synth {
    constructor({freq, volume, type, filter}) {
        if (!freq) {
            freq = 440.0;
        }
        if (!type) {
            type = 'sine';
        }
        if (!volume) {
            volume = 0.5;
        }
        this._osc = tsw.osc(freq, type);
        this._gain = tsw.gain(volume);
        this._gainEnv = tsw.gain(0.0);
        this._output = this._gainEnv;

        this._envParams = {
            attack: 0.01,
            release: 0.05
        };

        this._env = tsw.envelope({
            attack: this._envParams.attack,
            decay: 0,
            sustain: 1.0,
            release: this._envParams.release,
            param: this._gainEnv.params.gain,
            startLevel: 0
        });

        if (filter) {
            this._filter = tsw.filter(filter);
        } else {
            this._filter = tsw.gain(1.0);
        }

        tsw.connect(this._osc, this._gain, this._filter, this._gainEnv, tsw.speakers);
    }

    get output() { return this._output; }

    set frequency(value) {
        this._osc.frequency(value);
    }

    set volume(value) {
        this._gain.gain(value);
    }

    start() {
        this._osc.start();
        this._env.start();
    }

    stop() {
        this._env.release(tsw.now() + this._envParams.attack);
        this._osc.stop(tsw.now() + this._envParams.release + 0.1);
    }
}

export class SoundEngine {
    constructor() {
        this.synths = {};
    }

    addSynth(id, synthParams) {
        let synth = new Synth({
            volume: synthParams.volume,
            freq: synthParams.frequency,
            type: 'sawtooth',
            filter: {
                type: 'lowpass',
                frequency: 200,
                Q: 1
            }
        });
        synth.start();
        this.synths[id] = synth;
    }

    updateSynth(id, synthParams) {
        if (!this.synths[id]) {
            this.addSynth(id, synthParams);
            return;
        }
        if (synthParams.frequency) {
            this.synths[id].frequency = synthParams.frequency;
        }
        if (synthParams.volume) {
            this.synths[id].volume  = synthParams.volume;
        }
    }

    removeSynth(id) {
        this.synths[id].stop();
        delete this.synths[id];
    }
}
