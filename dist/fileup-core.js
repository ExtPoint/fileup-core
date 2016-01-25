(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./npm');

if (typeof window !== 'undefined') {
    var prev = window.FileUp;
    var FileUp = window.FileUp = module.exports;
    FileUp.noConflict = function() {
        window.FileUp = prev;
        return FileUp;
    }
}
},{"./npm":27}],2:[function(require,module,exports){
/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Neatness = require('neatness').newContext();
Neatness.noConflict();

/**
 * @namespace FileUp
 * @alias module:fileup-core
 */
var FileUp;

/**
 * @class FileUp
 * @extends Neatness.Object
 */
FileUp = Neatness.defineClass('FileUp', /** @lends FileUp.prototype */{

    __extends: Neatness.Object,

    __static: /** @lends FileUp */{

        Neatness: Neatness,

        EVENT_SUBMIT: 'submit'

    },

    /**
     * @type {string}
     */
    backendUrl: null,

    /**
     * @type {object}
     */
    backendParams: {},

    /**
     * @type {FileUp.form.Form}
     */
    form: {
        className: 'FileUp.form.Form'
    },

    /**
     * @type {FileUp.form.DropArea}
     */
    dropArea: {
        className: 'FileUp.form.DropArea'
    },

    /**
     * @type {FileUp.models.QueueCollection}
     */
    queue: {
        className: 'FileUp.models.QueueCollection'
    },

    /**
     * @type {FileUp.managers.QueueManager}
     */
    queueManager: {
        className: 'FileUp.managers.QueueManager'
    },

    /**
     * @type {FileUp.models.File}
     */
    fileConfig: {
        className: 'FileUp.models.File'
    },

    uploaderConfigs: {
        iframe: {
            className: 'FileUp.uploaders.IframeUploader'
        },
        xhr: {
            className: 'FileUp.uploaders.XhrUploader'
        }
    },

    constructor: function (config) {
        if (typeof config === 'object') {
            FileUp.helpers.ClassHelper.configure(this, config);
        }

        this._initForm();
        this._initDropArea();
        this._initQueue();
        this._initManagers();
    },

    _initForm: function () {
        this.form = FileUp.helpers.ClassHelper.createObject(this.form);
        this.form.on(FileUp.form.Form.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    },

    _initDropArea: function () {
        this.dropArea = FileUp.helpers.ClassHelper.createObject(this.dropArea);
        this.dropArea.on(FileUp.form.DropArea.EVENT_SUBMIT, this._onFormSubmit.bind(this));
    },

    _initQueue: function () {
        this.queue = FileUp.helpers.ClassHelper.createObject(this.queue);
    },

    _initManagers: function () {
        var managers = [
            'queue'
        ];

        for (var i = 0, l = managers.length; i < l; i++) {
            var name = managers[i] + 'Manager';
            this[name] = FileUp.helpers.ClassHelper.createObject(
                FileUp.helpers.ClassHelper.merge(
                    {
                        collection: this.queue
                    },
                    this[name]
                )
            );
        }
    },

    /**
     * Open browse files dialog on local machine
     */
    browse: function () {
        this.form.browse();
    },

    /**
     *
     */
    destroy: function () {
        this.form.destroy();
    },

    /**
     *
     * @param {object} nativeFiles
     * @protected
     */
    _onFormSubmit: function (nativeFiles) {
        var uploader = null;
        var isIE = FileUp.helpers.BrowserHelper.isIE();
        if (isIE && isIE < 10) {
            uploader = FileUp.helpers.ClassHelper.createObject(
                FileUp.helpers.ClassHelper.merge(
                    {
                        url: this.backendUrl,
                        params: this.backendParams,
                        form: this.form
                    },
                    this.uploaderConfigs.iframe
                )
            );
        }

        var i = 0;
        var files = [];
        for (var path in nativeFiles) {
            if (nativeFiles.hasOwnProperty(path)) {
                var nativeFile = nativeFiles[path];
                var file = FileUp.helpers.ClassHelper.createObject(
                    FileUp.helpers.ClassHelper.merge(
                        {
                            index: i++,
                            native: nativeFile,
                            path: path,
                            type: nativeFile.type || '',
                            bytesTotal: nativeFile.fileSize || nativeFile.size || 0
                        },
                        this.fileConfig
                    )
                );

                file.setUploader(uploader || FileUp.helpers.ClassHelper.createObject(
                        FileUp.helpers.ClassHelper.merge(
                            {
                                url: this.backendUrl,
                                params: this.backendParams,
                                file: file
                            },
                            this.uploaderConfigs.xhr
                        )
                    )
                );

                files.push(file);
            }
        }

        if (uploader instanceof FileUp.uploaders.IframeUploader) {
            uploader.files = files;
        }

        this.queue.add(files);
    }

});

/**
 * @module FileUp
 */
module.exports = FileUp;

},{"neatness":21}],3:[function(require,module,exports){
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

require('./Object');

/**
 * @class FileUp.base.Component
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.base.Component', /** @lends FileUp.base.Component.prototype */{

    __extends: FileUp.base.Object,

    _events: {},

    /**
     *
     * @param {string|string[]} names
     * @param {function} handler
     */
    on: function(names, handler) {
        if (!(names instanceof Array)) {
            names = [names];
        }

        for (var i = 0, l = names.length; i < l; i++) {
            var name = names[i];
            this._events[name] = this._events[name] || [];
            this._events[name].push(handler);
        }
    },

    /**
     *
     * @param {string|string[]} [names]
     * @param {function} [handler]
     */
    off: function(names, handler) {
        if (names) {
            if (!(names instanceof Array)) {
                names = [names];
            }

            for (var i = 0, l = names.length; i < l; i++) {
                var name = names[i];

                if (this._events[name]) {
                    if (handler) {
                        var index = this._events[name].indexOf(handler);
                        if (index !== -1) {
                            this._events[name].splice(index, 1);
                        }
                    } else {
                        delete this._events[name];
                    }
                }
            }
        } else {
            this._events = {};
        }
    },

    /**
     *
     * @param {string} name
     * @param {*[]} [args]
     */
    trigger: function(name, args) {
        args = args || [];

        if (this._events[name]) {
            for (var i = 0, l = this._events[name].length; i < l; i++) {
                this._events[name][i].apply(null, args);
            }
        }
    }

});

},{"../FileUp":2,"./Object":7}],4:[function(require,module,exports){
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

require('./Object');

/**
 * @class FileUp.base.Element
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.base.Element', /** @lends FileUp.base.Element.prototype */{

    __extends: FileUp.base.Object,

    element: null,

    hide: function() {
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
    },

    /**
     *
     * @param {HTMLElement} container
     */
    appendTo: function(container) {
        container.appendChild(this.element);
    },

    /**
     *
     */
    destroy: function() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

});

},{"../FileUp":2,"./Object":7}],5:[function(require,module,exports){
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
 * @class FileUp.base.Exception
 * @extends Error
 */
FileUp.Neatness.defineClass('FileUp.base.Exception', /** @lends FileUp.base.Exception.prototype */{

    __extends: Error,

    constructor: function (message) {
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.__static);
        }
        this.name = this.__className;
        this.message = message || '';
    }

});

},{"../FileUp":2}],6:[function(require,module,exports){
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

require('./Object');

/**
 * @class FileUp.base.Manager
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.base.Manager', /** @lends FileUp.base.Manager.prototype */{

    __extends: FileUp.base.Object,

    enable: true,

    /**
     * @type {FileUp.models.QueueCollection}
     */
    collection: null,

    init: function() {
        if (this.enable) {
            this.collection.on(FileUp.models.QueueCollection.EVENT_ADD, this._onAdd.bind(this));
            this.collection.on(FileUp.models.QueueCollection.EVENT_REMOVE, this._onRemove.bind(this));
        }
    },

    _onAdd: function() {
    },

    _onRemove: function() {
    }

});

},{"../FileUp":2,"./Object":7}],7:[function(require,module,exports){
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
 * @class FileUp.base.Object
 * @extends Neatness.Object
 */
FileUp.Neatness.defineClass('FileUp.base.Object', /** @lends FileUp.base.Object.prototype */{

    __extends: FileUp.Neatness.Object,

    constructor: function (config) {
        if (typeof config === 'object') {
            FileUp.helpers.ClassHelper.configure(this, config);
        }

        this.init();
    },

    init: function() {

    }


});

},{"../FileUp":2}],8:[function(require,module,exports){
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
 * @class FileUp.form.DropArea
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.form.DropArea', /** @lends FileUp.form.DropArea.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.form.DropArea */{

        EVENT_SUBMIT: 'submit',
        EVENT_DRAG_OVER: 'drag_over',
        EVENT_DRAG_LEAVE: 'drag_leave',
        EVENT_DROP: 'drop'

    },

    /**
     * @type {boolean}
     */
    _enable: false,

    /**
     * @type {HTMLElement}
     */
    container: null,

    /**
     * @type {HTMLElement}
     */
    _mask: null,

    /**
     * @type {object}
     */
    _files: {},

    _readLevel: 0,

    init: function() {
        this.container = this.container || document.body;
        this._initContainerEvents();
        this._initMask();
    },

    _initContainerEvents: function() {
        if (this.container) {
            this.container.ondragover = this._enable ? this._onDragOver.bind(this) : null;
            this.container.ondragleave = this._enable ? this._onDragLeave.bind(this) : null;
            this.container.ondrop = this._enable ? this._onDrop.bind(this) : null;
        }
    },

    _initMask: function() {
        this._mask = document.createElement('div');
        this._mask.style.position = 'absolute';
        this._mask.style.top = 0;
        this._mask.style.left = 0;
        this._mask.style.right = 0;
        this._mask.style.bottom = 0;
        this._mask.style.background = 'transparent';
        this._mask.style['z-index'] = 10000;
        this._mask.style.display = 'none';

        this.container.appendChild(this._mask);

        this._mask.ondragover = this._enable ? this._onDragOver.bind(this) : null;
        this._mask.ondragleave = this._enable ? this._onDragLeave.bind(this) : null;
        this._mask.ondrop = this._enable ? this._onDrop.bind(this) : null;
    },

    /**
     *
     * @param {boolean} value
     */
    setEnable: function(value) {
        this._enable = value && FileUp.helpers.BrowserHelper.isFileDropSupport();
        this._initContainerEvents();
    },

    /**
     *
     * @returns {boolean}
     */
    getEnable: function() {
        return this._enable;
    },

    _onDragOver: function(event) {
        event.preventDefault();

        if (event.target !== this._mask) {
            this._mask.style.display = 'block';
        }

        if (event.dataTransfer) {
            var dtTypes = event.dataTransfer.types;
            if (dtTypes) {
                // FF
                if (dtTypes.contains && !dtTypes.contains("Files")) {
                    return;
                }

                // Chrome
                if (dtTypes.indexOf && dtTypes.indexOf("Files") === -1) {
                    return;
                }
            }

            event.dataTransfer.dropEffect = 'copy';
        }

        this.trigger(this.__static.EVENT_DRAG_OVER, [event]);
    },

    _onDragLeave: function(event) {
        event.preventDefault();

        if (event.target === this._mask) {
            this._mask.style.display = 'none';
        }

        this.trigger(this.__static.EVENT_DRAG_LEAVE, [event]);
    },

    _onDrop: function(event) {
        event.preventDefault();

        this._mask.style.display = 'none';

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            this._readDataTransferItems(event.dataTransfer.items);
        } else {
            this._readDataTransferFiles(event.dataTransfer.files);
        }

        this.trigger(this.__static.EVENT_DROP, [event]);
    },

    _readDataTransferItems: function(items) {
        var entries = [];
        for (var i = 0, l = items.length; i < l; i++) {
            var entry = items[i].webkitGetAsEntry();
            if (entry !== null) {
                entries.push(entry);
            }
        }

        this._readDirectoryEntries(entries, '');
    },

    _readDirectoryEntries: function (entries, relativePath) {
        this._readLevel++;

        for (var i = 0, l = entries.length; i < l; i++) {
            (function(entry) {
                var path = (relativePath ? relativePath + '/' : '') + entry.name;

                if (entry.isDirectory) {
                    entry.createReader().readEntries(function(subEntries) {
                        this._readDirectoryEntries(subEntries, path)
                    }.bind(this), function(e) {
                        console.error(e);
                    });
                    this._readDirectoryEntries(entry, entry.name + '/');
                } else if (entry.isFile) {
                    this._readLevel++;
                    entry.file(function (file) {
                        this._files[path] = file;

                        this._readLevel--;
                        this._readDirectoryEntries([], path);
                    }.bind(this), function errorHandler(e) {
                        console.error(e);
                    });
                }
            }.bind(this))(entries[i]);
        }
        this._readLevel--;

        if (this._readLevel === 0) {
            this._onReadDataTransfer();
        }
    },

    _readDataTransferFiles: function(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];

            // Skip folders
            if (!file.type && file.size === 0) {
                continue;
            }

            this._files[file.name] = file;
        }

        this._onReadDataTransfer();
    },

    _onReadDataTransfer: function() {
        this.trigger(this.__static.EVENT_SUBMIT, [this._files]);
        this._files = {};
    }


});

},{"../FileUp":2}],9:[function(require,module,exports){
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

},{"../FileUp":2}],10:[function(require,module,exports){
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
 * @class FileUp.form.FormElement
 * @extends FileUp.base.Element
 */
FileUp.Neatness.defineClass('FileUp.form.FormElement', /** @lends FileUp.form.FormElement.prototype */{

    __extends: FileUp.base.Element,

    init: function () {
        this.element = document.createElement('form');
        this.element.setAttribute('method', 'POST');
        this.element.setAttribute('enctype', 'multipart/form-data');
        this.element.setAttribute('acceptCharset', 'UTF-8');
        this.element.setAttribute('characterSet', 'UTF-8');
        this.element.setAttribute('charset', 'UTF-8');

        this.hide();
    }

});

},{"../FileUp":2}],11:[function(require,module,exports){
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
    getFileNative: function (index) {
        index = index || 0;
        return this.element.files && this.element.files[index] || null;
    },

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFilePath: function (index) {
        index = index || 0;

        var file = this.getFileNative(index);
        if (!file) {
            return this.element.value || '';
        }

        return file.webkitRelativePath ?
            file.webkitRelativePath.replace(/^[\/\\]+/, '') :
            file.fileName || file.name || '';
    },

    /**
     *
     * @returns {number}
     */
    getCount: function () {
        if (this.element.files) {
            return this.element.files.length;
        }
        return this.element.value ? 1 : 0;
    },

    freeze: function () {
        this.element.onchange = null;
    },

    destroy: function () {
        this.element.onchange = null;
        this.__super();
    }

});

},{"../FileUp":2}],12:[function(require,module,exports){
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
 * @class FileUp.helpers.BrowserHelper
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.helpers.BrowserHelper', /** @lends FileUp.helpers.BrowserHelper.prototype */{

    __extends: FileUp.base.Object,

    __static: /** @lends FileUp.helpers.BrowserHelper */{

        _browserName: null,

        _browserVersion: null,

        _detect: function () {
            if (this._browserName !== null) {
                return;
            }

            var ua = navigator.userAgent, tem,
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];

                this._browserName = 'trident';
                this._browserVersion = tem[1] || 1;
                return;
            }
            if (M[1] === 'Chrome') {
                tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
                if (tem != null) {
                    this._browserName = tem[1].replace('OPR', 'Opera').toLowerCase();
                    this._browserVersion = tem[2] || 1;
                    return;
                }
            }
            M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
            if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);

            this._browserName = M[0].toLowerCase();
            this._browserVersion = M[1] || 1;
        },

        isIE: function () {
            this._detect();
            return this._browserName === 'msie' ? this._browserVersion : false;
        },

        isWebkit: function () {
            return this.isChrome() || this.isSafari();
        },

        isChrome: function () {
            this._detect();
            return this._browserName === 'chrome' ? this._browserVersion : false;
        },

        isSafari: function () {
            this._detect();
            return this._browserName === 'safari' ? this._browserVersion : false;
        },

        isFirefox: function () {
            this._detect();
            return this._browserName === 'firefox' ? this._browserVersion : false;
        },

        isTrident: function () {
            this._detect();
            return this._browserName === 'trident' ? this._browserVersion : false;
        },

        isFileDropSupport: function() {
            return 'draggable' in document.createElement('span') && typeof window.FileReader !== 'undefined';
        }

    }

});

},{"../FileUp":2}],13:[function(require,module,exports){
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
 * @class FileUp.helpers.ClassHelper
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.helpers.ClassHelper', /** @lends FileUp.helpers.ClassHelper.prototype */{

    __extends: FileUp.base.Object,

    __static: /** @lends FileUp.helpers.ClassHelper */{

        generateUid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
        },

        createObject: function (config) {
            if (!config.className) {
                throw new FileUp.base.Exception('Wrong configuration for create object.');
            }

            config = this.__static.clone(config);
            var className = config.className;
            delete config.className;

            // Get class
            var objectClass = FileUp.Neatness.namespace(className);
            if (typeof objectClass !== 'function') {
                throw new FileUp.base.Exception('Not found class `' + className + '` for create instance.');
            }

            return new objectClass(config);
        },

        /**
         *
         * @param object
         * @param config
         */
        configure: function (object, config) {
            for (var key in config) {
                if (!config.hasOwnProperty(key)) {
                    continue;
                }

                // Generate setter name
                var setter = 'set' + key.charAt(0).toUpperCase() + key.slice(1);

                if (typeof object[setter] !== 'function') {
                    if (typeof object[key] === 'function') {
                        throw new FileUp.base.Exception('You can not replace from config function `' + key + '` in object `' + object.className() + '`.');
                    }

                    if (typeof object[key] === 'undefined') {
                        throw new FileUp.base.Exception('Config param `' + key + '` is undefined in object `' + object.className() + '`.');
                    }
                }

                if (typeof object[key] !== 'undefined' && typeof object[key] !== 'function') {
                    if (this._isSimpleObject(object[key]) && this._isSimpleObject(object[key])) {
                        object[key] = this.__static.merge(object[key], config[key]);
                    } else {
                        object[key] = config[key];
                    }
                } else if (typeof object[setter] === 'function') {
                    object[setter].call(object, config[key]);
                }
            }
        },

        /**
         * @param {object...} [obj]
         * @returns {object}
         */
        merge: function (obj) {
            var dst = {};

            for (var i = 0, l = arguments.length; i < l; ++i) {
                obj = arguments[i];
                if (typeof obj !== 'object' || obj instanceof Array) {
                    continue;
                }

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (this._isSimpleObject(obj[key])) {
                            dst[key] = this.__static.merge(dst[key], obj[key]);
                        } else {
                            dst[key] = obj[key];
                        }
                    }
                }
            }

            return dst;
        },

        /**
         *
         * @param {object} obj
         * @returns {object}
         */
        clone: function (obj) {
            var clone = {};
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clone[key] = obj[key];
                }
            }
            return clone;
        },

        _isSimpleObject: function(obj) {
            return obj && typeof obj === 'object' && !(obj instanceof Array) && obj.constructor === Object;
        }

    }

});

},{"../FileUp":2}],14:[function(require,module,exports){
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
        this.__super();
        this.collection.on([
            FileUp.models.QueueCollection.EVENT_ADD,
            FileUp.models.QueueCollection.EVENT_ITEM_END
        ], this._queueNext.bind(this));
    },

    _queueNext: function() {
        var file = this.collection.getNextForUpload();
        if (file) {
            file.start();
            this._queueNext();
        }
    }

});

},{"../FileUp":2}],15:[function(require,module,exports){
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
 * @class FileUp.models.File
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.models.File', /** @lends FileUp.models.File.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.models.File */{

        STATUS_QUEUE: 'queue',
        STATUS_PROCESS: 'process',
        STATUS_PAUSE: 'pause',
        STATUS_END: 'end',

        RESULT_SUCCESS: 'success',
        RESULT_ERROR: 'error',

        EVENT_STATUS: 'status',
        EVENT_PROGRESS: 'progress'

    },

    index: 0,

    /**
     * @type {string}
     */
    _uid: null,

    /**
     * @type {File}
     */
    _native: null,

    /**
     * @type {FileUp.models.FileProgress}
     */
    progress: {
        className: 'FileUp.models.FileProgress'
    },

    /**
     * @type {FileUp.uploaders.BaseUploader}
     */
    _uploader: null,

    /**
     * @type {string}
     */
    _path: '',

    /**
     * @type {string}
     */
    _type: '',

    /**
     * @type {number}
     */
    _bytesUploaded: 0,

    /**
     * @type {number}
     */
    _bytesUploadEnd: 0,

    /**
     * @type {number}
     */
    _bytesTotal: 0,

    /**
     * @type {string}
     */
    _status: 'queue',

    /**
     * @type {string|null}
     */
    _result: null,

    /**
     * @type {number|null}
     */
    _resultHttpStatus: null,

    /**
     * @type {string|null}
     */
    _resultHttpMessage: null,

    init: function() {
        this._uid = this._uid || FileUp.helpers.ClassHelper.generateUid();
        this.progress = FileUp.helpers.ClassHelper.createObject(
            FileUp.helpers.ClassHelper.merge(
                {
                    file: this
                },
                this.progress
            )
        );
    },

    start: function() {
        this._uploader.start();
    },

    pause: function() {
        if (this._status === this.__static.STATUS_PAUSE) {
            this.start();
            return;
        }

        this.stop();
        this.setStatus(this.__static.STATUS_PAUSE);
    },

    stop: function() {
        this._uploader.stop();
    },

    /**
     *
     * @param {string} value
     */
    setUid: function(value) {
        this._uid = value;
    },

    /**
     *
     * @returns {string}
     */
    getUid: function() {
        return this._uid;
    },

    /**
     *
     * @param {File} value
     */
    setNative: function(value) {
        this._native = value;
    },

    /**
     *
     * @returns {File}
     */
    getNative: function() {
        return this._native;
    },

    /**
     *
     * @param {string} value
     */
    setPath: function(value) {
        this._path = value;
    },

    /**
     *
     * @returns {string}
     */
    getPath: function() {
        return this._path;
    },

    /**
     *
     * @param {string} value
     */
    setType: function(value) {
        this._type = value;
    },

    /**
     *
     * @returns {string}
     */
    getType: function() {
        return this._type;
    },

    /**
     *
     * @returns {string}
     */
    getName: function() {
        var path = this.getPath();
        var matches = /[^\/\\]+$/.exec(path);

        return matches ? matches[0].replace(/^([^?]+).*$/, '$1') : path;
    },

    /**
     *
     * @param {FileUp.uploaders.BaseUploader} value
     */
    setUploader: function(value) {
        if (this._uploader) {
            this._uploader.stop();
        }

        this._uploader = value;

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_START, function() {
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS, [this]);

            this._resultHttpStatus = null;
            this._resultHttpMessage = null;
            this.setStatus(this.__static.STATUS_PROCESS);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_ERROR, function(status, message) {
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS, [this]);

            this._result = this.__static.RESULT_ERROR;
            this.setStatus(this.__static.STATUS_END);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_END, function(status, data) {
            this.setBytesUploaded(this.getBytesTotal());
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS, [this]);

            this._result = this.__static.RESULT_SUCCESS;
            this.setStatus(this.__static.STATUS_END);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_PROGRESS, function(bytesUploaded) {
            this.progress.add(bytesUploaded);
            this.setBytesUploaded(bytesUploaded);
        }.bind(this));
    },

    /**
     *
     * @returns {FileUp.uploaders.BaseUploader}
     */
    getUploader: function() {
        return this._uploader;
    },

    /**
     *
     * @param {number} value
     */
    setBytesUploaded: function(value) {
        if (this._bytesUploaded === value) {
            return;
        }

        this._bytesUploaded = value;
        this.trigger(this.__static.EVENT_PROGRESS, [this]);
    },

    /**
     *
     * @returns {number}
     */
    getBytesUploaded: function() {
        return this._bytesUploaded;
    },

    /**
     *
     * @param {number} value
     */
    setBytesUploadEnd: function(value) {
        if (this._bytesUploadEnd === value) {
            return;
        }

        this._bytesUploadEnd = value;
        this.trigger(this.__static.EVENT_PROGRESS, [this]);
    },

    /**
     *
     * @returns {number}
     */
    getBytesUploadEnd: function() {
        return this._bytesUploadEnd;
    },

    /**
     *
     * @param {number} value
     */
    setBytesTotal: function(value) {
        if (this._bytesTotal === value) {
            return;
        }

        this._bytesTotal = value;
        this.trigger(this.__static.EVENT_PROGRESS, [this]);
    },

    /**
     *
     * @returns {number}
     */
    getBytesTotal: function() {
        return this._bytesTotal;
    },

    /**
     *
     * @param {string} value
     */
    setResult: function(value) {
        this._result = value;
    },

    /**
     *
     * @returns {string}
     */
    getResult: function() {
        return this._result;
    },

    /**
     *
     * @returns {boolean}
     */
    isResultSuccess: function() {
        return this._result === this.__static.RESULT_SUCCESS;
    },

    /**
     *
     * @returns {boolean}
     */
    isResultError: function() {
        return this._result === this.__static.RESULT_ERROR;
    },

    /**
     *
     * @param {string} value
     */
    setResultHttpStatus: function(value) {
        this._resultHttpStatus = value;
    },

    /**
     *
     * @returns {number|null}
     */
    getResultHttpStatus: function() {
        return this._resultHttpStatus;
    },

    /**
     *
     * @param {string} value
     */
    setResultHttpMessage: function(value) {
        this._resultHttpMessage = value;
    },

    /**
     *
     * @returns {string|null}
     */
    getResultHttpMessage: function() {
        return this._resultHttpMessage;
    },

    /**
     *
     * @returns {boolean}
     */
    isStatusQueue: function() {
        return this._status === this.__static.STATUS_QUEUE;
    },

    /**
     *
     * @returns {boolean}
     */
    isStatusProcess: function() {
        return this._status === this.__static.STATUS_PROCESS;
    },

    /**
     *
     * @returns {boolean}
     */
    isStatusPause: function() {
        return this._status === this.__static.STATUS_PAUSE;
    },

    /**
     *
     * @returns {boolean}
     */
    isStatusEnd: function() {
        return this._status === this.__static.STATUS_END;
    },

    /**
     *
     * @returns {string}
     */
    getStatus: function() {
        return this._status;
    },

    /**
     *
     * @returns {{path: string, type: string, bytesUploaded: number, bytesUploadEnd: number, bytesTotal: number, status: string, result: (string|null), resultHttpStatus: (number|null), resultHttpMessage: (string|null)}}
     */
    toJSON: function() {
        return {
            path: this.getPath(),
            type: this.getType(),
            bytesUploaded: this.getBytesUploaded(),
            bytesUploadEnd: this.getBytesUploadEnd(),
            bytesTotal: this.getBytesTotal(),
            status: this.getStatus(),
            result: this.getResult(),
            resultHttpStatus: this.getResultHttpStatus(),
            resultHttpMessage: this.getResultHttpMessage(),
            progress: this.progress.toJSON()
        }
    },

    setStatus: function(value) {
        if (this._status === value) {
            return;
        }

        this._status = value;
        this.trigger(this.__static.EVENT_STATUS, [this, this._status]);
    }

});

},{"../FileUp":2}],16:[function(require,module,exports){
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
 * @class FileUp.models.FileProgress
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.models.FileProgress', /** @lends FileUp.models.FileProgress.prototype */{

    __extends: FileUp.base.Object,

    /**
     * @type {number}
     */
    speedMinMeasurement: 2,

    /**
     * @type {number}
     */
    speedMaxMeasurement: 5,

    /**
     * @type {FileUp.models.File}
     */
    file: null,

    history: [],

    _lastTime: null,

    add: function(bytesUploaded) {
        var now = (new Date()).getTime();

        this.history.push({
            bytes: bytesUploaded - this.file.getBytesUploaded(),
            duration: this._lastTime ? now - this._lastTime : null
        });
        this._lastTime = now;
    },

    reset: function() {
        this.history = [];
        this._lastTime = null;
    },

    toJSON: function() {
        return {
            history: this.history
        }
    },

    /**
     * @returns {number} Seconds
     */
    getTimeLeft: function() {
        var bytesTotal = this.file.getBytesTotal();
        if (bytesTotal === 0) {
            return 0;
        }

        var speed = this.getSpeed();
        if (speed === 0) {
            return 0;
        }

        var bytesUploaded = this.file.getBytesUploaded();

        return Math.ceil((bytesTotal - bytesUploaded) / speed);
    },

    /**
     * @returns {number} Bytes in second
     */
    getSpeed: function() {
        if (this.history.length < this.speedMinMeasurement) {
            return 0;
        }

        // Get last diff values
        var history = this.history.slice(-1 * this.speedMaxMeasurement);

        // Calculate average upload speed
        var summaryBytes = 0;
        var summaryDuration = 0;
        for (var i = 0, l = history.length; i < l; i++) {
            summaryBytes += history[i].bytes;
            summaryDuration += history[i].duration;
        }

        if (summaryBytes === 0 || summaryDuration === 0) {
            return 0;
        }

        return Math.round(summaryBytes / (summaryDuration / 1000));
    },

    /**
     * @returns {number}
     */
    getPercent: function() {
        var bytesTotal = this.file.getBytesTotal();
        if (bytesTotal === 0) {
            return 0;
        }

        var bytesUploaded = this.file.getBytesUploaded();
        return Math.round(bytesUploaded * 100 / bytesTotal);
    }

});

},{"../FileUp":2}],17:[function(require,module,exports){
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
 * @class FileUp.models.QueueCollection
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.models.QueueCollection', /** @lends FileUp.models.QueueCollection.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.models.QueueCollection */{

        EVENT_ADD: 'add',
        EVENT_REMOVE: 'remove',
        EVENT_ALL_END: 'all_end',
        EVENT_ITEM_STATUS: 'item_status',
        EVENT_ITEM_PROGRESS: 'item_progress',
        EVENT_ITEM_END: 'item_end'

    },

    /**
     * @type {number}
     */
    maxConcurrentUploads: 3,

    /**
     * @type {FileUp.models.File[]}
     */
    _files: [],

    init: function() {
        this._onStatusChange = this._onStatusChange.bind(this);
        this._onProgressChange = this._onProgressChange.bind(this);
        this.__super();
    },

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    add: function (files) {
        this._files = this._files.concat(files);

        for (var i = 0, l = files.length; i < l; i++) {
            files[i].on(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
            files[i].on(FileUp.models.File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(this.__static.EVENT_ADD, [files]);
    },

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    remove: function (files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var index = this._files.indexOf(files[i]);
            if (index !== -1) {
                this._files.splice(index, 1);
            }
        }

        for (var i2 = 0, l2 = files.length; i2 < l2; i2++) {
            files[i2].off(FileUp.models.File.EVENT_STATUS, this._onStatusChange);
            files[i2].off(FileUp.models.File.EVENT_PROGRESS, this._onProgressChange);
        }

        this.trigger(this.__static.EVENT_REMOVE, [files]);
    },

    /**
     * @returns {FileUp.models.File[]}
     */
    getFiles: function () {
        return this._files;
    },

    /**
     * @returns {number}
     */
    getCount: function () {
        return this._files.length;
    },

    /**
     *
     * @param {string} status
     * @returns {number}
     */
    getCountByStatus: function (status) {
        var iCount = 0;
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].getStatus() === status) {
                iCount++;
            }
        }
        return iCount;
    },

    /**
     * Search file for next uploading
     * @returns {FileUp.models.File|null}
     */
    getNextForUpload: function () {
        if (this.getCountByStatus(FileUp.models.File.STATUS_PROCESS) >= this.maxConcurrentUploads) {
            return null;
        }

        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].isStatusQueue()) {
                return this._files[i];
            }
        }

        return null;
    },

    /**
     *
     * @param {FileUp.models.File} file
     * @protected
     */
    _onStatusChange: function(file) {
        this.trigger(this.__static.EVENT_ITEM_STATUS, [file]);

        if (file.isStatusEnd()) {
            this.trigger(this.__static.EVENT_ITEM_END, [file]);

            if (this.getCount() === this.getCountByStatus(FileUp.models.File.STATUS_END)) {
                this.trigger(this.__static.EVENT_ALL_END, [this._files]);
            }
        }
    },

    /**
     *
     * @param {FileUp.models.File} file
     * @protected
     */
    _onProgressChange: function(file) {
        this.trigger(this.__static.EVENT_ITEM_PROGRESS, [file]);
    }

});

},{"../FileUp":2}],18:[function(require,module,exports){
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
 * @class FileUp.uploaders.BaseUploader
 * @extends FileUp.base.Component
 */
FileUp.Neatness.defineClass('FileUp.uploaders.BaseUploader', /** @lends FileUp.uploaders.BaseUploader.prototype */{

    __extends: FileUp.base.Component,

    __static: /** @lends FileUp.uploaders.BaseUploader */{

        EVENT_START: 'start',
        EVENT_PROGRESS: 'progress',
        EVENT_ERROR: 'error',
        EVENT_END_PART: 'end_part',
        EVENT_END: 'end',

        isProgressSupport: function() {
            return false;
        },

        addUrlParams: function (url, params) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + this._serialize(params).join('&');
        },

        _serialize: function(params, parentKey) {
            parentKey = parentKey || '';

            var serialized = [];
            for (var key in params) {
                if (params.hasOwnProperty(key)) {
                    var encodedKey = encodeURIComponent(parentKey ? parentKey + '[' + key + ']' : key);

                    if (params[key] instanceof Array) {
                        for (var i = 0, l = params[key].length; i < l; i++) {
                            serialized.push(encodedKey + '[]=' + encodeURIComponent(params[key][i]))
                        }
                    } else if (typeof params[key] === 'object') {
                        serialized = serialized.concat(this.__static._serialize(params[key], key))
                    } else if (typeof params[key] === 'boolean') {
                        serialized.push(encodedKey + '=' + (params[key] ? 1 : 0))
                    } else {
                        serialized.push(encodedKey + '=' + encodeURIComponent(params[key]))
                    }
                }
            }
            return serialized;
        }

    },

    /**
     * @type {function}
     */
    responseParser: null,

    /**
     * @type {string}
     */
    _url: '',

    /**
     * @type {object}
     */
    _params: {},

    start: function() {
    },

    stop: function() {
    },

    isProgressSupport: function() {
        return false;
    },

    /**
     *
     * @param value
     */
    setUrl: function(value) {
        this._url = value;
    },

    /**
     *
     * @returns {string}
     */
    getUrl: function() {
        return this._url;
    },

    /**
     *
     * @param value
     */
    setParams: function(value) {
        this._params = value;
    },

    /**
     *
     * @returns {string}
     */
    getParams: function() {
        return this._params;
    },

    /**
     *
     * @param text
     * @returns {[]}
     * @protected
     */
    _defaultResponseParser: function(text) {
        var data = null;
        try {
            data = JSON.parse(text);
        } catch (e) {}
        return data;
    }

});

},{"../FileUp":2}],19:[function(require,module,exports){
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

require('./BaseUploader');

/**
 * @class FileUp.uploaders.IframeUploader
 * @extends FileUp.uploaders.BaseUploader
 */
FileUp.Neatness.defineClass('FileUp.uploaders.IframeUploader', /** @lends FileUp.uploaders.IframeUploader.prototype */{

    __extends: FileUp.uploaders.BaseUploader,

    __static: /** @lends FileUp.uploaders.IframeUploader */{

        _Counter: 0
    },

    /**
     * @type {FileUp.models.File[]}
     */
    files: null,

    /**
     * @type {FileUp.form.Form}
     */
    form: null,

    /**
     * @type {HTMLElement}
     */
    container: null,

    /**
     * @type {string}
     */
    namePrefix: 'FileUpIframe',

    /**
     * @type {string}
     */
    _name: '',

    /**
     * @type {HTMLElement}
     */
    _wrapper: null,

    /**
     * @type {HTMLElement}
     */
    _frame: null,

    /**
     * @type {number|null}
     */
    _frameLoadTimer: null,

    /**
     * @type {boolean}
     */
    _isFrameLoaded: false,

    init: function() {
        // Generate name
        this._name = this.namePrefix + (++this.__static._Counter);

        // Init container
        this.container = this.container || document.body;

        // Render frame
        this._initContainer();
        this._initFrame();
        
    },

    start: function () {
        // Start upload
        this.trigger(this.__static.EVENT_START);
        this.form.submit(this.getUrl(), this._name);
    },

    stop: function() {
        this._clearTimer();

        if (this._frame) {
            this._frame.onload = null;
            this._frame.onreadystatechange = null;

            this._wrapper.removeChild(this._frame);
            delete this._frame;
        }

        this.__super();
    },

    getUrl: function() {
        var uids = [];
        for (var key in this.files) {
            if (this.files.hasOwnProperty(key)) {
                uids.push(this.files[key].getUid());
            }
        }

        var params = this.getParams();
        params.uids = uids;

        return this.__static.addUrlParams(this._url, params);
    },

    _initContainer: function() {
        this._wrapper = document.createElement('div');
        this._wrapper.style.position = 'absolute';
        this._wrapper.style.width = 0;
        this._wrapper.style.height = 0;
        this._wrapper.style.top = '-100px';
        this._wrapper.style.left = '-100px';
        this._wrapper.style.display = 'none';

        this.container.appendChild(this._wrapper);
    },

    _initFrame: function () {
        var isCreated = false;
        var isIE = FileUp.helpers.BrowserHelper.isIE();

        if (isIE && isIE < 10) {
            try {
                this._frame = document.createElement('<iframe name="' + this._name + '">');
                isCreated = true;
            } catch (e) {
                // It seems IE9 in compatability mode.
            }
        }

        if (!isCreated) {
            this._frame = document.createElement('iframe');
            this._frame.name = this._name;
        }

        this._frame.src = 'javascript:{};';
        this._wrapper.appendChild(this._frame);

        // Subscribe on iframe load events
        this._frame.onreadystatechange = this._onReadyStateChange.bind(this);
        this._frame.onload = this._onLoad.bind(this);
    },

    _onReadyStateChange: function(event) {
        switch (this._frame.readyState) {
            case 'complete':
            case 'interactive':
                this._clearTimer();
                this._frameLoadTimer = setTimeout(function() {
                    try {
                        this._frame.contentWindow.document.body;
                        this._LoadHandler(event);
                    } catch (e) {
                        this._onReadyStateChange(event);
                    }
                }.bind(this), 1000);
                break;
        }
    },

    _onLoad: function(event) {
        this._clearTimer();

        // Check already loaded
        if (this._isFrameLoaded) {
            return;
        }
        this._isFrameLoaded = true;

        var document = null;
        var status = null;
        var errorMessage = '';

        // Catch iframe load error in Firefox.
        try {
            document = this._frame.contentWindow.document;
            document.body;
        }
        catch (e) {
            status = 403;
            errorMessage = e.toString();
        }

        var text = document.body.innerText || document.body.innerHTML;
        if (!status) {
            status = 201; // Created
        }

        if (status >= 200 && status < 300) {
            var data = (this.responseParser || this._defaultResponseParser).call(this, text);
            if (data instanceof Array) {
                for (var i = 0, l = this.files.length; i < l; i++) {
                    this.files[i].setResultHttpStatus(status);
                    this.files[i].setResultHttpMessage(data[i]);
                }
                this.trigger(this.__static.EVENT_END, [status, data]);
            } else {
                for (var i = 0, l = this.files.length; i < l; i++) {
                    this.files[i].setResultHttpStatus(status);
                    this.files[i].setResultHttpMessage(data);
                }
                this.trigger(this.__static.EVENT_ERROR, [500, data])
            }
        } else {
            for (var i = 0, l = this.files.length; i < l; i++) {
                this.files[i].setResultHttpStatus(status);
                this.files[i].setResultHttpMessage(errorMessage);
            }
            this.trigger(this.__static.EVENT_ERROR, [status, errorMessage])
        }

        this.stop();
    },

    _clearTimer: function() {
        if (this._frameLoadTimer) {
            clearTimeout(this._frameLoadTimer);
        }
    }

});

},{"../FileUp":2,"./BaseUploader":18}],20:[function(require,module,exports){
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

require('./BaseUploader');

/**
 * @class FileUp.uploaders.XhrUploader
 * @extends FileUp.uploaders.BaseUploader
 */
FileUp.Neatness.defineClass('FileUp.uploaders.XhrUploader', /** @lends FileUp.uploaders.XhrUploader.prototype */{

    __extends: FileUp.uploaders.BaseUploader,

    __static: /** @lends FileUp.uploaders.XhrUploader */{

        isProgressSupport: function() {
            return true;
        }

    },

    /**
     * @type {string}
     */
    method: 'PUT',

    /**
     * @type {FileUp.models.File}
     */
    file: null,

    /**
     * @type {number}
     */
    minProgressUpdateIntervalMs: 500,

    /**
     * This is IIS max httpRuntime@maxRequestLength value which is 2147482624 Kb
     * @type {number}
     */
    bytesMaxPart: 2097151 * 1024,

    /**
     * @type {number}
     */
    _lastReportTime: null,

    /**
     * @type {XMLHttpRequest}
     */
    _xhr: null,

    /**
     * @type {number}
     */
    _bytesStart: 0,

    /**
     * @type {number|null}
     */
    _bytesEnd: null,

    start: function () {
        this._initXhr();
        this._startInternal();
    },

    stop: function() {
        if (this._xhr) {
            if (this._xhr.upload) {
                this._xhr.upload.onprogress = null;
            }
            this._xhr.onreadystatechange = null;
            this._xhr.abort();
        }

        this.__super();
    },

    getUrl: function() {
        var params = this.getParams();
        params.uids = [this.file.getUid()];

        return this.__static.addUrlParams(this._url, params);
    },

    /**
     * Create XHR object and subscribe on it events
     * @private
     */
    _initXhr: function () {
        this._xhr = new XMLHttpRequest();
        this._xhr.upload.onprogress = this._onProgress.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open(this.method, this.getUrl(), true);

        try {
            this._xhr.withCredentials = true;
        } catch (e) {
        }

        if (FileUp.helpers.BrowserHelper.isWebkit() || FileUp.helpers.BrowserHelper.isTrident()) {
            this._xhr.setRequestHeader("If-None-Match", "*");
            this._xhr.setRequestHeader("If-Modified-Since", "Mon, 26 Jul 1997 05:00:00 GMT");
            this._xhr.setRequestHeader("Cache-Control", "no-cache");
            this._xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        }
    },

    _startInternal: function() {
        this.trigger(this.__static.EVENT_START);

        // Set file name
        this._xhr.setRequestHeader('Content-Disposition', 'attachment; filename="' + encodeURI(this.file.getName()) + '"');

        var isFF = FileUp.helpers.BrowserHelper.isFirefox();
        if (isFF && isFF < 7) {
            this._xhr.sendAsBinary(this.file.getNative().getAsBinary());
            return;
        }

        var bytesTotal = this.file.getBytesTotal();

        this._bytesStart = this.file.getBytesUploaded();
        this._bytesEnd = Math.min(this._bytesStart + this.bytesMaxPart, bytesTotal);

        // Check partial upload
        if (this._bytesStart > 0 || this._bytesEnd < bytesTotal) {
            this._xhr.setRequestHeader('Content-Range', 'bytes ' + this._bytesStart + '-' + (this._bytesEnd - 1) + '/' + bytesTotal);

            if (this._bytesEnd < bytesTotal) {
                this._xhr.send(this.file.getNative().slice(this._bytesStart, this._bytesEnd));
            } else {
                this._xhr.send(this.file.getNative().slice(this._bytesStart));
            }
        } else {
            this._xhr.send(this.file.getNative());
        }
    },

    /**
     *
     * @param {object} event
     * @protected
     */
    _onProgress: function(event) {
        var iNow = (new Date()).getTime();
        if (this._lastReportTime && iNow - this._lastReportTime < this.minProgressUpdateIntervalMs) {
            return;
        }
        this._lastReportTime = iNow;

        var bytesUploaded = this._bytesStart + event.loaded;
        this.trigger(this.__static.EVENT_PROGRESS, [bytesUploaded]);
    },

    /**
     *
     * @param {object} event
     * @protected
     */
    _onReadyStateChange: function(event) {
        if (this._xhr.readyState !== 4) {
            return;
        }

        var text = this._xhr.responseText || this._xhr.statusText;
        this.file.setResultHttpStatus(this._xhr.status);

        if (this._xhr.status >= 200 && this._xhr.status < 300) {
            if (this._bytesEnd < this.file.getBytesTotal()) {
                this.file.setBytesUploaded(this._bytesEnd);
                this.stop();
                this.start();

                this.trigger(this.__static.EVENT_END_PART);
            } else {
                var data = (this.responseParser || this._defaultResponseParser).call(this, text);
                if (data instanceof Array) {
                    this.file.setResultHttpMessage(data[0]);
                    this.trigger(this.__static.EVENT_END, [this._xhr.status, data]);
                } else {
                    this.file.setResultHttpMessage(data);
                    this.trigger(this.__static.EVENT_ERROR, [this._xhr.status, data])
                }
            }
        } else {
            this.file.setResultHttpMessage(text);
            this.trigger(this.__static.EVENT_ERROR, [this._xhr.status, text])
        }
    }

});

},{"../FileUp":2,"./BaseUploader":18}],21:[function(require,module,exports){
module.exports = require('./src/Neatness');
},{"./src/Neatness":24}],22:[function(require,module,exports){

module.exports = function(Neatness) {

	return Neatness.createClass('Neatness.Exception', /** @lends Neatness.Exception.prototype */{

		__extends: Error,

		/**
		 * Text message
		 * @type {string}
		 */
		message: null,

		/**
		 * Extra information dumps
		 * @type {Array}
		 */
		extra: null,

		/**
		 * Base class for implement exception. This class extend from native Error and support
		 * stack trace and message.
		 * @constructs
		 * @extends Error
		 */
		constructor: function (message) {
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, this.constructor || this);
			}

			this.name = this.constructor.name;
			this.message = message || '';

			if (arguments.length > 1) {
				this.extra = Array.prototype.slice.call(arguments, 1);
			}

			this.__super();
		},

		/**
		 *
		 * @returns {string}
		 */
		toString: function () {
			return this.message;
		}

	});

};
},{}],23:[function(require,module,exports){

module.exports = function(Neatness) {

	/**
	 * Base class. Extend all you base classes from this class for true navigation in IDE
	 * and support methods such as {@link Neatness.Object#className}
	 * @class Neatness.Object
	 */
	return Neatness.createClass('Neatness.Object', {

		/**
		 * Link to used class. If you access to this property in extends classes, then you give top-level class.
		 * @type {*}
		 */
		__static: null,

		/**
		 * Full current class name with namespace
		 * @example Returns value example
		 *  app.MyClass
		 * @type {string}
		 * @protected
		 */
		__className: null,

		/**
		 * Unique instance name
		 * @example Returns value example
		 *  app.MyClass50
		 * @type {string}
		 * @protected
		 */
		__instanceName: null,

		/**
		 * Full parent (extends) class name with namespace
		 * @example Returns value example
		 *  app.MyBaseClass
		 * @type {string}
		 * @protected
		 */
		__parentClassName: null,

		/**
		 * Returns full class name with namespace
		 * @example
		 *  app.MyClass
		 * @returns {string}
		 */
		className: function() {
			return this.__className;
		},

		/**
		 * Returns unique instance name
		 * @example
		 *  app.MyClass
		 * @returns {string}
		 */
		classInstanceName: function() {
			return this.__instanceName;
		},

		/**
		 * Returns full parent class name with namespace
		 * @example
		 *  app.MyBaseClass
		 * @returns {string}
		 */
		parentClassName: function() {
			return this.__parentClassName;
		},

		/**
		 * Call parent class methods through this method. This method support only synchronous nested calls.
		 * @param {...*}
		 * @protected
		 */
		__super: function () {
		}

	});

};

},{}],24:[function(require,module,exports){

var extendClass = require('./extendClass');
var formats = require('./formats');

// For .noConflict() implementation
var hasPreviousNeatness = typeof window !== 'undefined' && window.hasOwnProperty('Neatness');
var previousNeatness = hasPreviousNeatness ? window.Neatness : null;

/**
 * Neatness class
 * @function Neatness
 */
var Neatness = function() {

	/**
	 *
	 * @type {object}
	 */
	this._context = {};

	this._contextKeys = {};
};

/**
 * @function Neatness.prototype.newContext
 * @param {boolean} [removeGlobal] Set true for remove Neatness object from window (browser global object)
 * @returns {Neatness}
 */
Neatness.prototype.newContext = function(removeGlobal) {
	removeGlobal = removeGlobal || false;

	if (removeGlobal) {
		this.noConflict();
	}

	return new Neatness();
};

/**
 * @function Neatness.prototype.moveContext
 * @param {boolean} newContext New context object
 * @param {boolean} [removeFromOld] Set true for remove keys from old context
 * @returns {Neatness}
 */
Neatness.prototype.moveContext = function(newContext, removeFromOld) {
	removeFromOld = removeFromOld || false;

	for (var key in this._contextKeys) {
		if (this._contextKeys.hasOwnProperty(key)) {
			newContext[key] = this._context[key];
			if (removeFromOld) {
				delete this._context[key];
			}
		}
	}
	this._context = newContext;
};

/**
 * @function Neatness.prototype.noConflict
 * @returns {Neatness}
 */
Neatness.prototype.noConflict = function() {
	// Root namespace object
	var root = typeof window !== 'undefined' ? window : {};

	if (hasPreviousNeatness) {
		root.Neatness = previousNeatness;
	} else {
		delete root.Neatness;
	}

	return this;
};

/**
 * @function Neatness.prototype.namespace
 * @param {string} name Full namespace name
 * @returns {object}
 */
Neatness.prototype.namespace = function (name) {
	name = name || '';

	var nameParts = name.split('.');
	var currentScope = this._context;

	if (!name) {
		return currentScope;
	}

	// Find or create
	for (var i = 0; i < nameParts.length; i++) {
		var scopeName = nameParts[i];
		if (i === 0) {
			this._contextKeys[scopeName] = true;
		}

		if (!currentScope[scopeName]) {
			currentScope[scopeName] = {
				__className: nameParts.slice(0, i).join('.'),
				__parentClassName: null
			};
		}
		currentScope = currentScope[scopeName];
	}

	return currentScope;
};

/**
 * Method for define class
 * @function Neatness.prototype.createClass
 * @param {string} globalName
 * @param {(function|object|null)} optionsOrExtend
 * @param {object} [prototypeProperties]
 * @param {object} [staticProperties]
 * @return {object}
 */
Neatness.prototype.createClass = function (globalName, optionsOrExtend, prototypeProperties, staticProperties) {
	var params = formats.parseFormat(globalName, optionsOrExtend, prototypeProperties, staticProperties);

	// Support extends and mixins as strings class names
	if (typeof params[2] === 'string') {
		params[2] = this.namespace(params[2]);
        if (!params[1] && params[2] && typeof params[2].__className === 'string') {
            params[1] = formats.parseFullName(params[2].__className);
        }
	}
	var mixins = params[6];
	for (var i = 0, l = mixins.length; i < l; i++) {
		if (typeof mixins[i] === 'string') {
			mixins[i] = this.namespace(mixins[i]);
		}
	}

	// Show error if not defined extended class
	if (params[2] !== null && typeof params[2] !== 'function') {
		throw new Error('Not found extend class for `' + globalName + '`.');
	}

	var newClass = extendClass(params[0], params[1], params[2], params[6], params[3], params[4], params[7]);
	formats.applyClassConfig(newClass, params[5], params[0], params[1]);

	return newClass;
};

/**
 * Method for define class
 * @function Neatness.prototype.defineClass
 * @param {string} globalName
 * @param {(function|object|null)} optionsOrExtend
 * @param {object} [prototypeProperties]
 * @param {object} [staticProperties]
 * @return {object}
 */
Neatness.prototype.defineClass = function (globalName, optionsOrExtend, prototypeProperties, staticProperties) {
	var newClass = this.createClass.apply(this, arguments);
	var nameObject = formats.parseFullName(globalName);

	this.namespace(nameObject.namespace)[nameObject.name] = newClass;
	return newClass;
};

/**
 * Method for define enum
 * @function Neatness.prototype.defineClass
 * @param {string} globalName
 * @param {object} [staticProperties]
 * @return {object}
 */
Neatness.prototype.defineEnum = function (globalName, staticProperties) {
	var newClass = this.createClass(globalName, null, {}, staticProperties);
	var nameObject = formats.parseFullName(globalName);

	this.namespace(nameObject.namespace)[nameObject.name] = newClass;
	return newClass;
};

var neatness = module.exports = new Neatness();

// Web browser export
if (typeof window !== 'undefined') {
	window.Neatness = neatness;
}

/**
 * @type {Neatness.prototype.Object}
 */
Neatness.prototype.Object = require('./Neatness.Object')(neatness);

/**
 * @type {Neatness.prototype.Exception}
 */
Neatness.prototype.Exception = require('./Neatness.Exception')(neatness);

/**
 * @type {string}
 */
Neatness.prototype.version = '%JOINTS_CURRENT_VERSION%';

},{"./Neatness.Exception":22,"./Neatness.Object":23,"./extendClass":25,"./formats":26}],25:[function(require,module,exports){
var isEvalEnable = true;
var instanceCounter = 0;

var _noop = function() {
};

var _createFunction = function(nameObject, constructor) {
	if (!isEvalEnable || !nameObject) {
		return function () { return constructor.apply(this, arguments); }
	}

	var nameRegExp = /[^a-z$_\.]/i;
	var name = nameObject.name || 'Function';
	var nameParts = nameObject.globalName.split('.');

	// Create root object
	var rootName = nameParts.shift();
	var cs;

	rootName = rootName.replace(nameRegExp, '');
	eval('var ' + rootName + ' = cs = {};');

	// Create fake namespace object
	for (var i = 0; i < nameParts.length; i++) {
		var scopeName = nameParts[i];
		if (!cs[scopeName]) {
			cs[scopeName] = {};
		}
		cs = cs[scopeName];
	}

	var func;
	var fullName = (nameObject.namespace ? nameObject.namespace + '.' : '') + name;

	fullName = fullName.replace(nameRegExp, '');
	eval('func = ' + fullName + ' = function () { return constructor.apply(this, arguments); }');

	return func;
};

var _isStrictObject = function (obj) {
	if (!obj || typeof obj !== 'object' || obj instanceof RegExp || obj instanceof Date) {
		return false;
	}

	var bool = true;
	for (var key in obj) {
		bool = bool && obj.hasOwnProperty(key);
	}
	return bool;
};

var _clone = function(obj) {
	if (!_isStrictObject(obj)) {
		return obj;
	}

	var copy = obj.constructor();
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) {
			copy[key] = _clone(obj[key]);
		}
	}
	return copy;
};

