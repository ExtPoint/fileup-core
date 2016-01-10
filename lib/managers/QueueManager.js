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

    init: function() {
        this._onStatusChange = this._onStatusChange.bind(this);
        this.__super();
    },

    _onAdd: function(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            files[i].on(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
        }

        this._queueNext();
    },

    _onRemove: function(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            files[i].off(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
        }
    },

    /**
     *
     * @param {FileUp.models.File} file
     * @protected
     */
    _onStatusChange: function(file) {
        if (file.isStatusEnd()) {
            this._queueNext();
        }
    },

    _queueNext: function() {
        var file = this.collection.getNextForUpload();
        if (file) {
            file.start();
            this._queueNext();
        }
    }

});
