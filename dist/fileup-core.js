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
        if (this._history.length < this.speedMinMeasurement) {
            return 0;
        }

        // Get last diff values
        var history = this._history.slice(-1 * this.speedMaxMeasurement);

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
        if (file.isStatusEnd()) {
            this.trigger(this.__static.EVENT_ITEM_END, [file]);
        }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJmaWxldXAtY29yZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbnBtJyk7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdpbmRvdy5GaWxlVXAgPSBtb2R1bGUuZXhwb3J0cztcbn1cbn0se1wiLi9ucG1cIjoyN31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBOZWF0bmVzcyA9IHJlcXVpcmUoJ25lYXRuZXNzJykubmV3Q29udGV4dCgpO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAYWxpYXMgbW9kdWxlOmZpbGV1cC1jb3JlXG4gKi9cbnZhciBGaWxlVXA7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcFxuICogQGV4dGVuZHMgTmVhdG5lc3MuT2JqZWN0XG4gKi9cbkZpbGVVcCA9IE5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAnLCAvKiogQGxlbmRzIEZpbGVVcC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IE5lYXRuZXNzLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcCAqL3tcblxuICAgICAgICBOZWF0bmVzczogTmVhdG5lc3NcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGJhY2tlbmRVcmw6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybX1cbiAgICAgKi9cbiAgICBmb3JtOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5mb3JtLkZvcm0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5Ecm9wQXJlYX1cbiAgICAgKi9cbiAgICBkcm9wQXJlYToge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAuZm9ybS5Ecm9wQXJlYSdcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9ufVxuICAgICAqL1xuICAgIHF1ZXVlOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcn1cbiAgICAgKi9cbiAgICBxdWV1ZU1hbmFnZXI6IHtcbiAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcidcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cbiAgICAgKi9cbiAgICBmaWxlQ29uZmlnOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuRmlsZSdcbiAgICB9LFxuXG4gICAgdXBsb2FkZXJDb25maWdzOiB7XG4gICAgICAgIGlmcmFtZToge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlcidcbiAgICAgICAgfSxcbiAgICAgICAgeGhyOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJ1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pbml0Rm9ybSgpO1xuICAgICAgICB0aGlzLl9pbml0RHJvcEFyZWEoKTtcbiAgICAgICAgdGhpcy5faW5pdFF1ZXVlKCk7XG4gICAgICAgIHRoaXMuX2luaXRNYW5hZ2VycygpO1xuICAgIH0sXG5cbiAgICBfaW5pdEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5mb3JtID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KHRoaXMuZm9ybSk7XG4gICAgICAgIHRoaXMuZm9ybS5vbihGaWxlVXAuZm9ybS5Gb3JtLkVWRU5UX1NVQk1JVCwgdGhpcy5fb25Gb3JtU3VibWl0LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfaW5pdERyb3BBcmVhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QodGhpcy5kcm9wQXJlYSk7XG4gICAgICAgIHRoaXMuZHJvcEFyZWEub24oRmlsZVVwLmZvcm0uRHJvcEFyZWEuRVZFTlRfU1VCTUlULCB0aGlzLl9vbkZvcm1TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIF9pbml0UXVldWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdCh0aGlzLnF1ZXVlKTtcbiAgICB9LFxuXG4gICAgX2luaXRNYW5hZ2VyczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWFuYWdlcnMgPSBbXG4gICAgICAgICAgICAncXVldWUnXG4gICAgICAgIF07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBtYW5hZ2Vycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbWFuYWdlcnNbaV0gKyAnTWFuYWdlcic7XG4gICAgICAgICAgICB0aGlzW25hbWVdID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsZWN0aW9uOiB0aGlzLnF1ZXVlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbbmFtZV1cbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIE9wZW4gYnJvd3NlIGZpbGVzIGRpYWxvZyBvbiBsb2NhbCBtYWNoaW5lXG4gICAgICovXG4gICAgYnJvd3NlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5icm93c2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKi9cbiAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZm9ybS5kZXN0cm95KCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IG5hdGl2ZUZpbGVzXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbkZvcm1TdWJtaXQ6IGZ1bmN0aW9uIChuYXRpdmVGaWxlcykge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSBudWxsO1xuICAgICAgICB2YXIgaXNJRSA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpO1xuICAgICAgICBpZiAoaXNJRSAmJiBpc0lFIDwgMTApIHtcbiAgICAgICAgICAgIHVwbG9hZGVyID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYmFja2VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm06IHRoaXMuZm9ybVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwbG9hZGVyQ29uZmlncy5pZnJhbWVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVzID0gW107XG4gICAgICAgIGZvciAodmFyIHBhdGggaW4gbmF0aXZlRmlsZXMpIHtcbiAgICAgICAgICAgIGlmIChuYXRpdmVGaWxlcy5oYXNPd25Qcm9wZXJ0eShwYXRoKSkge1xuICAgICAgICAgICAgICAgIHZhciBuYXRpdmVGaWxlID0gbmF0aXZlRmlsZXNbcGF0aF07XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QoXG4gICAgICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hdGl2ZTogbmF0aXZlRmlsZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzVG90YWw6IG5hdGl2ZUZpbGUuZmlsZVNpemUgfHwgbmF0aXZlRmlsZS5zaXplIHx8IDBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVDb25maWdcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBmaWxlLnNldFVwbG9hZGVyKHVwbG9hZGVyIHx8IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB0aGlzLmJhY2tlbmRVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkZXJDb25maWdzLnhoclxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGZpbGVzLnB1c2goZmlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnF1ZXVlLmFkZChmaWxlcyk7XG4gICAgfVxuXG59KTtcblxuLyoqXG4gKiBAbW9kdWxlIEZpbGVVcFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IEZpbGVVcDtcblxufSx7XCJuZWF0bmVzc1wiOjIxfV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuQ29tcG9uZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfZXZlbnRzOiB7fSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IG5hbWVzXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gaGFuZGxlclxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAoIShuYW1lcyBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBuYW1lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0gPSB0aGlzLl9ldmVudHNbbmFtZV0gfHwgW107XG4gICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfHN0cmluZ1tdfSBbbmFtZXNdXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbihuYW1lcywgaGFuZGxlcikge1xuICAgICAgICBpZiAobmFtZXMpIHtcbiAgICAgICAgICAgIGlmICghKG5hbWVzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICAgICAgbmFtZXMgPSBbbmFtZXNdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gbmFtZXNbaV07XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9ldmVudHNbbmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gICAgICogQHBhcmFtIHsqW119IFthcmdzXVxuICAgICAqL1xuICAgIHRyaWdnZXI6IGZ1bmN0aW9uKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgYXJncyA9IGFyZ3MgfHwgW107XG5cbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50c1tuYW1lXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9ldmVudHNbbmFtZV0ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW25hbWVdW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vT2JqZWN0Jyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkVsZW1lbnRcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLkVsZW1lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkVsZW1lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBlbGVtZW50OiBudWxsLFxuXG4gICAgaGlkZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50b3AgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmxlZnQgPSAnLTk5OXB4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm9wYWNpdHkgPSAnMCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5maWx0ZXIgPSAnYWxwaGEob3BhY2l0eT0wKSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5ib3JkZXIgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVsncG9pbnRlci1ldmVudHMnXSA9ICdub25lJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBjb250YWluZXJcbiAgICAgKi9cbiAgICBhcHBlbmRUbzogZnVuY3Rpb24oY29udGFpbmVyKSB7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqL1xuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50ICYmIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvblxuICogQGV4dGVuZHMgRXJyb3JcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuYmFzZS5FeGNlcHRpb24nLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkV4Y2VwdGlvbi5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEVycm9yLFxuXG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5fX3N0YXRpYyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5uYW1lID0gdGhpcy5fX2NsYXNzTmFtZTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSB8fCAnJztcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSw2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9PYmplY3QnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuTWFuYWdlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuTWFuYWdlcicsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuTWFuYWdlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIGVuYWJsZTogdHJ1ZSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbn1cbiAgICAgKi9cbiAgICBjb2xsZWN0aW9uOiBudWxsLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmVuYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLm9uKEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uLkVWRU5UX0FERCwgdGhpcy5fb25BZGQuYmluZCh0aGlzKSk7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ub24oRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfUkVNT1ZFLCB0aGlzLl9vblJlbW92ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfb25BZGQ6IGZ1bmN0aW9uKCkge1xuICAgIH0sXG5cbiAgICBfb25SZW1vdmU6IGZ1bmN0aW9uKCkge1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vT2JqZWN0XCI6N31dLDc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqIEBleHRlbmRzIE5lYXRuZXNzLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLk9iamVjdCcsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLk5lYXRuZXNzLk9iamVjdCxcblxuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uZmlnID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY29uZmlndXJlKHRoaXMsIGNvbmZpZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9LFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG5cbiAgICB9XG5cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLmZvcm0uRHJvcEFyZWFcclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkRyb3BBcmVhJywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Ecm9wQXJlYS5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uRHJvcEFyZWEgKi97XHJcblxyXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge2Jvb2xlYW59XHJcbiAgICAgKi9cclxuICAgIGVuYWJsZTogZmFsc2UsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5lcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtvYmplY3R9XHJcbiAgICAgKi9cclxuICAgIF9maWxlczoge30sXHJcblxyXG4gICAgX3JlYWRMZXZlbDogMCxcclxuXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgdGhpcy5lbmFibGUgPSB0aGlzLmVuYWJsZSAmJiBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzRmlsZURyb3BTdXBwb3J0KCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmVuYWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5vbmRyYWdvdmVyID0gdGhpcy5fb25EcmFnT3Zlci5iaW5kKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5vbmRyYWdlbmQgPSB0aGlzLl9vbkRyYWdFbmQuYmluZCh0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIub25kcm9wID0gdGhpcy5fb25Ecm9wLmJpbmQodGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfb25EcmFnT3ZlcjogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XHJcbiAgICAgICAgICAgIHZhciBkdFR5cGVzID0gZXZlbnQuZGF0YVRyYW5zZmVyLnR5cGVzO1xyXG4gICAgICAgICAgICBpZiAoZHRUeXBlcykge1xyXG4gICAgICAgICAgICAgICAgLy8gRkZcclxuICAgICAgICAgICAgICAgIGlmIChkdFR5cGVzLmNvbnRhaW5zICYmICFkdFR5cGVzLmNvbnRhaW5zKFwiRmlsZXNcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2hyb21lXHJcbiAgICAgICAgICAgICAgICBpZiAoZHRUeXBlcy5pbmRleE9mICYmIGR0VHlwZXMuaW5kZXhPZihcIkZpbGVzXCIpID09PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vbkRyYWdFbmQ6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uRHJvcDogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyLml0ZW1zICYmIGV2ZW50LmRhdGFUcmFuc2Zlci5pdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlYWREYXRhVHJhbnNmZXJJdGVtcyhldmVudC5kYXRhVHJhbnNmZXIuaXRlbXMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3JlYWREYXRhVHJhbnNmZXJGaWxlcyhldmVudC5kYXRhVHJhbnNmZXIuZmlsZXMpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgX3JlYWREYXRhVHJhbnNmZXJJdGVtczogZnVuY3Rpb24oaXRlbXMpIHtcclxuICAgICAgICB2YXIgZW50cmllcyA9IFtdO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaXRlbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBlbnRyeSA9IGl0ZW1zW2ldLndlYmtpdEdldEFzRW50cnkoKTtcclxuICAgICAgICAgICAgaWYgKGVudHJ5ICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhlbnRyaWVzLCAnJyk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGlyZWN0b3J5RW50cmllczogZnVuY3Rpb24gKGVudHJpZXMsIHJlbGF0aXZlUGF0aCkge1xyXG4gICAgICAgIHRoaXMuX3JlYWRMZXZlbCsrO1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGVudHJpZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChmdW5jdGlvbihlbnRyeSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhdGggPSAocmVsYXRpdmVQYXRoID8gcmVsYXRpdmVQYXRoICsgJy8nIDogJycpICsgZW50cnkubmFtZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5jcmVhdGVSZWFkZXIoKS5yZWFkRW50cmllcyhmdW5jdGlvbihzdWJFbnRyaWVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWREaXJlY3RvcnlFbnRyaWVzKHN1YkVudHJpZXMsIHBhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVhZERpcmVjdG9yeUVudHJpZXMoZW50cnksIGVudHJ5Lm5hbWUgKyAnLycpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChlbnRyeS5pc0ZpbGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkTGV2ZWwrKztcclxuICAgICAgICAgICAgICAgICAgICBlbnRyeS5maWxlKGZ1bmN0aW9uIChmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzW3BhdGhdID0gZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3JlYWRMZXZlbC0tO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZWFkRGlyZWN0b3J5RW50cmllcyhbXSwgcGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbiBlcnJvckhhbmRsZXIoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpKGVudHJpZXNbaV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9yZWFkTGV2ZWwtLTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX3JlYWRMZXZlbCA9PT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLl9vblJlYWREYXRhVHJhbnNmZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9yZWFkRGF0YVRyYW5zZmVyRmlsZXM6IGZ1bmN0aW9uKGZpbGVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tpXTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNraXAgZm9sZGVyc1xyXG4gICAgICAgICAgICBpZiAoIWZpbGUudHlwZSAmJiBmaWxlLnNpemUgPT09IDApIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLl9maWxlc1tmaWxlLm5hbWVdID0gZmlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX29uUmVhZERhdGFUcmFuc2ZlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfb25SZWFkRGF0YVRyYW5zZmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFt0aGlzLl9maWxlc10pO1xyXG4gICAgICAgIHRoaXMuX2ZpbGVzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxufSk7XHJcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLkZvcm1cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm0nLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLkZvcm0ucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtICove1xuXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGFpbmVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgX2lzTXVsdGlwbGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgX2Zvcm1FbGVtZW50OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudH1cbiAgICAgKi9cbiAgICBfbGFzdElucHV0RWxlbWVudDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBfaW5wdXRFbGVtZW50czogW10sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSW5pdCBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGVsZW1lbnRcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuYXBwZW5kVG8odGhpcy5jb250YWluZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgaW5wdXQgZWxlbWVudFxuICAgICAgICB0aGlzLl9yZWZyZXNoSW5wdXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXRNdWx0aXBsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc011bHRpcGxlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRNdWx0aXBsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmVsZW1lbnQubXVsdGlwbGUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKHVybCwgdGFyZ2V0KSB7XG4gICAgICAgIC8vIFNldCBkZXN0aW5hdGlvblxuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5lbGVtZW50LmFjdGlvbiA9IHVybDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSB0YXJnZXQ7XG5cbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5zdWJtaXQoKTtcblxuICAgICAgICAvLyBSZXNldCB2YWx1ZXNcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5hY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbiBicm93c2UgZmlsZXMgZGlhbG9nIG9uIGxvY2FsIG1hY2hpbmVcbiAgICAgKi9cbiAgICBicm93c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoXCJjbGlja1wiLCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5lbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfcmVmcmVzaElucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEZyZWV6ZSBwcmV2aW91cyBlbGVtZW50LCBidXQgZG8gbm90IGRldGFjaFxuICAgICAgICBpZiAodGhpcy5fbGFzdElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5mcmVlemUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50KHtcbiAgICAgICAgICAgIG11bHRpcGxlOiB0aGlzLmdldE11bHRpcGxlKCksXG4gICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5fb25JbnB1dENoYW5nZS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmFwcGVuZFRvKHRoaXMuX2Zvcm1FbGVtZW50LmVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9pbnB1dEVsZW1lbnRzLnB1c2godGhpcy5fbGFzdElucHV0RWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbklucHV0Q2hhbmdlOiBmdW5jdGlvbihvRXZlbnQpIHtcbiAgICAgICAgb0V2ZW50ID0gb0V2ZW50IHx8IHdpbmRvdy5ldmVudDtcbiAgICAgICAgb0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZ2V0Q291bnQoKSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVzID0ge307XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fbGFzdElucHV0RWxlbWVudC5nZXRDb3VudCgpOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBmaWxlc1t0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmdldEZpbGVQYXRoKGkpXSA9IHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQuZ2V0RmlsZU5hdGl2ZShpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFtmaWxlc10pO1xuXG4gICAgICAgIHRoaXMuX3JlZnJlc2hJbnB1dCgpO1xuICAgIH0sXG5cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Zvcm1FbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9pbnB1dEVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5faW5wdXRFbGVtZW50c1tpXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9mZih0aGlzLl9fc3RhdGljLkVWRU5UX1NVQk1JVCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuZm9ybS5Gb3JtRWxlbWVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuRWxlbWVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm1FbGVtZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtRWxlbWVudC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkVsZW1lbnQsXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2Zvcm0nKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnbWV0aG9kJywgJ1BPU1QnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnZW5jdHlwZScsICdtdWx0aXBhcnQvZm9ybS1kYXRhJyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FjY2VwdENoYXJzZXQnLCAnVVRGLTgnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnY2hhcmFjdGVyU2V0JywgJ1VURi04Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NoYXJzZXQnLCAnVVRGLTgnKTtcblxuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLklucHV0RWxlbWVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuRWxlbWVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudCcsIC8qKiBAbGVuZHMgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuRWxlbWVudCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgbmFtZTogJ2ZpbGUnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgbXVsdGlwbGU6IGZhbHNlLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAqL1xuICAgIG9uQ2hhbmdlOiBudWxsLFxuXG4gICAgX2ZpbGVOYW1lczoge30sXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgIHRoaXMuZWxlbWVudC50eXBlID0gJ2ZpbGUnO1xuICAgICAgICB0aGlzLmVsZW1lbnQubmFtZSA9IHRoaXMubmFtZSArICh0aGlzLm11bHRpcGxlID8gJ1tdJyA6ICcnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm11bHRpcGxlID0gdGhpcy5tdWx0aXBsZTtcblxuICAgICAgICAvLyBJRTggZmlsZSBmaWVsZCB0cmFuc3BhcmVuY3kgZml4LlxuICAgICAgICBpZiAoRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc0lFKCkpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZSA9IHRoaXMuZWxlbWVudC5zdHlsZTtcbiAgICAgICAgICAgIHN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN1YnNjcmliZSBvbiBjaGFuZ2UgaW5wdXQgZmlsZXNcbiAgICAgICAgaWYgKHRoaXMub25DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5vbmNoYW5nZSA9IHRoaXMub25DaGFuZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAqL1xuICAgIGdldEZpbGVOYXRpdmU6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZmlsZXMgJiYgdGhpcy5lbGVtZW50LmZpbGVzW2luZGV4XSB8fCBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0RmlsZVBhdGg6IGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgdmFyIGZpbGUgPSB0aGlzLmdldEZpbGVOYXRpdmUoaW5kZXgpO1xuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmaWxlLndlYmtpdFJlbGF0aXZlUGF0aCA/XG4gICAgICAgICAgICBmaWxlLndlYmtpdFJlbGF0aXZlUGF0aC5yZXBsYWNlKC9eW1xcL1xcXFxdKy8sICcnKSA6XG4gICAgICAgICAgICBmaWxlLmZpbGVOYW1lIHx8IGZpbGUubmFtZSB8fCAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldENvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQuZmlsZXMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuZmlsZXMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQudmFsdWUgPyAxIDogMDtcbiAgICB9LFxuXG4gICAgZnJlZXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5vbmNoYW5nZSA9IG51bGw7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50Lm9uY2hhbmdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyJywgLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlciAqL3tcblxuICAgICAgICBfYnJvd3Nlck5hbWU6IG51bGwsXG5cbiAgICAgICAgX2Jyb3dzZXJWZXJzaW9uOiBudWxsLFxuXG4gICAgICAgIF9kZXRlY3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9icm93c2VyTmFtZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCwgdGVtLFxuICAgICAgICAgICAgICAgIE0gPSB1YS5tYXRjaCgvKG9wZXJhfGNocm9tZXxzYWZhcml8ZmlyZWZveHxtc2llfHRyaWRlbnQoPz1cXC8pKVxcLz9cXHMqKFxcZCspL2kpIHx8IFtdO1xuICAgICAgICAgICAgaWYgKC90cmlkZW50L2kudGVzdChNWzFdKSkge1xuICAgICAgICAgICAgICAgIHRlbSA9IC9cXGJydlsgOl0rKFxcZCspL2cuZXhlYyh1YSkgfHwgW107XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9icm93c2VyTmFtZSA9ICd0cmlkZW50JztcbiAgICAgICAgICAgICAgICB0aGlzLl9icm93c2VyVmVyc2lvbiA9IHRlbVsxXSB8fCAxO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChNWzFdID09PSAnQ2hyb21lJykge1xuICAgICAgICAgICAgICAgIHRlbSA9IHVhLm1hdGNoKC9cXGIoT1BSfEVkZ2UpXFwvKFxcZCspLyk7XG4gICAgICAgICAgICAgICAgaWYgKHRlbSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJOYW1lID0gdGVtWzFdLnJlcGxhY2UoJ09QUicsICdPcGVyYScpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gdGVtWzJdIHx8IDE7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBNID0gTVsyXSA/IFtNWzFdLCBNWzJdXSA6IFtuYXZpZ2F0b3IuYXBwTmFtZSwgbmF2aWdhdG9yLmFwcFZlcnNpb24sICctPyddO1xuICAgICAgICAgICAgaWYgKCh0ZW0gPSB1YS5tYXRjaCgvdmVyc2lvblxcLyhcXGQrKS9pKSkgIT0gbnVsbCkgTS5zcGxpY2UoMSwgMSwgdGVtWzFdKTtcblxuICAgICAgICAgICAgdGhpcy5fYnJvd3Nlck5hbWUgPSBNWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB0aGlzLl9icm93c2VyVmVyc2lvbiA9IE1bMV0gfHwgMTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0lFOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXRlY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9icm93c2VyTmFtZSA9PT0gJ21zaWUnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1dlYmtpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXNDaHJvbWUoKSB8fCB0aGlzLmlzU2FmYXJpKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNDaHJvbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnY2hyb21lJyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNTYWZhcmk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnc2FmYXJpJyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNGaXJlZm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLl9kZXRlY3QoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9icm93c2VyTmFtZSA9PT0gJ2ZpcmVmb3gnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1RyaWRlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAndHJpZGVudCcgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzRmlsZURyb3BTdXBwb3J0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAnZHJhZ2dhYmxlJyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJykgJiYgdHlwZW9mIHdpbmRvdy5GaWxlUmVhZGVyICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgfVxuXG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXInLCAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIgKi97XG5cbiAgICAgICAgY3JlYXRlT2JqZWN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5jbGFzc05hbWUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdXcm9uZyBjb25maWd1cmF0aW9uIGZvciBjcmVhdGUgb2JqZWN0LicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25maWcgPSB0aGlzLl9fc3RhdGljLmNsb25lKGNvbmZpZyk7XG4gICAgICAgICAgICB2YXIgY2xhc3NOYW1lID0gY29uZmlnLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIGRlbGV0ZSBjb25maWcuY2xhc3NOYW1lO1xuXG4gICAgICAgICAgICAvLyBHZXQgY2xhc3NcbiAgICAgICAgICAgIHZhciBvYmplY3RDbGFzcyA9IEZpbGVVcC5OZWF0bmVzcy5uYW1lc3BhY2UoY2xhc3NOYW1lKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0Q2xhc3MgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdOb3QgZm91bmQgY2xhc3MgYCcgKyBjbGFzc05hbWUgKyAnYCBmb3IgY3JlYXRlIGluc3RhbmNlLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IG9iamVjdENsYXNzKGNvbmZpZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBvYmplY3RcbiAgICAgICAgICogQHBhcmFtIGNvbmZpZ1xuICAgICAgICAgKi9cbiAgICAgICAgY29uZmlndXJlOiBmdW5jdGlvbiAob2JqZWN0LCBjb25maWcpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBjb25maWcpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWNvbmZpZy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEdlbmVyYXRlIHNldHRlciBuYW1lXG4gICAgICAgICAgICAgICAgdmFyIHNldHRlciA9ICdzZXQnICsga2V5LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsga2V5LnNsaWNlKDEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rbc2V0dGVyXSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRmlsZVVwLmJhc2UuRXhjZXB0aW9uKCdZb3UgY2FuIG5vdCByZXBsYWNlIGZyb20gY29uZmlnIGZ1bmN0aW9uIGAnICsga2V5ICsgJ2AgaW4gb2JqZWN0IGAnICsgb2JqZWN0LmNsYXNzTmFtZSgpICsgJ2AuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdFtrZXldID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignQ29uZmlnIHBhcmFtIGAnICsga2V5ICsgJ2AgaXMgdW5kZWZpbmVkIGluIG9iamVjdCBgJyArIG9iamVjdC5jbGFzc05hbWUoKSArICdgLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9iamVjdFtrZXldICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc1NpbXBsZU9iamVjdChvYmplY3Rba2V5XSkgJiYgdGhpcy5faXNTaW1wbGVPYmplY3Qob2JqZWN0W2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IHRoaXMuX19zdGF0aWMubWVyZ2Uob2JqZWN0W2tleV0sIGNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gY29uZmlnW2tleV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBvYmplY3Rbc2V0dGVyXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBvYmplY3Rbc2V0dGVyXS5jYWxsKG9iamVjdCwgY29uZmlnW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtvYmplY3QuLi59IFtvYmpdXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBtZXJnZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGRzdCA9IHt9O1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgICAgICAgICBvYmogPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNTaW1wbGVPYmplY3Qob2JqW2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHN0W2tleV0gPSB0aGlzLl9fc3RhdGljLm1lcmdlKGRzdFtrZXldLCBvYmpba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gb2JqW2tleV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBkc3Q7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAgICAgICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIGNsb25lOiBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgICAgICB2YXIgY2xvbmUgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvbmVba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjbG9uZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNTaW1wbGVPYmplY3Q6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJiAhKG9iaiBpbnN0YW5jZW9mIEFycmF5KSAmJiBvYmouY29uc3RydWN0b3IgPT09IE9iamVjdDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAubWFuYWdlcnMuUXVldWVNYW5hZ2VyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5NYW5hZ2VyXG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlcicsIC8qKiBAbGVuZHMgRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk1hbmFnZXIsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XG4gICAgICAgIHRoaXMuY29sbGVjdGlvbi5vbihbXG4gICAgICAgICAgICBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbi5FVkVOVF9BREQsXG4gICAgICAgICAgICBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbi5FVkVOVF9JVEVNX0VORFxuICAgICAgICBdLCB0aGlzLl9xdWV1ZU5leHQuYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIF9xdWV1ZU5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmlsZSA9IHRoaXMuY29sbGVjdGlvbi5nZXROZXh0Rm9yVXBsb2FkKCk7XG4gICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICBmaWxlLnN0YXJ0KCk7XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZU5leHQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5GaWxlXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnRcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAubW9kZWxzLkZpbGUnLCAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZS5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZSAqL3tcblxuICAgICAgICBTVEFUVVNfUVVFVUU6ICdxdWV1ZScsXG4gICAgICAgIFNUQVRVU19QUk9DRVNTOiAncHJvY2VzcycsXG4gICAgICAgIFNUQVRVU19QQVVTRTogJ3BhdXNlJyxcbiAgICAgICAgU1RBVFVTX0VORDogJ2VuZCcsXG5cbiAgICAgICAgUkVTVUxUX1NVQ0NFU1M6ICdzdWNjZXNzJyxcbiAgICAgICAgUkVTVUxUX0VSUk9SOiAnZXJyb3InLFxuXG4gICAgICAgIEVWRU5UX1NUQVRVUzogJ3N0YXR1cycsXG4gICAgICAgIEVWRU5UX1BST0dSRVNTOiAncHJvZ3Jlc3MnXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGV9XG4gICAgICovXG4gICAgX25hdGl2ZTogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzc31cbiAgICAgKi9cbiAgICBwcm9ncmVzczoge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzcydcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfVxuICAgICAqL1xuICAgIF91cGxvYWRlcjogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgX3BhdGg6ICcnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBfYnl0ZXNVcGxvYWRlZDogMCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgX2J5dGVzVXBsb2FkRW5kOiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBfYnl0ZXNUb3RhbDogMCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgX3N0YXR1czogJ3F1ZXVlJyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgKi9cbiAgICBfcmVzdWx0OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxuICAgICAqL1xuICAgIF9yZXN1bHRIdHRwU3RhdHVzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxuICAgICAqL1xuICAgIF9yZXN1bHRIdHRwTWVzc2FnZTogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIubWVyZ2UoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiB0aGlzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0aGlzLnByb2dyZXNzXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRSkge1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuX3NldFN0YXR1cyh0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRSk7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91cGxvYWRlci5zdG9wKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldE5hdGl2ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5fbmF0aXZlID0gdmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge0ZpbGV9XG4gICAgICovXG4gICAgZ2V0TmF0aXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRQYXRoOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLl9wYXRoID0gdmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRQYXRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhdGg7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXROYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHBhdGggPSB0aGlzLmdldFBhdGgoKTtcbiAgICAgICAgdmFyIG1hdGNoZXMgPSAvW15cXC9cXFxcXSskLy5leGVjKHBhdGgpO1xuXG4gICAgICAgIHJldHVybiBtYXRjaGVzID8gbWF0Y2hlc1swXS5yZXBsYWNlKC9eKFteP10rKS4qJC8sICckMScpIDogcGF0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldFVwbG9hZGVyOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fdXBsb2FkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX3VwbG9hZGVyLnN0b3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyID0gdmFsdWU7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfU1RBUlQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXMgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fcmVzdWx0SHR0cE1lc3NhZ2UgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdHVzKHRoaXMuX19zdGF0aWMuU1RBVFVTX1BST0NFU1MpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLm9uKEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLkVWRU5UX0VSUk9SLCBmdW5jdGlvbihzdGF0dXMsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbdGhpc10pO1xuXG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9fc3RhdGljLlJFU1VMVF9FUlJPUjtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfRU5EKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zZXRCeXRlc1VwbG9hZGVkKHRoaXMuZ2V0Qnl0ZXNUb3RhbCgpKTtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbdGhpc10pO1xuXG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9fc3RhdGljLlJFU1VMVF9TVUNDRVNTO1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdHVzKHRoaXMuX19zdGF0aWMuU1RBVFVTX0VORCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfUFJPR1JFU1MsIGZ1bmN0aW9uKGJ5dGVzVXBsb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MuYWRkKGJ5dGVzVXBsb2FkZWQpO1xuICAgICAgICAgICAgdGhpcy5zZXRCeXRlc1VwbG9hZGVkKGJ5dGVzVXBsb2FkZWQpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlcn1cbiAgICAgKi9cbiAgICBnZXRVcGxvYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGxvYWRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1VwbG9hZGVkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNVcGxvYWRlZCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVXBsb2FkZWQgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFt0aGlzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1VwbG9hZGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2J5dGVzVXBsb2FkZWQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gICAgICovXG4gICAgc2V0Qnl0ZXNVcGxvYWRFbmQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLl9ieXRlc1VwbG9hZEVuZCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVXBsb2FkRW5kID0gdmFsdWU7XG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbdGhpc10pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Qnl0ZXNVcGxvYWRFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYnl0ZXNVcGxvYWRFbmQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlXG4gICAgICovXG4gICAgc2V0Qnl0ZXNUb3RhbDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX2J5dGVzVG90YWwgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9ieXRlc1RvdGFsID0gdmFsdWU7XG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTLCBbdGhpc10pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Qnl0ZXNUb3RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1RvdGFsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0UmVzdWx0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1Jlc3VsdFN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0ID09PSB0aGlzLl9fc3RhdGljLlJFU1VMVF9TVUNDRVNTO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzUmVzdWx0RXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0ID09PSB0aGlzLl9fc3RhdGljLlJFU1VMVF9FUlJPUjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfG51bGx9XG4gICAgICovXG4gICAgZ2V0UmVzdWx0SHR0cFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHRIdHRwU3RhdHVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH1cbiAgICAgKi9cbiAgICBnZXRSZXN1bHRIdHRwTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1F1ZXVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUVVFVUU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNTdGF0dXNQcm9jZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUFJPQ0VTUztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1BhdXNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUEFVU0U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNTdGF0dXNFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19FTkQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgIH0sXG5cbiAgICBfc2V0U3RhdHVzOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhdHVzID0gdmFsdWU7XG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1NUQVRVUywgW3RoaXMsIHRoaXMuX3N0YXR1c10pO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5GaWxlUHJvZ3Jlc3NcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzJywgLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzcy5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgc3BlZWRNaW5NZWFzdXJlbWVudDogMixcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgc3BlZWRNYXhNZWFzdXJlbWVudDogNSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGV9XG4gICAgICovXG4gICAgZmlsZTogbnVsbCxcblxuICAgIF9oaXN0b3J5OiBbXSxcblxuICAgIF9sYXN0VGltZTogbnVsbCxcblxuICAgIGFkZDogZnVuY3Rpb24oYnl0ZXNVcGxvYWRlZCkge1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgICB0aGlzLl9oaXN0b3J5LnB1c2goe1xuICAgICAgICAgICAgYnl0ZXM6IGJ5dGVzVXBsb2FkZWQgLSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpLFxuICAgICAgICAgICAgZHVyYXRpb246IHRoaXMuX2xhc3RUaW1lID8gbm93IC0gdGhpcy5fbGFzdFRpbWUgOiBudWxsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sYXN0VGltZSA9IG5vdztcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9oaXN0b3J5ID0gW107XG4gICAgICAgIHRoaXMuX2xhc3RUaW1lID0gbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn0gU2Vjb25kc1xuICAgICAqL1xuICAgIGdldFRpbWVMZWZ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGJ5dGVzVG90YWwgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNUb3RhbCgpO1xuICAgICAgICBpZiAoYnl0ZXNUb3RhbCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3BlZWQgPSB0aGlzLmdldFNwZWVkKCk7XG4gICAgICAgIGlmIChzcGVlZCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYnl0ZXNVcGxvYWRlZCA9IHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCk7XG5cbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCgoYnl0ZXNUb3RhbCAtIGJ5dGVzVXBsb2FkZWQpIC8gc3BlZWQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBCeXRlcyBpbiBzZWNvbmRcbiAgICAgKi9cbiAgICBnZXRTcGVlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLl9oaXN0b3J5Lmxlbmd0aCA8IHRoaXMuc3BlZWRNaW5NZWFzdXJlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgbGFzdCBkaWZmIHZhbHVlc1xuICAgICAgICB2YXIgaGlzdG9yeSA9IHRoaXMuX2hpc3Rvcnkuc2xpY2UoLTEgKiB0aGlzLnNwZWVkTWF4TWVhc3VyZW1lbnQpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhdmVyYWdlIHVwbG9hZCBzcGVlZFxuICAgICAgICB2YXIgc3VtbWFyeUJ5dGVzID0gMDtcbiAgICAgICAgdmFyIHN1bW1hcnlEdXJhdGlvbiA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaGlzdG9yeS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN1bW1hcnlCeXRlcyArPSBoaXN0b3J5W2ldLmJ5dGVzO1xuICAgICAgICAgICAgc3VtbWFyeUR1cmF0aW9uICs9IGhpc3RvcnlbaV0uZHVyYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VtbWFyeUJ5dGVzID09PSAwIHx8IHN1bW1hcnlEdXJhdGlvbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChzdW1tYXJ5Qnl0ZXMgLyAoc3VtbWFyeUR1cmF0aW9uIC8gMTAwMCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldFBlcmNlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnl0ZXNUb3RhbCA9IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCk7XG4gICAgICAgIGlmIChieXRlc1RvdGFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBieXRlc1VwbG9hZGVkID0gdGhpcy5maWxlLmdldEJ5dGVzVXBsb2FkZWQoKTtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoYnl0ZXNVcGxvYWRlZCAqIDEwMCAvIGJ5dGVzVG90YWwpO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb25cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uJywgLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbi5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uICove1xuXG4gICAgICAgIEVWRU5UX0FERDogJ2FkZCcsXG4gICAgICAgIEVWRU5UX1JFTU9WRTogJ3JlbW92ZScsXG4gICAgICAgIEVWRU5UX0lURU1fRU5EOiAnaXRlbV9lbmQnXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBtYXhDb25jdXJyZW50VXBsb2FkczogMyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGVbXX1cbiAgICAgKi9cbiAgICBfZmlsZXM6IFtdLFxuXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX29uU3RhdHVzQ2hhbmdlID0gdGhpcy5fb25TdGF0dXNDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGVbXX0gZmlsZXNcbiAgICAgKi9cbiAgICBhZGQ6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICB0aGlzLl9maWxlcyA9IHRoaXMuX2ZpbGVzLmNvbmNhdChmaWxlcyk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGZpbGVzW2ldLm9uKEZpbGVVcC5tb2RlbHMuRmlsZS5FVkVOVF9TVEFUVVMsIHRoaXMuX29uU3RhdHVzQ2hhbmdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0FERCwgW2ZpbGVzXSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGVbXX0gZmlsZXNcbiAgICAgKi9cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChmaWxlcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmlsZXMuaW5kZXhPZihmaWxlc1tpXSk7XG4gICAgICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZmlsZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkyID0gMCwgbDIgPSBmaWxlcy5sZW5ndGg7IGkyIDwgbDI7IGkyKyspIHtcbiAgICAgICAgICAgIGZpbGVzW2kyXS5vZmYoRmlsZVVwLm1vZGVscy5GaWxlLkVWRU5UX1NUQVRVUywgdGhpcy5fb25TdGF0dXNDaGFuZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUkVNT1ZFLCBbZmlsZXNdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldENvdW50QnlTdGF0dXM6IGZ1bmN0aW9uIChzdGF0dXMpIHtcbiAgICAgICAgdmFyIGlDb3VudCA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZmlsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsZXNbaV0uZ2V0U3RhdHVzKCkgPT09IHN0YXR1cykge1xuICAgICAgICAgICAgICAgIGlDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpQ291bnQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFNlYXJjaCBmaWxlIGZvciBuZXh0IHVwbG9hZGluZ1xuICAgICAqIEByZXR1cm5zIHtGaWxlVXAubW9kZWxzLkZpbGV8bnVsbH1cbiAgICAgKi9cbiAgICBnZXROZXh0Rm9yVXBsb2FkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmdldENvdW50QnlTdGF0dXMoRmlsZVVwLm1vZGVscy5GaWxlLlNUQVRVU19QUk9DRVNTKSA+PSB0aGlzLm1heENvbmN1cnJlbnRVcGxvYWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZmlsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsZXNbaV0uaXNTdGF0dXNRdWV1ZSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGV9IGZpbGVcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgX29uU3RhdHVzQ2hhbmdlOiBmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgIGlmIChmaWxlLmlzU3RhdHVzRW5kKCkpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0lURU1fRU5ELCBbZmlsZV0pO1xuICAgICAgICB9XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJcclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIEVWRU5UX1NUQVJUOiAnc3RhcnQnLFxyXG4gICAgICAgIEVWRU5UX1BST0dSRVNTOiAncHJvZ3Jlc3MnLFxyXG4gICAgICAgIEVWRU5UX0VSUk9SOiAnZXJyb3InLFxyXG4gICAgICAgIEVWRU5UX0VORF9QQVJUOiAnZW5kX3BhcnQnLFxyXG4gICAgICAgIEVWRU5UX0VORDogJ2VuZCcsXHJcblxyXG4gICAgICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdXJsOiAnJyxcclxuXHJcbiAgICBzdGFydDogZnVuY3Rpb24oKSB7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgfSxcclxuXHJcbiAgICBpc1Byb2dyZXNzU3VwcG9ydDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxufSk7XHJcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTk6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbnJlcXVpcmUoJy4vQmFzZVVwbG9hZGVyJyk7XHJcblxyXG4vKipcclxuICogQGNsYXNzIEZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXJcclxuICogQGV4dGVuZHMgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJcclxuICovXHJcbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlcicsIC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlci5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlcixcclxuXHJcbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLklmcmFtZVVwbG9hZGVyICove1xyXG5cclxuICAgICAgICBfQ291bnRlcjogMFxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGV9XHJcbiAgICAgKi9cclxuICAgIGZpbGU6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybX1cclxuICAgICAqL1xyXG4gICAgZm9ybTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgY29udGFpbmVyOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgbmFtZVByZWZpeDogJ0ZpbGVVcElmcmFtZScsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBfbmFtZTogJycsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIF93cmFwcGVyOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBfZnJhbWU6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfG51bGx9XHJcbiAgICAgKi9cclxuICAgIF9mcmFtZUxvYWRUaW1lcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBfaXNGcmFtZUxvYWRlZDogZmFsc2UsXHJcblxyXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy8gR2VuZXJhdGUgbmFtZVxyXG4gICAgICAgIHRoaXMuX25hbWUgPSB0aGlzLm5hbWVQcmVmaXggKyAoKyt0aGlzLl9fc3RhdGljLl9Db3VudGVyKTtcclxuXHJcbiAgICAgICAgLy8gSW5pdCBjb250YWluZXJcclxuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IHRoaXMuY29udGFpbmVyIHx8IGRvY3VtZW50LmJvZHk7XHJcblxyXG4gICAgICAgIC8vIFJlbmRlciBmcmFtZVxyXG4gICAgICAgIHRoaXMuX2luaXRDb250YWluZXIoKTtcclxuICAgICAgICB0aGlzLl9pbml0RnJhbWUoKTtcclxuICAgICAgICBcclxuICAgIH0sXHJcblxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBTdGFydCB1cGxvYWRcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVEFSVCk7XHJcbiAgICAgICAgdGhpcy5mb3JtLnN1Ym1pdCh0aGlzLnVybCwgdGhpcy5fbmFtZSk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFyVGltZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2ZyYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lLm9ubG9hZCA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZyYW1lLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XHJcblxyXG4gICAgICAgICAgICB0aGlzLl93cmFwcGVyLnJlbW92ZUNoaWxkKHRoaXMuX2ZyYW1lKTtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2ZyYW1lO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9pbml0Q29udGFpbmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl93cmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS53aWR0aCA9IDA7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS5oZWlnaHQgPSAwO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUudG9wID0gJy0xMDBweCc7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS5sZWZ0ID0gJy0xMDBweCc7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG5cclxuICAgICAgICB0aGlzLmNvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl93cmFwcGVyKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2luaXRGcmFtZTogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBpc0NyZWF0ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgaXNJRSA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpO1xyXG5cclxuICAgICAgICBpZiAoaXNJRSAmJiBpc0lFIDwgMTApIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnPGlmcmFtZSBuYW1lPVwiJyArIHRoaXMuX25hbWUgKyAnXCI+Jyk7XHJcbiAgICAgICAgICAgICAgICBpc0NyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBJdCBzZWVtcyBJRTkgaW4gY29tcGF0YWJpbGl0eSBtb2RlLlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWlzQ3JlYXRlZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZS5uYW1lID0gdGhpcy5fbmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX2ZyYW1lLnNyYyA9ICdqYXZhc2NyaXB0Ont9Oyc7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlci5hcHBlbmRDaGlsZCh0aGlzLl9mcmFtZSk7XHJcblxyXG4gICAgICAgIC8vIFN1YnNjcmliZSBvbiBpZnJhbWUgbG9hZCBldmVudHNcclxuICAgICAgICB0aGlzLl9mcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB0aGlzLl9vblJlYWR5U3RhdGVDaGFuZ2UuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLl9mcmFtZS5vbmxvYWQgPSB0aGlzLl9vbkxvYWQuYmluZCh0aGlzKTtcclxuICAgIH0sXHJcblxyXG4gICAgX29uUmVhZHlTdGF0ZUNoYW5nZTogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMuX2ZyYW1lLnJlYWR5U3RhdGUpIHtcclxuICAgICAgICAgICAgY2FzZSAnY29tcGxldGUnOlxyXG4gICAgICAgICAgICBjYXNlICdpbnRlcmFjdGl2ZSc6XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jbGVhclRpbWVyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZUxvYWRUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudC5ib2R5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9Mb2FkSGFuZGxlcihldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9vblJlYWR5U3RhdGVDaGFuZ2UoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9vbkxvYWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5fY2xlYXJUaW1lcigpO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBhbHJlYWR5IGxvYWRlZFxyXG4gICAgICAgIGlmICh0aGlzLl9pc0ZyYW1lTG9hZGVkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5faXNGcmFtZUxvYWRlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIHZhciBkb2N1bWVudCA9IG51bGw7XHJcbiAgICAgICAgdmFyIHN0YXR1cyA9IG51bGw7XHJcbiAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9ICcnO1xyXG5cclxuICAgICAgICAvLyBDYXRjaCBpZnJhbWUgbG9hZCBlcnJvciBpbiBGaXJlZm94LlxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50ID0gdGhpcy5fZnJhbWUuY29udGVudFdpbmRvdy5kb2N1bWVudDtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgc3RhdHVzID0gNDAzO1xyXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBlLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXN0YXR1cykge1xyXG4gICAgICAgICAgICB2YXIgdGV4dCA9IGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0IHx8IGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICBpZiAodGV4dC50b0xvd2VyQ2FzZSgpICE9PSAnb2snICYmIHRleHQgIT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXhwID0gL1s0NV1bMC05XXsyfS87XHJcbiAgICAgICAgICAgICAgICBzdGF0dXMgPSAoZG9jdW1lbnQudGl0bGUubWF0Y2gocmVnZXhwKSB8fCB0ZXh0Lm1hdGNoKHJlZ2V4cCkgfHwgWzUwMF0pWzBdO1xyXG4gICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZG9jdW1lbnQudGl0bGUgKyAnXFxuJyArIGRvY3VtZW50LmJvZHkuaW5uZXJUZXh0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gMjAxOyAvLyBDcmVhdGVkXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0dXMgPj0gMjAwICYmIHN0YXR1cyA8IDMwMCkge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FTkQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VSUk9SLCBbc3RhdHVzLCBlcnJvck1lc3NhZ2VdKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9jbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5fZnJhbWVMb2FkVGltZXIpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2ZyYW1lTG9hZFRpbWVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59KTtcclxuXG59LHtcIi4uL0ZpbGVVcFwiOjIsXCIuL0Jhc2VVcGxvYWRlclwiOjE4fV0sMjA6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbnJlcXVpcmUoJy4vQmFzZVVwbG9hZGVyJyk7XHJcblxyXG4vKipcclxuICogQGNsYXNzIEZpbGVVcC51cGxvYWRlcnMuWGhyVXBsb2FkZXJcclxuICogQGV4dGVuZHMgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJcclxuICovXHJcbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlcicsIC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlci5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlcixcclxuXHJcbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyICove1xyXG5cclxuICAgICAgICBpc1Byb2dyZXNzU3VwcG9ydDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgbWV0aG9kOiAnUFVUJyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGV9XHJcbiAgICAgKi9cclxuICAgIGZpbGU6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBtaW5Qcm9ncmVzc1VwZGF0ZUludGVydmFsTXM6IDUwMCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgaXMgSUlTIG1heCBodHRwUnVudGltZUBtYXhSZXF1ZXN0TGVuZ3RoIHZhbHVlIHdoaWNoIGlzIDIxNDc0ODI2MjQgS2JcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGJ5dGVzTWF4UGFydDogMjA5NzE1MSAqIDEwMjQsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBfbGFzdFJlcG9ydFRpbWU6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7WE1MSHR0cFJlcXVlc3R9XHJcbiAgICAgKi9cclxuICAgIF94aHI6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxyXG4gICAgICovXHJcbiAgICBfYnl0ZXNTdGFydDogMCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ8bnVsbH1cclxuICAgICAqL1xyXG4gICAgX2J5dGVzRW5kOiBudWxsLFxyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5faW5pdFhocigpO1xyXG4gICAgICAgIHRoaXMuX3N0YXJ0SW50ZXJuYWwoKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3hocikge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5feGhyLnVwbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLnVwbG9hZC5vbnByb2dyZXNzID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLl94aHIub25yZWFkeXN0YXRlY2hhbmdlID0gbnVsbDtcclxuICAgICAgICAgICAgdGhpcy5feGhyLmFib3J0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9fc3VwZXIoKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgWEhSIG9iamVjdCBhbmQgc3Vic2NyaWJlIG9uIGl0IGV2ZW50c1xyXG4gICAgICogQHByaXZhdGVcclxuICAgICAqL1xyXG4gICAgX2luaXRYaHI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLl94aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICB0aGlzLl94aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSB0aGlzLl9vblByb2dyZXNzLmJpbmQodGhpcyk7XHJcbiAgICAgICAgdGhpcy5feGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IHRoaXMuX29uUmVhZHlTdGF0ZUNoYW5nZS5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX3hoci5vcGVuKHRoaXMubWV0aG9kLCB0aGlzLnVybCwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzV2Via2l0KCkgfHwgRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc1RyaWRlbnQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIklmLU5vbmUtTWF0Y2hcIiwgXCIqXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIklmLU1vZGlmaWVkLVNpbmNlXCIsIFwiTW9uLCAyNiBKdWwgMTk5NyAwNTowMDowMCBHTVRcIik7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ2FjaGUtQ29udHJvbFwiLCBcIm5vLWNhY2hlXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIlgtUmVxdWVzdGVkLVdpdGhcIiwgXCJYTUxIdHRwUmVxdWVzdFwiKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIF9zdGFydEludGVybmFsOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVEFSVCk7XHJcblxyXG4gICAgICAgIC8vIFNldCBmaWxlIG5hbWVcclxuICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50OyBmaWxlbmFtZT1cIicgKyBlbmNvZGVVUkkodGhpcy5maWxlLmdldE5hbWUoKSkgKyAnXCInKTtcclxuXHJcbiAgICAgICAgdmFyIGlzRkYgPSBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzRmlyZWZveCgpO1xyXG4gICAgICAgIGlmIChpc0ZGICYmIGlzRkYgPCA3KSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kQXNCaW5hcnkodGhpcy5maWxlLmdldE5hdGl2ZSgpLmdldEFzQmluYXJ5KCkpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgYnl0ZXNUb3RhbCA9IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCk7XHJcblxyXG4gICAgICAgIHRoaXMuX2J5dGVzU3RhcnQgPSB0aGlzLmZpbGUuZ2V0Qnl0ZXNVcGxvYWRlZCgpO1xyXG4gICAgICAgIHRoaXMuX2J5dGVzRW5kID0gTWF0aC5taW4odGhpcy5fYnl0ZXNTdGFydCArIHRoaXMuYnl0ZXNNYXhQYXJ0LCBieXRlc1RvdGFsKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuX2J5dGVzU3RhcnQgJiYgdGhpcy5fYnl0ZXNTdGFydCA+PSBieXRlc1RvdGFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VORCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENoZWNrIHBhcnRpYWwgdXBsb2FkXHJcbiAgICAgICAgaWYgKHRoaXMuX2J5dGVzU3RhcnQgPiAwIHx8IHRoaXMuX2J5dGVzRW5kIDwgYnl0ZXNUb3RhbCkge1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1SYW5nZScsICdieXRlcyAnICsgdGhpcy5fYnl0ZXNTdGFydCArICctJyArICh0aGlzLl9ieXRlc0VuZCAtIDEpICsgJy8nICsgYnl0ZXNUb3RhbCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5fYnl0ZXNFbmQgPCBieXRlc1RvdGFsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl94aHIuc2VuZCh0aGlzLmZpbGUuZ2V0TmF0aXZlKCkuc2xpY2UodGhpcy5fYnl0ZXNTdGFydCwgdGhpcy5fYnl0ZXNFbmQpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3hoci5zZW5kKHRoaXMuZmlsZS5nZXROYXRpdmUoKS5zbGljZSh0aGlzLl9ieXRlc1N0YXJ0KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2VuZCh0aGlzLmZpbGUuZ2V0TmF0aXZlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XHJcbiAgICAgKiBAcHJvdGVjdGVkXHJcbiAgICAgKi9cclxuICAgIF9vblByb2dyZXNzOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHZhciBpTm93ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcclxuICAgICAgICBpZiAodGhpcy5fbGFzdFJlcG9ydFRpbWUgJiYgaU5vdyAtIHRoaXMuX2xhc3RSZXBvcnRUaW1lIDwgdGhpcy5taW5Qcm9ncmVzc1VwZGF0ZUludGVydmFsTXMpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLl9sYXN0UmVwb3J0VGltZSA9IGlOb3c7XHJcblxyXG4gICAgICAgIHZhciBieXRlc1VwbG9hZGVkID0gdGhpcy5fYnl0ZXNTdGFydCArIGV2ZW50LmxvYWRlZDtcclxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9QUk9HUkVTUywgW2J5dGVzVXBsb2FkZWRdKTtcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGV2ZW50XHJcbiAgICAgKiBAcHJvdGVjdGVkXHJcbiAgICAgKi9cclxuICAgIF9vblJlYWR5U3RhdGVDaGFuZ2U6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX3hoci5yZWFkeVN0YXRlICE9PSA0KSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl94aHIuc3RhdHVzID49IDIwMCAmJiB0aGlzLl94aHIuc3RhdHVzIDwgMzAwKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9ieXRlc0VuZCA8IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsZS5zZXRCeXRlc1VwbG9hZGVkKHRoaXMuX2J5dGVzRW5kKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VORF9QQVJUKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VORCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgZXJyb3JNZXNzYWdlID0gdGhpcy5feGhyLnJlc3BvbnNlVGV4dCB8fCB0aGlzLl94aHIuc3RhdHVzVGV4dDtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFt0aGlzLl94aHIuc3RhdHVzLCBlcnJvck1lc3NhZ2VdKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vQmFzZVVwbG9hZGVyXCI6MTh9XSwyMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vc3JjL05lYXRuZXNzJyk7XG59LHtcIi4vc3JjL05lYXRuZXNzXCI6MjR9XSwyMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oTmVhdG5lc3MpIHtcblxuXHRyZXR1cm4gTmVhdG5lc3MuY3JlYXRlQ2xhc3MoJ05lYXRuZXNzLkV4Y2VwdGlvbicsIC8qKiBAbGVuZHMgTmVhdG5lc3MuRXhjZXB0aW9uLnByb3RvdHlwZSAqL3tcblxuXHRcdF9fZXh0ZW5kczogRXJyb3IsXG5cblx0XHQvKipcblx0XHQgKiBUZXh0IG1lc3NhZ2Vcblx0XHQgKiBAdHlwZSB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdG1lc3NhZ2U6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBFeHRyYSBpbmZvcm1hdGlvbiBkdW1wc1xuXHRcdCAqIEB0eXBlIHtBcnJheX1cblx0XHQgKi9cblx0XHRleHRyYTogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIEJhc2UgY2xhc3MgZm9yIGltcGxlbWVudCBleGNlcHRpb24uIFRoaXMgY2xhc3MgZXh0ZW5kIGZyb20gbmF0aXZlIEVycm9yIGFuZCBzdXBwb3J0XG5cdFx0ICogc3RhY2sgdHJhY2UgYW5kIG1lc3NhZ2UuXG5cdFx0ICogQGNvbnN0cnVjdHNcblx0XHQgKiBAZXh0ZW5kcyBFcnJvclxuXHRcdCAqL1xuXHRcdGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuXHRcdFx0aWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdFx0XHRcdEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHRoaXMuY29uc3RydWN0b3IgfHwgdGhpcyk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcblx0XHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgfHwgJyc7XG5cblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuXHRcdFx0XHR0aGlzLmV4dHJhID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5fX3N1cGVyKCk7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqXG5cdFx0ICogQHJldHVybnMge3N0cmluZ31cblx0XHQgKi9cblx0XHR0b1N0cmluZzogZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMubWVzc2FnZTtcblx0XHR9XG5cblx0fSk7XG5cbn07XG59LHt9XSwyMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oTmVhdG5lc3MpIHtcblxuXHQvKipcblx0ICogQmFzZSBjbGFzcy4gRXh0ZW5kIGFsbCB5b3UgYmFzZSBjbGFzc2VzIGZyb20gdGhpcyBjbGFzcyBmb3IgdHJ1ZSBuYXZpZ2F0aW9uIGluIElERVxuXHQgKiBhbmQgc3VwcG9ydCBtZXRob2RzIHN1Y2ggYXMge0BsaW5rIE5lYXRuZXNzLk9iamVjdCNjbGFzc05hbWV9XG5cdCAqIEBjbGFzcyBOZWF0bmVzcy5PYmplY3Rcblx0ICovXG5cdHJldHVybiBOZWF0bmVzcy5jcmVhdGVDbGFzcygnTmVhdG5lc3MuT2JqZWN0Jywge1xuXG5cdFx0LyoqXG5cdFx0ICogTGluayB0byB1c2VkIGNsYXNzLiBJZiB5b3UgYWNjZXNzIHRvIHRoaXMgcHJvcGVydHkgaW4gZXh0ZW5kcyBjbGFzc2VzLCB0aGVuIHlvdSBnaXZlIHRvcC1sZXZlbCBjbGFzcy5cblx0XHQgKiBAdHlwZSB7Kn1cblx0XHQgKi9cblx0XHRfX3N0YXRpYzogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIEZ1bGwgY3VycmVudCBjbGFzcyBuYW1lIHdpdGggbmFtZXNwYWNlXG5cdFx0ICogQGV4YW1wbGUgUmV0dXJucyB2YWx1ZSBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUNsYXNzXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKiBAcHJvdGVjdGVkXG5cdFx0ICovXG5cdFx0X19jbGFzc05hbWU6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBVbmlxdWUgaW5zdGFuY2UgbmFtZVxuXHRcdCAqIEBleGFtcGxlIFJldHVybnMgdmFsdWUgZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzczUwXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKiBAcHJvdGVjdGVkXG5cdFx0ICovXG5cdFx0X19pbnN0YW5jZU5hbWU6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBGdWxsIHBhcmVudCAoZXh0ZW5kcykgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlIFJldHVybnMgdmFsdWUgZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlCYXNlQ2xhc3Ncblx0XHQgKiBAdHlwZSB7c3RyaW5nfVxuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKi9cblx0XHRfX3BhcmVudENsYXNzTmFtZTogbnVsbCxcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgZnVsbCBjbGFzcyBuYW1lIHdpdGggbmFtZXNwYWNlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAgYXBwLk15Q2xhc3Ncblx0XHQgKiBAcmV0dXJucyB7c3RyaW5nfVxuXHRcdCAqL1xuXHRcdGNsYXNzTmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fX2NsYXNzTmFtZTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyB1bmlxdWUgaW5zdGFuY2UgbmFtZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUNsYXNzXG5cdFx0ICogQHJldHVybnMge3N0cmluZ31cblx0XHQgKi9cblx0XHRjbGFzc0luc3RhbmNlTmFtZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fX2luc3RhbmNlTmFtZTtcblx0XHR9LFxuXG5cdFx0LyoqXG5cdFx0ICogUmV0dXJucyBmdWxsIHBhcmVudCBjbGFzcyBuYW1lIHdpdGggbmFtZXNwYWNlXG5cdFx0ICogQGV4YW1wbGVcblx0XHQgKiAgYXBwLk15QmFzZUNsYXNzXG5cdFx0ICogQHJldHVybnMge3N0cmluZ31cblx0XHQgKi9cblx0XHRwYXJlbnRDbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX19wYXJlbnRDbGFzc05hbWU7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIENhbGwgcGFyZW50IGNsYXNzIG1ldGhvZHMgdGhyb3VnaCB0aGlzIG1ldGhvZC4gVGhpcyBtZXRob2Qgc3VwcG9ydCBvbmx5IHN5bmNocm9ub3VzIG5lc3RlZCBjYWxscy5cblx0XHQgKiBAcGFyYW0gey4uLip9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9fc3VwZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR9XG5cblx0fSk7XG5cbn07XG5cbn0se31dLDI0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblxyXG52YXIgZXh0ZW5kQ2xhc3MgPSByZXF1aXJlKCcuL2V4dGVuZENsYXNzJyk7XHJcbnZhciBmb3JtYXRzID0gcmVxdWlyZSgnLi9mb3JtYXRzJyk7XHJcblxyXG4vLyBGb3IgLm5vQ29uZmxpY3QoKSBpbXBsZW1lbnRhdGlvblxyXG52YXIgaGFzUHJldmlvdXNOZWF0bmVzcyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnTmVhdG5lc3MnKTtcclxudmFyIHByZXZpb3VzTmVhdG5lc3MgPSBoYXNQcmV2aW91c05lYXRuZXNzID8gd2luZG93Lk5lYXRuZXNzIDogbnVsbDtcclxuXHJcbi8qKlxyXG4gKiBOZWF0bmVzcyBjbGFzc1xyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3NcclxuICovXHJcbnZhciBOZWF0bmVzcyA9IGZ1bmN0aW9uKCkge1xyXG5cclxuXHQvKipcclxuXHQgKlxyXG5cdCAqIEB0eXBlIHtvYmplY3R9XHJcblx0ICovXHJcblx0dGhpcy5fY29udGV4dCA9IHt9O1xyXG5cclxuXHR0aGlzLl9jb250ZXh0S2V5cyA9IHt9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUubmV3Q29udGV4dFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtyZW1vdmVHbG9iYWxdIFNldCB0cnVlIGZvciByZW1vdmUgTmVhdG5lc3Mgb2JqZWN0IGZyb20gd2luZG93IChicm93c2VyIGdsb2JhbCBvYmplY3QpXHJcbiAqIEByZXR1cm5zIHtOZWF0bmVzc31cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5uZXdDb250ZXh0ID0gZnVuY3Rpb24ocmVtb3ZlR2xvYmFsKSB7XHJcblx0cmVtb3ZlR2xvYmFsID0gcmVtb3ZlR2xvYmFsIHx8IGZhbHNlO1xyXG5cclxuXHRpZiAocmVtb3ZlR2xvYmFsKSB7XHJcblx0XHR0aGlzLm5vQ29uZmxpY3QoKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiBuZXcgTmVhdG5lc3MoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm1vdmVDb250ZXh0XHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gbmV3Q29udGV4dCBOZXcgY29udGV4dCBvYmplY3RcclxuICogQHBhcmFtIHtib29sZWFufSBbcmVtb3ZlRnJvbU9sZF0gU2V0IHRydWUgZm9yIHJlbW92ZSBrZXlzIGZyb20gb2xkIGNvbnRleHRcclxuICogQHJldHVybnMge05lYXRuZXNzfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLm1vdmVDb250ZXh0ID0gZnVuY3Rpb24obmV3Q29udGV4dCwgcmVtb3ZlRnJvbU9sZCkge1xyXG5cdHJlbW92ZUZyb21PbGQgPSByZW1vdmVGcm9tT2xkIHx8IGZhbHNlO1xyXG5cclxuXHRmb3IgKHZhciBrZXkgaW4gdGhpcy5fY29udGV4dEtleXMpIHtcclxuXHRcdGlmICh0aGlzLl9jb250ZXh0S2V5cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdG5ld0NvbnRleHRba2V5XSA9IHRoaXMuX2NvbnRleHRba2V5XTtcclxuXHRcdFx0aWYgKHJlbW92ZUZyb21PbGQpIHtcclxuXHRcdFx0XHRkZWxldGUgdGhpcy5fY29udGV4dFtrZXldO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cdHRoaXMuX2NvbnRleHQgPSBuZXdDb250ZXh0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUubm9Db25mbGljdFxyXG4gKiBAcmV0dXJucyB7TmVhdG5lc3N9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xyXG5cdC8vIFJvb3QgbmFtZXNwYWNlIG9iamVjdFxyXG5cdHZhciByb290ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB7fTtcclxuXHJcblx0aWYgKGhhc1ByZXZpb3VzTmVhdG5lc3MpIHtcclxuXHRcdHJvb3QuTmVhdG5lc3MgPSBwcmV2aW91c05lYXRuZXNzO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRkZWxldGUgcm9vdC5OZWF0bmVzcztcclxuXHR9XHJcblxyXG5cdHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUubmFtZXNwYWNlXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIEZ1bGwgbmFtZXNwYWNlIG5hbWVcclxuICogQHJldHVybnMge29iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5uYW1lc3BhY2UgPSBmdW5jdGlvbiAobmFtZSkge1xyXG5cdG5hbWUgPSBuYW1lIHx8ICcnO1xyXG5cclxuXHR2YXIgbmFtZVBhcnRzID0gbmFtZS5zcGxpdCgnLicpO1xyXG5cdHZhciBjdXJyZW50U2NvcGUgPSB0aGlzLl9jb250ZXh0O1xyXG5cclxuXHRpZiAoIW5hbWUpIHtcclxuXHRcdHJldHVybiBjdXJyZW50U2NvcGU7XHJcblx0fVxyXG5cclxuXHQvLyBGaW5kIG9yIGNyZWF0ZVxyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgc2NvcGVOYW1lID0gbmFtZVBhcnRzW2ldO1xyXG5cdFx0aWYgKGkgPT09IDApIHtcclxuXHRcdFx0dGhpcy5fY29udGV4dEtleXNbc2NvcGVOYW1lXSA9IHRydWU7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFjdXJyZW50U2NvcGVbc2NvcGVOYW1lXSkge1xyXG5cdFx0XHRjdXJyZW50U2NvcGVbc2NvcGVOYW1lXSA9IHtcclxuXHRcdFx0XHRfX2NsYXNzTmFtZTogbmFtZVBhcnRzLnNsaWNlKDAsIGkpLmpvaW4oJy4nKSxcclxuXHRcdFx0XHRfX3BhcmVudENsYXNzTmFtZTogbnVsbFxyXG5cdFx0XHR9O1xyXG5cdFx0fVxyXG5cdFx0Y3VycmVudFNjb3BlID0gY3VycmVudFNjb3BlW3Njb3BlTmFtZV07XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gY3VycmVudFNjb3BlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1ldGhvZCBmb3IgZGVmaW5lIGNsYXNzXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUuY3JlYXRlQ2xhc3NcclxuICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbE5hbWVcclxuICogQHBhcmFtIHsoZnVuY3Rpb258b2JqZWN0fG51bGwpfSBvcHRpb25zT3JFeHRlbmRcclxuICogQHBhcmFtIHtvYmplY3R9IFtwcm90b3R5cGVQcm9wZXJ0aWVzXVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BlcnRpZXNdXHJcbiAqIEByZXR1cm4ge29iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5jcmVhdGVDbGFzcyA9IGZ1bmN0aW9uIChnbG9iYWxOYW1lLCBvcHRpb25zT3JFeHRlbmQsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN0YXRpY1Byb3BlcnRpZXMpIHtcclxuXHR2YXIgcGFyYW1zID0gZm9ybWF0cy5wYXJzZUZvcm1hdChnbG9iYWxOYW1lLCBvcHRpb25zT3JFeHRlbmQsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN0YXRpY1Byb3BlcnRpZXMpO1xyXG5cclxuXHQvLyBTdXBwb3J0IGV4dGVuZHMgYW5kIG1peGlucyBhcyBzdHJpbmdzIGNsYXNzIG5hbWVzXHJcblx0aWYgKHR5cGVvZiBwYXJhbXNbMl0gPT09ICdzdHJpbmcnKSB7XHJcblx0XHRwYXJhbXNbMl0gPSB0aGlzLm5hbWVzcGFjZShwYXJhbXNbMl0pO1xyXG4gICAgICAgIGlmICghcGFyYW1zWzFdICYmIHBhcmFtc1syXSAmJiB0eXBlb2YgcGFyYW1zWzJdLl9fY2xhc3NOYW1lID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICBwYXJhbXNbMV0gPSBmb3JtYXRzLnBhcnNlRnVsbE5hbWUocGFyYW1zWzJdLl9fY2xhc3NOYW1lKTtcclxuICAgICAgICB9XHJcblx0fVxyXG5cdHZhciBtaXhpbnMgPSBwYXJhbXNbNl07XHJcblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRpZiAodHlwZW9mIG1peGluc1tpXSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0bWl4aW5zW2ldID0gdGhpcy5uYW1lc3BhY2UobWl4aW5zW2ldKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIFNob3cgZXJyb3IgaWYgbm90IGRlZmluZWQgZXh0ZW5kZWQgY2xhc3NcclxuXHRpZiAocGFyYW1zWzJdICE9PSBudWxsICYmIHR5cGVvZiBwYXJhbXNbMl0gIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdHRocm93IG5ldyBFcnJvcignTm90IGZvdW5kIGV4dGVuZCBjbGFzcyBmb3IgYCcgKyBnbG9iYWxOYW1lICsgJ2AuJyk7XHJcblx0fVxyXG5cclxuXHR2YXIgbmV3Q2xhc3MgPSBleHRlbmRDbGFzcyhwYXJhbXNbMF0sIHBhcmFtc1sxXSwgcGFyYW1zWzJdLCBwYXJhbXNbNl0sIHBhcmFtc1szXSwgcGFyYW1zWzRdLCBwYXJhbXNbN10pO1xyXG5cdGZvcm1hdHMuYXBwbHlDbGFzc0NvbmZpZyhuZXdDbGFzcywgcGFyYW1zWzVdLCBwYXJhbXNbMF0sIHBhcmFtc1sxXSk7XHJcblxyXG5cdHJldHVybiBuZXdDbGFzcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXRob2QgZm9yIGRlZmluZSBjbGFzc1xyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUNsYXNzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcbiAqIEBwYXJhbSB7KGZ1bmN0aW9ufG9iamVjdHxudWxsKX0gb3B0aW9uc09yRXh0ZW5kXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG90eXBlUHJvcGVydGllc11cclxuICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wZXJ0aWVzXVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuZGVmaW5lQ2xhc3MgPSBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzKSB7XHJcblx0dmFyIG5ld0NsYXNzID0gdGhpcy5jcmVhdGVDbGFzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdHZhciBuYW1lT2JqZWN0ID0gZm9ybWF0cy5wYXJzZUZ1bGxOYW1lKGdsb2JhbE5hbWUpO1xyXG5cclxuXHR0aGlzLm5hbWVzcGFjZShuYW1lT2JqZWN0Lm5hbWVzcGFjZSlbbmFtZU9iamVjdC5uYW1lXSA9IG5ld0NsYXNzO1xyXG5cdHJldHVybiBuZXdDbGFzcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXRob2QgZm9yIGRlZmluZSBlbnVtXHJcbiAqIEBmdW5jdGlvbiBOZWF0bmVzcy5wcm90b3R5cGUuZGVmaW5lQ2xhc3NcclxuICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbE5hbWVcclxuICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wZXJ0aWVzXVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuZGVmaW5lRW51bSA9IGZ1bmN0aW9uIChnbG9iYWxOYW1lLCBzdGF0aWNQcm9wZXJ0aWVzKSB7XHJcblx0dmFyIG5ld0NsYXNzID0gdGhpcy5jcmVhdGVDbGFzcyhnbG9iYWxOYW1lLCBudWxsLCB7fSwgc3RhdGljUHJvcGVydGllcyk7XHJcblx0dmFyIG5hbWVPYmplY3QgPSBmb3JtYXRzLnBhcnNlRnVsbE5hbWUoZ2xvYmFsTmFtZSk7XHJcblxyXG5cdHRoaXMubmFtZXNwYWNlKG5hbWVPYmplY3QubmFtZXNwYWNlKVtuYW1lT2JqZWN0Lm5hbWVdID0gbmV3Q2xhc3M7XHJcblx0cmV0dXJuIG5ld0NsYXNzO1xyXG59O1xyXG5cclxudmFyIG5lYXRuZXNzID0gbW9kdWxlLmV4cG9ydHMgPSBuZXcgTmVhdG5lc3MoKTtcclxuXHJcbi8vIFdlYiBicm93c2VyIGV4cG9ydFxyXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuXHR3aW5kb3cuTmVhdG5lc3MgPSBuZWF0bmVzcztcclxufVxyXG5cclxuLyoqXHJcbiAqIEB0eXBlIHtOZWF0bmVzcy5wcm90b3R5cGUuT2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLk9iamVjdCA9IHJlcXVpcmUoJy4vTmVhdG5lc3MuT2JqZWN0JykobmVhdG5lc3MpO1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlIHtOZWF0bmVzcy5wcm90b3R5cGUuRXhjZXB0aW9ufVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLkV4Y2VwdGlvbiA9IHJlcXVpcmUoJy4vTmVhdG5lc3MuRXhjZXB0aW9uJykobmVhdG5lc3MpO1xyXG5cclxuLyoqXHJcbiAqIEB0eXBlIHtzdHJpbmd9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUudmVyc2lvbiA9ICclSk9JTlRTX0NVUlJFTlRfVkVSU0lPTiUnO1xyXG5cbn0se1wiLi9OZWF0bmVzcy5FeGNlcHRpb25cIjoyMixcIi4vTmVhdG5lc3MuT2JqZWN0XCI6MjMsXCIuL2V4dGVuZENsYXNzXCI6MjUsXCIuL2Zvcm1hdHNcIjoyNn1dLDI1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciBpc0V2YWxFbmFibGUgPSB0cnVlO1xyXG52YXIgaW5zdGFuY2VDb3VudGVyID0gMDtcclxuXHJcbnZhciBfbm9vcCA9IGZ1bmN0aW9uKCkge1xyXG59O1xyXG5cclxudmFyIF9jcmVhdGVGdW5jdGlvbiA9IGZ1bmN0aW9uKG5hbWVPYmplY3QsIGNvbnN0cnVjdG9yKSB7XHJcblx0aWYgKCFpc0V2YWxFbmFibGUgfHwgIW5hbWVPYmplY3QpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9XHJcblx0fVxyXG5cclxuXHR2YXIgbmFtZVJlZ0V4cCA9IC9bXmEteiRfXFwuXS9pO1xyXG5cdHZhciBuYW1lID0gbmFtZU9iamVjdC5uYW1lIHx8ICdGdW5jdGlvbic7XHJcblx0dmFyIG5hbWVQYXJ0cyA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZS5zcGxpdCgnLicpO1xyXG5cclxuXHQvLyBDcmVhdGUgcm9vdCBvYmplY3RcclxuXHR2YXIgcm9vdE5hbWUgPSBuYW1lUGFydHMuc2hpZnQoKTtcclxuXHR2YXIgY3M7XHJcblxyXG5cdHJvb3ROYW1lID0gcm9vdE5hbWUucmVwbGFjZShuYW1lUmVnRXhwLCAnJyk7XHJcblx0ZXZhbCgndmFyICcgKyByb290TmFtZSArICcgPSBjcyA9IHt9OycpO1xyXG5cclxuXHQvLyBDcmVhdGUgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lUGFydHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciBzY29wZU5hbWUgPSBuYW1lUGFydHNbaV07XHJcblx0XHRpZiAoIWNzW3Njb3BlTmFtZV0pIHtcclxuXHRcdFx0Y3Nbc2NvcGVOYW1lXSA9IHt9O1xyXG5cdFx0fVxyXG5cdFx0Y3MgPSBjc1tzY29wZU5hbWVdO1xyXG5cdH1cclxuXHJcblx0dmFyIGZ1bmM7XHJcblx0dmFyIGZ1bGxOYW1lID0gKG5hbWVPYmplY3QubmFtZXNwYWNlID8gbmFtZU9iamVjdC5uYW1lc3BhY2UgKyAnLicgOiAnJykgKyBuYW1lO1xyXG5cclxuXHRmdWxsTmFtZSA9IGZ1bGxOYW1lLnJlcGxhY2UobmFtZVJlZ0V4cCwgJycpO1xyXG5cdGV2YWwoJ2Z1bmMgPSAnICsgZnVsbE5hbWUgKyAnID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfScpO1xyXG5cclxuXHRyZXR1cm4gZnVuYztcclxufTtcclxuXHJcbnZhciBfaXNTdHJpY3RPYmplY3QgPSBmdW5jdGlvbiAob2JqKSB7XHJcblx0aWYgKCFvYmogfHwgdHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgb2JqIGluc3RhbmNlb2YgUmVnRXhwIHx8IG9iaiBpbnN0YW5jZW9mIERhdGUpIHtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdHZhciBib29sID0gdHJ1ZTtcclxuXHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRib29sID0gYm9vbCAmJiBvYmouaGFzT3duUHJvcGVydHkoa2V5KTtcclxuXHR9XHJcblx0cmV0dXJuIGJvb2w7XHJcbn07XHJcblxyXG52YXIgX2Nsb25lID0gZnVuY3Rpb24ob2JqKSB7XHJcblx0aWYgKCFfaXNTdHJpY3RPYmplY3Qob2JqKSkge1xyXG5cdFx0cmV0dXJuIG9iajtcclxuXHR9XHJcblxyXG5cdHZhciBjb3B5ID0gb2JqLmNvbnN0cnVjdG9yKCk7XHJcblx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcblx0XHRcdGNvcHlba2V5XSA9IF9jbG9uZShvYmpba2V5XSk7XHJcblx0XHR9XHJcblx0fVxyXG5cdHJldHVybiBjb3B5O1xyXG59O1xyXG5cclxudmFyIF9jbG9uZU9iakluUHJvdG8gPSBmdW5jdGlvbihvYmopIHtcclxuXHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRpZiAodHlwZW9mIG9iaiA9PT0gXCJvYmplY3RcIikge1xyXG5cdFx0XHRvYmpba2V5XSA9IF9jbG9uZShvYmpba2V5XSk7XHJcblx0XHR9XHJcblx0fVxyXG59O1xyXG5cclxudmFyIF9jb3ZlclZpcnR1YWwgPSBmdW5jdGlvbiAoY2hpbGRNZXRob2QsIHBhcmVudE1ldGhvZCwgc3VwZXJOYW1lKSB7XHJcblx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBjdXJyZW50U3VwZXIgPSB0aGlzW3N1cGVyTmFtZV07XHJcblx0XHR0aGlzW3N1cGVyTmFtZV0gPSBwYXJlbnRNZXRob2Q7XHJcblx0XHR2YXIgciA9IGNoaWxkTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0XHR0aGlzW3N1cGVyTmFtZV0gPSBjdXJyZW50U3VwZXI7XHJcblx0XHRyZXR1cm4gcjtcclxuXHR9O1xyXG59O1xyXG5cclxudmFyIF9leHRlbmRXaXRoU3VwZXIgPSBmdW5jdGlvbiAoY2hpbGRDbGFzcywgbmV3UHJvcGVydGllcywgc3VwZXJOYW1lKSB7XHJcblx0aWYgKCFuZXdQcm9wZXJ0aWVzKSB7XHJcblx0XHRyZXR1cm47XHJcblx0fVxyXG5cclxuXHQvLyBFeHRlbmQgYW5kIHNldHVwIHZpcnR1YWwgbWV0aG9kc1xyXG5cdGZvciAodmFyIGtleSBpbiBuZXdQcm9wZXJ0aWVzKSB7XHJcblx0XHRpZiAoIW5ld1Byb3BlcnRpZXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRjb250aW51ZTtcclxuXHRcdH1cclxuXHJcblx0XHR2YXIgdmFsdWUgPSBuZXdQcm9wZXJ0aWVzW2tleV07XHJcblx0XHRpZiAodHlwZW9mIHZhbHVlID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGNoaWxkQ2xhc3Nba2V5XSA9PSAnZnVuY3Rpb24nICYmIGNoaWxkQ2xhc3Nba2V5XSAhPT0gX25vb3ApIHtcclxuXHRcdFx0Y2hpbGRDbGFzc1trZXldID0gX2NvdmVyVmlydHVhbCh2YWx1ZSwgY2hpbGRDbGFzc1trZXldLCBzdXBlck5hbWUpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2hpbGRDbGFzc1trZXldID0gX2Nsb25lKHZhbHVlKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIERlZmF1bHQgc3RhdGVcclxuXHRpZiAoIWNoaWxkQ2xhc3Nbc3VwZXJOYW1lXSkge1xyXG5cdFx0Y2hpbGRDbGFzc1tzdXBlck5hbWVdID0gX25vb3A7XHJcblx0fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEV4dGVuZCBjbGFzc1xyXG4gKiBAcGFyYW0ge29iamVjdH0gbmFtZU9iamVjdFxyXG4gKiBAcGFyYW0ge29iamVjdH0gcGFyZW50TmFtZU9iamVjdFxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbcGFyZW50Q2xhc3NdXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFttaXhpbnNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG90eXBlUHJvcGVydGllc11cclxuICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wZXJ0aWVzXVxyXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IE5ldyBjbGFzc1xyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobmFtZU9iamVjdCwgcGFyZW50TmFtZU9iamVjdCwgcGFyZW50Q2xhc3MsIG1peGlucywgcHJvdG90eXBlUHJvcGVydGllcywgc3RhdGljUHJvcGVydGllcywgc3VwZXJOYW1lKSB7XHJcblx0cGFyZW50Q2xhc3MgPSBwYXJlbnRDbGFzcyB8fCBfbm9vcDtcclxuXHRtaXhpbnMgPSBtaXhpbnMgfHwgW107XHJcblxyXG5cdC8vIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIG5ldyBzdWJjbGFzcyBpcyBlaXRoZXIgZGVmaW5lZCBieSB5b3VcclxuXHQvLyAodGhlIFwiY29uc3RydWN0b3JcIiBwcm9wZXJ0eSBpbiB5b3VyIGBleHRlbmRgIGRlZmluaXRpb24pLCBvciBkZWZhdWx0ZWRcclxuXHQvLyBieSB1cyB0byBzaW1wbHkgY2FsbCB0aGUgcGFyZW50J3MgY29uc3RydWN0b3IuXHJcblx0dmFyIGNvbnN0cnVjdG9yID0gcHJvdG90eXBlUHJvcGVydGllcyAmJiBwcm90b3R5cGVQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpID9cclxuXHRcdF9jb3ZlclZpcnR1YWwocHJvdG90eXBlUHJvcGVydGllcy5jb25zdHJ1Y3RvciwgcGFyZW50Q2xhc3MsIHN1cGVyTmFtZSkgOlxyXG5cdFx0cGFyZW50Q2xhc3M7XHJcblx0dmFyIGNoaWxkQ2xhc3MgPSBfY3JlYXRlRnVuY3Rpb24obmFtZU9iamVjdCwgZnVuY3Rpb24oKSB7XHJcblx0XHRpZiAoIXRoaXMuX19pbnN0YW5jZU5hbWUpIHtcclxuXHRcdFx0X2Nsb25lT2JqSW5Qcm90byh0aGlzKTtcclxuXHRcdFx0dGhpcy5fX2luc3RhbmNlTmFtZSAgPSBuYW1lT2JqZWN0Lmdsb2JhbE5hbWUgKyBpbnN0YW5jZUNvdW50ZXIrKztcclxuXHRcdH1cclxuXHRcdGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcblx0fSk7XHJcblxyXG5cdC8vIEFkZCBzdGF0aWMgcHJvcGVydGllcyB0byB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb24sIGlmIHN1cHBsaWVkLlxyXG5cdGZvciAodmFyIHByb3AgaW4gcGFyZW50Q2xhc3MpIHtcclxuXHRcdGNoaWxkQ2xhc3NbcHJvcF0gPSBwYXJlbnRDbGFzc1twcm9wXTtcclxuXHR9XHJcblx0X2V4dGVuZFdpdGhTdXBlcihjaGlsZENsYXNzLCBzdGF0aWNQcm9wZXJ0aWVzLCBzdXBlck5hbWUpO1xyXG5cclxuXHQvLyBTZXQgdGhlIHByb3RvdHlwZSBjaGFpbiB0byBpbmhlcml0IGZyb20gYHBhcmVudGAsIHdpdGhvdXQgY2FsbGluZ1xyXG5cdC8vIGBwYXJlbnRgJ3MgY29uc3RydWN0b3IgZnVuY3Rpb24uXHJcblx0dmFyIFN1cnJvZ2F0ZSA9IF9jcmVhdGVGdW5jdGlvbihwYXJlbnROYW1lT2JqZWN0LCBfbm9vcCk7XHJcblx0U3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudENsYXNzLnByb3RvdHlwZTtcclxuXHJcblx0Y2hpbGRDbGFzcy5wcm90b3R5cGUgPSBuZXcgU3Vycm9nYXRlKCk7XHJcblxyXG5cdC8vIENvcHkgb2JqZWN0cyBmcm9tIGNoaWxkIHByb3RvdHlwZVxyXG5cdGZvciAodmFyIHByb3AyIGluIHBhcmVudENsYXNzLnByb3RvdHlwZSkge1xyXG5cdFx0aWYgKHBhcmVudENsYXNzLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShwcm9wMikgJiYgcHJvcDIgIT09ICdjb25zdHJ1Y3RvcicpIHtcclxuXHRcdFx0Y2hpbGRDbGFzcy5wcm90b3R5cGVbcHJvcDJdID0gX2Nsb25lKHBhcmVudENsYXNzLnByb3RvdHlwZVtwcm9wMl0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Ly8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIChpbnN0YW5jZSBwcm9wZXJ0aWVzKSB0byB0aGUgc3ViY2xhc3MsXHJcblx0Ly8gaWYgc3VwcGxpZWQuXHJcblx0aWYgKHByb3RvdHlwZVByb3BlcnRpZXMpIHtcclxuXHRcdF9leHRlbmRXaXRoU3VwZXIoY2hpbGRDbGFzcy5wcm90b3R5cGUsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN1cGVyTmFtZSk7XHJcblx0fVxyXG5cclxuXHQvLyBBZGQgcHJvdG90eXBlIHByb3BlcnRpZXMgYW5kIG1ldGhvZHMgZnJvbSBtaXhpbnNcclxuXHRmb3IgKHZhciBpID0gMCwgbCA9IG1peGlucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdGZvciAodmFyIG1peGluUHJvcCBpbiBtaXhpbnNbaV0ucHJvdG90eXBlKSB7XHJcblx0XHRcdC8vIFNraXAgcHJpdmF0ZVxyXG5cdFx0XHRpZiAobWl4aW5Qcm9wLnN1YnN0cigwLCAyKSA9PT0gJ19fJykge1xyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBDaGVjayBmb3IgZXhpc3RzIHByb3BlcnR5IG9yIG1ldGhvZC4gTWl4aW4gY2FuIG9ubHkgYWRkIHByb3BlcnRpZXMsIGJ1dCBubyByZXBsYWNlIGl0XHJcblx0XHRcdGlmICh0eXBlb2YgY2hpbGRDbGFzcy5wcm90b3R5cGVbbWl4aW5Qcm9wXSA9PT0gJ2Z1bmN0aW9uJyB8fCBjaGlsZENsYXNzLnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eShtaXhpblByb3ApKSB7XHJcblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCdUcnkgdG8gcmVwbGFjZSBwcm90b3R5cGUgcHJvcGVydHkgYCcgKyBtaXhpblByb3AgKyAnYCBpbiBjbGFzcyBgJyArIGNoaWxkQ2xhc3MuX19jbGFzc05hbWUgKyAnYCBieSBtaXhpbiBgJyArIG1peGluc1tpXS5fX2NsYXNzTmFtZSArICdgJyk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y2hpbGRDbGFzcy5wcm90b3R5cGVbbWl4aW5Qcm9wXSA9IG1peGluc1tpXS5wcm90b3R5cGVbbWl4aW5Qcm9wXTtcclxuXHRcdH1cclxuXHR9XHJcblx0Ly8gQWRkIHN0YXRpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIGZyb20gbWl4aW5zXHJcblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRmb3IgKHZhciBtaXhpblByb3AgaW4gbWl4aW5zW2ldKSB7XHJcblx0XHRcdC8vIFNraXAgcHJpdmF0ZVxyXG5cdFx0XHRpZiAobWl4aW5Qcm9wLnN1YnN0cigwLCAyKSA9PT0gJ19fJykge1xyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHQvLyBDaGVjayBmb3IgZXhpc3RzIHByb3BlcnR5IG9yIG1ldGhvZC4gTWl4aW4gY2FuIG9ubHkgYWRkIHByb3BlcnRpZXMsIGJ1dCBubyByZXBsYWNlIGl0XHJcblx0XHRcdGlmICh0eXBlb2YgY2hpbGRDbGFzc1ttaXhpblByb3BdID09PSAnZnVuY3Rpb24nIHx8IGNoaWxkQ2xhc3MuaGFzT3duUHJvcGVydHkobWl4aW5Qcm9wKSkge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJ5IHRvIHJlcGxhY2Ugc3RhdGljIHByb3BlcnR5IGAnICsgbWl4aW5Qcm9wICsgJ2AgaW4gY2xhc3MgYCcgKyBjaGlsZENsYXNzLl9fY2xhc3NOYW1lICsgJ2AgYnkgbWl4aW4gYCcgKyBtaXhpbnNbaV0uX19jbGFzc05hbWUgKyAnYCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNoaWxkQ2xhc3NbbWl4aW5Qcm9wXSA9IG1peGluc1tpXVttaXhpblByb3BdO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGNoaWxkQ2xhc3M7XHJcbn07XHJcblxufSx7fV0sMjY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xudmFyIEZPUk1BVF9KT0lOVFNfVjAyID0gJ25lYXRuZXNzX3YwMic7XHJcbnZhciBGT1JNQVRfSk9JTlRTX1YxMCA9ICduZWF0bmVzc192MTAnO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblxyXG5cdC8qKlxyXG5cdCAqIERldGVjdCBmb3JtYXQgYW5kIHJldHVybiBjbGFzcyBwYXJhbXNcclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsTmFtZVxyXG5cdCAqIEBwYXJhbSB7KGZ1bmN0aW9ufG9iamVjdHxudWxsKX0gb3B0aW9uc09yRXh0ZW5kXHJcblx0ICogQHBhcmFtIHtvYmplY3R9IFtwcm90b1Byb3BzXVxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcHNdXHJcblx0ICogQHJldHVybnMge29iamVjdH1cclxuXHQgKi9cclxuXHRwYXJzZUZvcm1hdDogZnVuY3Rpb24gKGdsb2JhbE5hbWUsIG9wdGlvbnNPckV4dGVuZCwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcclxuXHRcdHZhciBuYW1lT2JqZWN0ID0gdGhpcy5wYXJzZUZ1bGxOYW1lKGdsb2JhbE5hbWUpO1xyXG5cdFx0dmFyIHBhcmVudE5hbWVPYmplY3QgPSBudWxsO1xyXG5cdFx0dmFyIHBhcmVudENsYXNzID0gbnVsbDtcclxuXHRcdHZhciBwcm90b3R5cGVQcm9wZXJ0aWVzID0gbnVsbDtcclxuXHRcdHZhciBzdGF0aWNQcm9wZXJ0aWVzID0gbnVsbDtcclxuXHRcdHZhciBmb3JtYXQgPSBudWxsO1xyXG5cdFx0dmFyIG1peGlucyA9IFtdO1xyXG5cclxuXHRcdC8vIE5lYXRuZXNzIHYwLjIgKG9sZCkgZm9ybWF0XHJcblx0XHRpZiAob3B0aW9uc09yRXh0ZW5kID09PSBudWxsIHx8IHR5cGVvZiBvcHRpb25zT3JFeHRlbmQgPT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0cGFyZW50Q2xhc3MgPSBvcHRpb25zT3JFeHRlbmQ7XHJcblx0XHRcdHByb3RvdHlwZVByb3BlcnRpZXMgPSBwcm90b1Byb3BzO1xyXG5cdFx0XHRzdGF0aWNQcm9wZXJ0aWVzID0gc3RhdGljUHJvcHM7XHJcblx0XHRcdGZvcm1hdCA9IEZPUk1BVF9KT0lOVFNfVjAyO1xyXG5cclxuXHRcdFx0aWYgKHBhcmVudENsYXNzICYmIHR5cGVvZiBwYXJlbnRDbGFzcy5kZWJ1Z0NsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnROYW1lT2JqZWN0ID0gdGhpcy5wYXJzZUZ1bGxOYW1lKHBhcmVudENsYXNzLmRlYnVnQ2xhc3NOYW1lKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gTmVhdG5lc3MgdjEuMCBmb3JtYXRcclxuXHRcdH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnNPckV4dGVuZCA9PT0gJ29iamVjdCcpIHtcclxuXHRcdFx0aWYgKG9wdGlvbnNPckV4dGVuZC5oYXNPd25Qcm9wZXJ0eSgnX19leHRlbmRzJykpIHtcclxuXHRcdFx0XHRwYXJlbnRDbGFzcyA9IG9wdGlvbnNPckV4dGVuZC5fX2V4dGVuZHM7XHJcblx0XHRcdFx0ZGVsZXRlIG9wdGlvbnNPckV4dGVuZC5fX2V4dGVuZHM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChvcHRpb25zT3JFeHRlbmQuaGFzT3duUHJvcGVydHkoJ19fc3RhdGljJykpIHtcclxuXHRcdFx0XHRzdGF0aWNQcm9wZXJ0aWVzID0gb3B0aW9uc09yRXh0ZW5kLl9fc3RhdGljO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19zdGF0aWM7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChvcHRpb25zT3JFeHRlbmQuaGFzT3duUHJvcGVydHkoJ19fbWl4aW5zJykpIHtcclxuXHRcdFx0XHRtaXhpbnMgPSBtaXhpbnMuY29uY2F0KG9wdGlvbnNPckV4dGVuZC5fX21peGlucyk7XHJcblx0XHRcdFx0ZGVsZXRlIG9wdGlvbnNPckV4dGVuZC5fX21peGlucztcclxuXHRcdFx0fVxyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX21peGluJykpIHtcclxuXHRcdFx0XHRtaXhpbnMgPSBtaXhpbnMuY29uY2F0KG9wdGlvbnNPckV4dGVuZC5fX21peGluKTtcclxuXHRcdFx0XHRkZWxldGUgb3B0aW9uc09yRXh0ZW5kLl9fbWl4aW47XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZvcm1hdCA9IEZPUk1BVF9KT0lOVFNfVjEwO1xyXG5cdFx0XHRwcm90b3R5cGVQcm9wZXJ0aWVzID0gb3B0aW9uc09yRXh0ZW5kO1xyXG5cclxuXHRcdFx0aWYgKHBhcmVudENsYXNzICYmIHR5cGVvZiBwYXJlbnRDbGFzcy5fX2NsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0XHRwYXJlbnROYW1lT2JqZWN0ID0gdGhpcy5wYXJzZUZ1bGxOYW1lKHBhcmVudENsYXNzLl9fY2xhc3NOYW1lKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBbXHJcblx0XHRcdG5hbWVPYmplY3QsXHJcblx0XHRcdHBhcmVudE5hbWVPYmplY3QsXHJcblx0XHRcdHBhcmVudENsYXNzLFxyXG5cdFx0XHRwcm90b3R5cGVQcm9wZXJ0aWVzLFxyXG5cdFx0XHRzdGF0aWNQcm9wZXJ0aWVzLFxyXG5cdFx0XHRmb3JtYXQsXHJcblx0XHRcdG1peGlucyxcclxuXHRcdFx0Zm9ybWF0ID09PSBGT1JNQVRfSk9JTlRTX1YwMiA/ICdfc3VwZXInIDogJ19fc3VwZXInXHJcblx0XHRdO1xyXG5cdH0sXHJcblxyXG5cdGFwcGx5Q2xhc3NDb25maWc6IGZ1bmN0aW9uKG5ld0NsYXNzLCBmb3JtYXQsIG5hbWVPYmplY3QsIHBhcmVudE5hbWVPYmplY3QpIHtcclxuXHRcdC8vIFNldCBfX2NsYXNzTmFtZSBmb3IgYWxsIGZvcm1hdHNcclxuXHRcdG5ld0NsYXNzLl9fY2xhc3NOYW1lID0gbmV3Q2xhc3MucHJvdG90eXBlLl9fY2xhc3NOYW1lID0gbmFtZU9iamVjdC5nbG9iYWxOYW1lO1xyXG5cclxuXHRcdHZhciBjbGFzc05hbWVLZXkgPSBmb3JtYXQgPT09IEZPUk1BVF9KT0lOVFNfVjAyID8gJ2RlYnVnQ2xhc3NOYW1lJyA6ICdfX2NsYXNzTmFtZSc7XHJcblx0XHR2YXIgcGFyZW50Q2xhc3NOYW1lS2V5ID0gZm9ybWF0ID09PSBGT1JNQVRfSk9JTlRTX1YwMiA/ICcnIDogJ19fcGFyZW50Q2xhc3NOYW1lJztcclxuXHRcdHZhciBzdGF0aWNOYW1lS2V5ID0gZm9ybWF0ID09PSBGT1JNQVRfSk9JTlRTX1YwMiA/ICdfc3RhdGljJyA6ICdfX3N0YXRpYyc7XHJcblxyXG5cdFx0bmV3Q2xhc3NbY2xhc3NOYW1lS2V5XSA9IG5ld0NsYXNzLnByb3RvdHlwZVtjbGFzc05hbWVLZXldID0gbmFtZU9iamVjdC5nbG9iYWxOYW1lO1xyXG5cdFx0aWYgKHBhcmVudENsYXNzTmFtZUtleSkge1xyXG5cdFx0XHRuZXdDbGFzc1twYXJlbnRDbGFzc05hbWVLZXldID0gbmV3Q2xhc3MucHJvdG90eXBlW3BhcmVudENsYXNzTmFtZUtleV0gPSBwYXJlbnROYW1lT2JqZWN0ID8gKHBhcmVudE5hbWVPYmplY3QuZ2xvYmFsTmFtZSB8fCBudWxsKSA6IG51bGw7XHJcblx0XHR9XHJcblx0XHRuZXdDbGFzc1tzdGF0aWNOYW1lS2V5XSA9IG5ld0NsYXNzLnByb3RvdHlwZVtzdGF0aWNOYW1lS2V5XSA9IG5ld0NsYXNzO1xyXG5cclxuXHRcdHJldHVybiBuZXdDbGFzcztcclxuXHR9LFxyXG5cclxuXHRwYXJzZUZ1bGxOYW1lOiBmdW5jdGlvbihnbG9iYWxOYW1lKSB7XHJcblx0XHQvLyBTcGxpdCBuYW1lc3BhY2VcclxuXHRcdHZhciBwb3MgPSBnbG9iYWxOYW1lLmxhc3RJbmRleE9mKCcuJyk7XHJcblxyXG5cdFx0cmV0dXJuIHtcclxuXHRcdFx0Z2xvYmFsTmFtZTogZ2xvYmFsTmFtZSxcclxuXHRcdFx0bmFtZTogcG9zICE9PSAtMSA/IGdsb2JhbE5hbWUuc3Vic3RyKHBvcyArIDEpIDogZ2xvYmFsTmFtZSxcclxuXHRcdFx0bmFtZXNwYWNlOiBwb3MgIT09IC0xID8gZ2xvYmFsTmFtZS5zdWJzdHIoMCwgcG9zKSA6ICcnXHJcblx0XHR9O1xyXG5cdH1cclxuXHJcbn07XHJcblxufSx7fV0sMjc6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9saWIvYmFzZS9Db21wb25lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvRWxlbWVudCcpO1xucmVxdWlyZSgnLi9saWIvYmFzZS9FeGNlcHRpb24nKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvTWFuYWdlcicpO1xucmVxdWlyZSgnLi9saWIvYmFzZS9PYmplY3QnKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vRHJvcEFyZWEnKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vRm9ybScpO1xucmVxdWlyZSgnLi9saWIvZm9ybS9Gb3JtRWxlbWVudCcpO1xucmVxdWlyZSgnLi9saWIvZm9ybS9JbnB1dEVsZW1lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2hlbHBlcnMvQnJvd3NlckhlbHBlcicpO1xucmVxdWlyZSgnLi9saWIvaGVscGVycy9DbGFzc0hlbHBlcicpO1xucmVxdWlyZSgnLi9saWIvbWFuYWdlcnMvUXVldWVNYW5hZ2VyJyk7XG5yZXF1aXJlKCcuL2xpYi9tb2RlbHMvRmlsZScpO1xucmVxdWlyZSgnLi9saWIvbW9kZWxzL0ZpbGVQcm9ncmVzcycpO1xucmVxdWlyZSgnLi9saWIvbW9kZWxzL1F1ZXVlQ29sbGVjdGlvbicpO1xucmVxdWlyZSgnLi9saWIvdXBsb2FkZXJzL0Jhc2VVcGxvYWRlcicpO1xucmVxdWlyZSgnLi9saWIvdXBsb2FkZXJzL0lmcmFtZVVwbG9hZGVyJyk7XG5yZXF1aXJlKCcuL2xpYi91cGxvYWRlcnMvWGhyVXBsb2FkZXInKTtcblxufSx7XCIuL2xpYi9GaWxlVXBcIjoyLFwiLi9saWIvYmFzZS9Db21wb25lbnRcIjozLFwiLi9saWIvYmFzZS9FbGVtZW50XCI6NCxcIi4vbGliL2Jhc2UvRXhjZXB0aW9uXCI6NSxcIi4vbGliL2Jhc2UvTWFuYWdlclwiOjYsXCIuL2xpYi9iYXNlL09iamVjdFwiOjcsXCIuL2xpYi9mb3JtL0Ryb3BBcmVhXCI6OCxcIi4vbGliL2Zvcm0vRm9ybVwiOjksXCIuL2xpYi9mb3JtL0Zvcm1FbGVtZW50XCI6MTAsXCIuL2xpYi9mb3JtL0lucHV0RWxlbWVudFwiOjExLFwiLi9saWIvaGVscGVycy9Ccm93c2VySGVscGVyXCI6MTIsXCIuL2xpYi9oZWxwZXJzL0NsYXNzSGVscGVyXCI6MTMsXCIuL2xpYi9tYW5hZ2Vycy9RdWV1ZU1hbmFnZXJcIjoxNCxcIi4vbGliL21vZGVscy9GaWxlXCI6MTUsXCIuL2xpYi9tb2RlbHMvRmlsZVByb2dyZXNzXCI6MTYsXCIuL2xpYi9tb2RlbHMvUXVldWVDb2xsZWN0aW9uXCI6MTcsXCIuL2xpYi91cGxvYWRlcnMvQmFzZVVwbG9hZGVyXCI6MTgsXCIuL2xpYi91cGxvYWRlcnMvSWZyYW1lVXBsb2FkZXJcIjoxOSxcIi4vbGliL3VwbG9hZGVycy9YaHJVcGxvYWRlclwiOjIwfV19LHt9LFsxXSk7XG4iXSwiZmlsZSI6ImZpbGV1cC1jb3JlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
