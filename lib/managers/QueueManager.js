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
 * @class FileUp.managers.QueueManager
 * @extends FileUp.base.Manager
 */
FileUp.Neatness.defineClass('FileUp.managers.QueueManager', /** @lends FileUp.managers.QueueManager.prototype */{

    __extends: FileUp.base.Manager,

    autoStart: true,

    init: function() {
        this.__super();

        if (this.autoStart) {
            this.collection.on(FileUp.models.QueueCollection.EVENT_ADD, this._queueNext.bind(this));
        }
        this.collection.on(FileUp.models.QueueCollection.EVENT_ITEM_END, this._queueNext.bind(this));
    },

    start: function() {
        this._queueNext();
    },

    _queueNext: function() {
        var file = this.collection.getNextForUpload();
        if (file) {
            file.start();
            this._queueNext();
        }
    }

});
