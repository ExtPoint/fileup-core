/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Component from '../base/Component';
import File from './File';

export default class QueueCollection extends Component {

    preInit() {

        /**
         * @type {number}
         */
        this.maxConcurrentUploads = 3;

        /**
         * @type {number|null}
         */
        this.maxFiles = null;

        /**
         * @type {File[]}
         */
        this._files = [];

        this._onStatusChange = this._onStatusChange.bind(this);
        this._onProgressChange = this._onProgressChange.bind(this);

        super.preInit(...arguments);
    }

    /**
     *
     * @param {File[]} files
     */
    add(files) {
        this._files = this._files.concat(files);

        for (var i = 0, l = files.length; i < l; i++) {
            files[i].on(File.EVENT_STATUS, this._onStatusChange);
            files[i].on(File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(QueueCollection.EVENT_ADD, [files]);
    }

    /**
     *
     * @param {File[]} files
     */
    remove(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var index = this._files.indexOf(files[i]);
            if (index !== -1) {
                this._files.splice(index, 1);
            }
        }

        for (var i2 = 0, l2 = files.length; i2 < l2; i2++) {
            files[i2].off(File.EVENT_STATUS, this._onStatusChange);
            files[i2].off(File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(QueueCollection.EVENT_REMOVE, [files]);
    }

    /**
     * @returns {File[]}
     */
    getFiles() {
        return this._files;
    }

    /**
     *
     * @param {string} uid
     * @returns {File|null}
     */
    getByUid(uid) {
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].getUid() === uid) {
                return this._files[i];
            }
        }
        return null;
    }

    /**
     * @returns {number}
     */
    getCount() {
        return this._files.length;
    }

    /**
     *
     * @param {string} status
     * @returns {number}
     */
    getCountByStatus(status) {
        var iCount = 0;
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].getStatus() === status) {
                iCount++;
            }
        }
        return iCount;
    }

    /**
     * Search file for next uploading
     * @returns {File|null}
     */
    getNextForUpload() {
        if (this.getCountByStatus(File.STATUS_PROCESS) >= this.maxConcurrentUploads) {
            return null;
        }

        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].isStatusQueue()) {
                return this._files[i];
            }
        }

        return null;
    }

    /**
     *
     * @param {File} file
     * @protected
     */
    _onStatusChange(file) {
        this.trigger(QueueCollection.EVENT_ITEM_STATUS, [file]);

        if (file.isStatusEnd()) {
            this.trigger(QueueCollection.EVENT_ITEM_END, [file]);

            if (this.getCount() === this.getCountByStatus(File.STATUS_END)) {
                this.trigger(QueueCollection.EVENT_ALL_END, [this._files]);
            }
        }
    }

    /**
     *
     * @param {File} file
     * @protected
     */
    _onProgressChange(file) {
        this.trigger(QueueCollection.EVENT_ITEM_PROGRESS, [file]);
    }

}

QueueCollection.EVENT_ADD = 'add';
QueueCollection.EVENT_REMOVE = 'remove';
QueueCollection.EVENT_ALL_END = 'all_end';
QueueCollection.EVENT_ITEM_STATUS = 'item_status';
QueueCollection.EVENT_ITEM_PROGRESS = 'item_progress';
QueueCollection.EVENT_ITEM_END = 'item_end';
