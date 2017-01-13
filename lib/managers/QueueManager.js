/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Manager from '../base/Manager';
import QueueCollection from '../models/QueueCollection';

export default class QueueManager extends Manager {

    preInit() {
        this.autoStart = true;

        super.preInit(...arguments);
    }

    init() {
        super.init();

        if (this.autoStart) {
            this.collection.on(QueueCollection.EVENT_ADD, this._queueNext.bind(this));
        }
        this.collection.on(QueueCollection.EVENT_ITEM_END, this._queueNext.bind(this));
    }

    start() {
        this._queueNext();
    }

    _queueNext() {
        var file = this.collection.getNextForUpload();
        if (file) {
            file.start();
            this._queueNext();
        }
    }

}
