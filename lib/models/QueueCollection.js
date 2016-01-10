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
        EVENT_REMOVE: 'remove'

    },

    /**
     * @type {number}
     */
    maxConcurrentUploads: 3,

    /**
     * @type {FileUp.models.File[]}
     */
    _files: [],

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    add: function (files) {
        this._files = this._files.concat(files);
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
        this.trigger(this.__static.EVENT_REMOVE, [files]);
    },

    /**
     * @returns {number}
     */
    getCount: function () {
        return this._files.length;
    },

    /**
     * @returns {number}
     */
    getQueueCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusQueue();
            });
    },

    /**
     * @returns {number}
     */
    getProcessCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusProcess();
            });
    },

    /**
     * @returns {number}
     */
    getEndCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusEnd();
            });
    },

    /**
     * Search file for next uploading
     * @returns {FileUp.models.File|null}
     */
    getNextForUpload: function () {
        if (this.getProcessCount() >= this.maxConcurrentUploads) {
            return null;
        }

        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].isStatusQueue()) {
                return this._files[i];
            }
        }

        return null;
    },

    _count: function (fn) {
        var iCount = 0;
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (fn(this._files[i])) {
                iCount++;
            }
        }
        return iCount;
    }

});
