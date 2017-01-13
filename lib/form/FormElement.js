/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Element from '../base/Element';

export default class FormElement extends Element {

    init() {
        this.element = document.createElement('form');
        this.element.setAttribute('method', 'POST');
        this.element.setAttribute('enctype', 'multipart/form-data');
        this.element.setAttribute('acceptCharset', 'UTF-8');
        this.element.setAttribute('characterSet', 'UTF-8');
        this.element.setAttribute('charset', 'UTF-8');

        this.hide();
    }

}
