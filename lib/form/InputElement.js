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
 * @class FileUp.form.InputElement
 * @extends FileUp.base.Element
 */
FileUp.Neatness.defineClass('FileUp.form.InputElement', /** @lends FileUp.form.InputElement.prototype */{

    __extends: FileUp.base.Element,

    /**
     * @type {string}
     */
    name: 'file',

    /**
     * @type {boolean}
     */
    multiple: false,

    /**
     * @type {function}
     */
    onChange: null,

    _fileNames: {},

    init: function () {
        this.element = document.createElement('input');
        this.element.type = 'file';
        this.element.name = this.name + (this.multiple ? '[]' : '');
        this.element.multiple = this.multiple;

        // IE8 file field transparency fix.
        if (FileUp.helpers.BrowserHelper.isIE()) {
            var style = this.element.style;
            style.visibility = 'hidden';
            setTimeout(function () {
                style.visibility = 'visible';
            }, 0);
        }

        // Subscribe on change input files
        if (this.onChange) {
            this.element.onchange = this.onChange;
        }

        this.hide();
    },

    /**
     *
     * @param {number} index
     * @returns {object}
     */
    getFileDomObject: function(index) {
        index = index || 0;
        return this.element.files && this.element.files[index] || null;
    },

    /**
     *
     * @param {number} index
     * @returns {number}
     */
    getFileSize: function(index) {
        index = index || 0;

        var fileDomObject = this.getFileDomObject(index);
        return fileDomObject ? fileDomObject.fileSize || fileDomObject.size : 0;
    },

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFileName: function(index) {
        index = index || 0;

        if (!this._fileNames.hasOwnProperty(index)) {
            var fileDomObject = this.getFileDomObject(index);
            var path = fileDomObject ? fileDomObject.fileName || fileDomObject.name : '';

            this._fileNames[index] = path ? FileUp.helpers.UrlHelper.parseFileName(path) : '';
        }
        return this._fileNames[index];
    },

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFileRelativePath: function(index) {
        index = index || 0;

        var fileDomObject = this.getFileDomObject(index);
        if (fileDomObject && fileDomObject.webkitRelativePath) {
            return fileDomObject.webkitRelativePath
                .replace(/^[\/\\]+/, '')
                .replace(/\/\.$/, '/');
        }
        return '';
    },

    getCount: function() {
        if (this.element.files) {
            return this.element.files.length;
        }
        return this.element.value ? 1 : 0;
    },

    freeze: function() {
        this.element.onchange = null;
    },

    destroy: function() {
        this.element.onchange = null;
        this.__super();
    }

});
