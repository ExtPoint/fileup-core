/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

export default class Exception extends Error {

    constructor(message) {
        super(message);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = this.constructor.name;
        this.message = message || '';
    }
}
