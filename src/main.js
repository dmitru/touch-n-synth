/**
 * Created by dmitru on 12/19/15.
 */

import '../css/style.scss'

import {SoundEngine} from './synths.js'
import {KeyboardView, NotesVisualizerView} from './ui.js'

import $ from 'jquery'
import paper from 'paper'

window.$ = $;

$(document).ready(function() {
    const header = $('#header');

    const mainContainer = $('#main-container');
    mainContainer.height(window.innerHeight - header.height());

    const controllerContainer = $('#controller-container');
    controllerContainer.css('width', mainContainer.width());
    controllerContainer.css('height', mainContainer.height() * 0.8);

    const bottomContainer = $('#bottom-container');
    bottomContainer.css('width', mainContainer.width());
    bottomContainer.css('height', mainContainer.height() * 0.2);

    const visualizerContainer = $('#visualizer-container');
    visualizerContainer.css('width', mainContainer.width());
    visualizerContainer.css('height', mainContainer.height() * 0.2);

    const keyboardView = new KeyboardView(controllerContainer, {
        firstNote: 'A3',
        lastNote: 'E5'
    });
    const visualizerView = new NotesVisualizerView(visualizerContainer);
    window.visualizerView = visualizerView;

    function onResize() {
        mainContainer.height(window.innerHeight - header.height());
        controllerContainer.css('width', mainContainer.width());
        controllerContainer.css('height', mainContainer.height() * 0.8);
        keyboardView.onResize();
        visualizerContainer.css('width', mainContainer.width());
        visualizerContainer.css('height', mainContainer.height() * 0.2);
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