var _cloneObjInProto = function(obj) {
	for (var key in obj) {
		if (typeof obj === "object") {
			obj[key] = _clone(obj[key]);
		}
	}
};

var _coverVirtual = function (childMethod, parentMethod, superName) {
	return function () {
		var currentSuper = this[superName];
		this[superName] = parentMethod;
		var r = childMethod.apply(this, arguments);
		this[superName] = currentSuper;
		return r;
	};
};

var _extendWithSuper = function (childClass, newProperties, superName) {
	if (!newProperties) {
		return;
	}

	// Extend and setup virtual methods
	for (var key in newProperties) {
		if (!newProperties.hasOwnProperty(key)) {
			continue;
		}

		var value = newProperties[key];
		if (typeof value == 'function' && typeof childClass[key] == 'function' && childClass[key] !== _noop) {
			childClass[key] = _coverVirtual(value, childClass[key], superName);
		} else {
			childClass[key] = _clone(value);
		}
	}

	// Default state
	if (!childClass[superName]) {
		childClass[superName] = _noop;
	}
};

/**
 * Extend class
 * @param {object} nameObject
 * @param {object} parentNameObject
 * @param {function} [parentClass]
 * @param {function} [mixins]
 * @param {object} [prototypeProperties]
 * @param {object} [staticProperties]
 * @returns {function} New class
 */
