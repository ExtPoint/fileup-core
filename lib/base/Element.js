/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseObject from './BaseObject';

export default class Element extends BaseObject {

    preInit() {
        this.element = null;

        super.preInit();
    }

    hide() {
        this.element.style.position = 'absolute';
        this.element.style.top = '-999px';
        this.element.style.left = '-999px';
        this.element.style.opacity = '0';
        this.element.style.filter = 'alpha(opacity=0)';
        this.element.style.border = 'none';
        this.element.style.outline = 'none';
        this.element.style.width = 'none';
        this.element.style.height = 'none';
        this.element.style['pointer-events'] = 'none';
    }

    /**
     *
     * @param {HTMLElement} container
     */
    appendTo(container) {
        container.appendChild(this.element);
    }

    /**
     *
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}
