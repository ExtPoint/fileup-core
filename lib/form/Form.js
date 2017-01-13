/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Component from '../base/Component';
import FormElement from '../form/FormElement';
import InputElement from '../form/InputElement';

export default class Form extends Component {

    preInit() {
        /**
         * @type {HTMLElement}
         */
        this.container = null;

        /**
         * @type {boolean}
         */
        this._isMultiple = true;

        /**
         * @type {FormElement}
         */
        this._formElement = null;

        /**
         * @type {InputElement}
         */
        this._lastInputElement = null;

        /**
         * @type {InputElement[]}
         */
        this._inputElements = [];

        super.preInit(...arguments);
    }

    init() {
        // Init container
        this.container = this.container || document.body;

        // Create form element
        this._formElement = new FormElement();
        this._formElement.appendTo(this.container);

        // Create new input element
        this._refreshInput();
    }

    /**
     *
     * @returns {boolean}
     */
    getMultiple() {
        return this._isMultiple;
    }

    /**
     *
     * @param {boolean} value
     */
    setMultiple(value) {
        this._isMultiple = value;

        if (this._lastInputElement) {
            this._lastInputElement.element.multiple = value;
        }
    }

    submit(url, target) {
        // Set destination
        this._formElement.element.action = url;
        this._formElement.element.target = target;

        this._formElement.element.submit();

        // Reset values
        this._formElement.element.action = '';
        this._formElement.element.target = '';
    }

    /**
     * Open browse files dialog on local machine
     */
    browse() {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, false);

        this._lastInputElement.element.dispatchEvent(event);
    }

    /**
     *
     * @protected
     */
    _refreshInput() {
        // Freeze previous element, but do not detach
        if (this._lastInputElement) {
            this._lastInputElement.freeze();
            this.container.appendChild(this._lastInputElement.element);
        }

        this._lastInputElement = new InputElement({
            multiple: this.getMultiple(),
            onChange: this._onInputChange.bind(this)
        });
        this._lastInputElement.appendTo(this._formElement.element);
        this._inputElements.push(this._lastInputElement);
    }

    /**
     *
     * @param {object} event
     * @protected
     */
    _onInputChange(event) {
        event = event || window.event;
        event.preventDefault();

        if (this._lastInputElement.getCount() === 0) {
            return;
        }

        var files = {};
        for (var i = 0, l = this._lastInputElement.getCount(); i < l; i++) {
            files[this._lastInputElement.getFilePath(i)] = this._lastInputElement.getFileNative(i) || {};
        }
        this.trigger(Form.EVENT_SUBMIT, [files]);

        this._refreshInput();
    }

    destroy() {
        if (this._formElement) {
            this._formElement.destroy();
        }
        for (var i = 0, l = this._inputElements.length; i < l; i++) {
            this._inputElements[i].destroy();
        }

        this.off(Form.EVENT_SUBMIT);
    }
}

Form.EVENT_SUBMIT = 'submit';