module.exports = function (nameObject, parentNameObject, parentClass, mixins, prototypeProperties, staticProperties, superName) {
	parentClass = parentClass || _noop;
	mixins = mixins || [];

	// The constructor function for the new subclass is either defined by you
	// (the "constructor" property in your `extend` definition), or defaulted
	// by us to simply call the parent's constructor.
	var constructor = prototypeProperties && prototypeProperties.hasOwnProperty('constructor') ?
		_coverVirtual(prototypeProperties.constructor, parentClass, superName) :
		parentClass;
	var childClass = _createFunction(nameObject, function() {
		if (!this.__instanceName) {
			_cloneObjInProto(this);
			this.__instanceName  = nameObject.globalName + instanceCounter++;
		}
		constructor.apply(this, arguments);
	});

	// Add static properties to the constructor function, if supplied.
	for (var prop in parentClass) {
		childClass[prop] = parentClass[prop];
	}
	_extendWithSuper(childClass, staticProperties, superName);

	// Set the prototype chain to inherit from `parent`, without calling
	// `parent`'s constructor function.
	var Surrogate = _createFunction(parentNameObject, _noop);
	Surrogate.prototype = parentClass.prototype;

	childClass.prototype = new Surrogate();

	// Copy objects from child prototype
	for (var prop2 in parentClass.prototype) {
		if (parentClass.prototype.hasOwnProperty(prop2) && prop2 !== 'constructor') {
			childClass.prototype[prop2] = _clone(parentClass.prototype[prop2]);
		}
	}

	// Add prototype properties (instance properties) to the subclass,
	// if supplied.
	if (prototypeProperties) {
		_extendWithSuper(childClass.prototype, prototypeProperties, superName);
	}

	// Add prototype properties and methods from mixins
	for (var i = 0, l = mixins.length; i < l; i++) {
		for (var mixinProp in mixins[i].prototype) {
			// Skip private
			if (mixinProp.substr(0, 2) === '__') {
				continue;
			}

			// Check for exists property or method. Mixin can only add properties, but no replace it
			if (typeof childClass.prototype[mixinProp] === 'function' || childClass.prototype.hasOwnProperty(mixinProp)) {
				throw new Error('Try to replace prototype property `' + mixinProp + '` in class `' + childClass.__className + '` by mixin `' + mixins[i].__className + '`');
			}
			childClass.prototype[mixinProp] = mixins[i].prototype[mixinProp];
		}
	}
	// Add static properties and methods from mixins
	for (var i = 0, l = mixins.length; i < l; i++) {
		for (var mixinProp in mixins[i]) {
			// Skip private
			if (mixinProp.substr(0, 2) === '__') {
				continue;
			}

			// Check for exists property or method. Mixin can only add properties, but no replace it
			if (typeof childClass[mixinProp] === 'function' || childClass.hasOwnProperty(mixinProp)) {
				throw new Error('Try to replace static property `' + mixinProp + '` in class `' + childClass.__className + '` by mixin `' + mixins[i].__className + '`');
			}
			childClass[mixinProp] = mixins[i][mixinProp];
		}
	}

	return childClass;
};

},{}],26:[function(require,module,exports){
var FORMAT_JOINTS_V02 = 'neatness_v02';
var FORMAT_JOINTS_V10 = 'neatness_v10';

module.exports = {

	/**
	 * Detect format and return class params
	 * @param {string} globalName
	 * @param {(function|object|null)} optionsOrExtend
	 * @param {object} [protoProps]
	 * @param {object} [staticProps]
	 * @returns {object}
	 */
	parseFormat: function (globalName, optionsOrExtend, protoProps, staticProps) {
		var nameObject = this.parseFullName(globalName);
		var parentNameObject = null;
		var parentClass = null;
		var prototypeProperties = null;
		var staticProperties = null;
		var format = null;
		var mixins = [];

		// Neatness v0.2 (old) format
		if (optionsOrExtend === null || typeof optionsOrExtend === 'function') {
			parentClass = optionsOrExtend;
			prototypeProperties = protoProps;
			staticProperties = staticProps;
			format = FORMAT_JOINTS_V02;

			if (parentClass && typeof parentClass.debugClassName === 'string') {
				parentNameObject = this.parseFullName(parentClass.debugClassName);
			}

			// Neatness v1.0 format
		} else if (typeof optionsOrExtend === 'object') {
			if (optionsOrExtend.hasOwnProperty('__extends')) {
				parentClass = optionsOrExtend.__extends;
				delete optionsOrExtend.__extends;
			}

			if (optionsOrExtend.hasOwnProperty('__static')) {
				staticProperties = optionsOrExtend.__static;
				delete optionsOrExtend.__static;
			}

			if (optionsOrExtend.hasOwnProperty('__mixins')) {
				mixins = mixins.concat(optionsOrExtend.__mixins);
				delete optionsOrExtend.__mixins;
			}
			if (optionsOrExtend.hasOwnProperty('__mixin')) {
				mixins = mixins.concat(optionsOrExtend.__mixin);
				delete optionsOrExtend.__mixin;
			}

			format = FORMAT_JOINTS_V10;
			prototypeProperties = optionsOrExtend;

			if (parentClass && typeof parentClass.__className === 'string') {
				parentNameObject = this.parseFullName(parentClass.__className);
			}
		}

		return [
			nameObject,
			parentNameObject,
			parentClass,
			prototypeProperties,
			staticProperties,
			format,
			mixins,
			format === FORMAT_JOINTS_V02 ? '_super' : '__super'
		];
	},

	applyClassConfig: function(newClass, format, nameObject, parentNameObject) {
		// Set __className for all formats
		newClass.__className = newClass.prototype.__className = nameObject.globalName;

		var classNameKey = format === FORMAT_JOINTS_V02 ? 'debugClassName' : '__className';
		var parentClassNameKey = format === FORMAT_JOINTS_V02 ? '' : '__parentClassName';
		var staticNameKey = format === FORMAT_JOINTS_V02 ? '_static' : '__static';

		newClass[classNameKey] = newClass.prototype[classNameKey] = nameObject.globalName;
		if (parentClassNameKey) {
			newClass[parentClassNameKey] = newClass.prototype[parentClassNameKey] = parentNameObject ? (parentNameObject.globalName || null) : null;
		}
		newClass[staticNameKey] = newClass.prototype[staticNameKey] = newClass;

		return newClass;
	},

	parseFullName: function(globalName) {
		// Split namespace
		var pos = globalName.lastIndexOf('.');

		return {
			globalName: globalName,
			name: pos !== -1 ? globalName.substr(pos + 1) : globalName,
			namespace: pos !== -1 ? globalName.substr(0, pos) : ''
		};
	}

};

},{}],27:[function(require,module,exports){
module.exports = require('./lib/FileUp');

require('./lib/base/Component');
require('./lib/base/Element');
require('./lib/base/Exception');
require('./lib/base/Manager');
require('./lib/base/Object');
require('./lib/form/DropArea');
require('./lib/form/Form');
require('./lib/form/FormElement');
require('./lib/form/InputElement');
require('./lib/helpers/BrowserHelper');
require('./lib/helpers/ClassHelper');
require('./lib/managers/QueueManager');
require('./lib/models/File');
require('./lib/models/FileProgress');
require('./lib/models/QueueCollection');
require('./lib/uploaders/BaseUploader');
require('./lib/uploaders/IframeUploader');
require('./lib/uploaders/XhrUploader');

},{"./lib/FileUp":2,"./lib/base/Component":3,"./lib/base/Element":4,"./lib/base/Exception":5,"./lib/base/Manager":6,"./lib/base/Object":7,"./lib/form/DropArea":8,"./lib/form/Form":9,"./lib/form/FormElement":10,"./lib/form/InputElement":11,"./lib/helpers/BrowserHelper":12,"./lib/helpers/ClassHelper":13,"./lib/managers/QueueManager":14,"./lib/models/File":15,"./lib/models/FileProgress":16,"./lib/models/QueueCollection":17,"./lib/uploaders/BaseUploader":18,"./lib/uploaders/IframeUploader":19,"./lib/uploaders/XhrUploader":20}]},{},[1]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJmaWxldXAtY29yZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbnBtJyk7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBwcmV2ID0gd2luZG93LkZpbGVVcDtcbiAgICB2YXIgRmlsZVVwID0gd2luZG93LkZpbGVVcCA9IG1vZHVsZS5leHBvcnRzO1xuICAgIEZpbGVVcC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHdpbmRvdy5GaWxlVXAgPSBwcmV2O1xuICAgICAgICByZXR1cm4gRmlsZVVwO1xuICAgIH1cbn1cbn0se1wiLi9ucG1cIjoyN31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBOZWF0bmVzcyA9IHJlcXVpcmUoJ25lYXRuZXNzJykubmV3Q29udGV4dCgpO1xuTmVhdG5lc3Mubm9Db25mbGljdCgpO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAYWxpYXMgbW9kdWxlOmZpbGV1cC1jb3JlXG4gKi9cbnZhciBGaWxlVXA7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcFxuICogQGV4dGVuZHMgTmVhdG5lc3MuT2JqZWN0XG4gKi9cbkZpbGVVcCA9IE5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAnLCAvKiogQGxlbmRzIEZpbGVVcC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IE5lYXRuZXNzLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcCAqL3tcblxuICAgICAgICBOZWF0bmVzczogTmVhdG5lc3MsXG5cbiAgICAgICAgRVZFTlRfU1VCTUlUOiAnc3VibWl0J1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgYmFja2VuZFVybDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICovXG4gICAgYmFja2VuZFBhcmFtczoge30sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybX1cbiAgICAgKi9cbiAgICBmb3JtOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5mb3JtLkZvcm0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5Ecm9wQXJlYX1cbiAgICAgKi9cbiAgICBkcm9wQXJlYToge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAuZm9ybS5Ecm9wQXJlYSdcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9ufVxuICAgICAqL1xuICAgIHF1ZXVlOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcn1cbiAgICAgKi9cbiAgICBxdWV1ZU1hbmFnZXI6IHtcbiAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcidcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cbiAgICAgKi9cbiAgICBmaWxlQ29uZmlnOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuRmlsZSdcbiAgICB9LFxuXG4gICAgdXBsb2FkZXJDb25maWdzOiB7XG4gICAgICAgIGlmcmFtZToge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlcidcbiAgICAgICAgfSxcbiAgICAgICAgeGhyOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0Rm9ybSgpO1xuICAgICAgICB0aGlzLl9pbml0RHJvcEFyZWEoKTtcbiAgICAgICAgdGhpcy5faW5pdFF1ZXVlKCk7XG4gICAgICAgIHRoaXMuX2luaXRNYW5hZ2VycygpO1xuICAgIH0sXG5cbiAgICBfaW5pdEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5mb3JtID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KHRoaXMuZm9ybSk7XG4gICAgICAgIHRoaXMuZm9ybS5vbihGaWxlVXAuZm9ybS5Gb3JtLkVWRU5UX1NVQk1JVCwgdGhpcy5fb25Gb3JtU3VibWl0LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfaW5pdERyb3BBcmVhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QodGhpcy5kcm9wQXJlYSk7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEub24oRmlsZVVwLmZvcm0uRHJvcEFyZWEuRVZFTlRfU1VCTUlULCB0aGlzLl9vbkZvcm1TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIF9pbml0UXVldWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdCh0aGlzLnF1ZXVlKTtcbiAgICB9LFxuXG4gICAgX2luaXRNYW5hZ2VyczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWFuYWdlcnMgPSBbXG4gICAgICAgICAgICAncXVldWUnXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBtYW5hZ2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbWFuYWdlcnNbaV0gKyAnTWFuYWdlcic7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLnF1ZXVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbmFtZV1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wZW4gYnJvd3NlIGZpbGVzIGRpYWxvZyBvbiBsb2NhbCBtYWNoaW5lXG4gICAgICovXG4gICAgYnJvd3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5icm93c2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5hdGl2ZUZpbGVzXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbkZvcm1TdWJtaXQ6IGZ1bmN0aW9uIChuYXRpdmVGaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSBudWxsO1xuICAgICAgICB2YXIgaXNJRSA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpO1xuICAgICAgICBpZiAoaXNJRSAmJiBpc0lFIDwgMTApIHtcbiAgICAgICAgICAgIHVwbG9hZGVyID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYmFja2VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczogdGhpcy5iYWNrZW5kUGFyYW1zLFxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybTogdGhpcy5mb3JtXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkZXJDb25maWdzLmlmcmFtZVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBmaWxlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwYXRoIGluIG5hdGl2ZUZpbGVzKSB7XG4gICAgICAgICAgICBpZiAobmF0aXZlRmlsZXMuaGFzT3duUHJvcGVydHkocGF0aCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmF0aXZlRmlsZSA9IG5hdGl2ZUZpbGVzW3BhdGhdO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgICAgICBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5tZXJnZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSsrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZTogbmF0aXZlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG5hdGl2ZUZpbGUudHlwZSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBieXRlc1RvdGFsOiBuYXRpdmVGaWxlLmZpbGVTaXplIHx8IG5hdGl2ZUZpbGUuc2l6ZSB8fCAwXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxlQ29uZmlnXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgZmlsZS5zZXRVcGxvYWRlcih1cGxvYWRlciB8fCBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgICAgICBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5tZXJnZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy5iYWNrZW5kVXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IHRoaXMuYmFja2VuZFBhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGxvYWRlckNvbmZpZ3MueGhyXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGxvYWRlciBpbnN0YW5jZW9mIEZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHVwbG9hZGVyLmZpbGVzID0gZmlsZXM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnF1ZXVlLmFkZChmaWxlcyk7XG4gICAgfVxuXG59KTtcblxuLyoqXG4gKiBAbW9kdWxlIEZpbGVVcFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcDtcblxufSx7XCJuZWF0bmVzc1wiOjIxfV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuQ29tcG9uZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfZXZlbnRzOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IG5hbWVzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlclxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAoIShuYW1lcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgW107XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBbbmFtZXNdXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAobmFtZXMpIHtcbiAgICAgICAgICAgIGlmICghKG5hbWVzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9ldmVudHNbbmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqW119IFthcmdzXVxuICAgICAqL1xuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwgW107XG5cbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9ldmVudHNbbmFtZV0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkVsZW1lbnRcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLkVsZW1lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkVsZW1lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBlbGVtZW50OiBudWxsLFxuXG4gICAgaGlkZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50b3AgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0wKSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVsncG9pbnRlci1ldmVudHMnXSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXJcbiAgICAgKi9cbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50ICYmIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvblxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuYmFzZS5FeGNlcHRpb24nLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvbi5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEVycm9yLFxuXG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5fX3N0YXRpYyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5fX2NsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCAnJztcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9PYmplY3QnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuTWFuYWdlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuTWFuYWdlcicsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuTWFuYWdlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIGVuYWJsZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbn1cbiAgICAgKi9cbiAgICBjb2xsZWN0aW9uOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm9uKEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uLkVWRU5UX0FERCwgdGhpcy5fb25BZGQuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ub24oRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfUkVNT1ZFLCB0aGlzLl9vblJlbW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25BZGQ6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgICBfb25SZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vT2JqZWN0XCI6N31dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqIEBleHRlbmRzIE5lYXRuZXNzLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLk9iamVjdCcsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLk5lYXRuZXNzLk9iamVjdCxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLmZvcm0uRHJvcEFyZWFcclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkRyb3BBcmVhJywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Ecm9wQXJlYS5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uRHJvcEFyZWEgKi97XHJcblxyXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCcsXHJcbiAgICAgICAgRVZFTlRfRFJBR19PVkVSOiAnZHJhZ19vdmVyJyxcclxuICAgICAgICBFVkVOVF9EUkFHX0xFQVZFOiAnZHJhZ19sZWF2ZScsXHJcbiAgICAgICAgRVZFTlRfRFJPUDogJ2Ryb3AnXHJcblxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBfZW5hYmxlOiBmYWxzZSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgY29udGFpbmVyOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBfbWFzazogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIF9maWxlczoge30sXHJcblxyXG4gICAgX3JlYWRMZXZlbDogMCxcclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgdGhpcy5faW5pdENvbnRhaW5lckV2ZW50cygpO1xyXG4gICAgICAgIHRoaXMuX2luaXRNYXNrKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9pbml0Q29udGFpbmVyRXZlbnRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5jb250YWluZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIub25kcmFnb3ZlciA9IHRoaXMuX2VuYWJsZSA/IHRoaXMuX29uRHJhZ092ZXIuYmluZCh0aGlzKSA6IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLm9uZHJhZ2xlYXZlID0gdGhpcy5fZW5hYmxlID8gdGhpcy5fb25EcmFnTGVhdmUuYmluZCh0aGlzKSA6IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLm9uZHJvcCA9IHRoaXMuX2VuYWJsZSA/IHRoaXMuX29uRHJvcC5iaW5kKHRoaXMpIDogbnVsbDtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9pbml0TWFzazogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fbWFzayA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGUudG9wID0gMDtcclxuICAgICAgICB0aGlzLl9tYXNrLnN0eWxlLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGUucmlnaHQgPSAwO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGUuYm90dG9tID0gMDtcclxuICAgICAgICB0aGlzLl9tYXNrLnN0eWxlLmJhY2tncm91bmQgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGVbJ3otaW5kZXgnXSA9IDEwMDAwO1xyXG4gICAgICAgIHRoaXMuX21hc2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fbWFzayk7XHJcblxyXG4gICAgICAgIHRoaXMuX21hc2sub25kcmFnb3ZlciA9IHRoaXMuX2VuYWJsZSA/IHRoaXMuX29uRHJhZ092ZXIuYmluZCh0aGlzKSA6IG51bGw7XHJcbiAgICAgICAgdGhpcy5fbWFzay5vbmRyYWdsZWF2ZSA9IHRoaXMuX2VuYWJsZSA/IHRoaXMuX29uRHJhZ0xlYXZlLmJpbmQodGhpcykgOiBudWxsO1xyXG4gICAgICAgIHRoaXMuX21hc2sub25kcm9wID0gdGhpcy5fZW5hYmxlID8gdGhpcy5fb25Ecm9wLmJpbmQodGhpcykgOiBudWxsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHNldEVuYWJsZTogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICB0aGlzLl9lbmFibGUgPSB2YWx1ZSAmJiBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzRmlsZURyb3BTdXBwb3J0KCk7XHJcbiAgICAgICAgdGhpcy5faW5pdENvbnRhaW5lckV2ZW50cygpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgZ2V0RW5hYmxlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fZW5hYmxlO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25EcmFnT3ZlcjogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBpZiAoZXZlbnQudGFyZ2V0ICE9PSB0aGlzLl9tYXNrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX21hc2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBkdFR5cGVzID0gZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzO1xyXG4gICAgICAgICAgICBpZiAoZHRUeXBlcykge1xyXG4gICAgICAgICAgICAgICAgLy8gRkZcclxuICAgICAgICAgICAgICAgIGlmIChkdFR5cGVzLmNvbnRhaW5zICYmICFkdFR5cGVzLmNvbnRhaW5zKFwiRmlsZXNcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2hyb21lXHJcbiAgICAgICAgICAgICAgICBpZiAoZHRUeXBlcy5pbmRleE9mICYmIGR0VHlwZXMuaW5kZXhPZihcIkZpbGVzXCIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9EUkFHX09WRVIsIFtldmVudF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25EcmFnTGVhdmU6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LnRhcmdldCA9PT0gdGhpcy5fbWFzaykge1xyXG4gICAgICAgICAgICB0aGlzLl9tYXNrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9EUkFHX0xFQVZFLCBbZXZlbnRdKTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uRHJvcDogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICB0aGlzLl9tYXNrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gICAgICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIuaXRlbXMgJiYgZXZlbnQuZGF0YVRyYW5zZmVyLml0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVhZERhdGFUcmFuc2Zlckl0ZW1zKGV2ZW50LmRhdGFUcmFuc2Zlci5pdGVtcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fcmVhZERhdGFUcmFuc2ZlckZpbGVzKGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9EUk9QLCBbZXZlbnRdKTtcclxuICAgIH0sXHJcblxyXG4gICAgX3JlYWREYXRhVHJhbnNmZXJJdGVtczogZnVuY3Rpb24oaXRlbXMpIHtcclxuICAgICAgICB2YXIgZW50cmllcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IGl0ZW1zW2ldLndlYmtpdEdldEFzRW50cnkoKTtcclxuICAgICAgICAgICAgaWYgKGVudHJ5ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhlbnRyaWVzLCAnJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGlyZWN0b3J5RW50cmllczogZnVuY3Rpb24gKGVudHJpZXMsIHJlbGF0aXZlUGF0aCkge1xyXG4gICAgICAgIHRoaXMuX3JlYWRMZXZlbCsrO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVudHJpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbihlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSAocmVsYXRpdmVQYXRoID8gcmVsYXRpdmVQYXRoICsgJy8nIDogJycpICsgZW50cnkubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVSZWFkZXIoKS5yZWFkRW50cmllcyhmdW5jdGlvbihzdWJFbnRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWREaXJlY3RvcnlFbnRyaWVzKHN1YkVudHJpZXMsIHBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVhZERpcmVjdG9yeUVudHJpZXMoZW50cnksIGVudHJ5Lm5hbWUgKyAnLycpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkTGV2ZWwrKztcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzW3BhdGhdID0gZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhbXSwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpKGVudHJpZXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZWFkTGV2ZWwtLTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlYWRMZXZlbCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9vblJlYWREYXRhVHJhbnNmZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGF0YVRyYW5zZmVyRmlsZXM6IGZ1bmN0aW9uKGZpbGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNraXAgZm9sZGVyc1xyXG4gICAgICAgICAgICBpZiAoIWZpbGUudHlwZSAmJiBmaWxlLnNpemUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9maWxlc1tmaWxlLm5hbWVdID0gZmlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX29uUmVhZERhdGFUcmFuc2ZlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25SZWFkRGF0YVRyYW5zZmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFt0aGlzLl9maWxlc10pO1xyXG4gICAgICAgIHRoaXMuX2ZpbGVzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxufSk7XHJcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLkZvcm1cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm0nLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLkZvcm0ucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtICove1xuXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGFpbmVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgX2lzTXVsdGlwbGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgX2Zvcm1FbGVtZW50OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudH1cbiAgICAgKi9cbiAgICBfbGFzdElucHV0RWxlbWVudDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBfaW5wdXRFbGVtZW50czogW10sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSW5pdCBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGVsZW1lbnRcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuYXBwZW5kVG8odGhpcy5jb250YWluZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgaW5wdXQgZWxlbWVudFxuICAgICAgICB0aGlzLl9yZWZyZXNoSW5wdXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXRNdWx0aXBsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc011bHRpcGxlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRNdWx0aXBsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmVsZW1lbnQubXVsdGlwbGUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKHVybCwgdGFyZ2V0KSB7XG4gICAgICAgIC8vIFNldCBkZXN0aW5hdGlvblxuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5lbGVtZW50LmFjdGlvbiA9IHVybDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSB0YXJnZXQ7XG5cbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5zdWJtaXQoKTtcblxuICAgICAgICAvLyBSZXNldCB2YWx1ZXNcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5hY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbiBicm93c2UgZmlsZXMgZGlhbG9nIG9uIGxvY2FsIG1hY2hpbmVcbiAgICAgKi9cbiAgICBicm93c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoXCJjbGlja1wiLCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5lbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfcmVmcmVzaElucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEZyZWV6ZSBwcmV2aW91cyBlbGVtZW50LCBidXQgZG8gbm90IGRldGFjaFxuICAgICAgICBpZiAodGhpcy5fbGFzdElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5mcmVlemUoKTtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZWxlbWVudCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50ID0gbmV3IEZpbGVVcC5mb3JtLklucHV0RWxlbWVudCh7XG4gICAgICAgICAgICBtdWx0aXBsZTogdGhpcy5nZXRNdWx0aXBsZSgpLFxuICAgICAgICAgICAgb25DaGFuZ2U6IHRoaXMuX29uSW5wdXRDaGFuZ2UuYmluZCh0aGlzKVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5hcHBlbmRUbyh0aGlzLl9mb3JtRWxlbWVudC5lbGVtZW50KTtcbiAgICAgICAgdGhpcy5faW5wdXRFbGVtZW50cy5wdXNoKHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfb25JbnB1dENoYW5nZTogZnVuY3Rpb24ob0V2ZW50KSB7XG4gICAgICAgIG9FdmVudCA9IG9FdmVudCB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgICAgIG9FdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmdldENvdW50KCkgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmaWxlcyA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZ2V0Q291bnQoKTsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZmlsZXNbdGhpcy5fbGFzdElucHV0RWxlbWVudC5nZXRGaWxlUGF0aChpKV0gPSB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmdldEZpbGVOYXRpdmUoaSkgfHwge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1VCTUlULCBbZmlsZXNdKTtcblxuICAgICAgICB0aGlzLl9yZWZyZXNoSW5wdXQoKTtcbiAgICB9LFxuXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9mb3JtRWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZGVzdHJveSgpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5faW5wdXRFbGVtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX2lucHV0RWxlbWVudHNbaV0uZGVzdHJveSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vZmYodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQpO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnRcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkVsZW1lbnRcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuZm9ybS5Gb3JtRWxlbWVudCcsIC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5FbGVtZW50LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmb3JtJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ21ldGhvZCcsICdQT1NUJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2VuY3R5cGUnLCAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdhY2NlcHRDaGFyc2V0JywgJ1VURi04Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NoYXJhY3RlclNldCcsICdVVEYtOCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdjaGFyc2V0JywgJ1VURi04Jyk7XG5cbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnRcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkVsZW1lbnRcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLklucHV0RWxlbWVudC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkVsZW1lbnQsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIG5hbWU6ICdmaWxlJyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAqL1xuICAgIG11bHRpcGxlOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgKi9cbiAgICBvbkNoYW5nZTogbnVsbCxcblxuICAgIF9maWxlTmFtZXM6IHt9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnQudHlwZSA9ICdmaWxlJztcbiAgICAgICAgdGhpcy5lbGVtZW50Lm5hbWUgPSB0aGlzLm5hbWUgKyAodGhpcy5tdWx0aXBsZSA/ICdbXScgOiAnJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5tdWx0aXBsZSA9IHRoaXMubXVsdGlwbGU7XG5cbiAgICAgICAgLy8gSUU4IGZpbGUgZmllbGQgdHJhbnNwYXJlbmN5IGZpeC5cbiAgICAgICAgaWYgKEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpKSB7XG4gICAgICAgICAgICB2YXIgc3R5bGUgPSB0aGlzLmVsZW1lbnQuc3R5bGU7XG4gICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdWJzY3JpYmUgb24gY2hhbmdlIGlucHV0IGZpbGVzXG4gICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQub25jaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgKi9cbiAgICBnZXRGaWxlTmF0aXZlOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmZpbGVzICYmIHRoaXMuZWxlbWVudC5maWxlc1tpbmRleF0gfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldEZpbGVQYXRoOiBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuXG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5nZXRGaWxlTmF0aXZlKGluZGV4KTtcbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlIHx8ICcnO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGUud2Via2l0UmVsYXRpdmVQYXRoID9cbiAgICAgICAgICAgIGZpbGUud2Via2l0UmVsYXRpdmVQYXRoLnJlcGxhY2UoL15bXFwvXFxcXF0rLywgJycpIDpcbiAgICAgICAgICAgIGZpbGUuZmlsZU5hbWUgfHwgZmlsZS5uYW1lIHx8ICcnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZWxlbWVudC5maWxlcykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5maWxlcy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC52YWx1ZSA/IDEgOiAwO1xuICAgIH0sXG5cbiAgICBmcmVlemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm9uY2hhbmdlID0gbnVsbDtcbiAgICB9LFxuXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQub25jaGFuZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9fc3VwZXIoKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXJcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXInLCAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyICove1xuXG4gICAgICAgIF9icm93c2VyTmFtZTogbnVsbCxcblxuICAgICAgICBfYnJvd3NlclZlcnNpb246IG51bGwsXG5cbiAgICAgICAgX2RldGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2Jyb3dzZXJOYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LCB0ZW0sXG4gICAgICAgICAgICAgICAgTSA9IHVhLm1hdGNoKC8ob3BlcmF8Y2hyb21lfHNhZmFyaXxmaXJlZm94fG1zaWV8dHJpZGVudCg/PVxcLykpXFwvP1xccyooXFxkKykvaSkgfHwgW107XG4gICAgICAgICAgICBpZiAoL3RyaWRlbnQvaS50ZXN0KE1bMV0pKSB7XG4gICAgICAgICAgICAgICAgdGVtID0gL1xcYnJ2WyA6XSsoXFxkKykvZy5leGVjKHVhKSB8fCBbXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJOYW1lID0gJ3RyaWRlbnQnO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gdGVtWzFdIHx8IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE1bMV0gPT09ICdDaHJvbWUnKSB7XG4gICAgICAgICAgICAgICAgdGVtID0gdWEubWF0Y2goL1xcYihPUFJ8RWRnZSlcXC8oXFxkKykvKTtcbiAgICAgICAgICAgICAgICBpZiAodGVtICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvd3Nlck5hbWUgPSB0ZW1bMV0ucmVwbGFjZSgnT1BSJywgJ09wZXJhJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvd3NlclZlcnNpb24gPSB0ZW1bMl0gfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE0gPSBNWzJdID8gW01bMV0sIE1bMl1dIDogW25hdmlnYXRvci5hcHBOYW1lLCBuYXZpZ2F0b3IuYXBwVmVyc2lvbiwgJy0/J107XG4gICAgICAgICAgICBpZiAoKHRlbSA9IHVhLm1hdGNoKC92ZXJzaW9uXFwvKFxcZCspL2kpKSAhPSBudWxsKSBNLnNwbGljZSgxLCAxLCB0ZW1bMV0pO1xuXG4gICAgICAgICAgICB0aGlzLl9icm93c2VyTmFtZSA9IE1bMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gTVsxXSB8fCAxO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzSUU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnbXNpZScgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzV2Via2l0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0Nocm9tZSgpIHx8IHRoaXMuaXNTYWZhcmkoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0Nocm9tZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICdjaHJvbWUnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1NhZmFyaTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICdzYWZhcmknID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0ZpcmVmb3g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnZmlyZWZveCcgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVHJpZGVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICd0cmlkZW50JyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNGaWxlRHJvcFN1cHBvcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICdkcmFnZ2FibGUnIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKSAmJiB0eXBlb2Ygd2luZG93LkZpbGVSZWFkZXIgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB9XG5cbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlcicsIC8qKiBAbGVuZHMgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlciAqL3tcblxuICAgICAgICBnZW5lcmF0ZVVpZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7dmFyIHIgPSBNYXRoLnJhbmRvbSgpKjE2fDAsdj1jPT0neCc/cjpyJjB4M3wweDg7cmV0dXJuIHYudG9TdHJpbmcoMTYpO30pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZU9iamVjdDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKCFjb25maWcuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignV3JvbmcgY29uZmlndXJhdGlvbiBmb3IgY3JlYXRlIG9iamVjdC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnID0gdGhpcy5fX3N0YXRpYy5jbG9uZShjb25maWcpO1xuICAgICAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLmNsYXNzTmFtZTtcblxuICAgICAgICAgICAgLy8gR2V0IGNsYXNzXG4gICAgICAgICAgICB2YXIgb2JqZWN0Q2xhc3MgPSBGaWxlVXAuTmVhdG5lc3MubmFtZXNwYWNlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdENsYXNzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignTm90IGZvdW5kIGNsYXNzIGAnICsgY2xhc3NOYW1lICsgJ2AgZm9yIGNyZWF0ZSBpbnN0YW5jZS4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBvYmplY3RDbGFzcyhjb25maWcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgICAgICovXG4gICAgICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24gKG9iamVjdCwgY29uZmlnKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb25maWcuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBzZXR0ZXIgbmFtZVxuICAgICAgICAgICAgICAgIHZhciBzZXR0ZXIgPSAnc2V0JyArIGtleS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGtleS5zbGljZSgxKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W3NldHRlcl0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignWW91IGNhbiBub3QgcmVwbGFjZSBmcm9tIGNvbmZpZyBmdW5jdGlvbiBgJyArIGtleSArICdgIGluIG9iamVjdCBgJyArIG9iamVjdC5jbGFzc05hbWUoKSArICdgLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBGaWxlVXAuYmFzZS5FeGNlcHRpb24oJ0NvbmZpZyBwYXJhbSBgJyArIGtleSArICdgIGlzIHVuZGVmaW5lZCBpbiBvYmplY3QgYCcgKyBvYmplY3QuY2xhc3NOYW1lKCkgKyAnYC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNTaW1wbGVPYmplY3Qob2JqZWN0W2tleV0pICYmIHRoaXMuX2lzU2ltcGxlT2JqZWN0KG9iamVjdFtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W2tleV0gPSB0aGlzLl9fc3RhdGljLm1lcmdlKG9iamVjdFtrZXldLCBjb25maWdba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGNvbmZpZ1trZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqZWN0W3NldHRlcl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3NldHRlcl0uY2FsbChvYmplY3QsIGNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0Li4ufSBbb2JqXVxuICAgICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgbWVyZ2U6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHZhciBkc3QgPSB7fTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgb2JqID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzU2ltcGxlT2JqZWN0KG9ialtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gdGhpcy5fX3N0YXRpYy5tZXJnZShkc3Rba2V5XSwgb2JqW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3Rba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGNsb25lID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lW2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2lzU2ltcGxlT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmogJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgIShvYmogaW5zdGFuY2VvZiBBcnJheSkgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3Q7XG4gICAgICAgIH1cblxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuTWFuYWdlclxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXInLCAvKiogQGxlbmRzIEZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXIucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5NYW5hZ2VyLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX19zdXBlcigpO1xuICAgICAgICB0aGlzLmNvbGxlY3Rpb24ub24oW1xuICAgICAgICAgICAgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfQURELFxuICAgICAgICAgICAgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfSVRFTV9FTkRcbiAgICAgICAgXSwgdGhpcy5fcXVldWVOZXh0LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfcXVldWVOZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmNvbGxlY3Rpb24uZ2V0TmV4dEZvclVwbG9hZCgpO1xuICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgZmlsZS5zdGFydCgpO1xuICAgICAgICAgICAgdGhpcy5fcXVldWVOZXh0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5tb2RlbHMuRmlsZVxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1vZGVscy5GaWxlJywgLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLkZpbGUucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLkZpbGUgKi97XG5cbiAgICAgICAgU1RBVFVTX1FVRVVFOiAncXVldWUnLFxuICAgICAgICBTVEFUVVNfUFJPQ0VTUzogJ3Byb2Nlc3MnLFxuICAgICAgICBTVEFUVVNfUEFVU0U6ICdwYXVzZScsXG4gICAgICAgIFNUQVRVU19FTkQ6ICdlbmQnLFxuXG4gICAgICAgIFJFU1VMVF9TVUNDRVNTOiAnc3VjY2VzcycsXG4gICAgICAgIFJFU1VMVF9FUlJPUjogJ2Vycm9yJyxcblxuICAgICAgICBFVkVOVF9TVEFUVVM6ICdzdGF0dXMnLFxuICAgICAgICBFVkVOVF9QUk9HUkVTUzogJ3Byb2dyZXNzJ1xuXG4gICAgfSxcblxuICAgIGluZGV4OiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBfdWlkOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGV9XG4gICAgICovXG4gICAgX25hdGl2ZTogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzc31cbiAgICAgKi9cbiAgICBwcm9ncmVzczoge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzcydcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfVxuICAgICAqL1xuICAgIF91cGxvYWRlcjogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgX3BhdGg6ICcnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBfdHlwZTogJycsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIF9ieXRlc1VwbG9hZGVkOiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBfYnl0ZXNVcGxvYWRFbmQ6IDAsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIF9ieXRlc1RvdGFsOiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBfc3RhdHVzOiAncXVldWUnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxuICAgICAqL1xuICAgIF9yZXN1bHQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfG51bGx9XG4gICAgICovXG4gICAgX3Jlc3VsdEh0dHBTdGF0dXM6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfG51bGx9XG4gICAgICovXG4gICAgX3Jlc3VsdEh0dHBNZXNzYWdlOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VpZCA9IHRoaXMuX3VpZCB8fCBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5nZW5lcmF0ZVVpZCgpO1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIubWVyZ2UoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiB0aGlzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0aGlzLnByb2dyZXNzXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRSkge1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuc2V0U3RhdHVzKHRoaXMuX19zdGF0aWMuU1RBVFVTX1BBVVNFKTtcbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLnN0b3AoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRVaWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3VpZCA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0VWlkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VpZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbGV9IHZhbHVlXG4gICAgICovXG4gICAgc2V0TmF0aXZlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLl9uYXRpdmUgPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RmlsZX1cbiAgICAgKi9cbiAgICBnZXROYXRpdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbmF0aXZlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldFBhdGg6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3BhdGggPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFBhdGg6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGF0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRUeXBlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLl90eXBlID0gdmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRUeXBlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3R5cGU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXROYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSAvW15cXC9cXFxcXSskLy5leGVjKHBhdGgpO1xuXG4gICAgICAgIHJldHVybiBtYXRjaGVzID8gbWF0Y2hlc1swXS5yZXBsYWNlKC9eKFteP10rKS4qJC8sICckMScpIDogcGF0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldFVwbG9hZGVyOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fdXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnN0b3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdmFsdWU7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXMgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0SHR0cE1lc3NhZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfUFJPQ0VTUyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfRVJST1IsIGZ1bmN0aW9uKHN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX19zdGF0aWMuUkVTVUxUX0VSUk9SO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfRU5EKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9FTkQsIGZ1bmN0aW9uKHN0YXR1cywgZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5zZXRCeXRlc1VwbG9hZGVkKHRoaXMuZ2V0Qnl0ZXNUb3RhbCgpKTtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbdGhpc10pO1xuXG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9fc3RhdGljLlJFU1VMVF9TVUNDRVNTO1xuICAgICAgICAgICAgdGhpcy5zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfRU5EKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9QUk9HUkVTUywgZnVuY3Rpb24oYnl0ZXNVcGxvYWRlZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5hZGQoYnl0ZXNVcGxvYWRlZCk7XG4gICAgICAgICAgICB0aGlzLnNldEJ5dGVzVXBsb2FkZWQoYnl0ZXNVcGxvYWRlZCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfVxuICAgICAqL1xuICAgIGdldFVwbG9hZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwbG9hZGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldEJ5dGVzVXBsb2FkZWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9ieXRlc1VwbG9hZGVkID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYnl0ZXNVcGxvYWRlZCA9IHZhbHVlO1xuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9QUk9HUkVTUywgW3RoaXNdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldEJ5dGVzVXBsb2FkZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYnl0ZXNVcGxvYWRlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1VwbG9hZEVuZDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2J5dGVzVXBsb2FkRW5kID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYnl0ZXNVcGxvYWRFbmQgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1VwbG9hZEVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1VwbG9hZEVuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1RvdGFsOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNUb3RhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVG90YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1RvdGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J5dGVzVG90YWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0UmVzdWx0OiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLl9yZXN1bHQgPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFJlc3VsdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNSZXN1bHRTdWNjZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdCA9PT0gdGhpcy5fX3N0YXRpYy5SRVNVTFRfU1VDQ0VTUztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1Jlc3VsdEVycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdCA9PT0gdGhpcy5fX3N0YXRpYy5SRVNVTFRfRVJST1I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0UmVzdWx0SHR0cFN0YXR1czogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcmVzdWx0SHR0cFN0YXR1cyA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8bnVsbH1cbiAgICAgKi9cbiAgICBnZXRSZXN1bHRIdHRwU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0UmVzdWx0SHR0cE1lc3NhZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBNZXNzYWdlID0gdmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfVxuICAgICAqL1xuICAgIGdldFJlc3VsdEh0dHBNZXNzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdEh0dHBNZXNzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzU3RhdHVzUXVldWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19RVUVVRTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1Byb2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QUk9DRVNTO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzU3RhdHVzUGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c0VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IHRoaXMuX19zdGF0aWMuU1RBVFVTX0VORDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3twYXRoOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgYnl0ZXNVcGxvYWRlZDogbnVtYmVyLCBieXRlc1VwbG9hZEVuZDogbnVtYmVyLCBieXRlc1RvdGFsOiBudW1iZXIsIHN0YXR1czogc3RyaW5nLCByZXN1bHQ6IChzdHJpbmd8bnVsbCksIHJlc3VsdEh0dHBTdGF0dXM6IChudW1iZXJ8bnVsbCksIHJlc3VsdEh0dHBNZXNzYWdlOiAoc3RyaW5nfG51bGwpfX1cbiAgICAgKi9cbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcGF0aDogdGhpcy5nZXRQYXRoKCksXG4gICAgICAgICAgICB0eXBlOiB0aGlzLmdldFR5cGUoKSxcbiAgICAgICAgICAgIGJ5dGVzVXBsb2FkZWQ6IHRoaXMuZ2V0Qnl0ZXNVcGxvYWRlZCgpLFxuICAgICAgICAgICAgYnl0ZXNVcGxvYWRFbmQ6IHRoaXMuZ2V0Qnl0ZXNVcGxvYWRFbmQoKSxcbiAgICAgICAgICAgIGJ5dGVzVG90YWw6IHRoaXMuZ2V0Qnl0ZXNUb3RhbCgpLFxuICAgICAgICAgICAgc3RhdHVzOiB0aGlzLmdldFN0YXR1cygpLFxuICAgICAgICAgICAgcmVzdWx0OiB0aGlzLmdldFJlc3VsdCgpLFxuICAgICAgICAgICAgcmVzdWx0SHR0cFN0YXR1czogdGhpcy5nZXRSZXN1bHRIdHRwU3RhdHVzKCksXG4gICAgICAgICAgICByZXN1bHRIdHRwTWVzc2FnZTogdGhpcy5nZXRSZXN1bHRIdHRwTWVzc2FnZSgpLFxuICAgICAgICAgICAgcHJvZ3Jlc3M6IHRoaXMucHJvZ3Jlc3MudG9KU09OKClcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRTdGF0dXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGF0dXMgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1RBVFVTLCBbdGhpcywgdGhpcy5fc3RhdHVzXSk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzc1xuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1vZGVscy5GaWxlUHJvZ3Jlc3MnLCAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBzcGVlZE1pbk1lYXN1cmVtZW50OiAyLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBzcGVlZE1heE1lYXN1cmVtZW50OiA1LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cbiAgICAgKi9cbiAgICBmaWxlOiBudWxsLFxuXG4gICAgaGlzdG9yeTogW10sXG5cbiAgICBfbGFzdFRpbWU6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uKGJ5dGVzVXBsb2FkZWQpIHtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgdGhpcy5oaXN0b3J5LnB1c2goe1xuICAgICAgICAgICAgYnl0ZXM6IGJ5dGVzVXBsb2FkZWQgLSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuX2xhc3RUaW1lID8gbm93IC0gdGhpcy5fbGFzdFRpbWUgOiBudWxsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sYXN0VGltZSA9IG5vdztcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmhpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5fbGFzdFRpbWUgPSBudWxsO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaGlzdG9yeTogdGhpcy5oaXN0b3J5XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn0gU2Vjb25kc1xuICAgICAqL1xuICAgIGdldFRpbWVMZWZ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJ5dGVzVG90YWwgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNUb3RhbCgpO1xuICAgICAgICBpZiAoYnl0ZXNUb3RhbCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYnl0ZXNVcGxvYWRlZCA9IHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCk7XG5cbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCgoYnl0ZXNUb3RhbCAtIGJ5dGVzVXBsb2FkZWQpIC8gc3BlZWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlcyBpbiBzZWNvbmRcbiAgICAgKi9cbiAgICBnZXRTcGVlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmhpc3RvcnkubGVuZ3RoIDwgdGhpcy5zcGVlZE1pbk1lYXN1cmVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCBsYXN0IGRpZmYgdmFsdWVzXG4gICAgICAgIHZhciBoaXN0b3J5ID0gdGhpcy5oaXN0b3J5LnNsaWNlKC0xICogdGhpcy5zcGVlZE1heE1lYXN1cmVtZW50KTtcblxuICAgICAgICAvLyBDYWxjdWxhdGUgYXZlcmFnZSB1cGxvYWQgc3BlZWRcbiAgICAgICAgdmFyIHN1bW1hcnlCeXRlcyA9IDA7XG4gICAgICAgIHZhciBzdW1tYXJ5RHVyYXRpb24gPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGhpc3RvcnkubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBzdW1tYXJ5Qnl0ZXMgKz0gaGlzdG9yeVtpXS5ieXRlcztcbiAgICAgICAgICAgIHN1bW1hcnlEdXJhdGlvbiArPSBoaXN0b3J5W2ldLmR1cmF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN1bW1hcnlCeXRlcyA9PT0gMCB8fCBzdW1tYXJ5RHVyYXRpb24gPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoc3VtbWFyeUJ5dGVzIC8gKHN1bW1hcnlEdXJhdGlvbiAvIDEwMDApKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRQZXJjZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJ5dGVzVG90YWwgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNUb3RhbCgpO1xuICAgICAgICBpZiAoYnl0ZXNUb3RhbCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYnl0ZXNVcGxvYWRlZCA9IHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCk7XG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKGJ5dGVzVXBsb2FkZWQgKiAxMDAgLyBieXRlc1RvdGFsKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnRcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbicsIC8qKiBAbGVuZHMgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24ucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbiAqL3tcblxuICAgICAgICBFVkVOVF9BREQ6ICdhZGQnLFxuICAgICAgICBFVkVOVF9SRU1PVkU6ICdyZW1vdmUnLFxuICAgICAgICBFVkVOVF9BTExfRU5EOiAnYWxsX2VuZCcsXG4gICAgICAgIEVWRU5UX0lURU1fU1RBVFVTOiAnaXRlbV9zdGF0dXMnLFxuICAgICAgICBFVkVOVF9JVEVNX1BST0dSRVNTOiAnaXRlbV9wcm9ncmVzcycsXG4gICAgICAgIEVWRU5UX0lURU1fRU5EOiAnaXRlbV9lbmQnXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBtYXhDb25jdXJyZW50VXBsb2FkczogMyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGVbXX1cbiAgICAgKi9cbiAgICBfZmlsZXM6IFtdLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX29uU3RhdHVzQ2hhbmdlID0gdGhpcy5fb25TdGF0dXNDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fb25Qcm9ncmVzc0NoYW5nZSA9IHRoaXMuX29uUHJvZ3Jlc3NDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGVbXX0gZmlsZXNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICB0aGlzLl9maWxlcyA9IHRoaXMuX2ZpbGVzLmNvbmNhdChmaWxlcyk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGZpbGVzW2ldLm9uKEZpbGVVcC5tb2RlbHMuRmlsZS5FVkVOVF9TVEFUVVMsIHRoaXMuX29uU3RhdHVzQ2hhbmdlKTtcbiAgICAgICAgICAgIGZpbGVzW2ldLm9uKEZpbGVVcC5tb2RlbHMuRmlsZS5FVkVOVF9QUk9HUkVTUywgdGhpcy5fb25Qcm9ncmVzc0NoYW5nZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9BREQsIFtmaWxlc10pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLm1vZGVscy5GaWxlW119IGZpbGVzXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbGVzLmluZGV4T2YoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpMiA9IDAsIGwyID0gZmlsZXMubGVuZ3RoOyBpMiA8IGwyOyBpMisrKSB7XG4gICAgICAgICAgICBmaWxlc1tpMl0ub2ZmKEZpbGVVcC5tb2RlbHMuRmlsZS5FVkVOVF9TVEFUVVMsIHRoaXMuX29uU3RhdHVzQ2hhbmdlKTtcbiAgICAgICAgICAgIGZpbGVzW2kyXS5vZmYoRmlsZVVwLm1vZGVscy5GaWxlLkVWRU5UX1BST0dSRVNTLCB0aGlzLl9vblByb2dyZXNzQ2hhbmdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1JFTU9WRSwgW2ZpbGVzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtGaWxlVXAubW9kZWxzLkZpbGVbXX1cbiAgICAgKi9cbiAgICBnZXRGaWxlczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdHVzXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRDb3VudEJ5U3RhdHVzOiBmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgIHZhciBpQ291bnQgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2ZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbGVzW2ldLmdldFN0YXR1cygpID09PSBzdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBpQ291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaUNvdW50O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggZmlsZSBmb3IgbmV4dCB1cGxvYWRpbmdcbiAgICAgKiBAcmV0dXJucyB7RmlsZVVwLm1vZGVscy5GaWxlfG51bGx9XG4gICAgICovXG4gICAgZ2V0TmV4dEZvclVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5nZXRDb3VudEJ5U3RhdHVzKEZpbGVVcC5tb2RlbHMuRmlsZS5TVEFUVVNfUFJPQ0VTUykgPj0gdGhpcy5tYXhDb25jdXJyZW50VXBsb2Fkcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2ZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2ZpbGVzW2ldLmlzU3RhdHVzUXVldWUoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9maWxlc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLm1vZGVscy5GaWxlfSBmaWxlXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vblN0YXR1c0NoYW5nZTogZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9JVEVNX1NUQVRVUywgW2ZpbGVdKTtcblxuICAgICAgICBpZiAoZmlsZS5pc1N0YXR1c0VuZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9JVEVNX0VORCwgW2ZpbGVdKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0Q291bnQoKSA9PT0gdGhpcy5nZXRDb3VudEJ5U3RhdHVzKEZpbGVVcC5tb2RlbHMuRmlsZS5TVEFUVVNfRU5EKSkge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0FMTF9FTkQsIFt0aGlzLl9maWxlc10pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGV9IGZpbGVcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgX29uUHJvZ3Jlc3NDaGFuZ2U6IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfSVRFTV9QUk9HUkVTUywgW2ZpbGVdKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxuLyoqXHJcbiAqIEBjbGFzcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnRcclxuICovXHJcbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXInLCAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcclxuXHJcbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlciAqL3tcclxuXHJcbiAgICAgICAgRVZFTlRfU1RBUlQ6ICdzdGFydCcsXHJcbiAgICAgICAgRVZFTlRfUFJPR1JFU1M6ICdwcm9ncmVzcycsXHJcbiAgICAgICAgRVZFTlRfRVJST1I6ICdlcnJvcicsXHJcbiAgICAgICAgRVZFTlRfRU5EX1BBUlQ6ICdlbmRfcGFydCcsXHJcbiAgICAgICAgRVZFTlRfRU5EOiAnZW5kJyxcclxuXHJcbiAgICAgICAgaXNQcm9ncmVzc1N1cHBvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgYWRkVXJsUGFyYW1zOiBmdW5jdGlvbiAodXJsLCBwYXJhbXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHVybCArICh1cmwuaW5kZXhPZignPycpID09PSAtMSA/ICc/JyA6ICcmJykgKyB0aGlzLl9zZXJpYWxpemUocGFyYW1zKS5qb2luKCcmJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgX3NlcmlhbGl6ZTogZnVuY3Rpb24ocGFyYW1zLCBwYXJlbnRLZXkpIHtcclxuICAgICAgICAgICAgcGFyZW50S2V5ID0gcGFyZW50S2V5IHx8ICcnO1xyXG5cclxuICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSBbXTtcclxuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIHBhcmFtcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuY29kZWRLZXkgPSBlbmNvZGVVUklDb21wb25lbnQocGFyZW50S2V5ID8gcGFyZW50S2V5ICsgJ1snICsga2V5ICsgJ10nIDoga2V5KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtc1trZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXNba2V5XS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlcmlhbGl6ZWQucHVzaChlbmNvZGVkS2V5ICsgJ1tdPScgKyBlbmNvZGVVUklDb21wb25lbnQocGFyYW1zW2tleV1baV0pKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zW2tleV0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmlhbGl6ZWQgPSBzZXJpYWxpemVkLmNvbmNhdCh0aGlzLl9fc3RhdGljLl9zZXJpYWxpemUocGFyYW1zW2tleV0sIGtleSkpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcGFyYW1zW2tleV0gPT09ICdib29sZWFuJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpYWxpemVkLnB1c2goZW5jb2RlZEtleSArICc9JyArIChwYXJhbXNba2V5XSA/IDEgOiAwKSlcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJpYWxpemVkLnB1c2goZW5jb2RlZEtleSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChwYXJhbXNba2V5XSkpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxyXG4gICAgICovXHJcbiAgICByZXNwb25zZVBhcnNlcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIF91cmw6ICcnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge29iamVjdH1cclxuICAgICAqL1xyXG4gICAgX3BhcmFtczoge30sXHJcblxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgIH0sXHJcblxyXG4gICAgaXNQcm9ncmVzc1N1cHBvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZhbHVlXHJcbiAgICAgKi9cclxuICAgIHNldFVybDogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgICAgICB0aGlzLl91cmwgPSB2YWx1ZTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHJldHVybnMge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgZ2V0VXJsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fdXJsO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmFsdWVcclxuICAgICAqL1xyXG4gICAgc2V0UGFyYW1zOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuX3BhcmFtcyA9IHZhbHVlO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBnZXRQYXJhbXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9wYXJhbXM7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB0ZXh0XHJcbiAgICAgKiBAcmV0dXJucyB7W119XHJcbiAgICAgKiBAcHJvdGVjdGVkXHJcbiAgICAgKi9cclxuICAgIF9kZWZhdWx0UmVzcG9uc2VQYXJzZXI6IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgICB2YXIgZGF0YSA9IG51bGw7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZGF0YSA9IEpTT04ucGFyc2UodGV4dCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge31cclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxyXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XHJcbiAqIEBsaWNlbnNlIE1JVFxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XHJcblxyXG5yZXF1aXJlKCcuL0Jhc2VVcGxvYWRlcicpO1xyXG5cclxuLyoqXHJcbiAqIEBjbGFzcyBGaWxlVXAudXBsb2FkZXJzLklmcmFtZVVwbG9hZGVyXHJcbiAqIEBleHRlbmRzIEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyXHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXInLCAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXIucHJvdG90eXBlICove1xyXG5cclxuICAgIF9fZXh0ZW5kczogRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlciAqL3tcclxuXHJcbiAgICAgICAgX0NvdW50ZXI6IDBcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1vZGVscy5GaWxlW119XHJcbiAgICAgKi9cclxuICAgIGZpbGVzOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLkZvcm19XHJcbiAgICAgKi9cclxuICAgIGZvcm06IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5lcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIG5hbWVQcmVmaXg6ICdGaWxlVXBJZnJhbWUnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgX25hbWU6ICcnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBfd3JhcHBlcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgX2ZyYW1lOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxyXG4gICAgICovXHJcbiAgICBfZnJhbWVMb2FkVGltZXI6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgX2lzRnJhbWVMb2FkZWQ6IGZhbHNlLFxyXG5cclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIEdlbmVyYXRlIG5hbWVcclxuICAgICAgICB0aGlzLl9uYW1lID0gdGhpcy5uYW1lUHJlZml4ICsgKCsrdGhpcy5fX3N0YXRpYy5fQ291bnRlcik7XHJcblxyXG4gICAgICAgIC8vIEluaXQgY29udGFpbmVyXHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xyXG5cclxuICAgICAgICAvLyBSZW5kZXIgZnJhbWVcclxuICAgICAgICB0aGlzLl9pbml0Q29udGFpbmVyKCk7XHJcbiAgICAgICAgdGhpcy5faW5pdEZyYW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LFxyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gU3RhcnQgdXBsb2FkXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1RBUlQpO1xyXG4gICAgICAgIHRoaXMuZm9ybS5zdWJtaXQodGhpcy5nZXRVcmwoKSwgdGhpcy5fbmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFyVGltZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZyYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lLm9ubG9hZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl93cmFwcGVyLnJlbW92ZUNoaWxkKHRoaXMuX2ZyYW1lKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2ZyYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIGdldFVybDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHVpZHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gdGhpcy5maWxlcykge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5maWxlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgICB1aWRzLnB1c2godGhpcy5maWxlc1trZXldLmdldFVpZCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHBhcmFtcyA9IHRoaXMuZ2V0UGFyYW1zKCk7XHJcbiAgICAgICAgcGFyYW1zLnVpZHMgPSB1aWRzO1xyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5fX3N0YXRpYy5hZGRVcmxQYXJhbXModGhpcy5fdXJsLCBwYXJhbXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfaW5pdENvbnRhaW5lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUud2lkdGggPSAwO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gMDtcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLnRvcCA9ICctMTAwcHgnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUubGVmdCA9ICctMTAwcHgnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fd3JhcHBlcik7XHJcbiAgICB9LFxyXG5cclxuICAgIF9pbml0RnJhbWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaXNDcmVhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGlzSUUgPSBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzSUUoKTtcclxuXHJcbiAgICAgICAgaWYgKGlzSUUgJiYgaXNJRSA8IDEwKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl9uYW1lICsgJ1wiPicpO1xyXG4gICAgICAgICAgICAgICAgaXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQgc2VlbXMgSUU5IGluIGNvbXBhdGFiaWxpdHkgbW9kZS5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc0NyZWF0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUubmFtZSA9IHRoaXMuX25hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9mcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp7fTsnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuYXBwZW5kQ2hpbGQodGhpcy5fZnJhbWUpO1xyXG5cclxuICAgICAgICAvLyBTdWJzY3JpYmUgb24gaWZyYW1lIGxvYWQgZXZlbnRzXHJcbiAgICAgICAgdGhpcy5fZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gdGhpcy5fb25SZWFkeVN0YXRlQ2hhbmdlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fZnJhbWUub25sb2FkID0gdGhpcy5fb25Mb2FkLmJpbmQodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vblJlYWR5U3RhdGVDaGFuZ2U6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLl9mcmFtZS5yZWFkeVN0YXRlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlJzpcclxuICAgICAgICAgICAgY2FzZSAnaW50ZXJhY3RpdmUnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJUaW1lcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJhbWVMb2FkVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fTG9hZEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25SZWFkeVN0YXRlQ2hhbmdlKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIDEwMDApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfb25Mb2FkOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFyVGltZXIoKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgYWxyZWFkeSBsb2FkZWRcclxuICAgICAgICBpZiAodGhpcy5faXNGcmFtZUxvYWRlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2lzRnJhbWVMb2FkZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgZG9jdW1lbnQgPSBudWxsO1xyXG4gICAgICAgIHZhciBzdGF0dXMgPSBudWxsO1xyXG4gICAgICAgIHZhciBlcnJvck1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgLy8gQ2F0Y2ggaWZyYW1lIGxvYWQgZXJyb3IgaW4gRmlyZWZveC5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBkb2N1bWVudCA9IHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHN0YXR1cyA9IDQwMztcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dCB8fCBkb2N1bWVudC5ib2R5LmlubmVySFRNTDtcclxuICAgICAgICBpZiAoIXN0YXR1cykge1xyXG4gICAgICAgICAgICBzdGF0dXMgPSAyMDE7IC8vIENyZWF0ZWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9ICh0aGlzLnJlc3BvbnNlUGFyc2VyIHx8IHRoaXMuX2RlZmF1bHRSZXNwb25zZVBhcnNlcikuY2FsbCh0aGlzLCB0ZXh0KTtcclxuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBBcnJheSkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsZXNbaV0uc2V0UmVzdWx0SHR0cFN0YXR1cyhzdGF0dXMpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsZXNbaV0uc2V0UmVzdWx0SHR0cE1lc3NhZ2UoZGF0YVtpXSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FTkQsIFtzdGF0dXMsIGRhdGFdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5maWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVzW2ldLnNldFJlc3VsdEh0dHBTdGF0dXMoc3RhdHVzKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVzW2ldLnNldFJlc3VsdEh0dHBNZXNzYWdlKGRhdGEpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFs1MDAsIGRhdGFdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLmZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxlc1tpXS5zZXRSZXN1bHRIdHRwU3RhdHVzKHN0YXR1cyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVzW2ldLnNldFJlc3VsdEh0dHBNZXNzYWdlKGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFtzdGF0dXMsIGVycm9yTWVzc2FnZV0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9mcmFtZUxvYWRUaW1lcikge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fZnJhbWVMb2FkVGltZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vQmFzZVVwbG9hZGVyXCI6MTh9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxucmVxdWlyZSgnLi9CYXNlVXBsb2FkZXInKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKi9cclxuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLFxyXG5cclxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuWGhyVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBtZXRob2Q6ICdQVVQnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cclxuICAgICAqL1xyXG4gICAgZmlsZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIG1pblByb2dyZXNzVXBkYXRlSW50ZXJ2YWxNczogNTAwLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyBJSVMgbWF4IGh0dHBSdW50aW1lQG1heFJlcXVlc3RMZW5ndGggdmFsdWUgd2hpY2ggaXMgMjE0NzQ4MjYyNCBLYlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgYnl0ZXNNYXhQYXJ0OiAyMDk3MTUxICogMTAyNCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIF9sYXN0UmVwb3J0VGltZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtYTUxIdHRwUmVxdWVzdH1cclxuICAgICAqL1xyXG4gICAgX3hocjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIF9ieXRlc1N0YXJ0OiAwLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxyXG4gICAgICovXHJcbiAgICBfYnl0ZXNFbmQ6IG51bGwsXHJcblxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9pbml0WGhyKCk7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRJbnRlcm5hbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5feGhyKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl94aHIudXBsb2FkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl94aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX19zdXBlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBnZXRVcmw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHZhciBwYXJhbXMgPSB0aGlzLmdldFBhcmFtcygpO1xyXG4gICAgICAgIHBhcmFtcy51aWRzID0gW3RoaXMuZmlsZS5nZXRVaWQoKV07XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzLl9fc3RhdGljLmFkZFVybFBhcmFtcyh0aGlzLl91cmwsIHBhcmFtcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIFhIUiBvYmplY3QgYW5kIHN1YnNjcmliZSBvbiBpdCBldmVudHNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9pbml0WGhyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5feGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgdGhpcy5feGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdGhpcy5fb25Qcm9ncmVzcy5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX3hoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB0aGlzLl9vblJlYWR5U3RhdGVDaGFuZ2UuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLl94aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy5nZXRVcmwoKSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzV2Via2l0KCkgfHwgRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc1RyaWRlbnQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIklmLU5vbmUtTWF0Y2hcIiwgXCIqXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIklmLU1vZGlmaWVkLVNpbmNlXCIsIFwiTW9uLCAyNiBKdWwgMTk5NyAwNTowMDowMCBHTVRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcIm5vLWNhY2hlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtUmVxdWVzdGVkLVdpdGhcIiwgXCJYTUxIdHRwUmVxdWVzdFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9zdGFydEludGVybmFsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVEFSVCk7XHJcblxyXG4gICAgICAgIC8vIFNldCBmaWxlIG5hbWVcclxuICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50OyBmaWxlbmFtZT1cIicgKyBlbmNvZGVVUkkodGhpcy5maWxlLmdldE5hbWUoKSkgKyAnXCInKTtcclxuXHJcbiAgICAgICAgdmFyIGlzRkYgPSBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzRmlyZWZveCgpO1xyXG4gICAgICAgIGlmIChpc0ZGICYmIGlzRkYgPCA3KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kQXNCaW5hcnkodGhpcy5maWxlLmdldE5hdGl2ZSgpLmdldEFzQmluYXJ5KCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYnl0ZXNUb3RhbCA9IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2J5dGVzU3RhcnQgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpO1xyXG4gICAgICAgIHRoaXMuX2J5dGVzRW5kID0gTWF0aC5taW4odGhpcy5fYnl0ZXNTdGFydCArIHRoaXMuYnl0ZXNNYXhQYXJ0LCBieXRlc1RvdGFsKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgcGFydGlhbCB1cGxvYWRcclxuICAgICAgICBpZiAodGhpcy5fYnl0ZXNTdGFydCA+IDAgfHwgdGhpcy5fYnl0ZXNFbmQgPCBieXRlc1RvdGFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVJhbmdlJywgJ2J5dGVzICcgKyB0aGlzLl9ieXRlc1N0YXJ0ICsgJy0nICsgKHRoaXMuX2J5dGVzRW5kIC0gMSkgKyAnLycgKyBieXRlc1RvdGFsKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9ieXRlc0VuZCA8IGJ5dGVzVG90YWwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kKHRoaXMuZmlsZS5nZXROYXRpdmUoKS5zbGljZSh0aGlzLl9ieXRlc1N0YXJ0LCB0aGlzLl9ieXRlc0VuZCkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLnNlbmQodGhpcy5maWxlLmdldE5hdGl2ZSgpLnNsaWNlKHRoaXMuX2J5dGVzU3RhcnQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kKHRoaXMuZmlsZS5nZXROYXRpdmUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcclxuICAgICAqIEBwcm90ZWN0ZWRcclxuICAgICAqL1xyXG4gICAgX29uUHJvZ3Jlc3M6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGlOb3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0UmVwb3J0VGltZSAmJiBpTm93IC0gdGhpcy5fbGFzdFJlcG9ydFRpbWUgPCB0aGlzLm1pblByb2dyZXNzVXBkYXRlSW50ZXJ2YWxNcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2xhc3RSZXBvcnRUaW1lID0gaU5vdztcclxuXHJcbiAgICAgICAgdmFyIGJ5dGVzVXBsb2FkZWQgPSB0aGlzLl9ieXRlc1N0YXJ0ICsgZXZlbnQubG9hZGVkO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbYnl0ZXNVcGxvYWRlZF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcclxuICAgICAqIEBwcm90ZWN0ZWRcclxuICAgICAqL1xyXG4gICAgX29uUmVhZHlTdGF0ZUNoYW5nZTogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5feGhyLnJlYWR5U3RhdGUgIT09IDQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHRleHQgPSB0aGlzLl94aHIucmVzcG9uc2VUZXh0IHx8IHRoaXMuX3hoci5zdGF0dXNUZXh0O1xyXG4gICAgICAgIHRoaXMuZmlsZS5zZXRSZXN1bHRIdHRwU3RhdHVzKHRoaXMuX3hoci5zdGF0dXMpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5feGhyLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5feGhyLnN0YXR1cyA8IDMwMCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fYnl0ZXNFbmQgPCB0aGlzLmZpbGUuZ2V0Qnl0ZXNUb3RhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGUuc2V0Qnl0ZXNVcGxvYWRlZCh0aGlzLl9ieXRlc0VuZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FTkRfUEFSVCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9ICh0aGlzLnJlc3BvbnNlUGFyc2VyIHx8IHRoaXMuX2RlZmF1bHRSZXNwb25zZVBhcnNlcikuY2FsbCh0aGlzLCB0ZXh0KTtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGUuc2V0UmVzdWx0SHR0cE1lc3NhZ2UoZGF0YVswXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRU5ELCBbdGhpcy5feGhyLnN0YXR1cywgZGF0YV0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGUuc2V0UmVzdWx0SHR0cE1lc3NhZ2UoZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFt0aGlzLl94aHIuc3RhdHVzLCBkYXRhXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsZS5zZXRSZXN1bHRIdHRwTWVzc2FnZSh0ZXh0KTtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFt0aGlzLl94aHIuc3RhdHVzLCB0ZXh0XSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59KTtcclxuXG59LHtcIi4uL0ZpbGVVcFwiOjIsXCIuL0Jhc2VVcGxvYWRlclwiOjE4fV0sMjE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NyYy9OZWF0bmVzcycpO1xufSx7XCIuL3NyYy9OZWF0bmVzc1wiOjI0fV0sMjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5lYXRuZXNzKSB7XG5cblx0cmV0dXJuIE5lYXRuZXNzLmNyZWF0ZUNsYXNzKCdOZWF0bmVzcy5FeGNlcHRpb24nLCAvKiogQGxlbmRzIE5lYXRuZXNzLkV4Y2VwdGlvbi5wcm90b3R5cGUgKi97XG5cblx0XHRfX2V4dGVuZHM6IEVycm9yLFxuXG5cdFx0LyoqXG5cdFx0ICogVGV4dCBtZXNzYWdlXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKi9cblx0XHRtZXNzYWdlOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogRXh0cmEgaW5mb3JtYXRpb24gZHVtcHNcblx0XHQgKiBAdHlwZSB7QXJyYXl9XG5cdFx0ICovXG5cdFx0ZXh0cmE6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBCYXNlIGNsYXNzIGZvciBpbXBsZW1lbnQgZXhjZXB0aW9uLiBUaGlzIGNsYXNzIGV4dGVuZCBmcm9tIG5hdGl2ZSBFcnJvciBhbmQgc3VwcG9ydFxuXHRcdCAqIHN0YWNrIHRyYWNlIGFuZCBtZXNzYWdlLlxuXHRcdCAqIEBjb25zdHJ1Y3RzXG5cdFx0ICogQGV4dGVuZHMgRXJyb3Jcblx0XHQgKi9cblx0XHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHRcdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yIHx8IHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG5cdFx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8ICcnO1xuXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0dGhpcy5leHRyYSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX19zdXBlcigpO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLm1lc3NhZ2U7XG5cdFx0fVxuXG5cdH0pO1xuXG59O1xufSx7fV0sMjM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5lYXRuZXNzKSB7XG5cblx0LyoqXG5cdCAqIEJhc2UgY2xhc3MuIEV4dGVuZCBhbGwgeW91IGJhc2UgY2xhc3NlcyBmcm9tIHRoaXMgY2xhc3MgZm9yIHRydWUgbmF2aWdhdGlvbiBpbiBJREVcblx0ICogYW5kIHN1cHBvcnQgbWV0aG9kcyBzdWNoIGFzIHtAbGluayBOZWF0bmVzcy5PYmplY3QjY2xhc3NOYW1lfVxuXHQgKiBAY2xhc3MgTmVhdG5lc3MuT2JqZWN0XG5cdCAqL1xuXHRyZXR1cm4gTmVhdG5lc3MuY3JlYXRlQ2xhc3MoJ05lYXRuZXNzLk9iamVjdCcsIHtcblxuXHRcdC8qKlxuXHRcdCAqIExpbmsgdG8gdXNlZCBjbGFzcy4gSWYgeW91IGFjY2VzcyB0byB0aGlzIHByb3BlcnR5IGluIGV4dGVuZHMgY2xhc3NlcywgdGhlbiB5b3UgZ2l2ZSB0b3AtbGV2ZWwgY2xhc3MuXG5cdFx0ICogQHR5cGUgeyp9XG5cdFx0ICovXG5cdFx0X19zdGF0aWM6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBGdWxsIGN1cnJlbnQgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlIFJldHVybnMgdmFsdWUgZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzc1xuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9fY2xhc3NOYW1lOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogVW5pcXVlIGluc3RhbmNlIG5hbWVcblx0XHQgKiBAZXhhbXBsZSBSZXR1cm5zIHZhbHVlIGV4YW1wbGVcblx0XHQgKiAgYXBwLk15Q2xhc3M1MFxuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9faW5zdGFuY2VOYW1lOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogRnVsbCBwYXJlbnQgKGV4dGVuZHMpIGNsYXNzIG5hbWUgd2l0aCBuYW1lc3BhY2Vcblx0XHQgKiBAZXhhbXBsZSBSZXR1cm5zIHZhbHVlIGV4YW1wbGVcblx0XHQgKiAgYXBwLk15QmFzZUNsYXNzXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKiBAcHJvdGVjdGVkXG5cdFx0ICovXG5cdFx0X19wYXJlbnRDbGFzc05hbWU6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIGZ1bGwgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUNsYXNzXG5cdFx0ICogQHJldHVybnMge3N0cmluZ31cblx0XHQgKi9cblx0XHRjbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX19jbGFzc05hbWU7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdW5pcXVlIGluc3RhbmNlIG5hbWVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzc1xuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0Y2xhc3NJbnN0YW5jZU5hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX19pbnN0YW5jZU5hbWU7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgZnVsbCBwYXJlbnQgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUJhc2VDbGFzc1xuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0cGFyZW50Q2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9fcGFyZW50Q2xhc3NOYW1lO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBDYWxsIHBhcmVudCBjbGFzcyBtZXRob2RzIHRocm91Z2ggdGhpcyBtZXRob2QuIFRoaXMgbWV0aG9kIHN1cHBvcnQgb25seSBzeW5jaHJvbm91cyBuZXN0ZWQgY2FsbHMuXG5cdFx0ICogQHBhcmFtIHsuLi4qfVxuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKi9cblx0XHRfX3N1cGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0fVxuXG5cdH0pO1xuXG59O1xuXG59LHt9XSwyNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cclxudmFyIGV4dGVuZENsYXNzID0gcmVxdWlyZSgnLi9leHRlbmRDbGFzcycpO1xyXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xyXG5cclxuLy8gRm9yIC5ub0NvbmZsaWN0KCkgaW1wbGVtZW50YXRpb25cclxudmFyIGhhc1ByZXZpb3VzTmVhdG5lc3MgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ05lYXRuZXNzJyk7XHJcbnZhciBwcmV2aW91c05lYXRuZXNzID0gaGFzUHJldmlvdXNOZWF0bmVzcyA/IHdpbmRvdy5OZWF0bmVzcyA6IG51bGw7XHJcblxyXG4vKipcclxuICogTmVhdG5lc3MgY2xhc3NcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzXHJcbiAqL1xyXG52YXIgTmVhdG5lc3MgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAdHlwZSB7b2JqZWN0fVxyXG5cdCAqL1xyXG5cdHRoaXMuX2NvbnRleHQgPSB7fTtcclxuXHJcblx0dGhpcy5fY29udGV4dEtleXMgPSB7fTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5ld0NvbnRleHRcclxuICogQHBhcmFtIHtib29sZWFufSBbcmVtb3ZlR2xvYmFsXSBTZXQgdHJ1ZSBmb3IgcmVtb3ZlIE5lYXRuZXNzIG9iamVjdCBmcm9tIHdpbmRvdyAoYnJvd3NlciBnbG9iYWwgb2JqZWN0KVxyXG4gKiBAcmV0dXJucyB7TmVhdG5lc3N9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubmV3Q29udGV4dCA9IGZ1bmN0aW9uKHJlbW92ZUdsb2JhbCkge1xyXG5cdHJlbW92ZUdsb2JhbCA9IHJlbW92ZUdsb2JhbCB8fCBmYWxzZTtcclxuXHJcblx0aWYgKHJlbW92ZUdsb2JhbCkge1xyXG5cdFx0dGhpcy5ub0NvbmZsaWN0KCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbmV3IE5lYXRuZXNzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5tb3ZlQ29udGV4dFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG5ld0NvbnRleHQgTmV3IGNvbnRleHQgb2JqZWN0XHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlbW92ZUZyb21PbGRdIFNldCB0cnVlIGZvciByZW1vdmUga2V5cyBmcm9tIG9sZCBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHtOZWF0bmVzc31cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5tb3ZlQ29udGV4dCA9IGZ1bmN0aW9uKG5ld0NvbnRleHQsIHJlbW92ZUZyb21PbGQpIHtcclxuXHRyZW1vdmVGcm9tT2xkID0gcmVtb3ZlRnJvbU9sZCB8fCBmYWxzZTtcclxuXHJcblx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2NvbnRleHRLZXlzKSB7XHJcblx0XHRpZiAodGhpcy5fY29udGV4dEtleXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRuZXdDb250ZXh0W2tleV0gPSB0aGlzLl9jb250ZXh0W2tleV07XHJcblx0XHRcdGlmIChyZW1vdmVGcm9tT2xkKSB7XHJcblx0XHRcdFx0ZGVsZXRlIHRoaXMuX2NvbnRleHRba2V5XTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHR0aGlzLl9jb250ZXh0ID0gbmV3Q29udGV4dDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5vQ29uZmxpY3RcclxuICogQHJldHVybnMge05lYXRuZXNzfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcclxuXHQvLyBSb290IG5hbWVzcGFjZSBvYmplY3RcclxuXHR2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge307XHJcblxyXG5cdGlmIChoYXNQcmV2aW91c05lYXRuZXNzKSB7XHJcblx0XHRyb290Lk5lYXRuZXNzID0gcHJldmlvdXNOZWF0bmVzcztcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZGVsZXRlIHJvb3QuTmVhdG5lc3M7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5hbWVzcGFjZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBGdWxsIG5hbWVzcGFjZSBuYW1lXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRuYW1lID0gbmFtZSB8fCAnJztcclxuXHJcblx0dmFyIG5hbWVQYXJ0cyA9IG5hbWUuc3BsaXQoJy4nKTtcclxuXHR2YXIgY3VycmVudFNjb3BlID0gdGhpcy5fY29udGV4dDtcclxuXHJcblx0aWYgKCFuYW1lKSB7XHJcblx0XHRyZXR1cm4gY3VycmVudFNjb3BlO1xyXG5cdH1cclxuXHJcblx0Ly8gRmluZCBvciBjcmVhdGVcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHNjb3BlTmFtZSA9IG5hbWVQYXJ0c1tpXTtcclxuXHRcdGlmIChpID09PSAwKSB7XHJcblx0XHRcdHRoaXMuX2NvbnRleHRLZXlzW3Njb3BlTmFtZV0gPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghY3VycmVudFNjb3BlW3Njb3BlTmFtZV0pIHtcclxuXHRcdFx0Y3VycmVudFNjb3BlW3Njb3BlTmFtZV0gPSB7XHJcblx0XHRcdFx0X19jbGFzc05hbWU6IG5hbWVQYXJ0cy5zbGljZSgwLCBpKS5qb2luKCcuJyksXHJcblx0XHRcdFx0X19wYXJlbnRDbGFzc05hbWU6IG51bGxcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZVtzY29wZU5hbWVdO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN1cnJlbnRTY29wZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXRob2QgZm9yIGRlZmluZSBjbGFzc1xyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLmNyZWF0ZUNsYXNzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcbiAqIEBwYXJhbSB7KGZ1bmN0aW9ufG9iamVjdHxudWxsKX0gb3B0aW9uc09yRXh0ZW5kXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG90eXBlUHJvcGVydGllc11cclxuICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wZXJ0aWVzXVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzKSB7XHJcblx0dmFyIHBhcmFtcyA9IGZvcm1hdHMucGFyc2VGb3JtYXQoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzKTtcclxuXHJcblx0Ly8gU3VwcG9ydCBleHRlbmRzIGFuZCBtaXhpbnMgYXMgc3RyaW5ncyBjbGFzcyBuYW1lc1xyXG5cdGlmICh0eXBlb2YgcGFyYW1zWzJdID09PSAnc3RyaW5nJykge1xyXG5cdFx0cGFyYW1zWzJdID0gdGhpcy5uYW1lc3BhY2UocGFyYW1zWzJdKTtcclxuICAgICAgICBpZiAoIXBhcmFtc1sxXSAmJiBwYXJhbXNbMl0gJiYgdHlwZW9mIHBhcmFtc1syXS5fX2NsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcGFyYW1zWzFdID0gZm9ybWF0cy5wYXJzZUZ1bGxOYW1lKHBhcmFtc1syXS5fX2NsYXNzTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cdH1cclxuXHR2YXIgbWl4aW5zID0gcGFyYW1zWzZdO1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0aWYgKHR5cGVvZiBtaXhpbnNbaV0gPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdG1peGluc1tpXSA9IHRoaXMubmFtZXNwYWNlKG1peGluc1tpXSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBTaG93IGVycm9yIGlmIG5vdCBkZWZpbmVkIGV4dGVuZGVkIGNsYXNzXHJcblx0aWYgKHBhcmFtc1syXSAhPT0gbnVsbCAmJiB0eXBlb2YgcGFyYW1zWzJdICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCBleHRlbmQgY2xhc3MgZm9yIGAnICsgZ2xvYmFsTmFtZSArICdgLicpO1xyXG5cdH1cclxuXHJcblx0dmFyIG5ld0NsYXNzID0gZXh0ZW5kQ2xhc3MocGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSwgcGFyYW1zWzZdLCBwYXJhbXNbM10sIHBhcmFtc1s0XSwgcGFyYW1zWzddKTtcclxuXHRmb3JtYXRzLmFwcGx5Q2xhc3NDb25maWcobmV3Q2xhc3MsIHBhcmFtc1s1XSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0pO1xyXG5cclxuXHRyZXR1cm4gbmV3Q2xhc3M7XHJcbn07XHJcblxyXG4vKipcclxuICogTWV0aG9kIGZvciBkZWZpbmUgY2xhc3NcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5kZWZpbmVDbGFzc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsTmFtZVxyXG4gKiBAcGFyYW0geyhmdW5jdGlvbnxvYmplY3R8bnVsbCl9IG9wdGlvbnNPckV4dGVuZFxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvdHlwZVByb3BlcnRpZXNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUNsYXNzID0gZnVuY3Rpb24gKGdsb2JhbE5hbWUsIG9wdGlvbnNPckV4dGVuZCwgcHJvdG90eXBlUHJvcGVydGllcywgc3RhdGljUHJvcGVydGllcykge1xyXG5cdHZhciBuZXdDbGFzcyA9IHRoaXMuY3JlYXRlQ2xhc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR2YXIgbmFtZU9iamVjdCA9IGZvcm1hdHMucGFyc2VGdWxsTmFtZShnbG9iYWxOYW1lKTtcclxuXHJcblx0dGhpcy5uYW1lc3BhY2UobmFtZU9iamVjdC5uYW1lc3BhY2UpW25hbWVPYmplY3QubmFtZV0gPSBuZXdDbGFzcztcclxuXHRyZXR1cm4gbmV3Q2xhc3M7XHJcbn07XHJcblxyXG4vKipcclxuICogTWV0aG9kIGZvciBkZWZpbmUgZW51bVxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUNsYXNzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUVudW0gPSBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgc3RhdGljUHJvcGVydGllcykge1xyXG5cdHZhciBuZXdDbGFzcyA9IHRoaXMuY3JlYXRlQ2xhc3MoZ2xvYmFsTmFtZSwgbnVsbCwge30sIHN0YXRpY1Byb3BlcnRpZXMpO1xyXG5cdHZhciBuYW1lT2JqZWN0ID0gZm9ybWF0cy5wYXJzZUZ1bGxOYW1lKGdsb2JhbE5hbWUpO1xyXG5cclxuXHR0aGlzLm5hbWVzcGFjZShuYW1lT2JqZWN0Lm5hbWVzcGFjZSlbbmFtZU9iamVjdC5uYW1lXSA9IG5ld0NsYXNzO1xyXG5cdHJldHVybiBuZXdDbGFzcztcclxufTtcclxuXHJcbnZhciBuZWF0bmVzcyA9IG1vZHVsZS5leHBvcnRzID0gbmV3IE5lYXRuZXNzKCk7XHJcblxyXG4vLyBXZWIgYnJvd3NlciBleHBvcnRcclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0d2luZG93Lk5lYXRuZXNzID0gbmVhdG5lc3M7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7TmVhdG5lc3MucHJvdG90eXBlLk9iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5PYmplY3QgPSByZXF1aXJlKCcuL05lYXRuZXNzLk9iamVjdCcpKG5lYXRuZXNzKTtcclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7TmVhdG5lc3MucHJvdG90eXBlLkV4Y2VwdGlvbn1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5FeGNlcHRpb24gPSByZXF1aXJlKCcuL05lYXRuZXNzLkV4Y2VwdGlvbicpKG5lYXRuZXNzKTtcclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLnZlcnNpb24gPSAnJUpPSU5UU19DVVJSRU5UX1ZFUlNJT04lJztcclxuXG59LHtcIi4vTmVhdG5lc3MuRXhjZXB0aW9uXCI6MjIsXCIuL05lYXRuZXNzLk9iamVjdFwiOjIzLFwiLi9leHRlbmRDbGFzc1wiOjI1LFwiLi9mb3JtYXRzXCI6MjZ9XSwyNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgaXNFdmFsRW5hYmxlID0gdHJ1ZTtcclxudmFyIGluc3RhbmNlQ291bnRlciA9IDA7XHJcblxyXG52YXIgX25vb3AgPSBmdW5jdGlvbigpIHtcclxufTtcclxuXHJcbnZhciBfY3JlYXRlRnVuY3Rpb24gPSBmdW5jdGlvbihuYW1lT2JqZWN0LCBjb25zdHJ1Y3Rvcikge1xyXG5cdGlmICghaXNFdmFsRW5hYmxlIHx8ICFuYW1lT2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxyXG5cdH1cclxuXHJcblx0dmFyIG5hbWVSZWdFeHAgPSAvW15hLXokX1xcLl0vaTtcclxuXHR2YXIgbmFtZSA9IG5hbWVPYmplY3QubmFtZSB8fCAnRnVuY3Rpb24nO1xyXG5cdHZhciBuYW1lUGFydHMgPSBuYW1lT2JqZWN0Lmdsb2JhbE5hbWUuc3BsaXQoJy4nKTtcclxuXHJcblx0Ly8gQ3JlYXRlIHJvb3Qgb2JqZWN0XHJcblx0dmFyIHJvb3ROYW1lID0gbmFtZVBhcnRzLnNoaWZ0KCk7XHJcblx0dmFyIGNzO1xyXG5cclxuXHRyb290TmFtZSA9IHJvb3ROYW1lLnJlcGxhY2UobmFtZVJlZ0V4cCwgJycpO1xyXG5cdGV2YWwoJ3ZhciAnICsgcm9vdE5hbWUgKyAnID0gY3MgPSB7fTsnKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGZha2UgbmFtZXNwYWNlIG9iamVjdFxyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgc2NvcGVOYW1lID0gbmFtZVBhcnRzW2ldO1xyXG5cdFx0aWYgKCFjc1tzY29wZU5hbWVdKSB7XHJcblx0XHRcdGNzW3Njb3BlTmFtZV0gPSB7fTtcclxuXHRcdH1cclxuXHRcdGNzID0gY3Nbc2NvcGVOYW1lXTtcclxuXHR9XHJcblxyXG5cdHZhciBmdW5jO1xyXG5cdHZhciBmdWxsTmFtZSA9IChuYW1lT2JqZWN0Lm5hbWVzcGFjZSA/IG5hbWVPYmplY3QubmFtZXNwYWNlICsgJy4nIDogJycpICsgbmFtZTtcclxuXHJcblx0ZnVsbE5hbWUgPSBmdWxsTmFtZS5yZXBsYWNlKG5hbWVSZWdFeHAsICcnKTtcclxuXHRldmFsKCdmdW5jID0gJyArIGZ1bGxOYW1lICsgJyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0nKTtcclxuXHJcblx0cmV0dXJuIGZ1bmM7XHJcbn07XHJcblxyXG52YXIgX2lzU3RyaWN0T2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xyXG5cdGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiBpbnN0YW5jZW9mIFJlZ0V4cCB8fCBvYmogaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cclxuXHR2YXIgYm9vbCA9IHRydWU7XHJcblx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0Ym9vbCA9IGJvb2wgJiYgb2JqLmhhc093blByb3BlcnR5KGtleSk7XHJcblx0fVxyXG5cdHJldHVybiBib29sO1xyXG59O1xyXG5cclxudmFyIF9jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdGlmICghX2lzU3RyaWN0T2JqZWN0KG9iaikpIHtcclxuXHRcdHJldHVybiBvYmo7XHJcblx0fVxyXG5cclxuXHR2YXIgY29weSA9IG9iai5jb25zdHJ1Y3RvcigpO1xyXG5cdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRjb3B5W2tleV0gPSBfY2xvbmUob2JqW2tleV0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gY29weTtcclxufTtcclxuXHJcbnZhciBfY2xvbmVPYmpJblByb3RvID0gZnVuY3Rpb24ob2JqKSB7XHJcblx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0aWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIpIHtcclxuXHRcdFx0b2JqW2tleV0gPSBfY2xvbmUob2JqW2tleV0pO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbnZhciBfY292ZXJWaXJ0dWFsID0gZnVuY3Rpb24gKGNoaWxkTWV0aG9kLCBwYXJlbnRNZXRob2QsIHN1cGVyTmFtZSkge1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgY3VycmVudFN1cGVyID0gdGhpc1tzdXBlck5hbWVdO1xyXG5cdFx0dGhpc1tzdXBlck5hbWVdID0gcGFyZW50TWV0aG9kO1xyXG5cdFx0dmFyIHIgPSBjaGlsZE1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0dGhpc1tzdXBlck5hbWVdID0gY3VycmVudFN1cGVyO1xyXG5cdFx0cmV0dXJuIHI7XHJcblx0fTtcclxufTtcclxuXHJcbnZhciBfZXh0ZW5kV2l0aFN1cGVyID0gZnVuY3Rpb24gKGNoaWxkQ2xhc3MsIG5ld1Byb3BlcnRpZXMsIHN1cGVyTmFtZSkge1xyXG5cdGlmICghbmV3UHJvcGVydGllcykge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gRXh0ZW5kIGFuZCBzZXR1cCB2aXJ0dWFsIG1ldGhvZHNcclxuXHRmb3IgKHZhciBrZXkgaW4gbmV3UHJvcGVydGllcykge1xyXG5cdFx0aWYgKCFuZXdQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHZhbHVlID0gbmV3UHJvcGVydGllc1trZXldO1xyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBjaGlsZENsYXNzW2tleV0gPT0gJ2Z1bmN0aW9uJyAmJiBjaGlsZENsYXNzW2tleV0gIT09IF9ub29wKSB7XHJcblx0XHRcdGNoaWxkQ2xhc3Nba2V5XSA9IF9jb3ZlclZpcnR1YWwodmFsdWUsIGNoaWxkQ2xhc3Nba2V5XSwgc3VwZXJOYW1lKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNoaWxkQ2xhc3Nba2V5XSA9IF9jbG9uZSh2YWx1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBEZWZhdWx0IHN0YXRlXHJcblx0aWYgKCFjaGlsZENsYXNzW3N1cGVyTmFtZV0pIHtcclxuXHRcdGNoaWxkQ2xhc3Nbc3VwZXJOYW1lXSA9IF9ub29wO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmQgY2xhc3NcclxuICogQHBhcmFtIHtvYmplY3R9IG5hbWVPYmplY3RcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudE5hbWVPYmplY3RcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW3BhcmVudENsYXNzXVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbWl4aW5zXVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvdHlwZVByb3BlcnRpZXNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybnMge2Z1bmN0aW9ufSBOZXcgY2xhc3NcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG5hbWVPYmplY3QsIHBhcmVudE5hbWVPYmplY3QsIHBhcmVudENsYXNzLCBtaXhpbnMsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN0YXRpY1Byb3BlcnRpZXMsIHN1cGVyTmFtZSkge1xyXG5cdHBhcmVudENsYXNzID0gcGFyZW50Q2xhc3MgfHwgX25vb3A7XHJcblx0bWl4aW5zID0gbWl4aW5zIHx8IFtdO1xyXG5cclxuXHQvLyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBuZXcgc3ViY2xhc3MgaXMgZWl0aGVyIGRlZmluZWQgYnkgeW91XHJcblx0Ly8gKHRoZSBcImNvbnN0cnVjdG9yXCIgcHJvcGVydHkgaW4geW91ciBgZXh0ZW5kYCBkZWZpbml0aW9uKSwgb3IgZGVmYXVsdGVkXHJcblx0Ly8gYnkgdXMgdG8gc2ltcGx5IGNhbGwgdGhlIHBhcmVudCdzIGNvbnN0cnVjdG9yLlxyXG5cdHZhciBjb25zdHJ1Y3RvciA9IHByb3RvdHlwZVByb3BlcnRpZXMgJiYgcHJvdG90eXBlUHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/XHJcblx0XHRfY292ZXJWaXJ0dWFsKHByb3RvdHlwZVByb3BlcnRpZXMuY29uc3RydWN0b3IsIHBhcmVudENsYXNzLCBzdXBlck5hbWUpIDpcclxuXHRcdHBhcmVudENsYXNzO1xyXG5cdHZhciBjaGlsZENsYXNzID0gX2NyZWF0ZUZ1bmN0aW9uKG5hbWVPYmplY3QsIGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0aGlzLl9faW5zdGFuY2VOYW1lKSB7XHJcblx0XHRcdF9jbG9uZU9iakluUHJvdG8odGhpcyk7XHJcblx0XHRcdHRoaXMuX19pbnN0YW5jZU5hbWUgID0gbmFtZU9iamVjdC5nbG9iYWxOYW1lICsgaW5zdGFuY2VDb3VudGVyKys7XHJcblx0XHR9XHJcblx0XHRjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBBZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBpZiBzdXBwbGllZC5cclxuXHRmb3IgKHZhciBwcm9wIGluIHBhcmVudENsYXNzKSB7XHJcblx0XHRjaGlsZENsYXNzW3Byb3BdID0gcGFyZW50Q2xhc3NbcHJvcF07XHJcblx0fVxyXG5cdF9leHRlbmRXaXRoU3VwZXIoY2hpbGRDbGFzcywgc3RhdGljUHJvcGVydGllcywgc3VwZXJOYW1lKTtcclxuXHJcblx0Ly8gU2V0IHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gaW5oZXJpdCBmcm9tIGBwYXJlbnRgLCB3aXRob3V0IGNhbGxpbmdcclxuXHQvLyBgcGFyZW50YCdzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxyXG5cdHZhciBTdXJyb2dhdGUgPSBfY3JlYXRlRnVuY3Rpb24ocGFyZW50TmFtZU9iamVjdCwgX25vb3ApO1xyXG5cdFN1cnJvZ2F0ZS5wcm90b3R5cGUgPSBwYXJlbnRDbGFzcy5wcm90b3R5cGU7XHJcblxyXG5cdGNoaWxkQ2xhc3MucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xyXG5cclxuXHQvLyBDb3B5IG9iamVjdHMgZnJvbSBjaGlsZCBwcm90b3R5cGVcclxuXHRmb3IgKHZhciBwcm9wMiBpbiBwYXJlbnRDbGFzcy5wcm90b3R5cGUpIHtcclxuXHRcdGlmIChwYXJlbnRDbGFzcy5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkocHJvcDIpICYmIHByb3AyICE9PSAnY29uc3RydWN0b3InKSB7XHJcblx0XHRcdGNoaWxkQ2xhc3MucHJvdG90eXBlW3Byb3AyXSA9IF9jbG9uZShwYXJlbnRDbGFzcy5wcm90b3R5cGVbcHJvcDJdKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyAoaW5zdGFuY2UgcHJvcGVydGllcykgdG8gdGhlIHN1YmNsYXNzLFxyXG5cdC8vIGlmIHN1cHBsaWVkLlxyXG5cdGlmIChwcm90b3R5cGVQcm9wZXJ0aWVzKSB7XHJcblx0XHRfZXh0ZW5kV2l0aFN1cGVyKGNoaWxkQ2xhc3MucHJvdG90eXBlLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdXBlck5hbWUpO1xyXG5cdH1cclxuXHJcblx0Ly8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIGZyb20gbWl4aW5zXHJcblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRmb3IgKHZhciBtaXhpblByb3AgaW4gbWl4aW5zW2ldLnByb3RvdHlwZSkge1xyXG5cdFx0XHQvLyBTa2lwIHByaXZhdGVcclxuXHRcdFx0aWYgKG1peGluUHJvcC5zdWJzdHIoMCwgMikgPT09ICdfXycpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGV4aXN0cyBwcm9wZXJ0eSBvciBtZXRob2QuIE1peGluIGNhbiBvbmx5IGFkZCBwcm9wZXJ0aWVzLCBidXQgbm8gcmVwbGFjZSBpdFxyXG5cdFx0XHRpZiAodHlwZW9mIGNoaWxkQ2xhc3MucHJvdG90eXBlW21peGluUHJvcF0gPT09ICdmdW5jdGlvbicgfHwgY2hpbGRDbGFzcy5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkobWl4aW5Qcm9wKSkge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJ5IHRvIHJlcGxhY2UgcHJvdG90eXBlIHByb3BlcnR5IGAnICsgbWl4aW5Qcm9wICsgJ2AgaW4gY2xhc3MgYCcgKyBjaGlsZENsYXNzLl9fY2xhc3NOYW1lICsgJ2AgYnkgbWl4aW4gYCcgKyBtaXhpbnNbaV0uX19jbGFzc05hbWUgKyAnYCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNoaWxkQ2xhc3MucHJvdG90eXBlW21peGluUHJvcF0gPSBtaXhpbnNbaV0ucHJvdG90eXBlW21peGluUHJvcF07XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIEFkZCBzdGF0aWMgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBmcm9tIG1peGluc1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgbWl4aW5Qcm9wIGluIG1peGluc1tpXSkge1xyXG5cdFx0XHQvLyBTa2lwIHByaXZhdGVcclxuXHRcdFx0aWYgKG1peGluUHJvcC5zdWJzdHIoMCwgMikgPT09ICdfXycpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGV4aXN0cyBwcm9wZXJ0eSBvciBtZXRob2QuIE1peGluIGNhbiBvbmx5IGFkZCBwcm9wZXJ0aWVzLCBidXQgbm8gcmVwbGFjZSBpdFxyXG5cdFx0XHRpZiAodHlwZW9mIGNoaWxkQ2xhc3NbbWl4aW5Qcm9wXSA9PT0gJ2Z1bmN0aW9uJyB8fCBjaGlsZENsYXNzLmhhc093blByb3BlcnR5KG1peGluUHJvcCkpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyeSB0byByZXBsYWNlIHN0YXRpYyBwcm9wZXJ0eSBgJyArIG1peGluUHJvcCArICdgIGluIGNsYXNzIGAnICsgY2hpbGRDbGFzcy5fX2NsYXNzTmFtZSArICdgIGJ5IG1peGluIGAnICsgbWl4aW5zW2ldLl9fY2xhc3NOYW1lICsgJ2AnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjaGlsZENsYXNzW21peGluUHJvcF0gPSBtaXhpbnNbaV1bbWl4aW5Qcm9wXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBjaGlsZENsYXNzO1xyXG59O1xyXG5cbn0se31dLDI2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciBGT1JNQVRfSk9JTlRTX1YwMiA9ICduZWF0bmVzc192MDInO1xyXG52YXIgRk9STUFUX0pPSU5UU19WMTAgPSAnbmVhdG5lc3NfdjEwJztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHQvKipcclxuXHQgKiBEZXRlY3QgZm9ybWF0IGFuZCByZXR1cm4gY2xhc3MgcGFyYW1zXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbE5hbWVcclxuXHQgKiBAcGFyYW0geyhmdW5jdGlvbnxvYmplY3R8bnVsbCl9IG9wdGlvbnNPckV4dGVuZFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG9Qcm9wc11cclxuXHQgKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BzXVxyXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9XHJcblx0ICovXHJcblx0cGFyc2VGb3JtYXQ6IGZ1bmN0aW9uIChnbG9iYWxOYW1lLCBvcHRpb25zT3JFeHRlbmQsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XHJcblx0XHR2YXIgbmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShnbG9iYWxOYW1lKTtcclxuXHRcdHZhciBwYXJlbnROYW1lT2JqZWN0ID0gbnVsbDtcclxuXHRcdHZhciBwYXJlbnRDbGFzcyA9IG51bGw7XHJcblx0XHR2YXIgcHJvdG90eXBlUHJvcGVydGllcyA9IG51bGw7XHJcblx0XHR2YXIgc3RhdGljUHJvcGVydGllcyA9IG51bGw7XHJcblx0XHR2YXIgZm9ybWF0ID0gbnVsbDtcclxuXHRcdHZhciBtaXhpbnMgPSBbXTtcclxuXHJcblx0XHQvLyBOZWF0bmVzcyB2MC4yIChvbGQpIGZvcm1hdFxyXG5cdFx0aWYgKG9wdGlvbnNPckV4dGVuZCA9PT0gbnVsbCB8fCB0eXBlb2Ygb3B0aW9uc09yRXh0ZW5kID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHBhcmVudENsYXNzID0gb3B0aW9uc09yRXh0ZW5kO1xyXG5cdFx0XHRwcm90b3R5cGVQcm9wZXJ0aWVzID0gcHJvdG9Qcm9wcztcclxuXHRcdFx0c3RhdGljUHJvcGVydGllcyA9IHN0YXRpY1Byb3BzO1xyXG5cdFx0XHRmb3JtYXQgPSBGT1JNQVRfSk9JTlRTX1YwMjtcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDbGFzcyAmJiB0eXBlb2YgcGFyZW50Q2xhc3MuZGVidWdDbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50TmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShwYXJlbnRDbGFzcy5kZWJ1Z0NsYXNzTmFtZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIE5lYXRuZXNzIHYxLjAgZm9ybWF0XHJcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zT3JFeHRlbmQgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdGlmIChvcHRpb25zT3JFeHRlbmQuaGFzT3duUHJvcGVydHkoJ19fZXh0ZW5kcycpKSB7XHJcblx0XHRcdFx0cGFyZW50Q2xhc3MgPSBvcHRpb25zT3JFeHRlbmQuX19leHRlbmRzO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19leHRlbmRzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX3N0YXRpYycpKSB7XHJcblx0XHRcdFx0c3RhdGljUHJvcGVydGllcyA9IG9wdGlvbnNPckV4dGVuZC5fX3N0YXRpYztcclxuXHRcdFx0XHRkZWxldGUgb3B0aW9uc09yRXh0ZW5kLl9fc3RhdGljO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX21peGlucycpKSB7XHJcblx0XHRcdFx0bWl4aW5zID0gbWl4aW5zLmNvbmNhdChvcHRpb25zT3JFeHRlbmQuX19taXhpbnMpO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19taXhpbnM7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnNPckV4dGVuZC5oYXNPd25Qcm9wZXJ0eSgnX19taXhpbicpKSB7XHJcblx0XHRcdFx0bWl4aW5zID0gbWl4aW5zLmNvbmNhdChvcHRpb25zT3JFeHRlbmQuX19taXhpbik7XHJcblx0XHRcdFx0ZGVsZXRlIG9wdGlvbnNPckV4dGVuZC5fX21peGluO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3JtYXQgPSBGT1JNQVRfSk9JTlRTX1YxMDtcclxuXHRcdFx0cHJvdG90eXBlUHJvcGVydGllcyA9IG9wdGlvbnNPckV4dGVuZDtcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDbGFzcyAmJiB0eXBlb2YgcGFyZW50Q2xhc3MuX19jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50TmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShwYXJlbnRDbGFzcy5fX2NsYXNzTmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gW1xyXG5cdFx0XHRuYW1lT2JqZWN0LFxyXG5cdFx0XHRwYXJlbnROYW1lT2JqZWN0LFxyXG5cdFx0XHRwYXJlbnRDbGFzcyxcclxuXHRcdFx0cHJvdG90eXBlUHJvcGVydGllcyxcclxuXHRcdFx0c3RhdGljUHJvcGVydGllcyxcclxuXHRcdFx0Zm9ybWF0LFxyXG5cdFx0XHRtaXhpbnMsXHJcblx0XHRcdGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnX3N1cGVyJyA6ICdfX3N1cGVyJ1xyXG5cdFx0XTtcclxuXHR9LFxyXG5cclxuXHRhcHBseUNsYXNzQ29uZmlnOiBmdW5jdGlvbihuZXdDbGFzcywgZm9ybWF0LCBuYW1lT2JqZWN0LCBwYXJlbnROYW1lT2JqZWN0KSB7XHJcblx0XHQvLyBTZXQgX19jbGFzc05hbWUgZm9yIGFsbCBmb3JtYXRzXHJcblx0XHRuZXdDbGFzcy5fX2NsYXNzTmFtZSA9IG5ld0NsYXNzLnByb3RvdHlwZS5fX2NsYXNzTmFtZSA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZTtcclxuXHJcblx0XHR2YXIgY2xhc3NOYW1lS2V5ID0gZm9ybWF0ID09PSBGT1JNQVRfSk9JTlRTX1YwMiA/ICdkZWJ1Z0NsYXNzTmFtZScgOiAnX19jbGFzc05hbWUnO1xyXG5cdFx0dmFyIHBhcmVudENsYXNzTmFtZUtleSA9IGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnJyA6ICdfX3BhcmVudENsYXNzTmFtZSc7XHJcblx0XHR2YXIgc3RhdGljTmFtZUtleSA9IGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnX3N0YXRpYycgOiAnX19zdGF0aWMnO1xyXG5cclxuXHRcdG5ld0NsYXNzW2NsYXNzTmFtZUtleV0gPSBuZXdDbGFzcy5wcm90b3R5cGVbY2xhc3NOYW1lS2V5XSA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZTtcclxuXHRcdGlmIChwYXJlbnRDbGFzc05hbWVLZXkpIHtcclxuXHRcdFx0bmV3Q2xhc3NbcGFyZW50Q2xhc3NOYW1lS2V5XSA9IG5ld0NsYXNzLnByb3RvdHlwZVtwYXJlbnRDbGFzc05hbWVLZXldID0gcGFyZW50TmFtZU9iamVjdCA/IChwYXJlbnROYW1lT2JqZWN0Lmdsb2JhbE5hbWUgfHwgbnVsbCkgOiBudWxsO1xyXG5cdFx0fVxyXG5cdFx0bmV3Q2xhc3Nbc3RhdGljTmFtZUtleV0gPSBuZXdDbGFzcy5wcm90b3R5cGVbc3RhdGljTmFtZUtleV0gPSBuZXdDbGFzcztcclxuXHJcblx0XHRyZXR1cm4gbmV3Q2xhc3M7XHJcblx0fSxcclxuXHJcblx0cGFyc2VGdWxsTmFtZTogZnVuY3Rpb24oZ2xvYmFsTmFtZSkge1xyXG5cdFx0Ly8gU3BsaXQgbmFtZXNwYWNlXHJcblx0XHR2YXIgcG9zID0gZ2xvYmFsTmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdsb2JhbE5hbWU6IGdsb2JhbE5hbWUsXHJcblx0XHRcdG5hbWU6IHBvcyAhPT0gLTEgPyBnbG9iYWxOYW1lLnN1YnN0cihwb3MgKyAxKSA6IGdsb2JhbE5hbWUsXHJcblx0XHRcdG5hbWVzcGFjZTogcG9zICE9PSAtMSA/IGdsb2JhbE5hbWUuc3Vic3RyKDAsIHBvcykgOiAnJ1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG59O1xyXG5cbn0se31dLDI3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vbGliL2Jhc2UvQ29tcG9uZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL0VsZW1lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvRXhjZXB0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL01hbmFnZXInKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvT2JqZWN0Jyk7XG5yZXF1aXJlKCcuL2xpYi9mb3JtL0Ryb3BBcmVhJyk7XG5yZXF1aXJlKCcuL2xpYi9mb3JtL0Zvcm0nKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vRm9ybUVsZW1lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vSW5wdXRFbGVtZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9oZWxwZXJzL0Jyb3dzZXJIZWxwZXInKTtcbnJlcXVpcmUoJy4vbGliL2hlbHBlcnMvQ2xhc3NIZWxwZXInKTtcbnJlcXVpcmUoJy4vbGliL21hbmFnZXJzL1F1ZXVlTWFuYWdlcicpO1xucmVxdWlyZSgnLi9saWIvbW9kZWxzL0ZpbGUnKTtcbnJlcXVpcmUoJy4vbGliL21vZGVscy9GaWxlUHJvZ3Jlc3MnKTtcbnJlcXVpcmUoJy4vbGliL21vZGVscy9RdWV1ZUNvbGxlY3Rpb24nKTtcbnJlcXVpcmUoJy4vbGliL3VwbG9hZGVycy9CYXNlVXBsb2FkZXInKTtcbnJlcXVpcmUoJy4vbGliL3VwbG9hZGVycy9JZnJhbWVVcGxvYWRlcicpO1xucmVxdWlyZSgnLi9saWIvdXBsb2FkZXJzL1hoclVwbG9hZGVyJyk7XG5cbn0se1wiLi9saWIvRmlsZVVwXCI6MixcIi4vbGliL2Jhc2UvQ29tcG9uZW50XCI6MyxcIi4vbGliL2Jhc2UvRWxlbWVudFwiOjQsXCIuL2xpYi9iYXNlL0V4Y2VwdGlvblwiOjUsXCIuL2xpYi9iYXNlL01hbmFnZXJcIjo2LFwiLi9saWIvYmFzZS9PYmplY3RcIjo3LFwiLi9saWIvZm9ybS9Ecm9wQXJlYVwiOjgsXCIuL2xpYi9mb3JtL0Zvcm1cIjo5LFwiLi9saWIvZm9ybS9Gb3JtRWxlbWVudFwiOjEwLFwiLi9saWIvZm9ybS9JbnB1dEVsZW1lbnRcIjoxMSxcIi4vbGliL2hlbHBlcnMvQnJvd3NlckhlbHBlclwiOjEyLFwiLi9saWIvaGVscGVycy9DbGFzc0hlbHBlclwiOjEzLFwiLi9saWIvbWFuYWdlcnMvUXVldWVNYW5hZ2VyXCI6MTQsXCIuL2xpYi9tb2RlbHMvRmlsZVwiOjE1LFwiLi9saWIvbW9kZWxzL0ZpbGVQcm9ncmVzc1wiOjE2LFwiLi9saWIvbW9kZWxzL1F1ZXVlQ29sbGVjdGlvblwiOjE3LFwiLi9saWIvdXBsb2FkZXJzL0Jhc2VVcGxvYWRlclwiOjE4LFwiLi9saWIvdXBsb2FkZXJzL0lmcmFtZVVwbG9hZGVyXCI6MTksXCIuL2xpYi91cGxvYWRlcnMvWGhyVXBsb2FkZXJcIjoyMH1dfSx7fSxbMV0pO1xuIl0sImZpbGUiOiJmaWxldXAtY29yZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
