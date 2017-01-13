/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseObject from './BaseObject';

export default class Component extends BaseObject {

    preInit() {
        this._events = {};

        super.preInit(...arguments);
    }

    /**
     *
     * @param {string|string[]} names
     * @param {function} handler
     */
    on(names, handler) {
        if (!(names instanceof Array)) {
            names = [names];
        }

        for (var i = 0, l = names.length; i < l; i++) {
            var name = names[i];
            this._events[name] = this._events[name] || [];
            this._events[name].push(handler);
        }
    }

    /**
     *
     * @param {string|string[]} [names]
     * @param {function} [handler]
     */
    off(names, handler) {
        if (names) {
            if (!(names instanceof Array)) {
                names = [names];
            }

            for (var i = 0, l = names.length; i < l; i++) {
                var name = names[i];

                if (this._events[name]) {
                    if (handler) {
                        var index = this._events[name].indexOf(handler);
                        if (index !== -1) {
                            this._events[name].splice(index, 1);
                        }
                    } else {
                        delete this._events[name];
                    }
                }
            }
        } else {
            this._events = {};
        }
    }

    /**
     *
     * @param {string} name
     * @param {*[]} [args]
     */
    trigger(name, args) {
        args = args || [];

        if (this._events[name]) {
            for (var i = 0, l = this._events[name].length; i < l; i++) {
                this._events[name][i].apply(null, args);
            }
        }
    }

}
