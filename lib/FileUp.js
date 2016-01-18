/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Neatness = require('neatness').newContext();
Neatness.noConflict();

/**
 * @namespace FileUp
 * @alias module:fileup-core
 */
var FileUp;

/**
 * @class FileUp
 * @extends Neatness.Object
 */
FileUp = Neatness.defineClass('FileUp', /** @lends FileUp.prototype */{

    __extends: Neatness.Object,

    __static: /** @lends FileUp */{

        Neatness: Neatness,

        EVENT_SUBMIT: 'submit'

    },

    /**
     * @type {string}
     */
    backendUrl: null,

    /**
     * @type {object}
     */
    backendParams: {},

    /**
     * @type {FileUp.form.Form}
     */
    form: {
        className: 'FileUp.form.Form'
    },

    /**
     * @type {FileUp.form.DropArea}
     */
    dropArea: {
        className: 'FileUp.form.DropArea'
    },

    /**
     * @type {FileUp.models.QueueCollection}
     */
    queue: {
        className: 'FileUp.models.QueueCollection'
    },

    /**
     * @type {FileUp.managers.QueueManager}
     */
    queueManager: {
        className: 'FileUp.managers.QueueManager'
    },

    /**
     * @type {FileUp.models.File}
     */
    fileConfig: {
        className: 'FileUp.models.File'
    },

    uploaderConfigs: {
        iframe: {
            className: 'FileUp.uploaders.IframeUploader'
        },
        xhr: {
            className: 'FileUp.uploaders.XhrUploader'
        }
    },

    constructor: function (config) {
        if (typeof config === 'object') {
            FileUp.helpers.ClassHelper.configure(this, config);
        }

        this._initForm();
        this._initDropArea();
        this._initQueue();
        this._initManagers();
    },

    _initForm: function () {
        this.form = FileUp.helpers.ClassHelper.createObject(this.form);
        this.form.on(FileUp.form.Form.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    },

    _initDropArea: function () {
        this.dropArea = FileUp.helpers.ClassHelper.createObject(this.dropArea);
        this.dropArea.on(FileUp.form.DropArea.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    },

    _initQueue: function () {
        this.queue = FileUp.helpers.ClassHelper.createObject(this.queue);
    },

    _initManagers: function () {
        var managers = [
            'queue'
        ];

        for (var i = 0, l = managers.length; i < l; i++) {
            var name = managers[i] + 'Manager';
            this[name] = FileUp.helpers.ClassHelper.createObject(
                FileUp.helpers.ClassHelper.merge(
                    {
                        collection: this.queue
                    },
                    this[name]
                )
            );
        }
    },

    /**
     * Open browse files dialog on local machine
     */
    browse: function () {
        this.form.browse();
    },

    /**
     *
     */
    destroy: function () {
        this.form.destroy();
    },

    /**
     *
     * @param {object} nativeFiles
     * @protected
     */
    _onFormSubmit: function (nativeFiles) {
        var uploader = null;
        var isIE = FileUp.helpers.BrowserHelper.isIE();
        if (isIE && isIE < 10) {
            uploader = FileUp.helpers.ClassHelper.createObject(
                FileUp.helpers.ClassHelper.merge(
                    {
                        url: this.backendUrl,
                        params: this.backendParams,
                        form: this.form
                    },
                    this.uploaderConfigs.iframe
                )
            );
        }

        var i = 0;
        var files = [];
        for (var path in nativeFiles) {
            if (nativeFiles.hasOwnProperty(path)) {
                var nativeFile = nativeFiles[path];
                var file = FileUp.helpers.ClassHelper.createObject(
                    FileUp.helpers.ClassHelper.merge(
                        {
                            index: i++,
                            native: nativeFile,
                            path: path,
                            type: nativeFile.type || '',
                            bytesTotal: nativeFile.fileSize || nativeFile.size || 0
                        },
                        this.fileConfig
                    )
                );

                file.setUploader(uploader || FileUp.helpers.ClassHelper.createObject(
                        FileUp.helpers.ClassHelper.merge(
                            {
                                url: this.backendUrl,
                                params: this.backendParams,
                                file: file
                            },
                            this.uploaderConfigs.xhr
                        )
                    )
                );

                files.push(file);
            }
        }

        if (uploader instanceof FileUp.uploaders.IframeUploader) {
            uploader.files = files;
        }

        this.queue.add(files);
    }

});

/**
 * @module FileUp
 */
module.exports = FileUp;
