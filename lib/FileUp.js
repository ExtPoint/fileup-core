/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Form from './form/Form';
import DropArea from './form/DropArea';
import BrowserHelper from './helpers/BrowserHelper';
import ClassHelper from './helpers/ClassHelper';
import QueueCollection from './models/QueueCollection';
import QueueManager from './managers/QueueManager';
import File from './models/File';
import IframeUploader from './uploaders/IframeUploader';
import XhrUploader from './uploaders/XhrUploader';

export default class FileUp {

    constructor(config) {
        /**
         * @type {string}
         */
        this.backendUrl = null;

        /**
         * @type {object}
         */
        this.backendParams = {};

        /**
         * @type {Form}
         */
        this.form = {
            className: Form
        };

        /**
         * @type {DropArea}
         */
        this.dropArea = {
            className: DropArea
        };

        /**
         * @type {QueueCollection}
         */
        this.queue = {
            className: QueueCollection
        };

        /**
         * @type {QueueManager}
         */
        this.queueManager = {
            className: QueueManager
        };

        /**
         * @type {File}
         */
        this.fileConfig = {
            className: File
        };

        this.uploaderConfigs = {
            iframe: {
                className: IframeUploader
            },
            xhr: {
                className: XhrUploader
            }
        };

        if (typeof config === 'object') {
            ClassHelper.configure(this, config);
        }

        this._initForm();
        this._initDropArea();
        this._initQueue();
        this._initManagers();
    }

    _initForm() {
        this.form = ClassHelper.createObject(this.form);
        this.form.on(Form.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    }

    _initDropArea() {
        this.dropArea = ClassHelper.createObject(this.dropArea);
        this.dropArea.on(DropArea.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    }

    _initQueue() {
        this.queue = ClassHelper.createObject(this.queue);
    }

    _initManagers() {
        var managers = [
            'queue'
        ];

        for (var i = 0, l = managers.length; i < l; i++) {
            var name = managers[i] + 'Manager';
            this[name] = ClassHelper.createObject(
                ClassHelper.merge(
                    {
                        collection: this.queue
                    },
                    this[name]
                )
            );
        }
    }

    /**
     * Open browse files dialog on local machine
     */
    browse() {
        this.form.browse();
    }

    /**
     *
     */
    destroy() {
        this.form.destroy();
    }

    /**
     *
     * @param {object} nativeFiles
     * @protected
     */
    _onFormSubmit(nativeFiles) {
        var uploader = null;
        var isIE = BrowserHelper.isIE();
        if (isIE && isIE < 10) {
            uploader = ClassHelper.createObject(
                ClassHelper.merge(
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
                var file = ClassHelper.createObject(
                    ClassHelper.merge(
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

                file.setUploader(uploader || ClassHelper.createObject(
                        ClassHelper.merge(
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

        if (uploader instanceof IframeUploader) {
            uploader.files = files;
        }

        this.queue.add(files);
    }

}
