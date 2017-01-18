/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Exception from '../base/Exception';

export default class ClassHelper {

    static generateUid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    }

    static createObject(config) {
        if (!config.className) {
            throw new Exception('Wrong configuration for create object.');
        }

        config = this.clone(config);
        var className = config.className;
        delete config.className;

        // Get class
        var objectClass = className;
        if (typeof objectClass !== 'function') {
            throw new Exception('Not found class `' + className + '` for create instance.');
        }

        return new objectClass(config);
    }

    /**
     * @param {object} object
     * @param {object} config
     */
    static configure(object, config) {
        for (var key in config) {
            if (!config.hasOwnProperty(key)) {
                continue;
            }

            // Generate setter name
            var setter = 'set' + key.charAt(0).toUpperCase() + key.slice(1);

            if (typeof object[setter] !== 'function') {
                if (typeof object[key] === 'function') {
                    throw new Exception('You can not replace from config function `' + key + '` in object `' + object.constructor.name + '`.');
                }

                if (typeof object[key] === 'undefined') {
                    throw new Exception('Config param `' + key + '` is undefined in object `' + object.constructor.name + '`.');
                }
            }

            if (typeof object[key] !== 'undefined' && typeof object[key] !== 'function') {
                if (this._isSimpleObject(object[key]) && this._isSimpleObject(config[key])) {
                    object[key] = this.merge(object[key], config[key]);
                } else {
                    object[key] = config[key];
                }
            } else if (typeof object[setter] === 'function') {
                object[setter].call(object, config[key]);
            }
        }
    }

    /**
     * @param {object} [obj]
     * @returns {object}
     */
    static merge(obj) {
        var dst = {};

        for (var i = 0, l = arguments.length; i < l; ++i) {
            obj = arguments[i];
            if (typeof obj !== 'object' || obj instanceof Array) {
                continue;
            }

            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (this._isSimpleObject(obj[key])) {
                        dst[key] = this.merge(dst[key], obj[key]);
                    } else {
                        dst[key] = obj[key];
                    }
                }
            }
        }

        return dst;
    }

    /**
     *
     * @param {object} obj
     * @returns {object}
     */
    static clone(obj) {
        var clone = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = obj[key];
            }
        }
        return clone;
    }

    static _isSimpleObject(obj) {
        return obj && typeof obj === 'object' && !(obj instanceof Array) && obj.constructor === Object;
    }

}
