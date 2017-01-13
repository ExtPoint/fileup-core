/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Component from '../base/Component';
import FileProgress from './FileProgress';
import ClassHelper from '../helpers/ClassHelper';
import BaseUploader from '../uploaders/BaseUploader';

export default class File extends Component {

    preInit() {

        this.index = 0;

        /**
         * @type {string}
         */
        this._uid = null;

        /**
         * @type {File}
         */
        this._native = null;

        /**
         * @type {FileProgress}
         */
        this.progress = {
            className: FileProgress
        };

        /**
         * @type {BaseUploader}
         */
        this._uploader = null;

        /**
         * @type {string}
         */
        this._path = '';

        /**
         * @type {string}
         */
        this._type = '';

        /**
         * @type {number}
         */
        this._bytesUploaded = 0;

        /**
         * @type {number}
         */
        this._bytesUploadEnd = 0;

        /**
         * @type {number}
         */
        this._bytesTotal = 0;

        /**
         * @type {string}
         */
        this._status = 'queue';

        /**
         * @type {string|null}
         */
        this._result = null;

        /**
         * @type {number|null}
         */
        this._resultHttpStatus = null;

        /**
         * @type {string|null}
         */
        this._resultHttpMessage = null;

        super.preInit(...arguments);
    }

    init() {
        this._uid = this._uid || ClassHelper.generateUid();
        this.progress = ClassHelper.createObject(
            ClassHelper.merge(
                {
                    file: this
                },
                this.progress
            )
        );
    }

    start() {
        this._uploader.start();
    }

    pause() {
        if (this._status === File.STATUS_PAUSE) {
            this.start();
            return;
        }

        this.stop();
        this.setStatus(File.STATUS_PAUSE);
    }

    stop() {
        this._uploader.stop();
    }

    /**
     *
     * @param {string} value
     */
    setUid(value) {
        this._uid = value;
    }

    /**
     *
     * @returns {string}
     */
    getUid() {
        return this._uid;
    }

    /**
     *
     * @param {File} value
     */
    setNative(value) {
        this._native = value;
    }

    /**
     *
     * @returns {File}
     */
    getNative() {
        return this._native;
    }

    /**
     *
     * @param {string} value
     */
    setPath(value) {
        this._path = value;
    }

    /**
     *
     * @returns {string}
     */
    getPath() {
        return this._path;
    }

    /**
     *
     * @param {string} value
     */
    setType(value) {
        this._type = value;
    }

    /**
     *
     * @returns {string}
     */
    getType() {
        return this._type;
    }

    /**
     *
     * @returns {string}
     */
    getName() {
        var path = this.getPath();
        var matches = /[^\/\\]+$/.exec(path);

        return matches ? matches[0].replace(/^([^?]+).*$/, '$1') : path;
    }

    /**
     *
     * @param {BaseUploader} value
     */
    setUploader(value) {
        if (this._uploader) {
            this._uploader.stop();
        }

        this._uploader = value;

        this._uploader.on(BaseUploader.EVENT_START, () => {
            this.progress.reset();
            this.trigger(File.EVENT_PROGRESS, [this]);

            this._resultHttpStatus = null;
            this._resultHttpMessage = null;
            this.setStatus(File.STATUS_PROCESS);
        });

        this._uploader.on(BaseUploader.EVENT_ERROR, () => {
            this.progress.reset();
            this.trigger(File.EVENT_PROGRESS, [this]);

            this._result = File.RESULT_ERROR;
            this.setStatus(File.STATUS_END);
        });

        this._uploader.on(BaseUploader.EVENT_END, () => {
            this.setBytesUploaded(this.getBytesTotal());
            this.progress.reset();
            this.trigger(File.EVENT_PROGRESS, [this]);

            this._result = File.RESULT_SUCCESS;
            this.setStatus(File.STATUS_END);
        });

        this._uploader.on(BaseUploader.EVENT_PROGRESS, bytesUploaded => {
            this.progress.add(bytesUploaded);
            this.setBytesUploaded(bytesUploaded);
        });
    }

