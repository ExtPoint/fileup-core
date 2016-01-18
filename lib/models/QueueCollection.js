/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

/**
 * @namespace FileUp
 * @ignore
 */
var FileUp = require('../FileUp');

/**
 * @class FileUp.models.QueueCollection
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.models.QueueCollection', /** @lends FileUp.models.QueueCollection.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.models.QueueCollection */{

        EVENT_ADD: 'add',
        EVENT_REMOVE: 'remove',
        EVENT_ALL_END: 'all_end',
        EVENT_ITEM_STATUS: 'item_status',
        EVENT_ITEM_PROGRESS: 'item_progress',
        EVENT_ITEM_END: 'item_end'

    },

    /**
     * @type {number}
     */
    maxConcurrentUploads: 3,

    /**
     * @type {FileUp.models.File[]}
     */
    _files: [],

    init: function() {
        this._onStatusChange = this._onStatusChange.bind(this);
        this._onProgressChange = this._onProgressChange.bind(this);
        this.__super();
    },

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    add: function (files) {
        this._files = this._files.concat(files);

        for (var i = 0, l = files.length; i < l; i++) {
            files[i].on(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
            files[i].on(FileUp.models.File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(this.__static.EVENT_ADD, [files]);
    },

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    remove: function (files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var index = this._files.indexOf(files[i]);
            if (index !== -1) {
                this._files.splice(index, 1);
            }
        }

        for (var i2 = 0, l2 = files.length; i2 < l2; i2++) {
            files[i2].off(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
            files[i2].off(FileUp.models.File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(this.__static.EVENT_REMOVE, [files]);
    },

    /**
     * @returns {number}
     */
    getCount: function () {
        return this._files.length;
    },

    /**
     *
     * @param {string} status
     * @returns {number}
     */
    getCountByStatus: function (status) {
        var iCount = 0;
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].getStatus() === status) {
                iCount++;
            }
        }
        return iCount;
    },

    /**
     * Search file for next uploading
     * @returns {FileUp.models.File|null}
     */
    getNextForUpload: function () {
        if (this.getCountByStatus(FileUp.models.File.STATUS_PROCESS) >= this.maxConcurrentUploads) {
            return null;
        }

        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].isStatusQueue()) {
                return this._files[i];
            }
        }

        return null;
    },

    /**
     *
     * @param {FileUp.models.File} file
     * @protected
     */
    _onStatusChange: function(file) {
        this.trigger(this.__static.EVENT_ITEM_STATUS, [file]);

        if (file.isStatusEnd()) {
            this.trigger(this.__static.EVENT_ITEM_END, [file]);

            if (this.getCount() === this.getCountByStatus(FileUp.models.File.STATUS_END)) {
                this.trigger(this.__static.EVENT_ALL_END, [this._files]);
            }
        }
    },

    /**
     *
     * @param {FileUp.models.File} file
     * @protected
     */
    _onProgressChange: function(file) {
        this.trigger(this.__static.EVENT_ITEM_PROGRESS, [file]);
    }

});
