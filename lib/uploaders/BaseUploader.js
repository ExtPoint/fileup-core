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
 * @class FileUp.uploaders.BaseUploader
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.uploaders.BaseUploader', /** @lends FileUp.uploaders.BaseUploader.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.uploaders.BaseUploader */{

        EVENT_START: 'start',
        EVENT_PROGRESS: 'progress',
        EVENT_ERROR: 'error',
        EVENT_END_PART: 'end_part',
        EVENT_END: 'end',

        isProgressSupport: function() {
            return false;
        },

        addUrlParams: function (url, params) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + this._serialize(params).join('&');
        },

        _serialize: function(params, parentKey) {
            parentKey = parentKey || '';

            var serialized = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var encodedKey = encodeURIComponent(parentKey ? parentKey + '[' + key + ']' : key);

                    if (params[key] instanceof Array) {
                        for (var i = 0, l = params[key].length; i < l; i++) {
                            serialized.push(encodedKey + '[]=' + encodeURIComponent(params[key][i]))
                        }
                    } else if (typeof params[key] === 'object') {
                        serialized = serialized.concat(this.__static._serialize(params[key], key))
                    } else if (typeof params[key] === 'boolean') {
                        serialized.push(encodedKey + '=' + (params[key] ? 1 : 0))
                    } else {
                        serialized.push(encodedKey + '=' + encodeURIComponent(params[key]))
                    }
                }
            }
            return serialized;
        }

    },

    /**
     * @type {function}
     */
    responseParser: null,

    /**
     * @type {string}
     */
    _url: '',

    /**
     * @type {object}
     */
    _params: {},

    start: function() {
    },

    stop: function() {
    },

    isProgressSupport: function() {
        return false;
    },

    /**
     *
     * @param value
     */
    setUrl: function(value) {
        this._url = value;
    },

    /**
     *
     * @returns {string}
     */
    getUrl: function() {
        return this._url;
    },

    /**
     *
     * @param value
     */
    setParams: function(value) {
        this._params = value;
    },

    /**
     *
     * @returns {string}
     */
    getParams: function() {
        return this._params;
    },

    /**
     *
     * @param text
     * @returns {[]}
     * @protected
     */
    _defaultResponseParser: function(text) {
        var data = null;
        try {
            data = JSON.parse(text);
        } catch (e) {}
        return data;
    }

});