    /**
     *
     * @returns {BaseUploader}
     */
    getUploader() {
        return this._uploader;
    }

    /**
     *
     * @param {number} value
     */
    setBytesUploaded(value) {
        if (this._bytesUploaded === value) {
            return;
        }

        this._bytesUploaded = value;
        this.trigger(File.EVENT_PROGRESS, [this]);
    }

    /**
     *
     * @returns {number}
     */
    getBytesUploaded() {
        return this._bytesUploaded;
    }

    /**
     *
     * @param {number} value
     */
    setBytesUploadEnd(value) {
        if (this._bytesUploadEnd === value) {
            return;
        }

        this._bytesUploadEnd = value;
        this.trigger(File.EVENT_PROGRESS, [this]);
    }

    /**
     *
     * @returns {number}
     */
    getBytesUploadEnd() {
        return this._bytesUploadEnd;
    }

    /**
     *
     * @param {number} value
     */
    setBytesTotal(value) {
        if (this._bytesTotal === value) {
            return;
        }

        this._bytesTotal = value;
        this.trigger(File.EVENT_PROGRESS, [this]);
    }

    /**
     *
     * @returns {number}
     */
    getBytesTotal() {
        return this._bytesTotal;
    }

    /**
     *
     * @param {string} value
     */
    setResult(value) {
        this._result = value;
    }

    /**
     *
     * @returns {string}
     */
    getResult() {
        return this._result;
    }

    /**
     *
     * @returns {boolean}
     */
    isResultSuccess() {
        return this._result === File.RESULT_SUCCESS;
    }

    /**
     *
     * @returns {boolean}
     */
    isResultError() {
        return this._result === File.RESULT_ERROR;
    }

    /**
     *
     * @param {string} value
     */
    setResultHttpStatus(value) {
        this._resultHttpStatus = value;
    }

    /**
     *
     * @returns {number|null}
     */
    getResultHttpStatus() {
        return this._resultHttpStatus;
    }

    /**
     *
     * @param {string} value
     */
    setResultHttpMessage(value) {
        this._resultHttpMessage = value;
    }

    /**
     *
     * @returns {string|null}
     */
    getResultHttpMessage() {
        return this._resultHttpMessage;
    }

    /**
     *
     * @returns {boolean}
     */
    isStatusQueue() {
        return this._status === File.STATUS_QUEUE;
    }

    /**
     *
     * @returns {boolean}
     */
    isStatusProcess() {
        return this._status === File.STATUS_PROCESS;
    }

    /**
     *
     * @returns {boolean}
     */
    isStatusPause() {
        return this._status === File.STATUS_PAUSE;
    }

    /**
     *
     * @returns {boolean}
     */
    isStatusEnd() {
        return this._status === File.STATUS_END;
    }

    /**
     *
     * @returns {string}
     */
    getStatus() {
        return this._status;
    }

    /**
     *
     * @returns {{path: string, type: string, bytesUploaded: number, bytesUploadEnd: number, bytesTotal: number, status: string, result: (string|null), resultHttpStatus: (number|null), resultHttpMessage: (string|null)}}
     */
    toJSON() {
        return {
            path: this.getPath(),
            type: this.getType(),
            bytesUploaded: this.getBytesUploaded(),
            bytesUploadEnd: this.getBytesUploadEnd(),
            bytesTotal: this.getBytesTotal(),
            status: this.getStatus(),
            result: this.getResult(),
            resultHttpStatus: this.getResultHttpStatus(),
            resultHttpMessage: this.getResultHttpMessage(),
            progress: this.progress.toJSON()
        };
    }

    setStatus(value) {
        if (this._status === value) {
            return;
        }

        this._status = value;
        this.trigger(File.EVENT_STATUS, [this, this._status]);
    }

}

File.STATUS_QUEUE = 'queue';
File.STATUS_PROCESS = 'process';
File.STATUS_PAUSE = 'pause';
File.STATUS_END = 'end';
File.RESULT_SUCCESS = 'success';
File.RESULT_ERROR = 'error';

File.EVENT_STATUS = 'status';
File.EVENT_PROGRESS = 'progress';
