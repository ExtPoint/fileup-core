/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseObject from '../base/BaseObject';

export default class BrowserHelper extends BaseObject {

    static _browserName = null;
    static _browserVersion = null;

    static _detect() {
        if (this._browserName !== null) {
            return;
        }

        var ua = navigator.userAgent, tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if (/trident/i.test(M[1])) {
            tem = /\brv[ :]+(\d+)/g.exec(ua) || [];

            this._browserName = 'trident';
            this._browserVersion = tem[1] || 1;
            return;
        }
        if (M[1] === 'Chrome') {
            tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
            if (tem != null) {
                this._browserName = tem[1].replace('OPR', 'Opera').toLowerCase();
                this._browserVersion = tem[2] || 1;
                return;
            }
        }
        M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
        if ((tem = ua.match(/version\/(\d+)/i)) != null) {
            M.splice(1, 1, tem[1]);
        }

        this._browserName = M[0].toLowerCase();
        this._browserVersion = M[1] || 1;
    }

    static isIE() {
        this._detect();
        return this._browserName === 'msie' ? this._browserVersion : false;
    }

    static isWebkit() {
        return this.isChrome() || this.isSafari();
    }

    static isChrome() {
        this._detect();
        return this._browserName === 'chrome' ? this._browserVersion : false;
    }

    static isSafari() {
        this._detect();
        return this._browserName === 'safari' ? this._browserVersion : false;
    }

    static isFirefox() {
        this._detect();
        return this._browserName === 'firefox' ? this._browserVersion : false;
    }

    static isTrident() {
        this._detect();
        return this._browserName === 'trident' ? this._browserVersion : false;
    }

    static isFileDropSupport() {
        return 'draggable' in document.createElement('span') && typeof window.FileReader !== 'undefined';
    }

}
