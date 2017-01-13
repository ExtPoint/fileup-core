/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseUploader from './BaseUploader';
import BrowserHelper from '../helpers/BrowserHelper';

export default class IframeUploader extends BaseUploader {

    preInit() {

        /**
         * @type {File[]}
         */
        this.files = null;

        /**
         * @type {Form}
         */
        this.form = null;

        /**
         * @type {HTMLElement}
         */
        this.container = null;

        /**
         * @type {string}
         */
        this.namePrefix = 'FileUpIframe';

        /**
         * @type {string}
         */
        this._name = '';

        /**
         * @type {HTMLElement}
         */
        this._wrapper = null;

        /**
         * @type {HTMLElement}
         */
        this._frame = null;

        /**
         * @type {number|null}
         */
        this._frameLoadTimer = null;

        /**
         * @type {boolean}
         */
        this._isFrameLoaded = false;

        super.preInit(...arguments);
    }

    init() {
        // Generate name
        this._name = this.namePrefix + (++IframeUploader._Counter);

        // Init container
        this.container = this.container || document.body;

        // Render frame
        this._initContainer();
        this._initFrame();

    }

    start() {
        // Start upload
        this.trigger(BaseUploader.EVENT_START);
        this.form.submit(this.getUrl(), this._name);
    }

    stop() {
        this._clearTimer();

        if (this._frame) {
            this._frame.onload = null;
            this._frame.onreadystatechange = null;

            this._wrapper.removeChild(this._frame);
            delete this._frame;
        }

        super.start();
    }

    getUrl() {
        var uids = [];
        for (var key in this.files) {
            if (this.files.hasOwnProperty(key)) {
                uids.push(this.files[key].getUid());
            }
        }

        var params = this.getParams();
        params.uids = uids;

        return this.constructor.addUrlParams(this._url, params);
    }

    _initContainer() {
        this._wrapper = document.createElement('div');
        this._wrapper.style.position = 'absolute';
        this._wrapper.style.width = 0;
        this._wrapper.style.height = 0;
        this._wrapper.style.top = '-100px';
        this._wrapper.style.left = '-100px';
        this._wrapper.style.display = 'none';

        this.container.appendChild(this._wrapper);
    }

    _initFrame() {
        var isCreated = false;
        var isIE = BrowserHelper.isIE();

        if (isIE && isIE < 10) {
            try {
                this._frame = document.createElement('<iframe name="' + this._name + '">');
                isCreated = true;
            } catch (e) {
                // It seems IE9 in compatability mode.
            }
        }

        if (!isCreated) {
            this._frame = document.createElement('iframe');
            this._frame.name = this._name;
        }

        this._frame.src = 'javascript:{};';
        this._wrapper.appendChild(this._frame);

        // Subscribe on iframe load events
        this._frame.onreadystatechange = this._onReadyStateChange.bind(this);
        this._frame.onload = this._onLoad.bind(this);
    }

    _onReadyStateChange(event) {
        switch (this._frame.readyState) {
            case 'complete':
            case 'interactive':
                this._clearTimer();
                this._frameLoadTimer = setTimeout(() => {
                    try {
                        this._frame.contentWindow.document.body;
                        this._onLoad(event);
                    } catch (e) {
                        this._onReadyStateChange(event);
                    }
                }, 1000);
                break;
        }
    }

    _onLoad() {
        this._clearTimer();

        // Check already loaded
        if (this._isFrameLoaded) {
            return;
        }
        this._isFrameLoaded = true;

        var document = null;
        var status = null;
        var errorMessage = '';

        // Catch iframe load error in Firefox.
        try {
            document = this._frame.contentWindow.document;
            document.body;
        }
        catch (e) {
            status = 403;
            errorMessage = e.toString();
        }

        var text = document.body.innerText || document.body.innerHTML;
        if (!status) {
            status = 201; // Created
        }

        if (status >= 200 && status < 300) {
            var data = (this.responseParser || this._defaultResponseParser).call(this, text);
            if (data instanceof Array) {
                for (var i = 0, l = this.files.length; i < l; i++) {
                    this.files[i].setResultHttpStatus(status);
                    this.files[i].setResultHttpMessage(data[i]);
                }
                this.trigger(BaseUploader.EVENT_END, [status, data]);
            } else {
                for (var i = 0, l = this.files.length; i < l; i++) {
                    this.files[i].setResultHttpStatus(status);
                    this.files[i].setResultHttpMessage(data);
                }
                this.trigger(BaseUploader.EVENT_ERROR, [500, data]);
            }
        } else {
            for (var i = 0, l = this.files.length; i < l; i++) {
                this.files[i].setResultHttpStatus(status);
                this.files[i].setResultHttpMessage(errorMessage);
            }
            this.trigger(BaseUploader.EVENT_ERROR, [status, errorMessage]);
        }

        this.stop();
    }

    _clearTimer() {
        if (this._frameLoadTimer) {
            clearTimeout(this._frameLoadTimer);
        }
    }
}

IframeUploader._Counter = 0;
