/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Component from '../base/Component';

export default class BaseUploader extends Component {

    static isProgressSupport() {
        return false;
    }

    static addUrlParams(url, params) {
        return url + (url.indexOf('?') === -1 ? '?' : '&') + this._serialize(params).join('&');
    }

    static _serialize(params, parentKey) {
        parentKey = parentKey || '';

        var serialized = [];
        for (var key in params) {
            if (params.hasOwnProperty(key)) {
                var encodedKey = encodeURIComponent(parentKey ? parentKey + '[' + key + ']' : key);

                if (params[key] instanceof Array) {
                    for (var i = 0, l = params[key].length; i < l; i++) {
                        serialized.push(encodedKey + '[]=' + encodeURIComponent(params[key][i]));
                    }
                } else if (typeof params[key] === 'object') {
                    serialized = serialized.concat(this._serialize(params[key], key));
                } else if (typeof params[key] === 'boolean') {
                    serialized.push(encodedKey + '=' + (params[key] ? 1 : 0));
                } else {
                    serialized.push(encodedKey + '=' + encodeURIComponent(params[key]));
                }
            }
        }
        return serialized;
    }

    preInit() {

        /**
         * @type {function}
         */
        this.responseParser = null;

        /**
         * @type {string}
         */
        this._url = '';

        /**
         * @type {object}
         */
        this._params = {};

        super.preInit(...arguments);
    }


    start() {
    }

    stop() {
    }

    /**
     *
     * @param {string} value
     */
    setUrl(value) {
        this._url = value;
    }

    /**
     *
     * @returns {string}
     */
    getUrl() {
        return this._url;
    }

    /**
     *
     * @param {object} value
     */
    setParams(value) {
        this._params = value;
    }

    /**
     *
     * @returns {string}
     */
    getParams() {
        return this._params;
    }

    /**
     *
     * @param {string} text
     * @returns {[]}
     * @protected
     */
    _defaultResponseParser(text) {
        var data = null;
        try {
            data = JSON.parse(text);
        } catch (e) {}
        return data;
    }

}

BaseUploader.EVENT_START = 'start';
BaseUploader.EVENT_PROGRESS = 'progress';
BaseUploader.EVENT_ERROR = 'error';
BaseUploader.EVENT_END_PART = 'end_part';
BaseUploader.EVENT_END = 'end';

