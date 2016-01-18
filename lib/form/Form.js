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
 * @class FileUp.form.Form
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.form.Form', /** @lends FileUp.form.Form.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.form.Form */{

        EVENT_SUBMIT: 'submit'

    },

    /**
     * @type {HTMLElement}
     */
    container: null,

    /**
     * @type {boolean}
     */
    _isMultiple: true,

    /**
     * @type {FileUp.form.FormElement}
     */
    _formElement: null,

    /**
     * @type {FileUp.form.InputElement}
     */
    _lastInputElement: null,

    /**
     * @type {FileUp.form.InputElement[]}
     */
    _inputElements: [],

    init: function() {
        // Init container
        this.container = this.container || document.body;

        // Create form element
        this._formElement = new FileUp.form.FormElement();
        this._formElement.appendTo(this.container);

        // Create new input element
        this._refreshInput();
    },

    /**
     *
     * @returns {boolean}
     */
    getMultiple: function() {
        return this._isMultiple;
    },

    /**
     *
     * @param {boolean} value
     */
    setMultiple: function(value) {
        this._isMultiple = value;

        if (this._lastInputElement) {
            this._lastInputElement.element.multiple = value;
        }
    },

    submit: function(url, target) {
        // Set destination
        this._formElement.element.action = url;
        this._formElement.element.target = target;

        this._formElement.element.submit();

        // Reset values
        this._formElement.element.action = '';
        this._formElement.element.target = '';
    },

    /**
     * Open browse files dialog on local machine
     */
    browse: function() {
        var event = document.createEvent("MouseEvents");
        event.initEvent("click", true, false);

        this._lastInputElement.element.dispatchEvent(event);
    },

    /**
     *
     * @protected
     */
    _refreshInput: function () {
        // Freeze previous element, but do not detach
        if (this._lastInputElement) {
            this._lastInputElement.freeze();
            this.container.appendChild(this._lastInputElement.element);
        }

        this._lastInputElement = new FileUp.form.InputElement({
            multiple: this.getMultiple(),
            onChange: this._onInputChange.bind(this)
        });
        this._lastInputElement.appendTo(this._formElement.element);
        this._inputElements.push(this._lastInputElement);
    },

    /**
     *
     * @protected
     */
    _onInputChange: function(oEvent) {
        oEvent = oEvent || window.event;
        oEvent.preventDefault();

        if (this._lastInputElement.getCount() === 0) {
            return;
        }

        var files = {};
        for (var i = 0, l = this._lastInputElement.getCount(); i < l; i++) {
            files[this._lastInputElement.getFilePath(i)] = this._lastInputElement.getFileNative(i) || {};
        }
        this.trigger(this.__static.EVENT_SUBMIT, [files]);

        this._refreshInput();
    },

    destroy: function() {
        if (this._formElement) {
            this._formElement.destroy();
        }
        for (var i = 0, l = this._inputElements.length; i < l; i++) {
            this._inputElements[i].destroy();
        }

        this.off(this.__static.EVENT_SUBMIT);
    }

});
