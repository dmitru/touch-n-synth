/**
 * Created by dmitru on 12/19/15.
 */

import {SoundEngine} from './synths.js'
import {KeyboardView, NotesVisualizerView} from './ui.js'

let $ = require('jquery');
let paper = require('paper');
window.paper = paper;

$(document).ready(function() {
    const controllerContainer = $('#controller-container');
    controllerContainer.css('width', window.innerWidth);
    controllerContainer.css('height', window.innerHeight * 0.8);

    const visualizerContainer = $('#visualizer-container');
    visualizerContainer.css('width', window.innerWidth);
    visualizerContainer.css('height', window.innerHeight * 0.2);

    const keyboardView = new KeyboardView(controllerContainer, {
        firstNote: 'C4',
        lastNote: 'C6'
    });
    const visualizerView = new NotesVisualizerView(visualizerContainer);
    window.visualizerView = visualizerView;

    function onResize() {
        controllerContainer.css('width', window.innerWidth);
        controllerContainer.css('height', window.innerHeight * 0.8);
        keyboardView.onResize();

        visualizerContainer.css('width', window.innerWidth);
        visualizerContainer.css('height', window.innerHeight * 0.2);
        visualizerView.onResize();
    }

    $(window).resize(onResize);

    const soundEngine = new SoundEngine();

    // Set up event for affecting SoundEngine
    keyboardView.addListener('touch:start', touch => {
        soundEngine.addSynth(touch.id, touch.data)
    });
    keyboardView.addListener('touch:end', touch => {
        soundEngine.removeSynth(touch.id);
    });
    keyboardView.addListener('touch:move', touch => {
        soundEngine.updateSynth(touch.id, touch.data)
    });

    // Set up events for notes visualizer
    keyboardView.addListener('touch:state_changed', touches => visualizerView.onStateChanged(touches));
});
