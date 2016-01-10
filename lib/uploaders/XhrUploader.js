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

require('./BaseUploader');

/**
 * @class FileUp.uploaders.XhrUploader
 * @extends FileUp.uploaders.BaseUploader
 */
FileUp.Neatness.defineClass('FileUp.uploaders.XhrUploader', /** @lends FileUp.uploaders.XhrUploader.prototype */{

    __extends: FileUp.uploaders.BaseUploader,

    __static: /** @lends FileUp.uploaders.XhrUploader */{

        isProgressSupport: function() {
            return true;
        }

    },

    /**
     * @type {string}
     */
    method: 'PUT',

    /**
     * @type {FileUp.models.File}
     */
    file: null,

    /**
     * @type {number}
     */
    minProgressUpdateIntervalMs: 500,

    /**
     * This is IIS max httpRuntime@maxRequestLength value which is 2147482624 Kb
     * @type {number}
     */
    bytesMaxPart: 2097151 * 1024,

    /**
     * @type {number}
     */
    _lastReportTime: null,

    /**
     * @type {XMLHttpRequest}
     */
    _xhr: null,

    /**
     * @type {number}
     */
    _bytesStart: 0,

    /**
     * @type {number|null}
     */
    _bytesEnd: null,

    start: function () {
        this._initXhr();
        this._startInternal();
    },

    stop: function() {
        if (this._xhr) {
            if (this._xhr.upload) {
                this._xhr.upload.onprogress = null;
            }
            this._xhr.onreadystatechange = null;
            this._xhr.abort();
        }

        this.__super();
    },

    /**
     * Create XHR object and subscribe on it events
     * @private
     */
    _initXhr: function () {
        this._xhr = new XMLHttpRequest();
        this._xhr.upload.onprogress = this._onProgress.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open(this.method, this.url, true);

        try {
            this._xhr.withCredentials = true;
        } catch (e) {
        }

        if (FileUp.helpers.BrowserHelper.isWebkit() || FileUp.helpers.BrowserHelper.isTrident()) {
            this._xhr.setRequestHeader("If-None-Match", "*");
            this._xhr.setRequestHeader("If-Modified-Since", "Mon, 26 Jul 1997 05:00:00 GMT");
            this._xhr.setRequestHeader("Cache-Control", "no-cache");
            this._xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        }
    },

    _startInternal: function() {
        this.trigger(this.__static.EVENT_START);

        // Set file name
        this._xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + encodeURI(this.file.getName()) + '"');

        var isFF = FileUp.helpers.BrowserHelper.isFirefox();
        if (isFF && isFF < 7) {
            this._xhr.sendAsBinary(this.file.getNative().getAsBinary());
            return;
        }

        var bytesTotal = this.file.getBytesTotal();

        this._bytesStart = this.file.getBytesUploaded();
        this._bytesEnd = Math.min(this._bytesStart + this.bytesMaxPart, bytesTotal);

        if (this._bytesStart && this._bytesStart >= bytesTotal) {
            this.trigger(this.__static.EVENT_END);
            return;
        }

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
    },

    /**
     *
     * @param {object} event
     * @protected
     */
    _onProgress: function(event) {
        var iNow = (new Date()).getTime();
        if (this._lastReportTime && iNow - this._lastReportTime < this.minProgressUpdateIntervalMs) {
            return;
        }
        this._lastReportTime = iNow;

        var bytesUploaded = this._bytesStart + event.loaded;
        this.trigger(this.__static.EVENT_PROGRESS, [bytesUploaded]);
    },

    /**
     *
     * @param {object} event
     * @protected
     */
    _onReadyStateChange: function(event) {
        if (this._xhr.readyState !== 4) {
            return;
        }

        if (this._xhr.status >= 200 && this._xhr.status < 300) {
            if (this._bytesEnd < this.file.getBytesTotal()) {
                this.file.setBytesUploaded(this._bytesEnd);
                this.stop();
                this.start();

                this.trigger(this.__static.EVENT_END_PART);
            } else {
                this.trigger(this.__static.EVENT_END);
            }
        } else {
            var errorMessage = this._xhr.responseText || this._xhr.statusText;
            this.trigger(this.__static.EVENT_ERROR, [this._xhr.status, errorMessage])
        }
    }

});
