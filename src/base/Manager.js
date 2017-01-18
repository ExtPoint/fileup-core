/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import BaseObject from './BaseObject';
import QueueCollection from '../models/QueueCollection';

export default class Manager extends BaseObject {

    preInit() {
        this.enable = true;

        /**
         * @type {QueueCollection}
         */
        this.collection = null;

        super.preInit(...arguments);
    }

    init() {
        if (this.enable) {
            this.collection.on(QueueCollection.EVENT_ADD, this._onAdd.bind(this));
            this.collection.on(QueueCollection.EVENT_REMOVE, this._onRemove.bind(this));
        }
    }

    _onAdd() {
    }

    _onRemove() {
    }

}
