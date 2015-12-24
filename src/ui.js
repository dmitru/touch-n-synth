
import {EventTarget} from './events.js'
import {Notes} from './synths.js'

let $ = require('jquery');
let teoria = require('teoria');
let _ = require('underscore');
let paper = require('paper');

export class Touch {
    constructor(x, y) {
        this.id = Touch.next_id();
        this.x = x;
        this.y = y;
    }

    static next_id() {
        if (!this._next_id) {
            this._next_id = 0;
        }
        return this._next_id++;
    }

    static findClosestTouch(touch, others) {
        return _.min(others, other => {
            const dx = touch.x - other.x;
            const dy = touch.y - other.y;
            return dx * dx + dy * dy;
        });
    }
}

export class KeyboardView extends EventTarget {
    constructor(container, {firstNote, lastNote}={}) {
        super();

        if (!firstNote) firstNote = 'C4';
        if (!lastNote) lastNote = 'C5';

        this.container = $(container);
        let canvas = $('<canvas/>').css({width: this.width, height: this.height});
        this.container.append(canvas);
        this.canvas = canvas[0];

        this.firstNote = teoria.note(firstNote);
        this.lastNote = teoria.note(lastNote);
        this.notes = Notes.range(firstNote, lastNote);

        paper.setup(this.canvas);

        this.touches = [];
        this.touchPaths = [];

        this.drawKeyboard();
        this._setUpEventListeners();
    }

    computeFrequencyAndVolumeFromTouch(touch) {
        const noteWidth = this.noteWidth;
        const noteIndex = Math.floor(touch.x / noteWidth);
        const noteOffset = ((touch.x - noteWidth / 2.0) - noteWidth * noteIndex) / (noteWidth / 2.0);
        const CENT_HZ = 1.0005777895;
        const cents = Math.abs(noteOffset) * 50.0;
        const frequency = this.notes[noteIndex].fq() + Math.sign(noteOffset) * Math.pow(CENT_HZ, cents);
        const volume = (touch.y / this.height);
        return {
            frequency: frequency,
            volume: volume
        };
    }

    _setUpEventListeners() {
        this.canvas.addEventListener("mousedown", e => {
            this.touches = [new Touch(e.clientX, e.clientY)];
            this.fire({type: 'touch:start', data: this.touches[0]});
        }, false);
        this.canvas.addEventListener("mouseup", e => {
            this.fire({type: 'touch:end', data: this.touches[0]});
            this.touches = [];
        }, false);
        this.canvas.addEventListener("mousemove", e => {
            e.preventDefault();
            if (this.touches.length == 0) return;
            this.touches[0].x = e.clientX;
            this.touches[0].y = e.clientY;
            this.fire({type: 'touch:move', data: this.touches[0]});
        }, false);

        this.canvas.addEventListener("touchstart", e => {
            e.preventDefault();
            _.each(e.changedTouches, (newTouchEvent) => {
                let newTouch = new Touch(newTouchEvent.clientX, newTouchEvent.clientY);
                this.fire({type: 'touch:start', data: newTouch});
                this.touches.push(newTouch);
            });
        }, false);
        this.canvas.addEventListener("touchmove", e => {
            e.preventDefault();
            _.each(e.changedTouches, (movedTouchEvent) => {
                let movedTouch = new Touch(movedTouchEvent.clientX, movedTouchEvent.clientY);
                let closestTouch = Touch.findClosestTouch(movedTouch, this.touches);
                closestTouch.x = movedTouch.x;
                closestTouch.y = movedTouch.y;
                this.fire({type: 'touch:move', data: closestTouch});
            });
        }, false);
        this.canvas.addEventListener("touchend", e => {
            e.preventDefault();
            _.each(e.changedTouches, (endedTouchEvent) => {
                let endedTouch = new Touch(endedTouchEvent.clientX, endedTouchEvent.clientY);
                let closestTouch = Touch.findClosestTouch(endedTouch, this.touches);
                this.touches = _.filter(this.touches, touch => touch.id != closestTouch.id);
                this.fire({type: 'touch:end', data: closestTouch});
            });
        }, false);
    }

    drawTouches() {
        for (let i = 0; i < this.touchPaths.length; ++i) {
            this.touchPaths[i].remove();
        }
        this.touchPaths = [];
        for (let i = 0; i < this.touches.length; ++i) {
            let pointer = this.touches[i];
            let pointerPath = new paper.Path.Circle(new paper.Point(pointer.x, pointer.y), 10);
            pointerPath.fillColor = 'red';
            pointerPath.fillColor.alpha = 0.5;
            this.touchPaths.push(pointerPath);
        }
    }

    removeAllTouches() {
        _.each(this.touches, touch => {
            this.fire({type: 'touch:end', data: touch});
        });
    }

    get width() { return this.container.width(); }
    get height() { return this.container.height(); }
    get noteWidth() { return this.width / this.notes.length; }

    drawKeyboard() {
        for (let i = 0; i < this.notes.length; ++i) {
            const note = this.notes[i];
            var x = this.noteWidth * i;
            let rectangle = new paper.Rectangle(new paper.Point(x, 0), new paper.Point(x + this.noteWidth, this.height));
            let path = new paper.Path.Rectangle(rectangle);
            path.fillColor = (Notes.color(note) == 'black')? '#aaa' : 'white';
            path.strokeColor = '#888';
            path.strokeWidth = 1;
        }
    }

    redraw() {
        this.drawTouches();
    }
}
