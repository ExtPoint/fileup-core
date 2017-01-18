/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import ClassHelper from '../helpers/ClassHelper';

export default class BaseObject {

    constructor(config) {
        this.preInit(config);

        if (typeof config === 'object') {
            ClassHelper.configure(this, config);
        }

        this.init();
    }

    preInit() {

    }

    init() {

    }
}
