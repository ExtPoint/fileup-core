/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Element from '../base/Element';
import BrowserHelper from '../helpers/BrowserHelper';

export default class InputElement extends Element {

    preInit() {

        /**
         * @type {string}
         */
        this.name = 'file';

        /**
         * @type {boolean}
         */
        this.multiple = false;

        /**
         * @type {function}
         */
        this.onChange = null;

        this._fileNames = {};

        super.preInit(...arguments);
    }

    init() {
        this.element = document.createElement('input');
        this.element.type = 'file';
        this.element.name = this.name + (this.multiple ? '[]' : '');
        this.element.multiple = this.multiple;

        // IE8 file field transparency fix.
        if (BrowserHelper.isIE()) {
            var style = this.element.style;
            style.visibility = 'hidden';
            setTimeout(() => style.visibility = 'visible', 0);
        }

        // Subscribe on change input files
        if (this.onChange) {
            this.element.onchange = this.onChange;
        }

        this.hide();
    }

    /**
     *
     * @param {number} index
     * @returns {object}
     */
    getFileNative(index) {
        index = index || 0;
        return this.element.files && this.element.files[index] || null;
    }

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFilePath(index) {
        index = index || 0;

        var file = this.getFileNative(index);
        if (!file) {
            return this.element.value || '';
        }

        return file.webkitRelativePath ?
            file.webkitRelativePath.replace(/^[\/\\]+/, '') :
        file.fileName || file.name || '';
    }

    /**
     *
     * @returns {number}
     */
    getCount() {
        if (this.element.files) {
            return this.element.files.length;
        }
        return this.element.value ? 1 : 0;
    }

    freeze() {
        this.element.onchange = null;
    }

    destroy() {
        this.element.onchange = null;
        super.destroy();
    }
}
