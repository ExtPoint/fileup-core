(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./npm');

if (typeof window !== 'undefined') {
    window.FileUp = module.exports;
}
},{"./npm":27}],2:[function(require,module,exports){
/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

var Neatness = require('neatness').newContext();

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

        Neatness: Neatness

    },

    /**
     * @type {string}
     */
    backendUrl: null,

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
                        form: this.form
                    },
                    this.uploaderConfigs.iframe
                )
            );
        }

        var files = [];
        for (var path in nativeFiles) {
            if (nativeFiles.hasOwnProperty(path)) {
                var nativeFile = nativeFiles[path];
                var file = FileUp.helpers.ClassHelper.createObject(
                    FileUp.helpers.ClassHelper.merge(
                        {
                            native: nativeFile,
                            path: path,
                            bytesTotal: nativeFile.fileSize || nativeFile.size || 0
                        },
                        this.fileConfig
                    )
                );

                file.setUploader(uploader || FileUp.helpers.ClassHelper.createObject(
                        FileUp.helpers.ClassHelper.merge(
                            {
                                url: this.backendUrl,
                                file: file
                            },
                            this.uploaderConfigs.xhr
                        )
                    )
                );

                files.push(file);
            }
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

        EVENT_SUBMIT: 'submit'

    },

    /**
     * @type {boolean}
     */
    enable: false,

    /**
     * @type {HTMLElement}
     */
    container: null,

    /**
     * @type {object}
     */
    _files: {},

    _readLevel: 0,

    init: function() {
        this.container = this.container || document.body;
        this.enable = this.enable && FileUp.helpers.BrowserHelper.isFileDropSupport();

        if (this.enable) {
            this.container.ondragover = this._onDragOver.bind(this);
            this.container.ondragend = this._onDragEnd.bind(this);
            this.container.ondrop = this._onDrop.bind(this);
        }
    },

    _onDragOver: function(event) {
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

        return false;
    },

    _onDragEnd: function(event) {

        return false;
    },

    _onDrop: function(event) {
        event.preventDefault();

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            this._readDataTransferItems(event.dataTransfer.items);
        } else {
            this._readDataTransferFiles(event.dataTransfer.files);
        }
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
            files[this._lastInputElement.getFilePath(i)] = this._lastInputElement.getFileNative(i);
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
            return '';
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
    _name: '',

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
        this._setStatus(this.__static.STATUS_PAUSE);
    },

    stop: function() {
        this._uploader.stop();
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
    setName: function(value) {
        this._name = value;
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
            this._setStatus(this.__static.STATUS_PROCESS);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_ERROR, function(status, message) {
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS, [this]);

            this._result = this.__static.RESULT_ERROR;
            this._resultHttpStatus = status;
            this._resultHttpMessage = message;
            this._setStatus(this.__static.STATUS_END);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_END, function() {
            this.setBytesUploaded(this.getBytesTotal());
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS, [this]);

            this._result = this.__static.RESULT_SUCCESS;
            this._setStatus(this.__static.STATUS_END);
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
     * @returns {number|null}
     */
    getResultHttpStatus: function() {
        return this._resultHttpStatus;
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

    _setStatus: function(value) {
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

    __static: /** @lends FileUp.models.FileProgress */{

        SPEED_MIN_MEASUREMENT_COUNT: 2,
        SPEED_MAX_MEASUREMENT_COUNT: 5

    },

    /**
     * @type {FileUp.models.File}
     */
    file: null,

    _history: [],

    _lastTime: null,

    add: function(bytesUploaded) {
        var now = (new Date()).getTime();

        this._history.push({
            bytes: bytesUploaded - this.file.getBytesUploaded(),
            duration: this._lastTime ? now - this._lastTime : null
        });
        this._lastTime = now;
    },

    reset: function() {
        this._history = [];
        this._lastTime = null;
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
        if (this._history.length < this.__static.SPEED_MIN_MEASUREMENT_COUNT) {
            return 0;
        }

        // Get last diff values
        var history = this._history.slice(-1 * this.__static.SPEED_MAX_MEASUREMENT_COUNT);

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
        EVENT_REMOVE: 'remove'

    },

    /**
     * @type {number}
     */
    maxConcurrentUploads: 3,

    /**
     * @type {FileUp.models.File[]}
     */
    _files: [],

    /**
     *
     * @param {FileUp.models.File[]} files
     */
    add: function (files) {
        this._files = this._files.concat(files);
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
        this.trigger(this.__static.EVENT_REMOVE, [files]);
    },

    /**
     * @returns {number}
     */
    getCount: function () {
        return this._files.length;
    },

    /**
     * @returns {number}
     */
    getQueueCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusQueue();
            });
    },

    /**
     * @returns {number}
     */
    getProcessCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusProcess();
            });
    },

    /**
     * @returns {number}
     */
    getEndCount: function () {
        return this._count(
            /** @param {FileUp.models.File} file */
            function (file) {
                return file.isStatusEnd();
            });
    },

    /**
     * Search file for next uploading
     * @returns {FileUp.models.File|null}
     */
    getNextForUpload: function () {
        if (this.getProcessCount() >= this.maxConcurrentUploads) {
            return null;
        }

        for (var i = 0, l = this._files.length; i < l; i++) {
            if (this._files[i].isStatusQueue()) {
                return this._files[i];
            }
        }

        return null;
    },

    _count: function (fn) {
        var iCount = 0;
        for (var i = 0, l = this._files.length; i < l; i++) {
            if (fn(this._files[i])) {
                iCount++;
            }
        }
        return iCount;
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
        }

    },

    /**
     * @type {string}
     */
    url: '',

    start: function() {
    },

    stop: function() {
    },

    isProgressSupport: function() {
        return false;
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
     * @type {FileUp.models.File}
     */
    file: null,

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
        this.form.submit(this.url, this._name);
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

        if (!status) {
            var text = document.body.innerText || document.body.innerHTML;
            if (text.toLowerCase() !== 'ok' && text !== '') {
                var regexp = /[45][0-9]{2}/;
                status = (document.title.match(regexp) || text.match(regexp) || [500])[0];
                errorMessage = document.title + '\n' + document.body.innerText;
            } else {
                status = 201; // Created
            }
        }

        if (status >= 200 && status < 300) {
            this.trigger(this.__static.EVENT_END);
        } else {
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

    /**
     * Create XHR object and subscribe on it events
     * @private
     */
    _initXhr: function () {
        this._xhr = new XMLHttpRequest();
        this._xhr.upload.onprogress = this._onProgress.bind(this);
        this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
        this._xhr.open(this.method, this.url, true);

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

        if (this._bytesStart && this._bytesStart >= bytesTotal) {
            this.trigger(this.__static.EVENT_END);
            return;
        }

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

        if (this._xhr.status >= 200 && this._xhr.status < 300) {
            if (this._bytesEnd < this.file.getBytesTotal()) {
                this.file.setBytesUploaded(this._bytesEnd);
                this.stop();
                this.start();

                this.trigger(this.__static.EVENT_END_PART);
            } else {
                this.trigger(this.__static.EVENT_END);
            }
        } else {
            var errorMessage = this._xhr.responseText || this._xhr.statusText;
            this.trigger(this.__static.EVENT_ERROR, [this._xhr.status, errorMessage])
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJmaWxldXAtY29yZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbnBtJyk7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdpbmRvdy5GaWxlVXAgPSBtb2R1bGUuZXhwb3J0cztcbn1cbn0se1wiLi9ucG1cIjoyN31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBOZWF0bmVzcyA9IHJlcXVpcmUoJ25lYXRuZXNzJykubmV3Q29udGV4dCgpO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAYWxpYXMgbW9kdWxlOmZpbGV1cC1jb3JlXG4gKi9cbnZhciBGaWxlVXA7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcFxuICogQGV4dGVuZHMgTmVhdG5lc3MuT2JqZWN0XG4gKi9cbkZpbGVVcCA9IE5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAnLCAvKiogQGxlbmRzIEZpbGVVcC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IE5lYXRuZXNzLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcCAqL3tcblxuICAgICAgICBOZWF0bmVzczogTmVhdG5lc3NcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGJhY2tlbmRVcmw6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybX1cbiAgICAgKi9cbiAgICBmb3JtOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5mb3JtLkZvcm0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5Ecm9wQXJlYX1cbiAgICAgKi9cbiAgICBkcm9wQXJlYToge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAuZm9ybS5Ecm9wQXJlYSdcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9ufVxuICAgICAqL1xuICAgIHF1ZXVlOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcn1cbiAgICAgKi9cbiAgICBxdWV1ZU1hbmFnZXI6IHtcbiAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcidcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cbiAgICAgKi9cbiAgICBmaWxlQ29uZmlnOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuRmlsZSdcbiAgICB9LFxuXG4gICAgdXBsb2FkZXJDb25maWdzOiB7XG4gICAgICAgIGlmcmFtZToge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlcidcbiAgICAgICAgfSxcbiAgICAgICAgeGhyOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0Rm9ybSgpO1xuICAgICAgICB0aGlzLl9pbml0RHJvcEFyZWEoKTtcbiAgICAgICAgdGhpcy5faW5pdFF1ZXVlKCk7XG4gICAgICAgIHRoaXMuX2luaXRNYW5hZ2VycygpO1xuICAgIH0sXG5cbiAgICBfaW5pdEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5mb3JtID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KHRoaXMuZm9ybSk7XG4gICAgICAgIHRoaXMuZm9ybS5vbihGaWxlVXAuZm9ybS5Gb3JtLkVWRU5UX1NVQk1JVCwgdGhpcy5fb25Gb3JtU3VibWl0LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfaW5pdERyb3BBcmVhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QodGhpcy5kcm9wQXJlYSk7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEub24oRmlsZVVwLmZvcm0uRHJvcEFyZWEuRVZFTlRfU1VCTUlULCB0aGlzLl9vbkZvcm1TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIF9pbml0UXVldWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdCh0aGlzLnF1ZXVlKTtcbiAgICB9LFxuXG4gICAgX2luaXRNYW5hZ2VyczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWFuYWdlcnMgPSBbXG4gICAgICAgICAgICAncXVldWUnXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBtYW5hZ2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbWFuYWdlcnNbaV0gKyAnTWFuYWdlcic7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLnF1ZXVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbmFtZV1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wZW4gYnJvd3NlIGZpbGVzIGRpYWxvZyBvbiBsb2NhbCBtYWNoaW5lXG4gICAgICovXG4gICAgYnJvd3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5icm93c2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5hdGl2ZUZpbGVzXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbkZvcm1TdWJtaXQ6IGZ1bmN0aW9uIChuYXRpdmVGaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSBudWxsO1xuICAgICAgICB2YXIgaXNJRSA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpO1xuICAgICAgICBpZiAoaXNJRSAmJiBpc0lFIDwgMTApIHtcbiAgICAgICAgICAgIHVwbG9hZGVyID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYmFja2VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm06IHRoaXMuZm9ybVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwbG9hZGVyQ29uZmlncy5pZnJhbWVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVzID0gW107XG4gICAgICAgIGZvciAodmFyIHBhdGggaW4gbmF0aXZlRmlsZXMpIHtcbiAgICAgICAgICAgIGlmIChuYXRpdmVGaWxlcy5oYXNPd25Qcm9wZXJ0eShwYXRoKSkge1xuICAgICAgICAgICAgICAgIHZhciBuYXRpdmVGaWxlID0gbmF0aXZlRmlsZXNbcGF0aF07XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZTogbmF0aXZlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzVG90YWw6IG5hdGl2ZUZpbGUuZmlsZVNpemUgfHwgbmF0aXZlRmlsZS5zaXplIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVDb25maWdcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBmaWxlLnNldFVwbG9hZGVyKHVwbG9hZGVyIHx8IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB0aGlzLmJhY2tlbmRVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkZXJDb25maWdzLnhoclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnF1ZXVlLmFkZChmaWxlcyk7XG4gICAgfVxuXG59KTtcblxuLyoqXG4gKiBAbW9kdWxlIEZpbGVVcFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcDtcblxufSx7XCJuZWF0bmVzc1wiOjIxfV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuQ29tcG9uZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfZXZlbnRzOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IG5hbWVzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlclxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAoIShuYW1lcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgW107XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBbbmFtZXNdXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAobmFtZXMpIHtcbiAgICAgICAgICAgIGlmICghKG5hbWVzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9ldmVudHNbbmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqW119IFthcmdzXVxuICAgICAqL1xuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwgW107XG5cbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9ldmVudHNbbmFtZV0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkVsZW1lbnRcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLkVsZW1lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkVsZW1lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBlbGVtZW50OiBudWxsLFxuXG4gICAgaGlkZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50b3AgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0wKSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVsncG9pbnRlci1ldmVudHMnXSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXJcbiAgICAgKi9cbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50ICYmIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvblxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuYmFzZS5FeGNlcHRpb24nLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvbi5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEVycm9yLFxuXG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5fX3N0YXRpYyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5fX2NsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCAnJztcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9PYmplY3QnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuTWFuYWdlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuTWFuYWdlcicsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuTWFuYWdlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIGVuYWJsZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbn1cbiAgICAgKi9cbiAgICBjb2xsZWN0aW9uOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm9uKEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uLkVWRU5UX0FERCwgdGhpcy5fb25BZGQuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ub24oRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfUkVNT1ZFLCB0aGlzLl9vblJlbW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25BZGQ6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgICBfb25SZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vT2JqZWN0XCI6N31dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqIEBleHRlbmRzIE5lYXRuZXNzLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLk9iamVjdCcsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLk5lYXRuZXNzLk9iamVjdCxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLmZvcm0uRHJvcEFyZWFcclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkRyb3BBcmVhJywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Ecm9wQXJlYS5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uRHJvcEFyZWEgKi97XHJcblxyXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVuYWJsZTogZmFsc2UsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5lcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIF9maWxlczoge30sXHJcblxyXG4gICAgX3JlYWRMZXZlbDogMCxcclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgdGhpcy5lbmFibGUgPSB0aGlzLmVuYWJsZSAmJiBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzRmlsZURyb3BTdXBwb3J0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmVuYWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5vbmRyYWdvdmVyID0gdGhpcy5fb25EcmFnT3Zlci5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5vbmRyYWdlbmQgPSB0aGlzLl9vbkRyYWdFbmQuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIub25kcm9wID0gdGhpcy5fb25Ecm9wLmJpbmQodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfb25EcmFnT3ZlcjogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBkdFR5cGVzID0gZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzO1xyXG4gICAgICAgICAgICBpZiAoZHRUeXBlcykge1xyXG4gICAgICAgICAgICAgICAgLy8gRkZcclxuICAgICAgICAgICAgICAgIGlmIChkdFR5cGVzLmNvbnRhaW5zICYmICFkdFR5cGVzLmNvbnRhaW5zKFwiRmlsZXNcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2hyb21lXHJcbiAgICAgICAgICAgICAgICBpZiAoZHRUeXBlcy5pbmRleE9mICYmIGR0VHlwZXMuaW5kZXhPZihcIkZpbGVzXCIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vbkRyYWdFbmQ6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uRHJvcDogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLml0ZW1zICYmIGV2ZW50LmRhdGFUcmFuc2Zlci5pdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlYWREYXRhVHJhbnNmZXJJdGVtcyhldmVudC5kYXRhVHJhbnNmZXIuaXRlbXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlYWREYXRhVHJhbnNmZXJGaWxlcyhldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3JlYWREYXRhVHJhbnNmZXJJdGVtczogZnVuY3Rpb24oaXRlbXMpIHtcclxuICAgICAgICB2YXIgZW50cmllcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IGl0ZW1zW2ldLndlYmtpdEdldEFzRW50cnkoKTtcclxuICAgICAgICAgICAgaWYgKGVudHJ5ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhlbnRyaWVzLCAnJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGlyZWN0b3J5RW50cmllczogZnVuY3Rpb24gKGVudHJpZXMsIHJlbGF0aXZlUGF0aCkge1xyXG4gICAgICAgIHRoaXMuX3JlYWRMZXZlbCsrO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVudHJpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbihlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSAocmVsYXRpdmVQYXRoID8gcmVsYXRpdmVQYXRoICsgJy8nIDogJycpICsgZW50cnkubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVSZWFkZXIoKS5yZWFkRW50cmllcyhmdW5jdGlvbihzdWJFbnRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWREaXJlY3RvcnlFbnRyaWVzKHN1YkVudHJpZXMsIHBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVhZERpcmVjdG9yeUVudHJpZXMoZW50cnksIGVudHJ5Lm5hbWUgKyAnLycpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkTGV2ZWwrKztcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzW3BhdGhdID0gZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhbXSwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpKGVudHJpZXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZWFkTGV2ZWwtLTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlYWRMZXZlbCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9vblJlYWREYXRhVHJhbnNmZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGF0YVRyYW5zZmVyRmlsZXM6IGZ1bmN0aW9uKGZpbGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNraXAgZm9sZGVyc1xyXG4gICAgICAgICAgICBpZiAoIWZpbGUudHlwZSAmJiBmaWxlLnNpemUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9maWxlc1tmaWxlLm5hbWVdID0gZmlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX29uUmVhZERhdGFUcmFuc2ZlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25SZWFkRGF0YVRyYW5zZmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFt0aGlzLl9maWxlc10pO1xyXG4gICAgICAgIHRoaXMuX2ZpbGVzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxufSk7XHJcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLkZvcm1cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm0nLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLkZvcm0ucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtICove1xuXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGFpbmVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgX2lzTXVsdGlwbGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgX2Zvcm1FbGVtZW50OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudH1cbiAgICAgKi9cbiAgICBfbGFzdElucHV0RWxlbWVudDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBfaW5wdXRFbGVtZW50czogW10sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSW5pdCBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGVsZW1lbnRcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuYXBwZW5kVG8odGhpcy5jb250YWluZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgaW5wdXQgZWxlbWVudFxuICAgICAgICB0aGlzLl9yZWZyZXNoSW5wdXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXRNdWx0aXBsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc011bHRpcGxlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRNdWx0aXBsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmVsZW1lbnQubXVsdGlwbGUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKHVybCwgdGFyZ2V0KSB7XG4gICAgICAgIC8vIFNldCBkZXN0aW5hdGlvblxuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5lbGVtZW50LmFjdGlvbiA9IHVybDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSB0YXJnZXQ7XG5cbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5zdWJtaXQoKTtcblxuICAgICAgICAvLyBSZXNldCB2YWx1ZXNcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5hY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbiBicm93c2UgZmlsZXMgZGlhbG9nIG9uIGxvY2FsIG1hY2hpbmVcbiAgICAgKi9cbiAgICBicm93c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoXCJjbGlja1wiLCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5lbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfcmVmcmVzaElucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEZyZWV6ZSBwcmV2aW91cyBlbGVtZW50LCBidXQgZG8gbm90IGRldGFjaFxuICAgICAgICBpZiAodGhpcy5fbGFzdElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5mcmVlemUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50KHtcbiAgICAgICAgICAgIG11bHRpcGxlOiB0aGlzLmdldE11bHRpcGxlKCksXG4gICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5fb25JbnB1dENoYW5nZS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmFwcGVuZFRvKHRoaXMuX2Zvcm1FbGVtZW50LmVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9pbnB1dEVsZW1lbnRzLnB1c2godGhpcy5fbGFzdElucHV0RWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbklucHV0Q2hhbmdlOiBmdW5jdGlvbihvRXZlbnQpIHtcbiAgICAgICAgb0V2ZW50ID0gb0V2ZW50IHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgb0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZ2V0Q291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVzID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fbGFzdElucHV0RWxlbWVudC5nZXRDb3VudCgpOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBmaWxlc1t0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmdldEZpbGVQYXRoKGkpXSA9IHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZ2V0RmlsZU5hdGl2ZShpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFtmaWxlc10pO1xuXG4gICAgICAgIHRoaXMuX3JlZnJlc2hJbnB1dCgpO1xuICAgIH0sXG5cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Zvcm1FbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9pbnB1dEVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5faW5wdXRFbGVtZW50c1tpXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9mZih0aGlzLl9fc3RhdGljLkVWRU5UX1NVQk1JVCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuZm9ybS5Gb3JtRWxlbWVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuRWxlbWVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm1FbGVtZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtRWxlbWVudC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkVsZW1lbnQsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnbWV0aG9kJywgJ1BPU1QnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnZW5jdHlwZScsICdtdWx0aXBhcnQvZm9ybS1kYXRhJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FjY2VwdENoYXJzZXQnLCAnVVRGLTgnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnY2hhcmFjdGVyU2V0JywgJ1VURi04Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NoYXJzZXQnLCAnVVRGLTgnKTtcblxuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLklucHV0RWxlbWVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuRWxlbWVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudCcsIC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuRWxlbWVudCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgbmFtZTogJ2ZpbGUnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgbXVsdGlwbGU6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBudWxsLFxuXG4gICAgX2ZpbGVOYW1lczoge30sXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHRoaXMubmFtZSArICh0aGlzLm11bHRpcGxlID8gJ1tdJyA6ICcnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm11bHRpcGxlID0gdGhpcy5tdWx0aXBsZTtcblxuICAgICAgICAvLyBJRTggZmlsZSBmaWVsZCB0cmFuc3BhcmVuY3kgZml4LlxuICAgICAgICBpZiAoRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc0lFKCkpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHRoaXMuZWxlbWVudC5zdHlsZTtcbiAgICAgICAgICAgIHN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN1YnNjcmliZSBvbiBjaGFuZ2UgaW5wdXQgZmlsZXNcbiAgICAgICAgaWYgKHRoaXMub25DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbmNoYW5nZSA9IHRoaXMub25DaGFuZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAqL1xuICAgIGdldEZpbGVOYXRpdmU6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZmlsZXMgJiYgdGhpcy5lbGVtZW50LmZpbGVzW2luZGV4XSB8fCBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0RmlsZVBhdGg6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmdldEZpbGVOYXRpdmUoaW5kZXgpO1xuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlLndlYmtpdFJlbGF0aXZlUGF0aCA/XG4gICAgICAgICAgICBmaWxlLndlYmtpdFJlbGF0aXZlUGF0aC5yZXBsYWNlKC9eW1xcL1xcXFxdKy8sICcnKSA6XG4gICAgICAgICAgICBmaWxlLmZpbGVOYW1lIHx8IGZpbGUubmFtZSB8fCAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQuZmlsZXMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZmlsZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWUgPyAxIDogMDtcbiAgICB9LFxuXG4gICAgZnJlZXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5vbmNoYW5nZSA9IG51bGw7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm9uY2hhbmdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyJywgLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlciAqL3tcblxuICAgICAgICBfYnJvd3Nlck5hbWU6IG51bGwsXG5cbiAgICAgICAgX2Jyb3dzZXJWZXJzaW9uOiBudWxsLFxuXG4gICAgICAgIF9kZXRlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9icm93c2VyTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCwgdGVtLFxuICAgICAgICAgICAgICAgIE0gPSB1YS5tYXRjaCgvKG9wZXJhfGNocm9tZXxzYWZhcml8ZmlyZWZveHxtc2llfHRyaWRlbnQoPz1cXC8pKVxcLz9cXHMqKFxcZCspL2kpIHx8IFtdO1xuICAgICAgICAgICAgaWYgKC90cmlkZW50L2kudGVzdChNWzFdKSkge1xuICAgICAgICAgICAgICAgIHRlbSA9IC9cXGJydlsgOl0rKFxcZCspL2cuZXhlYyh1YSkgfHwgW107XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9icm93c2VyTmFtZSA9ICd0cmlkZW50JztcbiAgICAgICAgICAgICAgICB0aGlzLl9icm93c2VyVmVyc2lvbiA9IHRlbVsxXSB8fCAxO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChNWzFdID09PSAnQ2hyb21lJykge1xuICAgICAgICAgICAgICAgIHRlbSA9IHVhLm1hdGNoKC9cXGIoT1BSfEVkZ2UpXFwvKFxcZCspLyk7XG4gICAgICAgICAgICAgICAgaWYgKHRlbSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJOYW1lID0gdGVtWzFdLnJlcGxhY2UoJ09QUicsICdPcGVyYScpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gdGVtWzJdIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBNID0gTVsyXSA/IFtNWzFdLCBNWzJdXSA6IFtuYXZpZ2F0b3IuYXBwTmFtZSwgbmF2aWdhdG9yLmFwcFZlcnNpb24sICctPyddO1xuICAgICAgICAgICAgaWYgKCh0ZW0gPSB1YS5tYXRjaCgvdmVyc2lvblxcLyhcXGQrKS9pKSkgIT0gbnVsbCkgTS5zcGxpY2UoMSwgMSwgdGVtWzFdKTtcblxuICAgICAgICAgICAgdGhpcy5fYnJvd3Nlck5hbWUgPSBNWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl9icm93c2VyVmVyc2lvbiA9IE1bMV0gfHwgMTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0lFOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXRlY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9icm93c2VyTmFtZSA9PT0gJ21zaWUnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1dlYmtpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNDaHJvbWUoKSB8fCB0aGlzLmlzU2FmYXJpKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNDaHJvbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnY2hyb21lJyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNTYWZhcmk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnc2FmYXJpJyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNGaXJlZm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXRlY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9icm93c2VyTmFtZSA9PT0gJ2ZpcmVmb3gnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1RyaWRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAndHJpZGVudCcgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRmlsZURyb3BTdXBwb3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnZHJhZ2dhYmxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykgJiYgdHlwZW9mIHdpbmRvdy5GaWxlUmVhZGVyICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgfVxuXG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXInLCAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIgKi97XG5cbiAgICAgICAgY3JlYXRlT2JqZWN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdXcm9uZyBjb25maWd1cmF0aW9uIGZvciBjcmVhdGUgb2JqZWN0LicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25maWcgPSB0aGlzLl9fc3RhdGljLmNsb25lKGNvbmZpZyk7XG4gICAgICAgICAgICB2YXIgY2xhc3NOYW1lID0gY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIGRlbGV0ZSBjb25maWcuY2xhc3NOYW1lO1xuXG4gICAgICAgICAgICAvLyBHZXQgY2xhc3NcbiAgICAgICAgICAgIHZhciBvYmplY3RDbGFzcyA9IEZpbGVVcC5OZWF0bmVzcy5uYW1lc3BhY2UoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Q2xhc3MgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdOb3QgZm91bmQgY2xhc3MgYCcgKyBjbGFzc05hbWUgKyAnYCBmb3IgY3JlYXRlIGluc3RhbmNlLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IG9iamVjdENsYXNzKGNvbmZpZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgKi9cbiAgICAgICAgY29uZmlndXJlOiBmdW5jdGlvbiAob2JqZWN0LCBjb25maWcpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjb25maWcpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIHNldHRlciBuYW1lXG4gICAgICAgICAgICAgICAgdmFyIHNldHRlciA9ICdzZXQnICsga2V5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsga2V5LnNsaWNlKDEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rbc2V0dGVyXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdZb3UgY2FuIG5vdCByZXBsYWNlIGZyb20gY29uZmlnIGZ1bmN0aW9uIGAnICsga2V5ICsgJ2AgaW4gb2JqZWN0IGAnICsgb2JqZWN0LmNsYXNzTmFtZSgpICsgJ2AuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignQ29uZmlnIHBhcmFtIGAnICsga2V5ICsgJ2AgaXMgdW5kZWZpbmVkIGluIG9iamVjdCBgJyArIG9iamVjdC5jbGFzc05hbWUoKSArICdgLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9iamVjdFtrZXldICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc1NpbXBsZU9iamVjdChvYmplY3Rba2V5XSkgJiYgdGhpcy5faXNTaW1wbGVPYmplY3Qob2JqZWN0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHRoaXMuX19zdGF0aWMubWVyZ2Uob2JqZWN0W2tleV0sIGNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY29uZmlnW2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmplY3Rbc2V0dGVyXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3Rbc2V0dGVyXS5jYWxsKG9iamVjdCwgY29uZmlnW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3QuLi59IFtvYmpdXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGRzdCA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBvYmogPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNTaW1wbGVPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHN0W2tleV0gPSB0aGlzLl9fc3RhdGljLm1lcmdlKGRzdFtrZXldLCBvYmpba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAgICAgICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICB2YXIgY2xvbmUgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbG9uZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNTaW1wbGVPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAhKG9iaiBpbnN0YW5jZW9mIEFycmF5KSAmJiBvYmouY29uc3RydWN0b3IgPT09IE9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubWFuYWdlcnMuUXVldWVNYW5hZ2VyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5NYW5hZ2VyXG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcicsIC8qKiBAbGVuZHMgRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk1hbmFnZXIsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fb25TdGF0dXNDaGFuZ2UgPSB0aGlzLl9vblN0YXR1c0NoYW5nZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLl9fc3VwZXIoKTtcbiAgICB9LFxuXG4gICAgX29uQWRkOiBmdW5jdGlvbihmaWxlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgZmlsZXNbaV0ub24oRmlsZVVwLm1vZGVscy5GaWxlLkVWRU5UX1NUQVRVUywgdGhpcy5fb25TdGF0dXNDaGFuZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcXVldWVOZXh0KCk7XG4gICAgfSxcblxuICAgIF9vblJlbW92ZTogZnVuY3Rpb24oZmlsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGZpbGVzW2ldLm9mZihGaWxlVXAubW9kZWxzLkZpbGUuRVZFTlRfU1RBVFVTLCB0aGlzLl9vblN0YXR1c0NoYW5nZSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbGVVcC5tb2RlbHMuRmlsZX0gZmlsZVxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfb25TdGF0dXNDaGFuZ2U6IGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgaWYgKGZpbGUuaXNTdGF0dXNFbmQoKSkge1xuICAgICAgICAgICAgdGhpcy5fcXVldWVOZXh0KCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX3F1ZXVlTmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmaWxlID0gdGhpcy5jb2xsZWN0aW9uLmdldE5leHRGb3JVcGxvYWQoKTtcbiAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgIGZpbGUuc3RhcnQoKTtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXVlTmV4dCgpO1xuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubW9kZWxzLkZpbGVcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tb2RlbHMuRmlsZScsIC8qKiBAbGVuZHMgRmlsZVVwLm1vZGVscy5GaWxlLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuQ29tcG9uZW50LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLm1vZGVscy5GaWxlICove1xuXG4gICAgICAgIFNUQVRVU19RVUVVRTogJ3F1ZXVlJyxcbiAgICAgICAgU1RBVFVTX1BST0NFU1M6ICdwcm9jZXNzJyxcbiAgICAgICAgU1RBVFVTX1BBVVNFOiAncGF1c2UnLFxuICAgICAgICBTVEFUVVNfRU5EOiAnZW5kJyxcblxuICAgICAgICBSRVNVTFRfU1VDQ0VTUzogJ3N1Y2Nlc3MnLFxuICAgICAgICBSRVNVTFRfRVJST1I6ICdlcnJvcicsXG5cbiAgICAgICAgRVZFTlRfU1RBVFVTOiAnc3RhdHVzJyxcbiAgICAgICAgRVZFTlRfUFJPR1JFU1M6ICdwcm9ncmVzcydcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZX1cbiAgICAgKi9cbiAgICBfbmF0aXZlOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzfVxuICAgICAqL1xuICAgIHByb2dyZXNzOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJ9XG4gICAgICovXG4gICAgX3VwbG9hZGVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBfcGF0aDogJycsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIF9uYW1lOiAnJyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgX2J5dGVzVXBsb2FkZWQ6IDAsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIF9ieXRlc1VwbG9hZEVuZDogMCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgX2J5dGVzVG90YWw6IDAsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIF9zdGF0dXM6ICdxdWV1ZScsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfG51bGx9XG4gICAgICovXG4gICAgX3Jlc3VsdDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ8bnVsbH1cbiAgICAgKi9cbiAgICBfcmVzdWx0SHR0cFN0YXR1czogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgKi9cbiAgICBfcmVzdWx0SHR0cE1lc3NhZ2U6IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZTogdGhpc1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9ncmVzc1xuICAgICAgICAgICAgKVxuICAgICAgICApO1xuICAgIH0sXG5cbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLnN0YXJ0KCk7XG4gICAgfSxcblxuICAgIHBhdXNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUEFVU0UpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfUEFVU0UpO1xuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RvcCgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZX0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXROYXRpdmU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX25hdGl2ZSA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGaWxlfVxuICAgICAqL1xuICAgIGdldE5hdGl2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9uYXRpdmU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gICAgICovXG4gICAgc2V0UGF0aDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5fcGF0aCA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0UGF0aDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wYXRoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldE5hbWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldE5hbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcGF0aCA9IHRoaXMuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgbWF0Y2hlcyA9IC9bXlxcL1xcXFxdKyQvLmV4ZWMocGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZXMgPyBtYXRjaGVzWzBdLnJlcGxhY2UoL14oW14/XSspLiokLywgJyQxJykgOiBwYXRoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJ9IHZhbHVlXG4gICAgICovXG4gICAgc2V0VXBsb2FkZXI6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl91cGxvYWRlcikge1xuICAgICAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIgPSB2YWx1ZTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9TVEFSVCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnByb2dyZXNzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9QUk9HUkVTUywgW3RoaXNdKTtcblxuICAgICAgICAgICAgdGhpcy5fcmVzdWx0SHR0cFN0YXR1cyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfUFJPQ0VTUyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfRVJST1IsIGZ1bmN0aW9uKHN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX19zdGF0aWMuUkVTVUxUX0VSUk9SO1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0SHR0cFN0YXR1cyA9IHN0YXR1cztcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIHRoaXMuX3NldFN0YXR1cyh0aGlzLl9fc3RhdGljLlNUQVRVU19FTkQpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLm9uKEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLkVWRU5UX0VORCwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNldEJ5dGVzVXBsb2FkZWQodGhpcy5nZXRCeXRlc1RvdGFsKCkpO1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX19zdGF0aWMuUkVTVUxUX1NVQ0NFU1M7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfRU5EKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9QUk9HUkVTUywgZnVuY3Rpb24oYnl0ZXNVcGxvYWRlZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5hZGQoYnl0ZXNVcGxvYWRlZCk7XG4gICAgICAgICAgICB0aGlzLnNldEJ5dGVzVXBsb2FkZWQoYnl0ZXNVcGxvYWRlZCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfVxuICAgICAqL1xuICAgIGdldFVwbG9hZGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3VwbG9hZGVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldEJ5dGVzVXBsb2FkZWQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9ieXRlc1VwbG9hZGVkID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYnl0ZXNVcGxvYWRlZCA9IHZhbHVlO1xuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9QUk9HUkVTUywgW3RoaXNdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldEJ5dGVzVXBsb2FkZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYnl0ZXNVcGxvYWRlZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1VwbG9hZEVuZDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2J5dGVzVXBsb2FkRW5kID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fYnl0ZXNVcGxvYWRFbmQgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1VwbG9hZEVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1VwbG9hZEVuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1RvdGFsOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNUb3RhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVG90YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1RvdGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J5dGVzVG90YWw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRSZXN1bHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0O1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzUmVzdWx0U3VjY2VzczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHQgPT09IHRoaXMuX19zdGF0aWMuUkVTVUxUX1NVQ0NFU1M7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNSZXN1bHRFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHQgPT09IHRoaXMuX19zdGF0aWMuUkVTVUxUX0VSUk9SO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ8bnVsbH1cbiAgICAgKi9cbiAgICBnZXRSZXN1bHRIdHRwU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ3xudWxsfVxuICAgICAqL1xuICAgIGdldFJlc3VsdEh0dHBNZXNzYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdEh0dHBNZXNzYWdlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzU3RhdHVzUXVldWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19RVUVVRTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1Byb2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QUk9DRVNTO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzU3RhdHVzUGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c0VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXMgPT09IHRoaXMuX19zdGF0aWMuU1RBVFVTX0VORDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zdGF0dXM7XG4gICAgfSxcblxuICAgIF9zZXRTdGF0dXM6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9zdGF0dXMgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdGF0dXMgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1RBVFVTLCBbdGhpcywgdGhpcy5fc3RhdHVzXSk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzc1xuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1vZGVscy5GaWxlUHJvZ3Jlc3MnLCAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLm1vZGVscy5GaWxlUHJvZ3Jlc3MgKi97XG5cbiAgICAgICAgU1BFRURfTUlOX01FQVNVUkVNRU5UX0NPVU5UOiAyLFxuICAgICAgICBTUEVFRF9NQVhfTUVBU1VSRU1FTlRfQ09VTlQ6IDVcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1vZGVscy5GaWxlfVxuICAgICAqL1xuICAgIGZpbGU6IG51bGwsXG5cbiAgICBfaGlzdG9yeTogW10sXG5cbiAgICBfbGFzdFRpbWU6IG51bGwsXG5cbiAgICBhZGQ6IGZ1bmN0aW9uKGJ5dGVzVXBsb2FkZWQpIHtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgdGhpcy5faGlzdG9yeS5wdXNoKHtcbiAgICAgICAgICAgIGJ5dGVzOiBieXRlc1VwbG9hZGVkIC0gdGhpcy5maWxlLmdldEJ5dGVzVXBsb2FkZWQoKSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLl9sYXN0VGltZSA/IG5vdyAtIHRoaXMuX2xhc3RUaW1lIDogbnVsbFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fbGFzdFRpbWUgPSBub3c7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5faGlzdG9yeSA9IFtdO1xuICAgICAgICB0aGlzLl9sYXN0VGltZSA9IG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IFNlY29uZHNcbiAgICAgKi9cbiAgICBnZXRUaW1lTGVmdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBieXRlc1RvdGFsID0gdGhpcy5maWxlLmdldEJ5dGVzVG90YWwoKTtcbiAgICAgICAgaWYgKGJ5dGVzVG90YWwgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNwZWVkID0gdGhpcy5nZXRTcGVlZCgpO1xuICAgICAgICBpZiAoc3BlZWQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJ5dGVzVXBsb2FkZWQgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwoKGJ5dGVzVG90YWwgLSBieXRlc1VwbG9hZGVkKSAvIHNwZWVkKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn0gQnl0ZXMgaW4gc2Vjb25kXG4gICAgICovXG4gICAgZ2V0U3BlZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5faGlzdG9yeS5sZW5ndGggPCB0aGlzLl9fc3RhdGljLlNQRUVEX01JTl9NRUFTVVJFTUVOVF9DT1VOVCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgbGFzdCBkaWZmIHZhbHVlc1xuICAgICAgICB2YXIgaGlzdG9yeSA9IHRoaXMuX2hpc3Rvcnkuc2xpY2UoLTEgKiB0aGlzLl9fc3RhdGljLlNQRUVEX01BWF9NRUFTVVJFTUVOVF9DT1VOVCk7XG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGF2ZXJhZ2UgdXBsb2FkIHNwZWVkXG4gICAgICAgIHZhciBzdW1tYXJ5Qnl0ZXMgPSAwO1xuICAgICAgICB2YXIgc3VtbWFyeUR1cmF0aW9uID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBoaXN0b3J5Lmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgc3VtbWFyeUJ5dGVzICs9IGhpc3RvcnlbaV0uYnl0ZXM7XG4gICAgICAgICAgICBzdW1tYXJ5RHVyYXRpb24gKz0gaGlzdG9yeVtpXS5kdXJhdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdW1tYXJ5Qnl0ZXMgPT09IDAgfHwgc3VtbWFyeUR1cmF0aW9uID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHN1bW1hcnlCeXRlcyAvIChzdW1tYXJ5RHVyYXRpb24gLyAxMDAwKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0UGVyY2VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBieXRlc1RvdGFsID0gdGhpcy5maWxlLmdldEJ5dGVzVG90YWwoKTtcbiAgICAgICAgaWYgKGJ5dGVzVG90YWwgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJ5dGVzVXBsb2FkZWQgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpO1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChieXRlc1VwbG9hZGVkICogMTAwIC8gYnl0ZXNUb3RhbCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvblxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24nLCAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuQ29tcG9uZW50LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24gKi97XG5cbiAgICAgICAgRVZFTlRfQUREOiAnYWRkJyxcbiAgICAgICAgRVZFTlRfUkVNT1ZFOiAncmVtb3ZlJ1xuXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgbWF4Q29uY3VycmVudFVwbG9hZHM6IDMsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1vZGVscy5GaWxlW119XG4gICAgICovXG4gICAgX2ZpbGVzOiBbXSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGVbXX0gZmlsZXNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICB0aGlzLl9maWxlcyA9IHRoaXMuX2ZpbGVzLmNvbmNhdChmaWxlcyk7XG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0FERCwgW2ZpbGVzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGVbXX0gZmlsZXNcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmlsZXMuaW5kZXhPZihmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9SRU1PVkUsIFtmaWxlc10pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlcy5sZW5ndGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0UXVldWVDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY291bnQoXG4gICAgICAgICAgICAvKiogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGV9IGZpbGUgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUuaXNTdGF0dXNRdWV1ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0UHJvY2Vzc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb3VudChcbiAgICAgICAgICAgIC8qKiBAcGFyYW0ge0ZpbGVVcC5tb2RlbHMuRmlsZX0gZmlsZSAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZS5pc1N0YXR1c1Byb2Nlc3MoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldEVuZENvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb3VudChcbiAgICAgICAgICAgIC8qKiBAcGFyYW0ge0ZpbGVVcC5tb2RlbHMuRmlsZX0gZmlsZSAqL1xuICAgICAgICAgICAgZnVuY3Rpb24gKGZpbGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmlsZS5pc1N0YXR1c0VuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBmaWxlIGZvciBuZXh0IHVwbG9hZGluZ1xuICAgICAqIEByZXR1cm5zIHtGaWxlVXAubW9kZWxzLkZpbGV8bnVsbH1cbiAgICAgKi9cbiAgICBnZXROZXh0Rm9yVXBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmdldFByb2Nlc3NDb3VudCgpID49IHRoaXMubWF4Q29uY3VycmVudFVwbG9hZHMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9maWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9maWxlc1tpXS5pc1N0YXR1c1F1ZXVlKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgX2NvdW50OiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgdmFyIGlDb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZmlsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZm4odGhpcy5fZmlsZXNbaV0pKSB7XG4gICAgICAgICAgICAgICAgaUNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlDb3VudDtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxuLyoqXHJcbiAqIEBjbGFzcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnRcclxuICovXHJcbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXInLCAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcclxuXHJcbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlciAqL3tcclxuXHJcbiAgICAgICAgRVZFTlRfU1RBUlQ6ICdzdGFydCcsXHJcbiAgICAgICAgRVZFTlRfUFJPR1JFU1M6ICdwcm9ncmVzcycsXHJcbiAgICAgICAgRVZFTlRfRVJST1I6ICdlcnJvcicsXHJcbiAgICAgICAgRVZFTlRfRU5EX1BBUlQ6ICdlbmRfcGFydCcsXHJcbiAgICAgICAgRVZFTlRfRU5EOiAnZW5kJyxcclxuXHJcbiAgICAgICAgaXNQcm9ncmVzc1N1cHBvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICB1cmw6ICcnLFxyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG59KTtcclxuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxucmVxdWlyZSgnLi9CYXNlVXBsb2FkZXInKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKi9cclxuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAudXBsb2FkZXJzLklmcmFtZVVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLklmcmFtZVVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLFxyXG5cclxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIF9Db3VudGVyOiAwXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cclxuICAgICAqL1xyXG4gICAgZmlsZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5Gb3JtfVxyXG4gICAgICovXHJcbiAgICBmb3JtOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBjb250YWluZXI6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBuYW1lUHJlZml4OiAnRmlsZVVwSWZyYW1lJyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIF9uYW1lOiAnJyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgX3dyYXBwZXI6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIF9mcmFtZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ8bnVsbH1cclxuICAgICAqL1xyXG4gICAgX2ZyYW1lTG9hZFRpbWVyOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIF9pc0ZyYW1lTG9hZGVkOiBmYWxzZSxcclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBHZW5lcmF0ZSBuYW1lXHJcbiAgICAgICAgdGhpcy5fbmFtZSA9IHRoaXMubmFtZVByZWZpeCArICgrK3RoaXMuX19zdGF0aWMuX0NvdW50ZXIpO1xyXG5cclxuICAgICAgICAvLyBJbml0IGNvbnRhaW5lclxyXG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gdGhpcy5jb250YWluZXIgfHwgZG9jdW1lbnQuYm9keTtcclxuXHJcbiAgICAgICAgLy8gUmVuZGVyIGZyYW1lXHJcbiAgICAgICAgdGhpcy5faW5pdENvbnRhaW5lcigpO1xyXG4gICAgICAgIHRoaXMuX2luaXRGcmFtZSgpO1xyXG4gICAgICAgIFxyXG4gICAgfSxcclxuXHJcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIC8vIFN0YXJ0IHVwbG9hZFxyXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1NUQVJUKTtcclxuICAgICAgICB0aGlzLmZvcm0uc3VibWl0KHRoaXMudXJsLCB0aGlzLl9uYW1lKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fY2xlYXJUaW1lcigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fZnJhbWUpIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUub25sb2FkID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuX3dyYXBwZXIucmVtb3ZlQ2hpbGQodGhpcy5fZnJhbWUpO1xyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fZnJhbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9fc3VwZXIoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2luaXRDb250YWluZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLndpZHRoID0gMDtcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLmhlaWdodCA9IDA7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS50b3AgPSAnLTEwMHB4JztcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLmxlZnQgPSAnLTEwMHB4JztcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcblxyXG4gICAgICAgIHRoaXMuY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuX3dyYXBwZXIpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfaW5pdEZyYW1lOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGlzQ3JlYXRlZCA9IGZhbHNlO1xyXG4gICAgICAgIHZhciBpc0lFID0gRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc0lFKCk7XHJcblxyXG4gICAgICAgIGlmIChpc0lFICYmIGlzSUUgPCAxMCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCc8aWZyYW1lIG5hbWU9XCInICsgdGhpcy5fbmFtZSArICdcIj4nKTtcclxuICAgICAgICAgICAgICAgIGlzQ3JlYXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIC8vIEl0IHNlZW1zIElFOSBpbiBjb21wYXRhYmlsaXR5IG1vZGUuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNDcmVhdGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lLm5hbWUgPSB0aGlzLl9uYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fZnJhbWUuc3JjID0gJ2phdmFzY3JpcHQ6e307JztcclxuICAgICAgICB0aGlzLl93cmFwcGVyLmFwcGVuZENoaWxkKHRoaXMuX2ZyYW1lKTtcclxuXHJcbiAgICAgICAgLy8gU3Vic2NyaWJlIG9uIGlmcmFtZSBsb2FkIGV2ZW50c1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHRoaXMuX29uUmVhZHlTdGF0ZUNoYW5nZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX2ZyYW1lLm9ubG9hZCA9IHRoaXMuX29uTG9hZC5iaW5kKHRoaXMpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25SZWFkeVN0YXRlQ2hhbmdlOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5fZnJhbWUucmVhZHlTdGF0ZSkge1xyXG4gICAgICAgICAgICBjYXNlICdjb21wbGV0ZSc6XHJcbiAgICAgICAgICAgIGNhc2UgJ2ludGVyYWN0aXZlJzpcclxuICAgICAgICAgICAgICAgIHRoaXMuX2NsZWFyVGltZXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lTG9hZFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX0xvYWRIYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX29uUmVhZHlTdGF0ZUNoYW5nZShldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAxMDAwKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX29uTG9hZDogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB0aGlzLl9jbGVhclRpbWVyKCk7XHJcblxyXG4gICAgICAgIC8vIENoZWNrIGFscmVhZHkgbG9hZGVkXHJcbiAgICAgICAgaWYgKHRoaXMuX2lzRnJhbWVMb2FkZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9pc0ZyYW1lTG9hZGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIGRvY3VtZW50ID0gbnVsbDtcclxuICAgICAgICB2YXIgc3RhdHVzID0gbnVsbDtcclxuICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gJyc7XHJcblxyXG4gICAgICAgIC8vIENhdGNoIGlmcmFtZSBsb2FkIGVycm9yIGluIEZpcmVmb3guXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgZG9jdW1lbnQgPSB0aGlzLl9mcmFtZS5jb250ZW50V2luZG93LmRvY3VtZW50O1xyXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzdGF0dXMgPSA0MDM7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGUudG9TdHJpbmcoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc3RhdHVzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuYm9keS5pbm5lclRleHQgfHwgZG9jdW1lbnQuYm9keS5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIGlmICh0ZXh0LnRvTG93ZXJDYXNlKCkgIT09ICdvaycgJiYgdGV4dCAhPT0gJycpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSAvWzQ1XVswLTldezJ9LztcclxuICAgICAgICAgICAgICAgIHN0YXR1cyA9IChkb2N1bWVudC50aXRsZS5tYXRjaChyZWdleHApIHx8IHRleHQubWF0Y2gocmVnZXhwKSB8fCBbNTAwXSlbMF07XHJcbiAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBkb2N1bWVudC50aXRsZSArICdcXG4nICsgZG9jdW1lbnQuYm9keS5pbm5lclRleHQ7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSAyMDE7IC8vIENyZWF0ZWRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VORCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFtzdGF0dXMsIGVycm9yTWVzc2FnZV0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9mcmFtZUxvYWRUaW1lcikge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fZnJhbWVMb2FkVGltZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vQmFzZVVwbG9hZGVyXCI6MTh9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxucmVxdWlyZSgnLi9CYXNlVXBsb2FkZXInKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKi9cclxuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLFxyXG5cclxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuWGhyVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBtZXRob2Q6ICdQVVQnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cclxuICAgICAqL1xyXG4gICAgZmlsZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIG1pblByb2dyZXNzVXBkYXRlSW50ZXJ2YWxNczogNTAwLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyBJSVMgbWF4IGh0dHBSdW50aW1lQG1heFJlcXVlc3RMZW5ndGggdmFsdWUgd2hpY2ggaXMgMjE0NzQ4MjYyNCBLYlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgYnl0ZXNNYXhQYXJ0OiAyMDk3MTUxICogMTAyNCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIF9sYXN0UmVwb3J0VGltZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtYTUxIdHRwUmVxdWVzdH1cclxuICAgICAqL1xyXG4gICAgX3hocjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIF9ieXRlc1N0YXJ0OiAwLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxyXG4gICAgICovXHJcbiAgICBfYnl0ZXNFbmQ6IG51bGwsXHJcblxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl9pbml0WGhyKCk7XHJcbiAgICAgICAgdGhpcy5fc3RhcnRJbnRlcm5hbCgpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5feGhyKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl94aHIudXBsb2FkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl94aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuYWJvcnQoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX19zdXBlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBYSFIgb2JqZWN0IGFuZCBzdWJzY3JpYmUgb24gaXQgZXZlbnRzXHJcbiAgICAgKiBAcHJpdmF0ZVxyXG4gICAgICovXHJcbiAgICBfaW5pdFhocjogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX3hociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgICAgIHRoaXMuX3hoci51cGxvYWQub25wcm9ncmVzcyA9IHRoaXMuX29uUHJvZ3Jlc3MuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLl94aHIub25yZWFkeXN0YXRlY2hhbmdlID0gdGhpcy5fb25SZWFkeVN0YXRlQ2hhbmdlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgdGhpcy5feGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5feGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNXZWJraXQoKSB8fCBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzVHJpZGVudCgpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiSWYtTm9uZS1NYXRjaFwiLCBcIipcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiSWYtTW9kaWZpZWQtU2luY2VcIiwgXCJNb24sIDI2IEp1bCAxOTk3IDA1OjAwOjAwIEdNVFwiKTtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDYWNoZS1Db250cm9sXCIsIFwibm8tY2FjaGVcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiWC1SZXF1ZXN0ZWQtV2l0aFwiLCBcIlhNTEh0dHBSZXF1ZXN0XCIpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3N0YXJ0SW50ZXJuYWw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1NUQVJUKTtcclxuXHJcbiAgICAgICAgLy8gU2V0IGZpbGUgbmFtZVxyXG4gICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7IGZpbGVuYW1lPVwiJyArIGVuY29kZVVSSSh0aGlzLmZpbGUuZ2V0TmFtZSgpKSArICdcIicpO1xyXG5cclxuICAgICAgICB2YXIgaXNGRiA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNGaXJlZm94KCk7XHJcbiAgICAgICAgaWYgKGlzRkYgJiYgaXNGRiA8IDcpIHtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNlbmRBc0JpbmFyeSh0aGlzLmZpbGUuZ2V0TmF0aXZlKCkuZ2V0QXNCaW5hcnkoKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBieXRlc1RvdGFsID0gdGhpcy5maWxlLmdldEJ5dGVzVG90YWwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYnl0ZXNTdGFydCA9IHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCk7XHJcbiAgICAgICAgdGhpcy5fYnl0ZXNFbmQgPSBNYXRoLm1pbih0aGlzLl9ieXRlc1N0YXJ0ICsgdGhpcy5ieXRlc01heFBhcnQsIGJ5dGVzVG90YWwpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYnl0ZXNTdGFydCAmJiB0aGlzLl9ieXRlc1N0YXJ0ID49IGJ5dGVzVG90YWwpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRU5EKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgcGFydGlhbCB1cGxvYWRcclxuICAgICAgICBpZiAodGhpcy5fYnl0ZXNTdGFydCA+IDAgfHwgdGhpcy5fYnl0ZXNFbmQgPCBieXRlc1RvdGFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVJhbmdlJywgJ2J5dGVzICcgKyB0aGlzLl9ieXRlc1N0YXJ0ICsgJy0nICsgKHRoaXMuX2J5dGVzRW5kIC0gMSkgKyAnLycgKyBieXRlc1RvdGFsKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9ieXRlc0VuZCA8IGJ5dGVzVG90YWwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kKHRoaXMuZmlsZS5nZXROYXRpdmUoKS5zbGljZSh0aGlzLl9ieXRlc1N0YXJ0LCB0aGlzLl9ieXRlc0VuZCkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLnNlbmQodGhpcy5maWxlLmdldE5hdGl2ZSgpLnNsaWNlKHRoaXMuX2J5dGVzU3RhcnQpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kKHRoaXMuZmlsZS5nZXROYXRpdmUoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcclxuICAgICAqIEBwcm90ZWN0ZWRcclxuICAgICAqL1xyXG4gICAgX29uUHJvZ3Jlc3M6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGlOb3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xyXG4gICAgICAgIGlmICh0aGlzLl9sYXN0UmVwb3J0VGltZSAmJiBpTm93IC0gdGhpcy5fbGFzdFJlcG9ydFRpbWUgPCB0aGlzLm1pblByb2dyZXNzVXBkYXRlSW50ZXJ2YWxNcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2xhc3RSZXBvcnRUaW1lID0gaU5vdztcclxuXHJcbiAgICAgICAgdmFyIGJ5dGVzVXBsb2FkZWQgPSB0aGlzLl9ieXRlc1N0YXJ0ICsgZXZlbnQubG9hZGVkO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbYnl0ZXNVcGxvYWRlZF0pO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZXZlbnRcclxuICAgICAqIEBwcm90ZWN0ZWRcclxuICAgICAqL1xyXG4gICAgX29uUmVhZHlTdGF0ZUNoYW5nZTogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5feGhyLnJlYWR5U3RhdGUgIT09IDQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3hoci5zdGF0dXMgPj0gMjAwICYmIHRoaXMuX3hoci5zdGF0dXMgPCAzMDApIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2J5dGVzRW5kIDwgdGhpcy5maWxlLmdldEJ5dGVzVG90YWwoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxlLnNldEJ5dGVzVXBsb2FkZWQodGhpcy5fYnl0ZXNFbmQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRU5EX1BBUlQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRU5EKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBlcnJvck1lc3NhZ2UgPSB0aGlzLl94aHIucmVzcG9uc2VUZXh0IHx8IHRoaXMuX3hoci5zdGF0dXNUZXh0O1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FUlJPUiwgW3RoaXMuX3hoci5zdGF0dXMsIGVycm9yTWVzc2FnZV0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSk7XHJcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9CYXNlVXBsb2FkZXJcIjoxOH1dLDIxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9zcmMvTmVhdG5lc3MnKTtcbn0se1wiLi9zcmMvTmVhdG5lc3NcIjoyNH1dLDIyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihOZWF0bmVzcykge1xuXG5cdHJldHVybiBOZWF0bmVzcy5jcmVhdGVDbGFzcygnTmVhdG5lc3MuRXhjZXB0aW9uJywgLyoqIEBsZW5kcyBOZWF0bmVzcy5FeGNlcHRpb24ucHJvdG90eXBlICove1xuXG5cdFx0X19leHRlbmRzOiBFcnJvcixcblxuXHRcdC8qKlxuXHRcdCAqIFRleHQgbWVzc2FnZVxuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0bWVzc2FnZTogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIEV4dHJhIGluZm9ybWF0aW9uIGR1bXBzXG5cdFx0ICogQHR5cGUge0FycmF5fVxuXHRcdCAqL1xuXHRcdGV4dHJhOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogQmFzZSBjbGFzcyBmb3IgaW1wbGVtZW50IGV4Y2VwdGlvbi4gVGhpcyBjbGFzcyBleHRlbmQgZnJvbSBuYXRpdmUgRXJyb3IgYW5kIHN1cHBvcnRcblx0XHQgKiBzdGFjayB0cmFjZSBhbmQgbWVzc2FnZS5cblx0XHQgKiBAY29uc3RydWN0c1xuXHRcdCAqIEBleHRlbmRzIEVycm9yXG5cdFx0ICovXG5cdFx0Y29uc3RydWN0b3I6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG5cdFx0XHRpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0XHRcdFx0RXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3RvciB8fCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5uYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xuXHRcdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCAnJztcblxuXHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdHRoaXMuZXh0cmEgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9fc3VwZXIoKTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICpcblx0XHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHRvU3RyaW5nOiBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5tZXNzYWdlO1xuXHRcdH1cblxuXHR9KTtcblxufTtcbn0se31dLDIzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihOZWF0bmVzcykge1xuXG5cdC8qKlxuXHQgKiBCYXNlIGNsYXNzLiBFeHRlbmQgYWxsIHlvdSBiYXNlIGNsYXNzZXMgZnJvbSB0aGlzIGNsYXNzIGZvciB0cnVlIG5hdmlnYXRpb24gaW4gSURFXG5cdCAqIGFuZCBzdXBwb3J0IG1ldGhvZHMgc3VjaCBhcyB7QGxpbmsgTmVhdG5lc3MuT2JqZWN0I2NsYXNzTmFtZX1cblx0ICogQGNsYXNzIE5lYXRuZXNzLk9iamVjdFxuXHQgKi9cblx0cmV0dXJuIE5lYXRuZXNzLmNyZWF0ZUNsYXNzKCdOZWF0bmVzcy5PYmplY3QnLCB7XG5cblx0XHQvKipcblx0XHQgKiBMaW5rIHRvIHVzZWQgY2xhc3MuIElmIHlvdSBhY2Nlc3MgdG8gdGhpcyBwcm9wZXJ0eSBpbiBleHRlbmRzIGNsYXNzZXMsIHRoZW4geW91IGdpdmUgdG9wLWxldmVsIGNsYXNzLlxuXHRcdCAqIEB0eXBlIHsqfVxuXHRcdCAqL1xuXHRcdF9fc3RhdGljOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogRnVsbCBjdXJyZW50IGNsYXNzIG5hbWUgd2l0aCBuYW1lc3BhY2Vcblx0XHQgKiBAZXhhbXBsZSBSZXR1cm5zIHZhbHVlIGV4YW1wbGVcblx0XHQgKiAgYXBwLk15Q2xhc3Ncblx0XHQgKiBAdHlwZSB7c3RyaW5nfVxuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKi9cblx0XHRfX2NsYXNzTmFtZTogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIFVuaXF1ZSBpbnN0YW5jZSBuYW1lXG5cdFx0ICogQGV4YW1wbGUgUmV0dXJucyB2YWx1ZSBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUNsYXNzNTBcblx0XHQgKiBAdHlwZSB7c3RyaW5nfVxuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKi9cblx0XHRfX2luc3RhbmNlTmFtZTogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIEZ1bGwgcGFyZW50IChleHRlbmRzKSBjbGFzcyBuYW1lIHdpdGggbmFtZXNwYWNlXG5cdFx0ICogQGV4YW1wbGUgUmV0dXJucyB2YWx1ZSBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUJhc2VDbGFzc1xuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9fcGFyZW50Q2xhc3NOYW1lOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyBmdWxsIGNsYXNzIG5hbWUgd2l0aCBuYW1lc3BhY2Vcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzc1xuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0Y2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9fY2xhc3NOYW1lO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIHVuaXF1ZSBpbnN0YW5jZSBuYW1lXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAgYXBwLk15Q2xhc3Ncblx0XHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdGNsYXNzSW5zdGFuY2VOYW1lOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9faW5zdGFuY2VOYW1lO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIGZ1bGwgcGFyZW50IGNsYXNzIG5hbWUgd2l0aCBuYW1lc3BhY2Vcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlCYXNlQ2xhc3Ncblx0XHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdHBhcmVudENsYXNzTmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fX3BhcmVudENsYXNzTmFtZTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogQ2FsbCBwYXJlbnQgY2xhc3MgbWV0aG9kcyB0aHJvdWdoIHRoaXMgbWV0aG9kLiBUaGlzIG1ldGhvZCBzdXBwb3J0IG9ubHkgc3luY2hyb25vdXMgbmVzdGVkIGNhbGxzLlxuXHRcdCAqIEBwYXJhbSB7Li4uKn1cblx0XHQgKiBAcHJvdGVjdGVkXG5cdFx0ICovXG5cdFx0X19zdXBlcjogZnVuY3Rpb24gKCkge1xuXHRcdH1cblxuXHR9KTtcblxufTtcblxufSx7fV0sMjQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXHJcbnZhciBleHRlbmRDbGFzcyA9IHJlcXVpcmUoJy4vZXh0ZW5kQ2xhc3MnKTtcclxudmFyIGZvcm1hdHMgPSByZXF1aXJlKCcuL2Zvcm1hdHMnKTtcclxuXHJcbi8vIEZvciAubm9Db25mbGljdCgpIGltcGxlbWVudGF0aW9uXHJcbnZhciBoYXNQcmV2aW91c05lYXRuZXNzID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93Lmhhc093blByb3BlcnR5KCdOZWF0bmVzcycpO1xyXG52YXIgcHJldmlvdXNOZWF0bmVzcyA9IGhhc1ByZXZpb3VzTmVhdG5lc3MgPyB3aW5kb3cuTmVhdG5lc3MgOiBudWxsO1xyXG5cclxuLyoqXHJcbiAqIE5lYXRuZXNzIGNsYXNzXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzc1xyXG4gKi9cclxudmFyIE5lYXRuZXNzID0gZnVuY3Rpb24oKSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqXHJcblx0ICogQHR5cGUge29iamVjdH1cclxuXHQgKi9cclxuXHR0aGlzLl9jb250ZXh0ID0ge307XHJcblxyXG5cdHRoaXMuX2NvbnRleHRLZXlzID0ge307XHJcbn07XHJcblxyXG4vKipcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5uZXdDb250ZXh0XHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlbW92ZUdsb2JhbF0gU2V0IHRydWUgZm9yIHJlbW92ZSBOZWF0bmVzcyBvYmplY3QgZnJvbSB3aW5kb3cgKGJyb3dzZXIgZ2xvYmFsIG9iamVjdClcclxuICogQHJldHVybnMge05lYXRuZXNzfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLm5ld0NvbnRleHQgPSBmdW5jdGlvbihyZW1vdmVHbG9iYWwpIHtcclxuXHRyZW1vdmVHbG9iYWwgPSByZW1vdmVHbG9iYWwgfHwgZmFsc2U7XHJcblxyXG5cdGlmIChyZW1vdmVHbG9iYWwpIHtcclxuXHRcdHRoaXMubm9Db25mbGljdCgpO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIG5ldyBOZWF0bmVzcygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUubW92ZUNvbnRleHRcclxuICogQHBhcmFtIHtib29sZWFufSBuZXdDb250ZXh0IE5ldyBjb250ZXh0IG9iamVjdFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZW1vdmVGcm9tT2xkXSBTZXQgdHJ1ZSBmb3IgcmVtb3ZlIGtleXMgZnJvbSBvbGQgY29udGV4dFxyXG4gKiBAcmV0dXJucyB7TmVhdG5lc3N9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubW92ZUNvbnRleHQgPSBmdW5jdGlvbihuZXdDb250ZXh0LCByZW1vdmVGcm9tT2xkKSB7XHJcblx0cmVtb3ZlRnJvbU9sZCA9IHJlbW92ZUZyb21PbGQgfHwgZmFsc2U7XHJcblxyXG5cdGZvciAodmFyIGtleSBpbiB0aGlzLl9jb250ZXh0S2V5cykge1xyXG5cdFx0aWYgKHRoaXMuX2NvbnRleHRLZXlzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0bmV3Q29udGV4dFtrZXldID0gdGhpcy5fY29udGV4dFtrZXldO1xyXG5cdFx0XHRpZiAocmVtb3ZlRnJvbU9sZCkge1xyXG5cdFx0XHRcdGRlbGV0ZSB0aGlzLl9jb250ZXh0W2tleV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblx0dGhpcy5fY29udGV4dCA9IG5ld0NvbnRleHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5ub0NvbmZsaWN0XHJcbiAqIEByZXR1cm5zIHtOZWF0bmVzc31cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XHJcblx0Ly8gUm9vdCBuYW1lc3BhY2Ugb2JqZWN0XHJcblx0dmFyIHJvb3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHt9O1xyXG5cclxuXHRpZiAoaGFzUHJldmlvdXNOZWF0bmVzcykge1xyXG5cdFx0cm9vdC5OZWF0bmVzcyA9IHByZXZpb3VzTmVhdG5lc3M7XHJcblx0fSBlbHNlIHtcclxuXHRcdGRlbGV0ZSByb290Lk5lYXRuZXNzO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5uYW1lc3BhY2VcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgRnVsbCBuYW1lc3BhY2UgbmFtZVxyXG4gKiBAcmV0dXJucyB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLm5hbWVzcGFjZSA9IGZ1bmN0aW9uIChuYW1lKSB7XHJcblx0bmFtZSA9IG5hbWUgfHwgJyc7XHJcblxyXG5cdHZhciBuYW1lUGFydHMgPSBuYW1lLnNwbGl0KCcuJyk7XHJcblx0dmFyIGN1cnJlbnRTY29wZSA9IHRoaXMuX2NvbnRleHQ7XHJcblxyXG5cdGlmICghbmFtZSkge1xyXG5cdFx0cmV0dXJuIGN1cnJlbnRTY29wZTtcclxuXHR9XHJcblxyXG5cdC8vIEZpbmQgb3IgY3JlYXRlXHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lUGFydHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciBzY29wZU5hbWUgPSBuYW1lUGFydHNbaV07XHJcblx0XHRpZiAoaSA9PT0gMCkge1xyXG5cdFx0XHR0aGlzLl9jb250ZXh0S2V5c1tzY29wZU5hbWVdID0gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWN1cnJlbnRTY29wZVtzY29wZU5hbWVdKSB7XHJcblx0XHRcdGN1cnJlbnRTY29wZVtzY29wZU5hbWVdID0ge1xyXG5cdFx0XHRcdF9fY2xhc3NOYW1lOiBuYW1lUGFydHMuc2xpY2UoMCwgaSkuam9pbignLicpLFxyXG5cdFx0XHRcdF9fcGFyZW50Q2xhc3NOYW1lOiBudWxsXHJcblx0XHRcdH07XHJcblx0XHR9XHJcblx0XHRjdXJyZW50U2NvcGUgPSBjdXJyZW50U2NvcGVbc2NvcGVOYW1lXTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBjdXJyZW50U2NvcGU7XHJcbn07XHJcblxyXG4vKipcclxuICogTWV0aG9kIGZvciBkZWZpbmUgY2xhc3NcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5jcmVhdGVDbGFzc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsTmFtZVxyXG4gKiBAcGFyYW0geyhmdW5jdGlvbnxvYmplY3R8bnVsbCl9IG9wdGlvbnNPckV4dGVuZFxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvdHlwZVByb3BlcnRpZXNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLmNyZWF0ZUNsYXNzID0gZnVuY3Rpb24gKGdsb2JhbE5hbWUsIG9wdGlvbnNPckV4dGVuZCwgcHJvdG90eXBlUHJvcGVydGllcywgc3RhdGljUHJvcGVydGllcykge1xyXG5cdHZhciBwYXJhbXMgPSBmb3JtYXRzLnBhcnNlRm9ybWF0KGdsb2JhbE5hbWUsIG9wdGlvbnNPckV4dGVuZCwgcHJvdG90eXBlUHJvcGVydGllcywgc3RhdGljUHJvcGVydGllcyk7XHJcblxyXG5cdC8vIFN1cHBvcnQgZXh0ZW5kcyBhbmQgbWl4aW5zIGFzIHN0cmluZ3MgY2xhc3MgbmFtZXNcclxuXHRpZiAodHlwZW9mIHBhcmFtc1syXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHBhcmFtc1syXSA9IHRoaXMubmFtZXNwYWNlKHBhcmFtc1syXSk7XHJcbiAgICAgICAgaWYgKCFwYXJhbXNbMV0gJiYgcGFyYW1zWzJdICYmIHR5cGVvZiBwYXJhbXNbMl0uX19jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHBhcmFtc1sxXSA9IGZvcm1hdHMucGFyc2VGdWxsTmFtZShwYXJhbXNbMl0uX19jbGFzc05hbWUpO1xyXG4gICAgICAgIH1cclxuXHR9XHJcblx0dmFyIG1peGlucyA9IHBhcmFtc1s2XTtcclxuXHRmb3IgKHZhciBpID0gMCwgbCA9IG1peGlucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdGlmICh0eXBlb2YgbWl4aW5zW2ldID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRtaXhpbnNbaV0gPSB0aGlzLm5hbWVzcGFjZShtaXhpbnNbaV0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gU2hvdyBlcnJvciBpZiBub3QgZGVmaW5lZCBleHRlbmRlZCBjbGFzc1xyXG5cdGlmIChwYXJhbXNbMl0gIT09IG51bGwgJiYgdHlwZW9mIHBhcmFtc1syXSAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0dGhyb3cgbmV3IEVycm9yKCdOb3QgZm91bmQgZXh0ZW5kIGNsYXNzIGZvciBgJyArIGdsb2JhbE5hbWUgKyAnYC4nKTtcclxuXHR9XHJcblxyXG5cdHZhciBuZXdDbGFzcyA9IGV4dGVuZENsYXNzKHBhcmFtc1swXSwgcGFyYW1zWzFdLCBwYXJhbXNbMl0sIHBhcmFtc1s2XSwgcGFyYW1zWzNdLCBwYXJhbXNbNF0sIHBhcmFtc1s3XSk7XHJcblx0Zm9ybWF0cy5hcHBseUNsYXNzQ29uZmlnKG5ld0NsYXNzLCBwYXJhbXNbNV0sIHBhcmFtc1swXSwgcGFyYW1zWzFdKTtcclxuXHJcblx0cmV0dXJuIG5ld0NsYXNzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ldGhvZCBmb3IgZGVmaW5lIGNsYXNzXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUuZGVmaW5lQ2xhc3NcclxuICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbE5hbWVcclxuICogQHBhcmFtIHsoZnVuY3Rpb258b2JqZWN0fG51bGwpfSBvcHRpb25zT3JFeHRlbmRcclxuICogQHBhcmFtIHtvYmplY3R9IFtwcm90b3R5cGVQcm9wZXJ0aWVzXVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BlcnRpZXNdXHJcbiAqIEByZXR1cm4ge29iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5kZWZpbmVDbGFzcyA9IGZ1bmN0aW9uIChnbG9iYWxOYW1lLCBvcHRpb25zT3JFeHRlbmQsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN0YXRpY1Byb3BlcnRpZXMpIHtcclxuXHR2YXIgbmV3Q2xhc3MgPSB0aGlzLmNyZWF0ZUNsYXNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0dmFyIG5hbWVPYmplY3QgPSBmb3JtYXRzLnBhcnNlRnVsbE5hbWUoZ2xvYmFsTmFtZSk7XHJcblxyXG5cdHRoaXMubmFtZXNwYWNlKG5hbWVPYmplY3QubmFtZXNwYWNlKVtuYW1lT2JqZWN0Lm5hbWVdID0gbmV3Q2xhc3M7XHJcblx0cmV0dXJuIG5ld0NsYXNzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ldGhvZCBmb3IgZGVmaW5lIGVudW1cclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5kZWZpbmVDbGFzc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsTmFtZVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BlcnRpZXNdXHJcbiAqIEByZXR1cm4ge29iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5kZWZpbmVFbnVtID0gZnVuY3Rpb24gKGdsb2JhbE5hbWUsIHN0YXRpY1Byb3BlcnRpZXMpIHtcclxuXHR2YXIgbmV3Q2xhc3MgPSB0aGlzLmNyZWF0ZUNsYXNzKGdsb2JhbE5hbWUsIG51bGwsIHt9LCBzdGF0aWNQcm9wZXJ0aWVzKTtcclxuXHR2YXIgbmFtZU9iamVjdCA9IGZvcm1hdHMucGFyc2VGdWxsTmFtZShnbG9iYWxOYW1lKTtcclxuXHJcblx0dGhpcy5uYW1lc3BhY2UobmFtZU9iamVjdC5uYW1lc3BhY2UpW25hbWVPYmplY3QubmFtZV0gPSBuZXdDbGFzcztcclxuXHRyZXR1cm4gbmV3Q2xhc3M7XHJcbn07XHJcblxyXG52YXIgbmVhdG5lc3MgPSBtb2R1bGUuZXhwb3J0cyA9IG5ldyBOZWF0bmVzcygpO1xyXG5cclxuLy8gV2ViIGJyb3dzZXIgZXhwb3J0XHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xyXG5cdHdpbmRvdy5OZWF0bmVzcyA9IG5lYXRuZXNzO1xyXG59XHJcblxyXG4vKipcclxuICogQHR5cGUge05lYXRuZXNzLnByb3RvdHlwZS5PYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuT2JqZWN0ID0gcmVxdWlyZSgnLi9OZWF0bmVzcy5PYmplY3QnKShuZWF0bmVzcyk7XHJcblxyXG4vKipcclxuICogQHR5cGUge05lYXRuZXNzLnByb3RvdHlwZS5FeGNlcHRpb259XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuRXhjZXB0aW9uID0gcmVxdWlyZSgnLi9OZWF0bmVzcy5FeGNlcHRpb24nKShuZWF0bmVzcyk7XHJcblxyXG4vKipcclxuICogQHR5cGUge3N0cmluZ31cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS52ZXJzaW9uID0gJyVKT0lOVFNfQ1VSUkVOVF9WRVJTSU9OJSc7XHJcblxufSx7XCIuL05lYXRuZXNzLkV4Y2VwdGlvblwiOjIyLFwiLi9OZWF0bmVzcy5PYmplY3RcIjoyMyxcIi4vZXh0ZW5kQ2xhc3NcIjoyNSxcIi4vZm9ybWF0c1wiOjI2fV0sMjU6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIGlzRXZhbEVuYWJsZSA9IHRydWU7XHJcbnZhciBpbnN0YW5jZUNvdW50ZXIgPSAwO1xyXG5cclxudmFyIF9ub29wID0gZnVuY3Rpb24oKSB7XHJcbn07XHJcblxyXG52YXIgX2NyZWF0ZUZ1bmN0aW9uID0gZnVuY3Rpb24obmFtZU9iamVjdCwgY29uc3RydWN0b3IpIHtcclxuXHRpZiAoIWlzRXZhbEVuYWJsZSB8fCAhbmFtZU9iamVjdCkge1xyXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH1cclxuXHR9XHJcblxyXG5cdHZhciBuYW1lUmVnRXhwID0gL1teYS16JF9cXC5dL2k7XHJcblx0dmFyIG5hbWUgPSBuYW1lT2JqZWN0Lm5hbWUgfHwgJ0Z1bmN0aW9uJztcclxuXHR2YXIgbmFtZVBhcnRzID0gbmFtZU9iamVjdC5nbG9iYWxOYW1lLnNwbGl0KCcuJyk7XHJcblxyXG5cdC8vIENyZWF0ZSByb290IG9iamVjdFxyXG5cdHZhciByb290TmFtZSA9IG5hbWVQYXJ0cy5zaGlmdCgpO1xyXG5cdHZhciBjcztcclxuXHJcblx0cm9vdE5hbWUgPSByb290TmFtZS5yZXBsYWNlKG5hbWVSZWdFeHAsICcnKTtcclxuXHRldmFsKCd2YXIgJyArIHJvb3ROYW1lICsgJyA9IGNzID0ge307Jyk7XHJcblxyXG5cdC8vIENyZWF0ZSBmYWtlIG5hbWVzcGFjZSBvYmplY3RcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHNjb3BlTmFtZSA9IG5hbWVQYXJ0c1tpXTtcclxuXHRcdGlmICghY3Nbc2NvcGVOYW1lXSkge1xyXG5cdFx0XHRjc1tzY29wZU5hbWVdID0ge307XHJcblx0XHR9XHJcblx0XHRjcyA9IGNzW3Njb3BlTmFtZV07XHJcblx0fVxyXG5cclxuXHR2YXIgZnVuYztcclxuXHR2YXIgZnVsbE5hbWUgPSAobmFtZU9iamVjdC5uYW1lc3BhY2UgPyBuYW1lT2JqZWN0Lm5hbWVzcGFjZSArICcuJyA6ICcnKSArIG5hbWU7XHJcblxyXG5cdGZ1bGxOYW1lID0gZnVsbE5hbWUucmVwbGFjZShuYW1lUmVnRXhwLCAnJyk7XHJcblx0ZXZhbCgnZnVuYyA9ICcgKyBmdWxsTmFtZSArICcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9Jyk7XHJcblxyXG5cdHJldHVybiBmdW5jO1xyXG59O1xyXG5cclxudmFyIF9pc1N0cmljdE9iamVjdCA9IGZ1bmN0aW9uIChvYmopIHtcclxuXHRpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogaW5zdGFuY2VvZiBSZWdFeHAgfHwgb2JqIGluc3RhbmNlb2YgRGF0ZSkge1xyXG5cdFx0cmV0dXJuIGZhbHNlO1xyXG5cdH1cclxuXHJcblx0dmFyIGJvb2wgPSB0cnVlO1xyXG5cdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdGJvb2wgPSBib29sICYmIG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpO1xyXG5cdH1cclxuXHRyZXR1cm4gYm9vbDtcclxufTtcclxuXHJcbnZhciBfY2xvbmUgPSBmdW5jdGlvbihvYmopIHtcclxuXHRpZiAoIV9pc1N0cmljdE9iamVjdChvYmopKSB7XHJcblx0XHRyZXR1cm4gb2JqO1xyXG5cdH1cclxuXHJcblx0dmFyIGNvcHkgPSBvYmouY29uc3RydWN0b3IoKTtcclxuXHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29weVtrZXldID0gX2Nsb25lKG9ialtrZXldKTtcclxuXHRcdH1cclxuXHR9XHJcblx0cmV0dXJuIGNvcHk7XHJcbn07XHJcblxyXG52YXIgX2Nsb25lT2JqSW5Qcm90byA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdGlmICh0eXBlb2Ygb2JqID09PSBcIm9iamVjdFwiKSB7XHJcblx0XHRcdG9ialtrZXldID0gX2Nsb25lKG9ialtrZXldKTtcclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG52YXIgX2NvdmVyVmlydHVhbCA9IGZ1bmN0aW9uIChjaGlsZE1ldGhvZCwgcGFyZW50TWV0aG9kLCBzdXBlck5hbWUpIHtcclxuXHRyZXR1cm4gZnVuY3Rpb24gKCkge1xyXG5cdFx0dmFyIGN1cnJlbnRTdXBlciA9IHRoaXNbc3VwZXJOYW1lXTtcclxuXHRcdHRoaXNbc3VwZXJOYW1lXSA9IHBhcmVudE1ldGhvZDtcclxuXHRcdHZhciByID0gY2hpbGRNZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHRcdHRoaXNbc3VwZXJOYW1lXSA9IGN1cnJlbnRTdXBlcjtcclxuXHRcdHJldHVybiByO1xyXG5cdH07XHJcbn07XHJcblxyXG52YXIgX2V4dGVuZFdpdGhTdXBlciA9IGZ1bmN0aW9uIChjaGlsZENsYXNzLCBuZXdQcm9wZXJ0aWVzLCBzdXBlck5hbWUpIHtcclxuXHRpZiAoIW5ld1Byb3BlcnRpZXMpIHtcclxuXHRcdHJldHVybjtcclxuXHR9XHJcblxyXG5cdC8vIEV4dGVuZCBhbmQgc2V0dXAgdmlydHVhbCBtZXRob2RzXHJcblx0Zm9yICh2YXIga2V5IGluIG5ld1Byb3BlcnRpZXMpIHtcclxuXHRcdGlmICghbmV3UHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciB2YWx1ZSA9IG5ld1Byb3BlcnRpZXNba2V5XTtcclxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgY2hpbGRDbGFzc1trZXldID09ICdmdW5jdGlvbicgJiYgY2hpbGRDbGFzc1trZXldICE9PSBfbm9vcCkge1xyXG5cdFx0XHRjaGlsZENsYXNzW2tleV0gPSBfY292ZXJWaXJ0dWFsKHZhbHVlLCBjaGlsZENsYXNzW2tleV0sIHN1cGVyTmFtZSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjaGlsZENsYXNzW2tleV0gPSBfY2xvbmUodmFsdWUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gRGVmYXVsdCBzdGF0ZVxyXG5cdGlmICghY2hpbGRDbGFzc1tzdXBlck5hbWVdKSB7XHJcblx0XHRjaGlsZENsYXNzW3N1cGVyTmFtZV0gPSBfbm9vcDtcclxuXHR9XHJcbn07XHJcblxyXG4vKipcclxuICogRXh0ZW5kIGNsYXNzXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBuYW1lT2JqZWN0XHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBwYXJlbnROYW1lT2JqZWN0XHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtwYXJlbnRDbGFzc11cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW21peGluc11cclxuICogQHBhcmFtIHtvYmplY3R9IFtwcm90b3R5cGVQcm9wZXJ0aWVzXVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BlcnRpZXNdXHJcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gTmV3IGNsYXNzXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChuYW1lT2JqZWN0LCBwYXJlbnROYW1lT2JqZWN0LCBwYXJlbnRDbGFzcywgbWl4aW5zLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzLCBzdXBlck5hbWUpIHtcclxuXHRwYXJlbnRDbGFzcyA9IHBhcmVudENsYXNzIHx8IF9ub29wO1xyXG5cdG1peGlucyA9IG1peGlucyB8fCBbXTtcclxuXHJcblx0Ly8gVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgbmV3IHN1YmNsYXNzIGlzIGVpdGhlciBkZWZpbmVkIGJ5IHlvdVxyXG5cdC8vICh0aGUgXCJjb25zdHJ1Y3RvclwiIHByb3BlcnR5IGluIHlvdXIgYGV4dGVuZGAgZGVmaW5pdGlvbiksIG9yIGRlZmF1bHRlZFxyXG5cdC8vIGJ5IHVzIHRvIHNpbXBseSBjYWxsIHRoZSBwYXJlbnQncyBjb25zdHJ1Y3Rvci5cclxuXHR2YXIgY29uc3RydWN0b3IgPSBwcm90b3R5cGVQcm9wZXJ0aWVzICYmIHByb3RvdHlwZVByb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgP1xyXG5cdFx0X2NvdmVyVmlydHVhbChwcm90b3R5cGVQcm9wZXJ0aWVzLmNvbnN0cnVjdG9yLCBwYXJlbnRDbGFzcywgc3VwZXJOYW1lKSA6XHJcblx0XHRwYXJlbnRDbGFzcztcclxuXHR2YXIgY2hpbGRDbGFzcyA9IF9jcmVhdGVGdW5jdGlvbihuYW1lT2JqZWN0LCBmdW5jdGlvbigpIHtcclxuXHRcdGlmICghdGhpcy5fX2luc3RhbmNlTmFtZSkge1xyXG5cdFx0XHRfY2xvbmVPYmpJblByb3RvKHRoaXMpO1xyXG5cdFx0XHR0aGlzLl9faW5zdGFuY2VOYW1lICA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZSArIGluc3RhbmNlQ291bnRlcisrO1xyXG5cdFx0fVxyXG5cdFx0Y29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR9KTtcclxuXHJcblx0Ly8gQWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiwgaWYgc3VwcGxpZWQuXHJcblx0Zm9yICh2YXIgcHJvcCBpbiBwYXJlbnRDbGFzcykge1xyXG5cdFx0Y2hpbGRDbGFzc1twcm9wXSA9IHBhcmVudENsYXNzW3Byb3BdO1xyXG5cdH1cclxuXHRfZXh0ZW5kV2l0aFN1cGVyKGNoaWxkQ2xhc3MsIHN0YXRpY1Byb3BlcnRpZXMsIHN1cGVyTmFtZSk7XHJcblxyXG5cdC8vIFNldCB0aGUgcHJvdG90eXBlIGNoYWluIHRvIGluaGVyaXQgZnJvbSBgcGFyZW50YCwgd2l0aG91dCBjYWxsaW5nXHJcblx0Ly8gYHBhcmVudGAncyBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cclxuXHR2YXIgU3Vycm9nYXRlID0gX2NyZWF0ZUZ1bmN0aW9uKHBhcmVudE5hbWVPYmplY3QsIF9ub29wKTtcclxuXHRTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50Q2xhc3MucHJvdG90eXBlO1xyXG5cclxuXHRjaGlsZENsYXNzLnByb3RvdHlwZSA9IG5ldyBTdXJyb2dhdGUoKTtcclxuXHJcblx0Ly8gQ29weSBvYmplY3RzIGZyb20gY2hpbGQgcHJvdG90eXBlXHJcblx0Zm9yICh2YXIgcHJvcDIgaW4gcGFyZW50Q2xhc3MucHJvdG90eXBlKSB7XHJcblx0XHRpZiAocGFyZW50Q2xhc3MucHJvdG90eXBlLmhhc093blByb3BlcnR5KHByb3AyKSAmJiBwcm9wMiAhPT0gJ2NvbnN0cnVjdG9yJykge1xyXG5cdFx0XHRjaGlsZENsYXNzLnByb3RvdHlwZVtwcm9wMl0gPSBfY2xvbmUocGFyZW50Q2xhc3MucHJvdG90eXBlW3Byb3AyXSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBBZGQgcHJvdG90eXBlIHByb3BlcnRpZXMgKGluc3RhbmNlIHByb3BlcnRpZXMpIHRvIHRoZSBzdWJjbGFzcyxcclxuXHQvLyBpZiBzdXBwbGllZC5cclxuXHRpZiAocHJvdG90eXBlUHJvcGVydGllcykge1xyXG5cdFx0X2V4dGVuZFdpdGhTdXBlcihjaGlsZENsYXNzLnByb3RvdHlwZSwgcHJvdG90eXBlUHJvcGVydGllcywgc3VwZXJOYW1lKTtcclxuXHR9XHJcblxyXG5cdC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBmcm9tIG1peGluc1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgbWl4aW5Qcm9wIGluIG1peGluc1tpXS5wcm90b3R5cGUpIHtcclxuXHRcdFx0Ly8gU2tpcCBwcml2YXRlXHJcblx0XHRcdGlmIChtaXhpblByb3Auc3Vic3RyKDAsIDIpID09PSAnX18nKSB7XHJcblx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIENoZWNrIGZvciBleGlzdHMgcHJvcGVydHkgb3IgbWV0aG9kLiBNaXhpbiBjYW4gb25seSBhZGQgcHJvcGVydGllcywgYnV0IG5vIHJlcGxhY2UgaXRcclxuXHRcdFx0aWYgKHR5cGVvZiBjaGlsZENsYXNzLnByb3RvdHlwZVttaXhpblByb3BdID09PSAnZnVuY3Rpb24nIHx8IGNoaWxkQ2xhc3MucHJvdG90eXBlLmhhc093blByb3BlcnR5KG1peGluUHJvcCkpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyeSB0byByZXBsYWNlIHByb3RvdHlwZSBwcm9wZXJ0eSBgJyArIG1peGluUHJvcCArICdgIGluIGNsYXNzIGAnICsgY2hpbGRDbGFzcy5fX2NsYXNzTmFtZSArICdgIGJ5IG1peGluIGAnICsgbWl4aW5zW2ldLl9fY2xhc3NOYW1lICsgJ2AnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjaGlsZENsYXNzLnByb3RvdHlwZVttaXhpblByb3BdID0gbWl4aW5zW2ldLnByb3RvdHlwZVttaXhpblByb3BdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHQvLyBBZGQgc3RhdGljIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgZnJvbSBtaXhpbnNcclxuXHRmb3IgKHZhciBpID0gMCwgbCA9IG1peGlucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdGZvciAodmFyIG1peGluUHJvcCBpbiBtaXhpbnNbaV0pIHtcclxuXHRcdFx0Ly8gU2tpcCBwcml2YXRlXHJcblx0XHRcdGlmIChtaXhpblByb3Auc3Vic3RyKDAsIDIpID09PSAnX18nKSB7XHJcblx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIENoZWNrIGZvciBleGlzdHMgcHJvcGVydHkgb3IgbWV0aG9kLiBNaXhpbiBjYW4gb25seSBhZGQgcHJvcGVydGllcywgYnV0IG5vIHJlcGxhY2UgaXRcclxuXHRcdFx0aWYgKHR5cGVvZiBjaGlsZENsYXNzW21peGluUHJvcF0gPT09ICdmdW5jdGlvbicgfHwgY2hpbGRDbGFzcy5oYXNPd25Qcm9wZXJ0eShtaXhpblByb3ApKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUcnkgdG8gcmVwbGFjZSBzdGF0aWMgcHJvcGVydHkgYCcgKyBtaXhpblByb3AgKyAnYCBpbiBjbGFzcyBgJyArIGNoaWxkQ2xhc3MuX19jbGFzc05hbWUgKyAnYCBieSBtaXhpbiBgJyArIG1peGluc1tpXS5fX2NsYXNzTmFtZSArICdgJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2hpbGRDbGFzc1ttaXhpblByb3BdID0gbWl4aW5zW2ldW21peGluUHJvcF07XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gY2hpbGRDbGFzcztcclxufTtcclxuXG59LHt9XSwyNjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgRk9STUFUX0pPSU5UU19WMDIgPSAnbmVhdG5lc3NfdjAyJztcclxudmFyIEZPUk1BVF9KT0lOVFNfVjEwID0gJ25lYXRuZXNzX3YxMCc7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuXHJcblx0LyoqXHJcblx0ICogRGV0ZWN0IGZvcm1hdCBhbmQgcmV0dXJuIGNsYXNzIHBhcmFtc1xyXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcblx0ICogQHBhcmFtIHsoZnVuY3Rpb258b2JqZWN0fG51bGwpfSBvcHRpb25zT3JFeHRlbmRcclxuXHQgKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvUHJvcHNdXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wc11cclxuXHQgKiBAcmV0dXJucyB7b2JqZWN0fVxyXG5cdCAqL1xyXG5cdHBhcnNlRm9ybWF0OiBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xyXG5cdFx0dmFyIG5hbWVPYmplY3QgPSB0aGlzLnBhcnNlRnVsbE5hbWUoZ2xvYmFsTmFtZSk7XHJcblx0XHR2YXIgcGFyZW50TmFtZU9iamVjdCA9IG51bGw7XHJcblx0XHR2YXIgcGFyZW50Q2xhc3MgPSBudWxsO1xyXG5cdFx0dmFyIHByb3RvdHlwZVByb3BlcnRpZXMgPSBudWxsO1xyXG5cdFx0dmFyIHN0YXRpY1Byb3BlcnRpZXMgPSBudWxsO1xyXG5cdFx0dmFyIGZvcm1hdCA9IG51bGw7XHJcblx0XHR2YXIgbWl4aW5zID0gW107XHJcblxyXG5cdFx0Ly8gTmVhdG5lc3MgdjAuMiAob2xkKSBmb3JtYXRcclxuXHRcdGlmIChvcHRpb25zT3JFeHRlbmQgPT09IG51bGwgfHwgdHlwZW9mIG9wdGlvbnNPckV4dGVuZCA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRwYXJlbnRDbGFzcyA9IG9wdGlvbnNPckV4dGVuZDtcclxuXHRcdFx0cHJvdG90eXBlUHJvcGVydGllcyA9IHByb3RvUHJvcHM7XHJcblx0XHRcdHN0YXRpY1Byb3BlcnRpZXMgPSBzdGF0aWNQcm9wcztcclxuXHRcdFx0Zm9ybWF0ID0gRk9STUFUX0pPSU5UU19WMDI7XHJcblxyXG5cdFx0XHRpZiAocGFyZW50Q2xhc3MgJiYgdHlwZW9mIHBhcmVudENsYXNzLmRlYnVnQ2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudE5hbWVPYmplY3QgPSB0aGlzLnBhcnNlRnVsbE5hbWUocGFyZW50Q2xhc3MuZGVidWdDbGFzc05hbWUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBOZWF0bmVzcyB2MS4wIGZvcm1hdFxyXG5cdFx0fSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9uc09yRXh0ZW5kID09PSAnb2JqZWN0Jykge1xyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX2V4dGVuZHMnKSkge1xyXG5cdFx0XHRcdHBhcmVudENsYXNzID0gb3B0aW9uc09yRXh0ZW5kLl9fZXh0ZW5kcztcclxuXHRcdFx0XHRkZWxldGUgb3B0aW9uc09yRXh0ZW5kLl9fZXh0ZW5kcztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnNPckV4dGVuZC5oYXNPd25Qcm9wZXJ0eSgnX19zdGF0aWMnKSkge1xyXG5cdFx0XHRcdHN0YXRpY1Byb3BlcnRpZXMgPSBvcHRpb25zT3JFeHRlbmQuX19zdGF0aWM7XHJcblx0XHRcdFx0ZGVsZXRlIG9wdGlvbnNPckV4dGVuZC5fX3N0YXRpYztcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG9wdGlvbnNPckV4dGVuZC5oYXNPd25Qcm9wZXJ0eSgnX19taXhpbnMnKSkge1xyXG5cdFx0XHRcdG1peGlucyA9IG1peGlucy5jb25jYXQob3B0aW9uc09yRXh0ZW5kLl9fbWl4aW5zKTtcclxuXHRcdFx0XHRkZWxldGUgb3B0aW9uc09yRXh0ZW5kLl9fbWl4aW5zO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChvcHRpb25zT3JFeHRlbmQuaGFzT3duUHJvcGVydHkoJ19fbWl4aW4nKSkge1xyXG5cdFx0XHRcdG1peGlucyA9IG1peGlucy5jb25jYXQob3B0aW9uc09yRXh0ZW5kLl9fbWl4aW4pO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19taXhpbjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9ybWF0ID0gRk9STUFUX0pPSU5UU19WMTA7XHJcblx0XHRcdHByb3RvdHlwZVByb3BlcnRpZXMgPSBvcHRpb25zT3JFeHRlbmQ7XHJcblxyXG5cdFx0XHRpZiAocGFyZW50Q2xhc3MgJiYgdHlwZW9mIHBhcmVudENsYXNzLl9fY2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdHBhcmVudE5hbWVPYmplY3QgPSB0aGlzLnBhcnNlRnVsbE5hbWUocGFyZW50Q2xhc3MuX19jbGFzc05hbWUpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIFtcclxuXHRcdFx0bmFtZU9iamVjdCxcclxuXHRcdFx0cGFyZW50TmFtZU9iamVjdCxcclxuXHRcdFx0cGFyZW50Q2xhc3MsXHJcblx0XHRcdHByb3RvdHlwZVByb3BlcnRpZXMsXHJcblx0XHRcdHN0YXRpY1Byb3BlcnRpZXMsXHJcblx0XHRcdGZvcm1hdCxcclxuXHRcdFx0bWl4aW5zLFxyXG5cdFx0XHRmb3JtYXQgPT09IEZPUk1BVF9KT0lOVFNfVjAyID8gJ19zdXBlcicgOiAnX19zdXBlcidcclxuXHRcdF07XHJcblx0fSxcclxuXHJcblx0YXBwbHlDbGFzc0NvbmZpZzogZnVuY3Rpb24obmV3Q2xhc3MsIGZvcm1hdCwgbmFtZU9iamVjdCwgcGFyZW50TmFtZU9iamVjdCkge1xyXG5cdFx0Ly8gU2V0IF9fY2xhc3NOYW1lIGZvciBhbGwgZm9ybWF0c1xyXG5cdFx0bmV3Q2xhc3MuX19jbGFzc05hbWUgPSBuZXdDbGFzcy5wcm90b3R5cGUuX19jbGFzc05hbWUgPSBuYW1lT2JqZWN0Lmdsb2JhbE5hbWU7XHJcblxyXG5cdFx0dmFyIGNsYXNzTmFtZUtleSA9IGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnZGVidWdDbGFzc05hbWUnIDogJ19fY2xhc3NOYW1lJztcclxuXHRcdHZhciBwYXJlbnRDbGFzc05hbWVLZXkgPSBmb3JtYXQgPT09IEZPUk1BVF9KT0lOVFNfVjAyID8gJycgOiAnX19wYXJlbnRDbGFzc05hbWUnO1xyXG5cdFx0dmFyIHN0YXRpY05hbWVLZXkgPSBmb3JtYXQgPT09IEZPUk1BVF9KT0lOVFNfVjAyID8gJ19zdGF0aWMnIDogJ19fc3RhdGljJztcclxuXHJcblx0XHRuZXdDbGFzc1tjbGFzc05hbWVLZXldID0gbmV3Q2xhc3MucHJvdG90eXBlW2NsYXNzTmFtZUtleV0gPSBuYW1lT2JqZWN0Lmdsb2JhbE5hbWU7XHJcblx0XHRpZiAocGFyZW50Q2xhc3NOYW1lS2V5KSB7XHJcblx0XHRcdG5ld0NsYXNzW3BhcmVudENsYXNzTmFtZUtleV0gPSBuZXdDbGFzcy5wcm90b3R5cGVbcGFyZW50Q2xhc3NOYW1lS2V5XSA9IHBhcmVudE5hbWVPYmplY3QgPyAocGFyZW50TmFtZU9iamVjdC5nbG9iYWxOYW1lIHx8IG51bGwpIDogbnVsbDtcclxuXHRcdH1cclxuXHRcdG5ld0NsYXNzW3N0YXRpY05hbWVLZXldID0gbmV3Q2xhc3MucHJvdG90eXBlW3N0YXRpY05hbWVLZXldID0gbmV3Q2xhc3M7XHJcblxyXG5cdFx0cmV0dXJuIG5ld0NsYXNzO1xyXG5cdH0sXHJcblxyXG5cdHBhcnNlRnVsbE5hbWU6IGZ1bmN0aW9uKGdsb2JhbE5hbWUpIHtcclxuXHRcdC8vIFNwbGl0IG5hbWVzcGFjZVxyXG5cdFx0dmFyIHBvcyA9IGdsb2JhbE5hbWUubGFzdEluZGV4T2YoJy4nKTtcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRnbG9iYWxOYW1lOiBnbG9iYWxOYW1lLFxyXG5cdFx0XHRuYW1lOiBwb3MgIT09IC0xID8gZ2xvYmFsTmFtZS5zdWJzdHIocG9zICsgMSkgOiBnbG9iYWxOYW1lLFxyXG5cdFx0XHRuYW1lc3BhY2U6IHBvcyAhPT0gLTEgPyBnbG9iYWxOYW1lLnN1YnN0cigwLCBwb3MpIDogJydcclxuXHRcdH07XHJcblx0fVxyXG5cclxufTtcclxuXG59LHt9XSwyNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL0ZpbGVVcCcpO1xuXG5yZXF1aXJlKCcuL2xpYi9iYXNlL0NvbXBvbmVudCcpO1xucmVxdWlyZSgnLi9saWIvYmFzZS9FbGVtZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL0V4Y2VwdGlvbicpO1xucmVxdWlyZSgnLi9saWIvYmFzZS9NYW5hZ2VyJyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL09iamVjdCcpO1xucmVxdWlyZSgnLi9saWIvZm9ybS9Ecm9wQXJlYScpO1xucmVxdWlyZSgnLi9saWIvZm9ybS9Gb3JtJyk7XG5yZXF1aXJlKCcuL2xpYi9mb3JtL0Zvcm1FbGVtZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9mb3JtL0lucHV0RWxlbWVudCcpO1xucmVxdWlyZSgnLi9saWIvaGVscGVycy9Ccm93c2VySGVscGVyJyk7XG5yZXF1aXJlKCcuL2xpYi9oZWxwZXJzL0NsYXNzSGVscGVyJyk7XG5yZXF1aXJlKCcuL2xpYi9tYW5hZ2Vycy9RdWV1ZU1hbmFnZXInKTtcbnJlcXVpcmUoJy4vbGliL21vZGVscy9GaWxlJyk7XG5yZXF1aXJlKCcuL2xpYi9tb2RlbHMvRmlsZVByb2dyZXNzJyk7XG5yZXF1aXJlKCcuL2xpYi9tb2RlbHMvUXVldWVDb2xsZWN0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi91cGxvYWRlcnMvQmFzZVVwbG9hZGVyJyk7XG5yZXF1aXJlKCcuL2xpYi91cGxvYWRlcnMvSWZyYW1lVXBsb2FkZXInKTtcbnJlcXVpcmUoJy4vbGliL3VwbG9hZGVycy9YaHJVcGxvYWRlcicpO1xuXG59LHtcIi4vbGliL0ZpbGVVcFwiOjIsXCIuL2xpYi9iYXNlL0NvbXBvbmVudFwiOjMsXCIuL2xpYi9iYXNlL0VsZW1lbnRcIjo0LFwiLi9saWIvYmFzZS9FeGNlcHRpb25cIjo1LFwiLi9saWIvYmFzZS9NYW5hZ2VyXCI6NixcIi4vbGliL2Jhc2UvT2JqZWN0XCI6NyxcIi4vbGliL2Zvcm0vRHJvcEFyZWFcIjo4LFwiLi9saWIvZm9ybS9Gb3JtXCI6OSxcIi4vbGliL2Zvcm0vRm9ybUVsZW1lbnRcIjoxMCxcIi4vbGliL2Zvcm0vSW5wdXRFbGVtZW50XCI6MTEsXCIuL2xpYi9oZWxwZXJzL0Jyb3dzZXJIZWxwZXJcIjoxMixcIi4vbGliL2hlbHBlcnMvQ2xhc3NIZWxwZXJcIjoxMyxcIi4vbGliL21hbmFnZXJzL1F1ZXVlTWFuYWdlclwiOjE0LFwiLi9saWIvbW9kZWxzL0ZpbGVcIjoxNSxcIi4vbGliL21vZGVscy9GaWxlUHJvZ3Jlc3NcIjoxNixcIi4vbGliL21vZGVscy9RdWV1ZUNvbGxlY3Rpb25cIjoxNyxcIi4vbGliL3VwbG9hZGVycy9CYXNlVXBsb2FkZXJcIjoxOCxcIi4vbGliL3VwbG9hZGVycy9JZnJhbWVVcGxvYWRlclwiOjE5LFwiLi9saWIvdXBsb2FkZXJzL1hoclVwbG9hZGVyXCI6MjB9XX0se30sWzFdKTtcbiJdLCJmaWxlIjoiZmlsZXVwLWNvcmUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
