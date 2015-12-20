/**
 * Created by dmitru on 12/19/15.
 */

import {SoundEngine} from './synths.js'
import {KeyboardView} from './ui.js'

let $ = require('jquery');
let paper = require('paper');

$(document).ready(function() {
    const controllerContainer = $('#controller-container');
    controllerContainer.css('width', window.innerWidth);
    controllerContainer.css('height', window.innerHeight);

    const keyboardView = new KeyboardView(controllerContainer, {
        firstNote: 'C4',
        lastNote: 'C5'
    });
    const soundEngine = new SoundEngine();

    paper.view.onFrame = function(e) {
        keyboardView.redraw();
    };

    keyboardView.addListener('touch:start', touchStart);
    keyboardView.addListener('touch:end', touchEnd);
    keyboardView.addListener('touch:move', touchMove);

    function touchStart(event) {
        let touch = event.data;
        soundEngine.addSynth(touch.id, touch.data);
    }

    function touchEnd (event) {
        let touch = event.data;
        soundEngine.removeSynth(touch.id);
    }

    function touchMove(event) {
        let touch = event.data;
        soundEngine.updateSynth(touch.id, touch.data);
    }

    window.keyboardView = keyboardView;
});
