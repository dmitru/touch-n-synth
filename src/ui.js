
import $ from 'jquery'
import _ from 'underscore'
import teoria from 'teoria'
import paper from 'paper'

import {EventTarget} from './events.js'
import {Notes} from './synths.js'


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
            const endedTouch = this.touches[0];
            this.touches = [];
            this.onTouchEnd(endedTouch);
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
                this.onTouchMove(closestTouch);
            });
        }, false);
        this.element.addEventListener("touchend", e => {
            e.preventDefault();
            _.each(e.changedTouches, (endedTouchEvent) => {
                let endedTouch = new Touch(endedTouchEvent.clientX, endedTouchEvent.clientY);
                let closestTouch = TouchSurface.findClosestTouch(endedTouch, this.touches);
                this.touches = _.filter(this.touches, touch => touch.id != closestTouch.id);
                this.onTouchEnd(closestTouch);
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

        this.onResize();
    }

    _setupUi(container) {
        this.container = $(container);
        this.container.append($('<canvas/>'));
        this.canvas = this.container.find('canvas')[0];
        this._paper_project = new paper.Project(this.canvas);
        new paper.Layer();

        paper.view.onFrame = () => this.draw();
    }

    _setupTouchSurface() {
        this._touchSurface = new TouchSurface(this.canvas);
        this._touchSurface.addListener('touch:start', touch => this.onTouchStart(touch));
        this._touchSurface.addListener('touch:end', touch => this.onTouchEnd(touch));
        this._touchSurface.addListener('touch:move', touch => this.onTouchMove(touch));
    }

    onTouchStart(touch) {
        touch.data = this.computeFrequencyAndVolumeFromTouch(touch);
        this.fire({type: 'touch:start', data: touch});
        this.fire({type: 'touch:state_changed', data: this._touchSurface.touches});
    }

    onTouchEnd(touch) {
        this.fire({type: 'touch:end', data: touch});
        this.fire({type: 'touch:state_changed', data: this._touchSurface.touches});
    }

    onTouchMove(touch) {
        touch.data = this.computeFrequencyAndVolumeFromTouch(touch);
        this.fire({type: 'touch:move', data: touch});
        this.fire({type: 'touch:state_changed', data: this._touchSurface.touches});
    }

    computeFrequencyAndVolumeFromTouch(touch) {
        const noteWidth = this.noteWidth;
        const noteIndex = Math.floor(touch.x / noteWidth);
        //const noteOffset = ((touch.x - noteWidth / 2.0) - noteWidth * noteIndex) / (noteWidth / 2.0);
        const noteOffset = 0;
        const CENT_HZ = 1.0005777895;
        const cents = noteOffset * 50.0;
        const frequency = this.notes[noteIndex].fq() * Math.pow(CENT_HZ, cents);
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
        _.each(this._touchSurface.touches, (touch) => {
            let pointerPath = new paper.Path.Circle(new paper.Point(touch.x, touch.y), 10);
            pointerPath.fillColor = 'red';
            pointerPath.fillColor.alpha = 0.5;
            this.touchPaths.push(pointerPath);
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

    onResize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this._paper_project.activate();
        paper.view.viewSize = new paper.Size(this.width, this.width);
        this.redraw();
    }

    redraw() {
        this._paper_project.activate();
        this._paper_project.clear();
        this.drawKeyboard();
        this.draw();
    }

    draw() {
        this._paper_project.activate();
        this.drawTouches();
    }
}


export class NotesVisualizerView extends EventTarget {
    constructor(container) {
        super();
        this.touches = [];
        this._setupUi(container);
    }

    _setupUi(container) {
        this.container = $(container);
        this.container.append($('<canvas/>'));
        this.canvas = this.container.find('canvas')[0];
        this._paper_project = new paper.Project(this.canvas);
        new paper.Layer();
        paper.view.onFrame = () => this.draw();

        this.onResize();
    }


    onStateChanged(touches) {
        this.touches = touches;
    }

    onResize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this._paper_project.activate();
        paper.view.viewSize = new paper.Size(this.width, this.width);
        this.redraw();
        paper.view.draw()
    }

    redraw() {
        this._paper_project.activate();
        this._paper_project.clear();
        this.draw();
    }

    draw() {
        this._paper_project.activate();
        this.drawNotes();
    }

    get width() { return this.container.width(); }
    get height() { return this.container.height(); }

    drawNotes() {
        if (this.touchPath) {
            this.touchPath.remove();
        }
        if (this.touches && this.touches.length > 0) {
            this.touchPath = new paper.PointText(new paper.Point(this.width / 2, this.height / 2));
            this.touchPath.justification = 'center';
            this.touchPath.fillColor = 'black';
            this.touchPath.fontSize = 30;
            let content = '';
            _.each(this.touches, (touch) => {
                const note = teoria.note.fromFrequency(touch.data.frequency);
                const percents = (note.cents).toFixed(2);
                content += `${note.note.name().toUpperCase()}${note.note.accidental()} ${percents}  `;
            });

            this.touchPath.content = content;
        }
    }
}

