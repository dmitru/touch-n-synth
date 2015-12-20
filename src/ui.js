
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
        this.data = null;
    }

    static next_id() {
        if (!this._next_id) {
            this._next_id = 0;
        }
        return this._next_id++;
    }
}

export class TouchSurface extends EventTarget {
    constructor(element) {
        super();
        this.element = element;
        this.touches = [];
        this._setUpEventListeners();
    }

    onTouchStart(touch) {
        this.fire({type: 'touch:start', data: touch});
    }
    onTouchEnd(touch) {
        this.fire({type: 'touch:end', data: touch});
    }
    onTouchMove(touch) {
        this.fire({type: 'touch:move', data: touch});
    }

    _setUpEventListeners() {
        this.element.addEventListener("mousedown", e => {
            e.preventDefault();
            this.touches = [new Touch(e.clientX, e.clientY)];
            this.onTouchStart(this.touches[0]);
        }, false);
        this.element.addEventListener("mouseup", e => {
            e.preventDefault();
            this.onTouchEnd(this.touches[0]);
            this.touches = [];
        }, false);
        this.element.addEventListener("mousemove", e => {
            e.preventDefault();
            if (this.touches.length == 0) return;
            this.touches[0].x = e.clientX;
            this.touches[0].y = e.clientY;
            this.onTouchMove(this.touches[0]);
        }, false);

        this.element.addEventListener("touchstart", e => {
            e.preventDefault();
            _.each(e.changedTouches, (newTouchEvent) => {
                let newTouch = new Touch(newTouchEvent.clientX, newTouchEvent.clientY);
                this.onTouchStart(newTouch);
                this.touches.push(newTouch);
            });
        }, false);
        this.element.addEventListener("touchmove", e => {
            e.preventDefault();
            _.each(e.changedTouches, (movedTouchEvent) => {
                let movedTouch = new Touch(movedTouchEvent.clientX, movedTouchEvent.clientY);
                let closestTouch = TouchSurface.findClosestTouch(movedTouch, this.touches);
                closestTouch.x = movedTouch.x;
                closestTouch.y = movedTouch.y;
                this.onTouchStart(closestTouch);
            });
        }, false);
        this.element.addEventListener("touchend", e => {
            e.preventDefault();
            _.each(e.changedTouches, (endedTouchEvent) => {
                let endedTouch = new Touch(endedTouchEvent.clientX, endedTouchEvent.clientY);
                let closestTouch = Touch.findClosestTouch(endedTouch, this.touches);
                this.touches = _.filter(this.touches, touch => touch.id != closestTouch.id);
                this.onTouchMove(closestTouch);
            });
        }, false);
    }

    removeAllTouches() {
        _.each(this.touches, touch => {
            this.onTouchEnd(touch);
        });
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

        this._setupUi(container);
        this._setupTouchSurface();

        if (!firstNote) firstNote = 'C4';
        if (!lastNote) lastNote = 'C5';

        this.firstNote = teoria.note(firstNote);
        this.lastNote = teoria.note(lastNote);
        this.notes = Notes.range(firstNote, lastNote);
        this.touchPaths = [];

        this.drawKeyboard();
    }

    _setupUi(container) {
        this.container = $(container);
        let canvas = $('<canvas/>').css({width: this.width, height: this.height});
        this.container.append(canvas);
        this.canvas = canvas[0];
        paper.setup(this.canvas);
        this._paper_project = paper.project
    }

    _setupTouchSurface() {
        this._touchSurface = new TouchSurface(this.canvas);
        this._touchSurface.addListener('touch:start', e => this.onTouchStart(e));
        this._touchSurface.addListener('touch:end', e => this.onTouchEnd(e));
        this._touchSurface.addListener('touch:move', e => this.onTouchMove(e));
    }

    onTouchStart(e) {
        let touch = e.data;
        touch.data = this.computeFrequencyAndVolumeFromTouch(touch);
        this.fire({type: 'touch:start', data: touch});
    }

    onTouchEnd(e) {
        let touch = e.data;
        this.fire({type: 'touch:end', data: touch});
    }

    onTouchMove(e) {
        let touch = e.data;
        touch.data = this.computeFrequencyAndVolumeFromTouch(touch);
        this.fire({type: 'touch:move', data: touch});
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

    drawTouches() {
        for (let i = 0; i < this.touchPaths.length; ++i) {
            this.touchPaths[i].remove();
        }
        this.touchPaths = [];
        const touches = this._touchSurface.touches;
        for (let i = 0; i < touches.length; ++i) {
            let pointer = touches[i];
            let pointerPath = new paper.Path.Circle(new paper.Point(pointer.x, pointer.y), 10);
            pointerPath.fillColor = 'red';
            pointerPath.fillColor.alpha = 0.5;
            this.touchPaths.push(pointerPath);
        }
    }

    get width() { return this.container.width(); }
    get height() { return this.container.height(); }
    get noteWidth() { return this.width / this.notes.length; }

    drawKeyboard() {
        this._paper_project.activate()
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
        this._paper_project.activate()
        this.drawTouches()
    }
}
