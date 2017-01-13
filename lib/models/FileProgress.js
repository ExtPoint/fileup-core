/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseObject from '../base/BaseObject';

export default class FileProgress extends BaseObject {

    preInit() {

        /**
         * @type {number}
         */
        this.speedMinMeasurement = 2;

        /**
         * @type {number}
         */
        this.speedMaxMeasurement = 5;

        /**
         * @type {File}
         */
        this.file = null;

        this.history = [];

        this._lastTime = null;

        super.preInit(...arguments);
    }

    add(bytesUploaded) {
        var now = (new Date()).getTime();

        this.history.push({
            bytes: bytesUploaded - this.file.getBytesUploaded(),
            duration: this._lastTime ? now - this._lastTime : null
        });
        this._lastTime = now;
    }

    reset() {
        this.history = [];
        this._lastTime = null;
    }

    toJSON() {
        return {
            history: this.history
        };
    }

    /**
     * @returns {number} Seconds
     */
    getTimeLeft() {
        var bytesTotal = this.file.getBytesTotal();
        if (bytesTotal === 0) {
            return 0;
        }

        var speed = this.getSpeed();
        if (speed === 0) {
            return 0;
        }

        var bytesUploaded = this.file.getBytesUploaded();

        return Math.ceil((bytesTotal - bytesUploaded) / speed);
    }

    /**
     * @returns {number} Bytes in second
     */
    getSpeed() {
        if (this.history.length < this.speedMinMeasurement) {
            return 0;
        }

        // Get last diff values
        var history = this.history.slice(-1 * this.speedMaxMeasurement);

        // Calculate average upload speed
        var summaryBytes = 0;
        var summaryDuration = 0;
        for (var i = 0, l = history.length; i < l; i++) {
            summaryBytes += history[i].bytes;
            summaryDuration += history[i].duration;
        }

        if (summaryBytes === 0 || summaryDuration === 0) {
            return 0;
        }

        return Math.round(summaryBytes / (summaryDuration / 1000));
    }

    /**
     * @returns {number}
     */
    getPercent() {
        var bytesTotal = this.file.getBytesTotal();
        if (bytesTotal === 0) {
            return 0;
        }

        var bytesUploaded = this.file.getBytesUploaded();
        return Math.round(bytesUploaded * 100 / bytesTotal);
    }

}
