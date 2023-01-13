/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseUploader from './BaseUploader';

export default class AxiosUploader extends BaseUploader {

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
         * @type {string}
         */
        this.fileFieldName = 'file';

        /**
         * @type {number}
         */
        this._lastReportTime = null;

        /**
         * @type {number}
         */
        this._bytesStart = 0;

        /**
         * @type {number|null}
         */
        this._bytesEnd = null;

        this.axios = null;

        super.preInit(...arguments);
    }


    start() {
        this._startInternal();
    }

    stop() {
        // super.start();
    }

    getUrl() {
        var params = this.getParams();
        params.uids = [this.file.getUid()];

        return this.constructor.addUrlParams(this._url, params);
    }

    _startInternal() {
        this.trigger(BaseUploader.EVENT_START);

        const config = {
            method: this.method,
            url: this._url,
            onUploadProgress: this._onUploadProgress.bind(this),
            headers: {
                ...this.headers,
                ['Content-Disposition']: 'attachment; filename="' + encodeURI(this.file.getName()) + '"',
                ['Content-Type']: 'multipart/form-data',
            },
        };

        const bytesTotal = this.file.getBytesTotal();

        this._bytesStart = this.file.getBytesUploaded();
        this._bytesEnd = Math.min(this._bytesStart + this.bytesMaxPart, bytesTotal);

        config.data = new FormData();
        config.data.append(this.fileFieldName, this.file.getNative());

        if (this.axios instanceof Promise) {
            Promise.resolve(this.axios)
                .then(axios => {
                    axios.request(config)
                        .then(response => {
                            this.file.setResultHttpMessage(response.data);
                            this.trigger(BaseUploader.EVENT_END,
                                [response.status, response.data]
                            );
                        })
                        .catch(() => {
                            this.trigger(BaseUploader.ERROR);
                        });
                });
        } else {
            this.axios.request(config)
                .then(response => {
                    this.trigger(BaseUploader.EVENT_END,
                        [response.status, response.data]
                    );
                })
                .catch(() => {
                    this.trigger(BaseUploader.ERROR);
                });
        }
    }

    _onUploadProgress(progressEvent) {
        var iNow = (new Date()).getTime();
        if (this._lastReportTime && iNow - this._lastReportTime < this.minProgressUpdateIntervalMs) {
            return;
        }
        this._lastReportTime = iNow;

        this.trigger(BaseUploader.EVENT_PROGRESS, [progressEvent.loaded]);
    }
}
