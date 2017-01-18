/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseUploader from './BaseUploader';
import BrowserHelper from '../helpers/BrowserHelper';

export default class XhrUploader extends BaseUploader {

    static isProgressSupport() {
        return true;
    }

    preInit() {
        /**
         * @type {string}
         */
        this.method = 'PUT';

        /**
         * @type {File}
         */
        this.file = null;

        /**
         * @type {number}
         */
        this.minProgressUpdateIntervalMs = 500;

        /**
         * This is IIS max httpRuntime@maxRequestLength value which is 2147482624 Kb
         * @type {number}
         */
        this.bytesMaxPart = 2097151 * 1024;

        /**
         * @type {object}
         */
        this.headers = {};

        /**
         * @type {number}
         */
        this._lastReportTime = null;

        /**
         * @type {XMLHttpRequest}
         */
        this._xhr = null;

        /**
         * @type {number}
         */
        this._bytesStart = 0;

        /**
         * @type {number|null}
         */
        this._bytesEnd = null;

        super.preInit(...arguments);
    }


    start() {
        this._initXhr();
        this._startInternal();
    }

    stop() {
        if (this._xhr) {
            if (this._xhr.upload) {
                this._xhr.upload.onprogress = null;
            }
            this._xhr.onreadystatechange = null;
            this._xhr.abort();
        }

        super.start();
    }

    getUrl() {
        var params = this.getParams();
        params.uids = [this.file.getUid()];

        return this.constructor.addUrlParams(this._url, params);
    }

    /**
     * Create XHR object and subscribe on it events
     * @private
     */
    _initXhr() {
        this._xhr = new XMLHttpRequest();
        this._xhr.upload.onprogress = this._onProgress.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open(this.method, this.getUrl(), true);

        try {
            this._xhr.withCredentials = true;
        } catch (e) {}

        // Set headers
        let headers = {};
        if (BrowserHelper.isWebkit() || BrowserHelper.isTrident()) {
            headers = {
                ...headers,
                'If-None-Match': '*',
                'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
                'Cache-Control': 'no-cache',
                'X-Requested-With': 'XMLHttpRequest'
            };
        }
        headers = {...headers, ...this.headers};
        Object.keys(headers).forEach(key => {
            this._xhr.setRequestHeader(key, headers[key]);
        });
    }

    _startInternal() {
        this.trigger(BaseUploader.EVENT_START);

        // Set file name
        this._xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + encodeURI(this.file.getName()) + '"');

        var isFF = BrowserHelper.isFirefox();
        if (isFF && isFF < 7) {
            this._xhr.sendAsBinary(this.file.getNative().getAsBinary());
            return;
        }

        var bytesTotal = this.file.getBytesTotal();

        this._bytesStart = this.file.getBytesUploaded();
        this._bytesEnd = Math.min(this._bytesStart + this.bytesMaxPart, bytesTotal);

        // Check partial upload
        if (this._bytesStart > 0 || this._bytesEnd < bytesTotal) {
            this._xhr.setRequestHeader('Content-Range', 'bytes ' + this._bytesStart + '-' + (this._bytesEnd - 1) + '/' + bytesTotal);

            if (this._bytesEnd < bytesTotal) {
                this._xhr.send(this.file.getNative().slice(this._bytesStart, this._bytesEnd));
            } else {
                this._xhr.send(this.file.getNative().slice(this._bytesStart));
            }
        } else {
            this._xhr.send(this.file.getNative());
        }
    }

    /**
     *
     * @param {object} event
     * @protected
     */
    _onProgress(event) {
        var iNow = (new Date()).getTime();
        if (this._lastReportTime && iNow - this._lastReportTime < this.minProgressUpdateIntervalMs) {
            return;
        }
        this._lastReportTime = iNow;

        var bytesUploaded = this._bytesStart + event.loaded;
        this.trigger(BaseUploader.EVENT_PROGRESS, [bytesUploaded]);
    }

    /**
     *
     * @protected
     */
    _onReadyStateChange() {
        if (this._xhr.readyState !== 4) {
            return;
        }

        var text = this._xhr.responseText || this._xhr.statusText;
        this.file.setResultHttpStatus(this._xhr.status);

        if (this._xhr.status >= 200 && this._xhr.status < 300) {
            if (this._bytesEnd < this.file.getBytesTotal()) {
                this.file.setBytesUploaded(this._bytesEnd);
                this.stop();
                this.start();

                this.trigger(BaseUploader.EVENT_END_PART);
            } else {
                var data = (this.responseParser || this._defaultResponseParser).call(this, text);
                if (data instanceof Array) {
                    this.file.setResultHttpMessage(data[0]);
                    this.trigger(BaseUploader.EVENT_END, [this._xhr.status, data]);
                } else {
                    this.file.setResultHttpMessage(data);
                    this.trigger(BaseUploader.EVENT_ERROR, [this._xhr.status, data]);
                }
            }
        } else {
            this.file.setResultHttpMessage(text);
            this.trigger(BaseUploader.EVENT_ERROR, [this._xhr.status, text]);
        }
    }

}
