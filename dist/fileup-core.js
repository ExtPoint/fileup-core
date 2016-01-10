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
        this._initQueue();
        this._initManagers();
    },

    _initForm: function () {
        this.form = FileUp.helpers.ClassHelper.createObject(this.form);
        this.form.on(FileUp.form.Form.EVENT_SUBMIT, this._onFormSubmit.bind(this));
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
     * @param {FileUp.form.InputElement} inputElement
     * @protected
     */
    _onFormSubmit: function (inputElement) {
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
        for (var i = 0, l = inputElement.getCount(); i < l; i++) {
            var file = FileUp.helpers.ClassHelper.createObject(
                FileUp.helpers.ClassHelper.merge(
                    {
                        inputElement: inputElement,
                        inputElementIndex: i,
                        relativePath: inputElement.getFileRelativePath(i),
                        name: inputElement.getFileName(i),
                        bytesTotal: inputElement.getFileSize(i)
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

        this.trigger(this.__static.EVENT_SUBMIT, [this._lastInputElement]);
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
    getFileDomObject: function(index) {
        index = index || 0;
        return this.element.files && this.element.files[index] || null;
    },

    /**
     *
     * @param {number} index
     * @returns {number}
     */
    getFileSize: function(index) {
        index = index || 0;

        var fileDomObject = this.getFileDomObject(index);
        return fileDomObject ? fileDomObject.fileSize || fileDomObject.size : 0;
    },

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFileName: function(index) {
        index = index || 0;

        if (!this._fileNames.hasOwnProperty(index)) {
            var fileDomObject = this.getFileDomObject(index);
            var path = fileDomObject ? fileDomObject.fileName || fileDomObject.name : '';

            this._fileNames[index] = path ? FileUp.helpers.UrlHelper.parseFileName(path) : '';
        }
        return this._fileNames[index];
    },

    /**
     *
     * @param {number} index
     * @returns {string}
     */
    getFileRelativePath: function(index) {
        index = index || 0;

        var fileDomObject = this.getFileDomObject(index);
        if (fileDomObject && fileDomObject.webkitRelativePath) {
            return fileDomObject.webkitRelativePath
                .replace(/^[\/\\]+/, '')
                .replace(/\/\.$/, '/');
        }
        return '';
    },

    getCount: function() {
        if (this.element.files) {
            return this.element.files.length;
        }
        return this.element.value ? 1 : 0;
    },

    freeze: function() {
        this.element.onchange = null;
    },

    destroy: function() {
        this.element.onchange = null;
        this.__super();
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
        }

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
 * @class FileUp.helpers.UrlHelper
 * @extends FileUp.base.Object
 */
FileUp.Neatness.defineClass('FileUp.helpers.UrlHelper', /** @lends FileUp.helpers.UrlHelper.prototype */{

    __extends: FileUp.base.Object,

    __static: /** @lends FileUp.helpers.UrlHelper */{

        parseFileName: function(url) {
            var matches = /[^\/\\]+$/.exec(url);
            if (matches) {
                return matches[0].replace(/^([^?]+).*$/, '$1');
            }
            return null;
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

    _onAdd: function() {
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
     * @type {FileUp.form.InputElement}
     */
    inputElement: null,

    /**
     * @type {number}
     */
    inputElementIndex: 0,

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
    _relativePath: '',

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
     * @returns {object}
     */
    getDomObject: function() {
        return this.inputElement.getFileDomObject(this.inputElementIndex);
    },

    /**
     *
     * @param {string} value
     */
    setRelativePath: function(value) {
        this._relativePath = value;
    },

    /**
     *
     * @returns {string}
     */
    getRelativePath: function() {
        return this._relativePath;
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
        return this._name;
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
            this.trigger(this.__static.EVENT_PROGRESS);

            this._resultHttpStatus = null;
            this._resultHttpMessage = null;
            this._setStatus(this.__static.STATUS_PROCESS);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_ERROR, function(status, message) {
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS);

            this._result = this.__static.RESULT_ERROR;
            this._resultHttpStatus = status;
            this._resultHttpMessage = message;
            this._setStatus(this.__static.STATUS_END);
        }.bind(this));

        this._uploader.on(FileUp.uploaders.BaseUploader.EVENT_END, function() {
            this.progress.reset();
            this.trigger(this.__static.EVENT_PROGRESS);

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
        this.trigger(this.__static.EVENT_PROGRESS);
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
        this.trigger(this.__static.EVENT_PROGRESS);
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
        this.trigger(this.__static.EVENT_PROGRESS);
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
        this.trigger(this.__static.EVENT_STATUS, [this._status]);
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

    /**
     * This is IIS max httpRuntime@maxRequestLength value which is 2147482624 Kb
     * @type {number}
     */
    bytesMaxPart: 2097151 * 1024,

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
            if (text.toLowerCase() !== 'ok' || text !== '') {
                var regexp = /[45][0-9]{2}/;
                status = (document.title.match(regexp) || text.match(regexp) || [500])[0];
                errorMessage = document.title + '\n' + document.body.innerText;
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

        var isFF = FileUp.helpers.BrowserHelper.isFirefox();
        if (isFF && isFF < 7) {
            this._xhr.sendAsBinary(this.file.getDomObject().getAsBinary());
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
            this._xhr.setRequestHeader("Content-Range", "bytes " + this._bytesStart + "-" + (this._bytesEnd - 1) + "/" + bytesTotal);

            if (this._bytesEnd < bytesTotal) {
                this._xhr.send(this.file.getDomObject().slice(this._bytesStart, this._bytesEnd));
            } else {
                this._xhr.send(this.file.getDomObject().slice(this._bytesStart));
            }
        } else {
            this._xhr.send(this.file.getDomObject());
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
require('./lib/form/Form');
require('./lib/form/FormElement');
require('./lib/form/InputElement');
require('./lib/helpers/BrowserHelper');
require('./lib/helpers/ClassHelper');
require('./lib/helpers/UrlHelper');
require('./lib/managers/QueueManager');
require('./lib/models/File');
require('./lib/models/FileProgress');
require('./lib/models/QueueCollection');
require('./lib/uploaders/BaseUploader');
require('./lib/uploaders/IframeUploader');
require('./lib/uploaders/XhrUploader');

},{"./lib/FileUp":2,"./lib/base/Component":3,"./lib/base/Element":4,"./lib/base/Exception":5,"./lib/base/Manager":6,"./lib/base/Object":7,"./lib/form/Form":8,"./lib/form/FormElement":9,"./lib/form/InputElement":10,"./lib/helpers/BrowserHelper":11,"./lib/helpers/ClassHelper":12,"./lib/helpers/UrlHelper":13,"./lib/managers/QueueManager":14,"./lib/models/File":15,"./lib/models/FileProgress":16,"./lib/models/QueueCollection":17,"./lib/uploaders/BaseUploader":18,"./lib/uploaders/IframeUploader":19,"./lib/uploaders/XhrUploader":20}]},{},[1]);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJmaWxldXAtY29yZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbnBtJyk7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHdpbmRvdy5GaWxlVXAgPSBtb2R1bGUuZXhwb3J0cztcbn1cbn0se1wiLi9ucG1cIjoyN31dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBOZWF0bmVzcyA9IHJlcXVpcmUoJ25lYXRuZXNzJykubmV3Q29udGV4dCgpO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAYWxpYXMgbW9kdWxlOmZpbGV1cC1jb3JlXG4gKi9cbnZhciBGaWxlVXA7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcFxuICogQGV4dGVuZHMgTmVhdG5lc3MuT2JqZWN0XG4gKi9cbkZpbGVVcCA9IE5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAnLCAvKiogQGxlbmRzIEZpbGVVcC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IE5lYXRuZXNzLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcCAqL3tcblxuICAgICAgICBOZWF0bmVzczogTmVhdG5lc3NcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIGJhY2tlbmRVcmw6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybX1cbiAgICAgKi9cbiAgICBmb3JtOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5mb3JtLkZvcm0nXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbn1cbiAgICAgKi9cbiAgICBxdWV1ZToge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbidcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXJ9XG4gICAgICovXG4gICAgcXVldWVNYW5hZ2VyOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXInXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAubW9kZWxzLkZpbGV9XG4gICAgICovXG4gICAgZmlsZUNvbmZpZzoge1xuICAgICAgICBjbGFzc05hbWU6ICdGaWxlVXAubW9kZWxzLkZpbGUnXG4gICAgfSxcblxuICAgIHVwbG9hZGVyQ29uZmlnczoge1xuICAgICAgICBpZnJhbWU6IHtcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXInXG4gICAgICAgIH0sXG4gICAgICAgIHhocjoge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiAnRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlcidcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNvbmZpZ3VyZSh0aGlzLCBjb25maWcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5faW5pdEZvcm0oKTtcbiAgICAgICAgdGhpcy5faW5pdFF1ZXVlKCk7XG4gICAgICAgIHRoaXMuX2luaXRNYW5hZ2VycygpO1xuICAgIH0sXG5cbiAgICBfaW5pdEZvcm06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5mb3JtID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KHRoaXMuZm9ybSk7XG4gICAgICAgIHRoaXMuZm9ybS5vbihGaWxlVXAuZm9ybS5Gb3JtLkVWRU5UX1NVQk1JVCwgdGhpcy5fb25Gb3JtU3VibWl0LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBfaW5pdFF1ZXVlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucXVldWUgPSBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jcmVhdGVPYmplY3QodGhpcy5xdWV1ZSk7XG4gICAgfSxcblxuICAgIF9pbml0TWFuYWdlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1hbmFnZXJzID0gW1xuICAgICAgICAgICAgJ3F1ZXVlJ1xuICAgICAgICBdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbWFuYWdlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IG1hbmFnZXJzW2ldICsgJ01hbmFnZXInO1xuICAgICAgICAgICAgdGhpc1tuYW1lXSA9IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgICAgICBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5tZXJnZShcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGVjdGlvbjogdGhpcy5xdWV1ZVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzW25hbWVdXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBPcGVuIGJyb3dzZSBmaWxlcyBkaWFsb2cgb24gbG9jYWwgbWFjaGluZVxuICAgICAqL1xuICAgIGJyb3dzZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZvcm0uYnJvd3NlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZvcm0uZGVzdHJveSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50fSBpbnB1dEVsZW1lbnRcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgX29uRm9ybVN1Ym1pdDogZnVuY3Rpb24gKGlucHV0RWxlbWVudCkge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSBudWxsO1xuICAgICAgICB2YXIgaXNJRSA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNJRSgpO1xuICAgICAgICBpZiAoaXNJRSAmJiBpc0lFIDwgMTApIHtcbiAgICAgICAgICAgIHVwbG9hZGVyID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYmFja2VuZFVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm06IHRoaXMuZm9ybVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwbG9hZGVyQ29uZmlncy5pZnJhbWVcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZpbGVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW5wdXRFbGVtZW50LmdldENvdW50KCk7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBmaWxlID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgICAgIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLm1lcmdlKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbnB1dEVsZW1lbnQ6IGlucHV0RWxlbWVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlucHV0RWxlbWVudEluZGV4OiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVsYXRpdmVQYXRoOiBpbnB1dEVsZW1lbnQuZ2V0RmlsZVJlbGF0aXZlUGF0aChpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGlucHV0RWxlbWVudC5nZXRGaWxlTmFtZShpKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzVG90YWw6IGlucHV0RWxlbWVudC5nZXRGaWxlU2l6ZShpKVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVDb25maWdcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBmaWxlLnNldFVwbG9hZGVyKHVwbG9hZGVyIHx8IEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyLmNyZWF0ZU9iamVjdChcbiAgICAgICAgICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIubWVyZ2UoXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB0aGlzLmJhY2tlbmRVcmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkZXJDb25maWdzLnhoclxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZmlsZXMucHVzaChmaWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucXVldWUuYWRkKGZpbGVzKTtcbiAgICB9XG5cbn0pO1xuXG4vKipcbiAqIEBtb2R1bGUgRmlsZVVwXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gRmlsZVVwO1xuXG59LHtcIm5lYXRuZXNzXCI6MjF9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9PYmplY3QnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuQ29tcG9uZW50XG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuYmFzZS5Db21wb25lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIF9ldmVudHM6IHt9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xzdHJpbmdbXX0gbmFtZXNcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICovXG4gICAgb246IGZ1bmN0aW9uKG5hbWVzLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmICghKG5hbWVzIGluc3RhbmNlb2YgQXJyYXkpKSB7XG4gICAgICAgICAgICBuYW1lcyA9IFtuYW1lc107XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IG5hbWVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXSA9IHRoaXMuX2V2ZW50c1tuYW1lXSB8fCBbXTtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8c3RyaW5nW119IFtuYW1lc11cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBbaGFuZGxlcl1cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uKG5hbWVzLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChuYW1lcykge1xuICAgICAgICAgICAgaWYgKCEobmFtZXMgaW5zdGFuY2VvZiBBcnJheSkpIHtcbiAgICAgICAgICAgICAgICBuYW1lcyA9IFtuYW1lc107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbmFtZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWUgPSBuYW1lc1tpXTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9ldmVudHNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2V2ZW50c1tuYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1tuYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAgICAgKiBAcGFyYW0geypbXX0gW2FyZ3NdXG4gICAgICovXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24obmFtZSwgYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCBbXTtcblxuICAgICAgICBpZiAodGhpcy5fZXZlbnRzW25hbWVdKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2V2ZW50c1tuYW1lXS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbbmFtZV1baV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjIsXCIuL09iamVjdFwiOjd9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxucmVxdWlyZSgnLi9PYmplY3QnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuRWxlbWVudFxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuRWxlbWVudCcsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuRWxlbWVudC5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIGVsZW1lbnQ6IG51bGwsXG5cbiAgICBoaWRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLnRvcCA9ICctOTk5cHgnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUubGVmdCA9ICctOTk5cHgnO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmZpbHRlciA9ICdhbHBoYShvcGFjaXR5PTApJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmJvcmRlciA9ICdub25lJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLm91dGxpbmUgPSAnbm9uZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS53aWR0aCA9ICdub25lJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmhlaWdodCA9ICdub25lJztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlWydwb2ludGVyLWV2ZW50cyddID0gJ25vbmUnO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGNvbnRhaW5lclxuICAgICAqL1xuICAgIGFwcGVuZFRvOiBmdW5jdGlvbihjb250YWluZXIpIHtcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmVsZW1lbnQgJiYgdGhpcy5lbGVtZW50LnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjIsXCIuL09iamVjdFwiOjd9XSw1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmJhc2UuRXhjZXB0aW9uXG4gKiBAZXh0ZW5kcyBFcnJvclxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5iYXNlLkV4Y2VwdGlvbicsIC8qKiBAbGVuZHMgRmlsZVVwLmJhc2UuRXhjZXB0aW9uLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRXJyb3IsXG5cbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLl9fc3RhdGljKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5hbWUgPSB0aGlzLl9fY2xhc3NOYW1lO1xuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8ICcnO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDY6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBGaWxlVXBcbiAqIEBpZ25vcmVcbiAqL1xudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xuXG5yZXF1aXJlKCcuL09iamVjdCcpO1xuXG4vKipcbiAqIEBjbGFzcyBGaWxlVXAuYmFzZS5NYW5hZ2VyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuYmFzZS5NYW5hZ2VyJywgLyoqIEBsZW5kcyBGaWxlVXAuYmFzZS5NYW5hZ2VyLnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuT2JqZWN0LFxuXG4gICAgZW5hYmxlOiB0cnVlLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9ufVxuICAgICAqL1xuICAgIGNvbGxlY3Rpb246IG51bGwsXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuZW5hYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ub24oRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb24uRVZFTlRfQURELCB0aGlzLl9vbkFkZC5iaW5kKHRoaXMpKTtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5vbihGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbi5FVkVOVF9SRU1PVkUsIHRoaXMuX29uUmVtb3ZlLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9vbkFkZDogZnVuY3Rpb24oKSB7XG4gICAgfSxcblxuICAgIF9vblJlbW92ZTogZnVuY3Rpb24oKSB7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyLFwiLi9PYmplY3RcIjo3fV0sNzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5iYXNlLk9iamVjdFxuICogQGV4dGVuZHMgTmVhdG5lc3MuT2JqZWN0XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmJhc2UuT2JqZWN0JywgLyoqIEBsZW5kcyBGaWxlVXAuYmFzZS5PYmplY3QucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuTmVhdG5lc3MuT2JqZWN0LFxuXG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25maWcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5jb25maWd1cmUodGhpcywgY29uZmlnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcblxuICAgIH1cblxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sODpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLkZvcm1cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5mb3JtLkZvcm0nLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLkZvcm0ucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5Gb3JtICove1xuXG4gICAgICAgIEVWRU5UX1NVQk1JVDogJ3N1Ym1pdCdcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XG4gICAgICovXG4gICAgY29udGFpbmVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgX2lzTXVsdGlwbGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLmZvcm0uRm9ybUVsZW1lbnR9XG4gICAgICovXG4gICAgX2Zvcm1FbGVtZW50OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudH1cbiAgICAgKi9cbiAgICBfbGFzdElucHV0RWxlbWVudDogbnVsbCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnRbXX1cbiAgICAgKi9cbiAgICBfaW5wdXRFbGVtZW50czogW10sXG5cbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gSW5pdCBjb250YWluZXJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgICAgIC8vIENyZWF0ZSBmb3JtIGVsZW1lbnRcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuYXBwZW5kVG8odGhpcy5jb250YWluZXIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBuZXcgaW5wdXQgZWxlbWVudFxuICAgICAgICB0aGlzLl9yZWZyZXNoSW5wdXQoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBnZXRNdWx0aXBsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc011bHRpcGxlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRNdWx0aXBsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgdGhpcy5faXNNdWx0aXBsZSA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLl9sYXN0SW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmVsZW1lbnQubXVsdGlwbGUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzdWJtaXQ6IGZ1bmN0aW9uKHVybCwgdGFyZ2V0KSB7XG4gICAgICAgIC8vIFNldCBkZXN0aW5hdGlvblxuICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5lbGVtZW50LmFjdGlvbiA9IHVybDtcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSB0YXJnZXQ7XG5cbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5zdWJtaXQoKTtcblxuICAgICAgICAvLyBSZXNldCB2YWx1ZXNcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC5hY3Rpb24gPSAnJztcbiAgICAgICAgdGhpcy5fZm9ybUVsZW1lbnQuZWxlbWVudC50YXJnZXQgPSAnJztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogT3BlbiBicm93c2UgZmlsZXMgZGlhbG9nIG9uIGxvY2FsIG1hY2hpbmVcbiAgICAgKi9cbiAgICBicm93c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIk1vdXNlRXZlbnRzXCIpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoXCJjbGlja1wiLCB0cnVlLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5lbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBfcmVmcmVzaElucHV0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEZyZWV6ZSBwcmV2aW91cyBlbGVtZW50LCBidXQgZG8gbm90IGRldGFjaFxuICAgICAgICBpZiAodGhpcy5fbGFzdElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdElucHV0RWxlbWVudC5mcmVlemUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xhc3RJbnB1dEVsZW1lbnQgPSBuZXcgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50KHtcbiAgICAgICAgICAgIG11bHRpcGxlOiB0aGlzLmdldE11bHRpcGxlKCksXG4gICAgICAgICAgICBvbkNoYW5nZTogdGhpcy5fb25JbnB1dENoYW5nZS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9sYXN0SW5wdXRFbGVtZW50LmFwcGVuZFRvKHRoaXMuX2Zvcm1FbGVtZW50LmVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9pbnB1dEVsZW1lbnRzLnB1c2godGhpcy5fbGFzdElucHV0RWxlbWVudCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIF9vbklucHV0Q2hhbmdlOiBmdW5jdGlvbihvRXZlbnQpIHtcbiAgICAgICAgb0V2ZW50ID0gb0V2ZW50IHx8IHdpbmRvdy5ldmVudDtcblxuICAgICAgICBvRXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAodGhpcy5fbGFzdElucHV0RWxlbWVudC5nZXRDb3VudCgpID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9TVUJNSVQsIFt0aGlzLl9sYXN0SW5wdXRFbGVtZW50XSk7XG4gICAgICAgIHRoaXMuX3JlZnJlc2hJbnB1dCgpO1xuICAgIH0sXG5cbiAgICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Zvcm1FbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLl9mb3JtRWxlbWVudC5kZXN0cm95KCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLl9pbnB1dEVsZW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5faW5wdXRFbGVtZW50c1tpXS5kZXN0cm95KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9mZih0aGlzLl9fc3RhdGljLkVWRU5UX1NVQk1JVCk7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sOTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5mb3JtLkZvcm1FbGVtZW50XG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5FbGVtZW50XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmZvcm0uRm9ybUVsZW1lbnQnLCAvKiogQGxlbmRzIEZpbGVVcC5mb3JtLkZvcm1FbGVtZW50LnByb3RvdHlwZSAqL3tcblxuICAgIF9fZXh0ZW5kczogRmlsZVVwLmJhc2UuRWxlbWVudCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdtZXRob2QnLCAnUE9TVCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdlbmN0eXBlJywgJ211bHRpcGFydC9mb3JtLWRhdGEnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnYWNjZXB0Q2hhcnNldCcsICdVVEYtOCcpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKCdjaGFyYWN0ZXJTZXQnLCAnVVRGLTgnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZSgnY2hhcnNldCcsICdVVEYtOCcpO1xuXG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDEwOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50XG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5FbGVtZW50XG4gKi9cbkZpbGVVcC5OZWF0bmVzcy5kZWZpbmVDbGFzcygnRmlsZVVwLmZvcm0uSW5wdXRFbGVtZW50JywgLyoqIEBsZW5kcyBGaWxlVXAuZm9ybS5JbnB1dEVsZW1lbnQucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5FbGVtZW50LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBuYW1lOiAnZmlsZScsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBtdWx0aXBsZTogZmFsc2UsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICovXG4gICAgb25DaGFuZ2U6IG51bGwsXG5cbiAgICBfZmlsZU5hbWVzOiB7fSxcblxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnR5cGUgPSAnZmlsZSc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5uYW1lID0gdGhpcy5uYW1lICsgKHRoaXMubXVsdGlwbGUgPyAnW10nIDogJycpO1xuICAgICAgICB0aGlzLmVsZW1lbnQubXVsdGlwbGUgPSB0aGlzLm11bHRpcGxlO1xuXG4gICAgICAgIC8vIElFOCBmaWxlIGZpZWxkIHRyYW5zcGFyZW5jeSBmaXguXG4gICAgICAgIGlmIChGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzSUUoKSkge1xuICAgICAgICAgICAgdmFyIHN0eWxlID0gdGhpcy5lbGVtZW50LnN0eWxlO1xuICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICdoaWRkZW4nO1xuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUudmlzaWJpbGl0eSA9ICd2aXNpYmxlJztcbiAgICAgICAgICAgIH0sIDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3Vic2NyaWJlIG9uIGNoYW5nZSBpbnB1dCBmaWxlc1xuICAgICAgICBpZiAodGhpcy5vbkNoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm9uY2hhbmdlID0gdGhpcy5vbkNoYW5nZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleFxuICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICovXG4gICAgZ2V0RmlsZURvbU9iamVjdDogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgaW5kZXggPSBpbmRleCB8fCAwO1xuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmZpbGVzICYmIHRoaXMuZWxlbWVudC5maWxlc1tpbmRleF0gfHwgbnVsbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldEZpbGVTaXplOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgdmFyIGZpbGVEb21PYmplY3QgPSB0aGlzLmdldEZpbGVEb21PYmplY3QoaW5kZXgpO1xuICAgICAgICByZXR1cm4gZmlsZURvbU9iamVjdCA/IGZpbGVEb21PYmplY3QuZmlsZVNpemUgfHwgZmlsZURvbU9iamVjdC5zaXplIDogMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXhcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfVxuICAgICAqL1xuICAgIGdldEZpbGVOYW1lOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgaWYgKCF0aGlzLl9maWxlTmFtZXMuaGFzT3duUHJvcGVydHkoaW5kZXgpKSB7XG4gICAgICAgICAgICB2YXIgZmlsZURvbU9iamVjdCA9IHRoaXMuZ2V0RmlsZURvbU9iamVjdChpbmRleCk7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IGZpbGVEb21PYmplY3QgPyBmaWxlRG9tT2JqZWN0LmZpbGVOYW1lIHx8IGZpbGVEb21PYmplY3QubmFtZSA6ICcnO1xuXG4gICAgICAgICAgICB0aGlzLl9maWxlTmFtZXNbaW5kZXhdID0gcGF0aCA/IEZpbGVVcC5oZWxwZXJzLlVybEhlbHBlci5wYXJzZUZpbGVOYW1lKHBhdGgpIDogJyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVOYW1lc1tpbmRleF07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4XG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRGaWxlUmVsYXRpdmVQYXRoOiBmdW5jdGlvbihpbmRleCkge1xuICAgICAgICBpbmRleCA9IGluZGV4IHx8IDA7XG5cbiAgICAgICAgdmFyIGZpbGVEb21PYmplY3QgPSB0aGlzLmdldEZpbGVEb21PYmplY3QoaW5kZXgpO1xuICAgICAgICBpZiAoZmlsZURvbU9iamVjdCAmJiBmaWxlRG9tT2JqZWN0LndlYmtpdFJlbGF0aXZlUGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGVEb21PYmplY3Qud2Via2l0UmVsYXRpdmVQYXRoXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL15bXFwvXFxcXF0rLywgJycpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcL1xcLiQvLCAnLycpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9LFxuXG4gICAgZ2V0Q291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5lbGVtZW50LmZpbGVzKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LmZpbGVzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnZhbHVlID8gMSA6IDA7XG4gICAgfSxcblxuICAgIGZyZWV6ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudC5vbmNoYW5nZSA9IG51bGw7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmVsZW1lbnQub25jaGFuZ2UgPSBudWxsO1xuICAgICAgICB0aGlzLl9fc3VwZXIoKTtcbiAgICB9XG5cbn0pO1xuXG59LHtcIi4uL0ZpbGVVcFwiOjJ9XSwxMTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxuICogQGlnbm9yZVxuICovXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XG5cbi8qKlxuICogQGNsYXNzIEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXJcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXInLCAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5PYmplY3QsXG5cbiAgICBfX3N0YXRpYzogLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyICove1xuXG4gICAgICAgIF9icm93c2VyTmFtZTogbnVsbCxcblxuICAgICAgICBfYnJvd3NlclZlcnNpb246IG51bGwsXG5cbiAgICAgICAgX2RldGVjdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2Jyb3dzZXJOYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50LCB0ZW0sXG4gICAgICAgICAgICAgICAgTSA9IHVhLm1hdGNoKC8ob3BlcmF8Y2hyb21lfHNhZmFyaXxmaXJlZm94fG1zaWV8dHJpZGVudCg/PVxcLykpXFwvP1xccyooXFxkKykvaSkgfHwgW107XG4gICAgICAgICAgICBpZiAoL3RyaWRlbnQvaS50ZXN0KE1bMV0pKSB7XG4gICAgICAgICAgICAgICAgdGVtID0gL1xcYnJ2WyA6XSsoXFxkKykvZy5leGVjKHVhKSB8fCBbXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJOYW1lID0gJ3RyaWRlbnQnO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gdGVtWzFdIHx8IDE7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE1bMV0gPT09ICdDaHJvbWUnKSB7XG4gICAgICAgICAgICAgICAgdGVtID0gdWEubWF0Y2goL1xcYihPUFJ8RWRnZSlcXC8oXFxkKykvKTtcbiAgICAgICAgICAgICAgICBpZiAodGVtICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvd3Nlck5hbWUgPSB0ZW1bMV0ucmVwbGFjZSgnT1BSJywgJ09wZXJhJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYnJvd3NlclZlcnNpb24gPSB0ZW1bMl0gfHwgMTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIE0gPSBNWzJdID8gW01bMV0sIE1bMl1dIDogW25hdmlnYXRvci5hcHBOYW1lLCBuYXZpZ2F0b3IuYXBwVmVyc2lvbiwgJy0/J107XG4gICAgICAgICAgICBpZiAoKHRlbSA9IHVhLm1hdGNoKC92ZXJzaW9uXFwvKFxcZCspL2kpKSAhPSBudWxsKSBNLnNwbGljZSgxLCAxLCB0ZW1bMV0pO1xuXG4gICAgICAgICAgICB0aGlzLl9icm93c2VyTmFtZSA9IE1bMF0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX2Jyb3dzZXJWZXJzaW9uID0gTVsxXSB8fCAxO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzSUU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnbXNpZScgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzV2Via2l0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc0Nocm9tZSgpIHx8IHRoaXMuaXNTYWZhcmkoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0Nocm9tZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICdjaHJvbWUnID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1NhZmFyaTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICdzYWZhcmknID8gdGhpcy5fYnJvd3NlclZlcnNpb24gOiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc0ZpcmVmb3g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuX2RldGVjdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Jyb3dzZXJOYW1lID09PSAnZmlyZWZveCcgPyB0aGlzLl9icm93c2VyVmVyc2lvbiA6IGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzVHJpZGVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fZGV0ZWN0KCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYnJvd3Nlck5hbWUgPT09ICd0cmlkZW50JyA/IHRoaXMuX2Jyb3dzZXJWZXJzaW9uIDogZmFsc2U7XG4gICAgICAgIH1cblxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDEyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXJcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyJywgLyoqIEBsZW5kcyBGaWxlVXAuaGVscGVycy5DbGFzc0hlbHBlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLkNsYXNzSGVscGVyICove1xuXG4gICAgICAgIGNyZWF0ZU9iamVjdDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgaWYgKCFjb25maWcuY2xhc3NOYW1lKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignV3JvbmcgY29uZmlndXJhdGlvbiBmb3IgY3JlYXRlIG9iamVjdC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uZmlnID0gdGhpcy5fX3N0YXRpYy5jbG9uZShjb25maWcpO1xuICAgICAgICAgICAgdmFyIGNsYXNzTmFtZSA9IGNvbmZpZy5jbGFzc05hbWU7XG4gICAgICAgICAgICBkZWxldGUgY29uZmlnLmNsYXNzTmFtZTtcblxuICAgICAgICAgICAgLy8gR2V0IGNsYXNzXG4gICAgICAgICAgICB2YXIgb2JqZWN0Q2xhc3MgPSBGaWxlVXAuTmVhdG5lc3MubmFtZXNwYWNlKGNsYXNzTmFtZSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9iamVjdENsYXNzICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignTm90IGZvdW5kIGNsYXNzIGAnICsgY2xhc3NOYW1lICsgJ2AgZm9yIGNyZWF0ZSBpbnN0YW5jZS4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG5ldyBvYmplY3RDbGFzcyhjb25maWcpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gb2JqZWN0XG4gICAgICAgICAqIEBwYXJhbSBjb25maWdcbiAgICAgICAgICovXG4gICAgICAgIGNvbmZpZ3VyZTogZnVuY3Rpb24gKG9iamVjdCwgY29uZmlnKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb25maWcuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBHZW5lcmF0ZSBzZXR0ZXIgbmFtZVxuICAgICAgICAgICAgICAgIHZhciBzZXR0ZXIgPSAnc2V0JyArIGtleS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGtleS5zbGljZSgxKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W3NldHRlcl0gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEZpbGVVcC5iYXNlLkV4Y2VwdGlvbignWW91IGNhbiBub3QgcmVwbGFjZSBmcm9tIGNvbmZpZyBmdW5jdGlvbiBgJyArIGtleSArICdgIGluIG9iamVjdCBgJyArIG9iamVjdC5jbGFzc05hbWUoKSArICdgLicpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvYmplY3Rba2V5XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBGaWxlVXAuYmFzZS5FeGNlcHRpb24oJ0NvbmZpZyBwYXJhbSBgJyArIGtleSArICdgIGlzIHVuZGVmaW5lZCBpbiBvYmplY3QgYCcgKyBvYmplY3QuY2xhc3NOYW1lKCkgKyAnYC4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0W2tleV0gIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvYmplY3Rba2V5XSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5faXNTaW1wbGVPYmplY3Qob2JqZWN0W2tleV0pICYmIHRoaXMuX2lzU2ltcGxlT2JqZWN0KG9iamVjdFtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W2tleV0gPSB0aGlzLl9fc3RhdGljLm1lcmdlKG9iamVjdFtrZXldLCBjb25maWdba2V5XSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGNvbmZpZ1trZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqZWN0W3NldHRlcl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0W3NldHRlcl0uY2FsbChvYmplY3QsIGNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0Li4ufSBbb2JqXVxuICAgICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgbWVyZ2U6IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgICAgIHZhciBkc3QgPSB7fTtcblxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgICAgICAgICAgICAgb2JqID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqICE9PSAnb2JqZWN0JyB8fCBvYmogaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2lzU2ltcGxlT2JqZWN0KG9ialtrZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRzdFtrZXldID0gdGhpcy5fX3N0YXRpYy5tZXJnZShkc3Rba2V5XSwgb2JqW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkc3Rba2V5XSA9IG9ialtrZXldO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gZHN0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb2JqXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgdmFyIGNsb25lID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lW2tleV0gPSBvYmpba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2lzU2ltcGxlT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgIHJldHVybiBvYmogJiYgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiYgIShvYmogaW5zdGFuY2VvZiBBcnJheSkgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBPYmplY3Q7XG4gICAgICAgIH1cblxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDEzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLmhlbHBlcnMuVXJsSGVscGVyXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5PYmplY3RcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAuaGVscGVycy5VcmxIZWxwZXInLCAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLlVybEhlbHBlci5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5oZWxwZXJzLlVybEhlbHBlciAqL3tcblxuICAgICAgICBwYXJzZUZpbGVOYW1lOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgICAgIHZhciBtYXRjaGVzID0gL1teXFwvXFxcXF0rJC8uZXhlYyh1cmwpO1xuICAgICAgICAgICAgaWYgKG1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0Y2hlc1swXS5yZXBsYWNlKC9eKFteP10rKS4qJC8sICckMScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1hbmFnZXJzLlF1ZXVlTWFuYWdlclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuTWFuYWdlclxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXInLCAvKiogQGxlbmRzIEZpbGVVcC5tYW5hZ2Vycy5RdWV1ZU1hbmFnZXIucHJvdG90eXBlICove1xuXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5NYW5hZ2VyLFxuXG4gICAgX29uQWRkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fcXVldWVOZXh0KCk7XG4gICAgfSxcblxuICAgIF9xdWV1ZU5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmlsZSA9IHRoaXMuY29sbGVjdGlvbi5nZXROZXh0Rm9yVXBsb2FkKCk7XG4gICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICBmaWxlLnN0YXJ0KCk7XG4gICAgICAgICAgICB0aGlzLl9xdWV1ZU5leHQoKTtcbiAgICAgICAgfVxuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE1OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5GaWxlXG4gKiBAZXh0ZW5kcyBGaWxlVXAuYmFzZS5Db21wb25lbnRcbiAqL1xuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAubW9kZWxzLkZpbGUnLCAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZS5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZSAqL3tcblxuICAgICAgICBTVEFUVVNfUVVFVUU6ICdxdWV1ZScsXG4gICAgICAgIFNUQVRVU19QUk9DRVNTOiAncHJvY2VzcycsXG4gICAgICAgIFNUQVRVU19QQVVTRTogJ3BhdXNlJyxcbiAgICAgICAgU1RBVFVTX0VORDogJ2VuZCcsXG5cbiAgICAgICAgUkVTVUxUX1NVQ0NFU1M6ICdzdWNjZXNzJyxcbiAgICAgICAgUkVTVUxUX0VSUk9SOiAnZXJyb3InLFxuXG4gICAgICAgIEVWRU5UX1NUQVRVUzogJ3N0YXR1cycsXG4gICAgICAgIEVWRU5UX1BST0dSRVNTOiAncHJvZ3Jlc3MnXG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLklucHV0RWxlbWVudH1cbiAgICAgKi9cbiAgICBpbnB1dEVsZW1lbnQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIGlucHV0RWxlbWVudEluZGV4OiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzfVxuICAgICAqL1xuICAgIHByb2dyZXNzOiB7XG4gICAgICAgIGNsYXNzTmFtZTogJ0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzJ1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7RmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJ9XG4gICAgICovXG4gICAgX3VwbG9hZGVyOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgKi9cbiAgICBfcmVsYXRpdmVQYXRoOiAnJyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgX25hbWU6ICcnLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBfYnl0ZXNVcGxvYWRlZDogMCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtudW1iZXJ9XG4gICAgICovXG4gICAgX2J5dGVzVXBsb2FkRW5kOiAwLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcn1cbiAgICAgKi9cbiAgICBfYnl0ZXNUb3RhbDogMCxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICovXG4gICAgX3N0YXR1czogJ3F1ZXVlJyxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtzdHJpbmd8bnVsbH1cbiAgICAgKi9cbiAgICBfcmVzdWx0OiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxuICAgICAqL1xuICAgIF9yZXN1bHRIdHRwU3RhdHVzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge3N0cmluZ3xudWxsfVxuICAgICAqL1xuICAgIF9yZXN1bHRIdHRwTWVzc2FnZTogbnVsbCxcblxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIuY3JlYXRlT2JqZWN0KFxuICAgICAgICAgICAgRmlsZVVwLmhlbHBlcnMuQ2xhc3NIZWxwZXIubWVyZ2UoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmaWxlOiB0aGlzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0aGlzLnByb2dyZXNzXG4gICAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fdXBsb2FkZXIuc3RhcnQoKTtcbiAgICB9LFxuXG4gICAgcGF1c2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRSkge1xuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgIHRoaXMuX3NldFN0YXR1cyh0aGlzLl9fc3RhdGljLlNUQVRVU19QQVVTRSk7XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl91cGxvYWRlci5zdG9wKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge29iamVjdH1cbiAgICAgKi9cbiAgICBnZXREb21PYmplY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pbnB1dEVsZW1lbnQuZ2V0RmlsZURvbU9iamVjdCh0aGlzLmlucHV0RWxlbWVudEluZGV4KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRSZWxhdGl2ZVBhdGg6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3JlbGF0aXZlUGF0aCA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0UmVsYXRpdmVQYXRoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlbGF0aXZlUGF0aDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXROYW1lOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gdmFsdWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXROYW1lOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25hbWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRVcGxvYWRlcjogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VwbG9hZGVyKSB7XG4gICAgICAgICAgICB0aGlzLl91cGxvYWRlci5zdG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91cGxvYWRlciA9IHZhbHVlO1xuXG4gICAgICAgIHRoaXMuX3VwbG9hZGVyLm9uKEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLkVWRU5UX1NUQVJULCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1BST0dSRVNTKTtcblxuICAgICAgICAgICAgdGhpcy5fcmVzdWx0SHR0cFN0YXR1cyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfUFJPQ0VTUyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfRVJST1IsIGZ1bmN0aW9uKHN0YXR1cywgbWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MpO1xuXG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9fc3RhdGljLlJFU1VMVF9FUlJPUjtcbiAgICAgICAgICAgIHRoaXMuX3Jlc3VsdEh0dHBTdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgICAgICB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLl9zZXRTdGF0dXModGhpcy5fX3N0YXRpYy5TVEFUVVNfRU5EKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLl91cGxvYWRlci5vbihGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5FVkVOVF9FTkQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5wcm9ncmVzcy5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MpO1xuXG4gICAgICAgICAgICB0aGlzLl9yZXN1bHQgPSB0aGlzLl9fc3RhdGljLlJFU1VMVF9TVUNDRVNTO1xuICAgICAgICAgICAgdGhpcy5fc2V0U3RhdHVzKHRoaXMuX19zdGF0aWMuU1RBVFVTX0VORCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5fdXBsb2FkZXIub24oRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIuRVZFTlRfUFJPR1JFU1MsIGZ1bmN0aW9uKGJ5dGVzVXBsb2FkZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvZ3Jlc3MuYWRkKGJ5dGVzVXBsb2FkZWQpO1xuICAgICAgICAgICAgdGhpcy5zZXRCeXRlc1VwbG9hZGVkKGJ5dGVzVXBsb2FkZWQpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlcn1cbiAgICAgKi9cbiAgICBnZXRVcGxvYWRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl91cGxvYWRlcjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1VwbG9hZGVkOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNVcGxvYWRlZCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVXBsb2FkZWQgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Qnl0ZXNVcGxvYWRlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1VwbG9hZGVkO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxuICAgICAqL1xuICAgIHNldEJ5dGVzVXBsb2FkRW5kOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNVcGxvYWRFbmQgPT09IHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9ieXRlc1VwbG9hZEVuZCA9IHZhbHVlO1xuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9QUk9HUkVTUyk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRCeXRlc1VwbG9hZEVuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1VwbG9hZEVuZDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gdmFsdWVcbiAgICAgKi9cbiAgICBzZXRCeXRlc1RvdGFsOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fYnl0ZXNUb3RhbCA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2J5dGVzVG90YWwgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgZ2V0Qnl0ZXNUb3RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ieXRlc1RvdGFsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd9XG4gICAgICovXG4gICAgZ2V0UmVzdWx0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Jlc3VsdDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1Jlc3VsdFN1Y2Nlc3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0ID09PSB0aGlzLl9fc3RhdGljLlJFU1VMVF9TVUNDRVNTO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGlzUmVzdWx0RXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVzdWx0ID09PSB0aGlzLl9fc3RhdGljLlJFU1VMVF9FUlJPUjtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfG51bGx9XG4gICAgICovXG4gICAgZ2V0UmVzdWx0SHR0cFN0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHRIdHRwU3RhdHVzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtzdHJpbmd8bnVsbH1cbiAgICAgKi9cbiAgICBnZXRSZXN1bHRIdHRwTWVzc2FnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXN1bHRIdHRwTWVzc2FnZTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1F1ZXVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUVVFVUU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNTdGF0dXNQcm9jZXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUFJPQ0VTUztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBpc1N0YXR1c1BhdXNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cyA9PT0gdGhpcy5fX3N0YXRpYy5TVEFUVVNfUEFVU0U7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaXNTdGF0dXNFbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzID09PSB0aGlzLl9fc3RhdGljLlNUQVRVU19FTkQ7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqXG4gICAgICogQHJldHVybnMge3N0cmluZ31cbiAgICAgKi9cbiAgICBnZXRTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3RhdHVzO1xuICAgIH0sXG5cbiAgICBfc2V0U3RhdHVzOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy5fc3RhdHVzID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fc3RhdHVzID0gdmFsdWU7XG4gICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX1NUQVRVUywgW3RoaXMuX3N0YXR1c10pO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5GaWxlUHJvZ3Jlc3NcbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLk9iamVjdFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzJywgLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLkZpbGVQcm9ncmVzcy5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLk9iamVjdCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuRmlsZVByb2dyZXNzICove1xuXG4gICAgICAgIFNQRUVEX01JTl9NRUFTVVJFTUVOVF9DT1VOVDogMixcbiAgICAgICAgU1BFRURfTUFYX01FQVNVUkVNRU5UX0NPVU5UOiA1XG5cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cbiAgICAgKi9cbiAgICBmaWxlOiBudWxsLFxuXG4gICAgX2hpc3Rvcnk6IFtdLFxuXG4gICAgX2xhc3RUaW1lOiBudWxsLFxuXG4gICAgYWRkOiBmdW5jdGlvbihieXRlc1VwbG9hZGVkKSB7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG4gICAgICAgIHRoaXMuX2hpc3RvcnkucHVzaCh7XG4gICAgICAgICAgICBieXRlczogYnl0ZXNVcGxvYWRlZCAtIHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCksXG4gICAgICAgICAgICBkdXJhdGlvbjogdGhpcy5fbGFzdFRpbWUgPyBub3cgLSB0aGlzLl9sYXN0VGltZSA6IG51bGxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2xhc3RUaW1lID0gbm93O1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX2hpc3RvcnkgPSBbXTtcbiAgICAgICAgdGhpcy5fbGFzdFRpbWUgPSBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfSBTZWNvbmRzXG4gICAgICovXG4gICAgZ2V0VGltZUxlZnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnl0ZXNUb3RhbCA9IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCk7XG4gICAgICAgIGlmIChieXRlc1RvdGFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcGVlZCA9IHRoaXMuZ2V0U3BlZWQoKTtcbiAgICAgICAgaWYgKHNwZWVkID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBieXRlc1VwbG9hZGVkID0gdGhpcy5maWxlLmdldEJ5dGVzVXBsb2FkZWQoKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKChieXRlc1RvdGFsIC0gYnl0ZXNVcGxvYWRlZCkgLyBzcGVlZCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IEJ5dGVzIGluIHNlY29uZFxuICAgICAqL1xuICAgIGdldFNwZWVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2hpc3RvcnkubGVuZ3RoIDwgdGhpcy5fX3N0YXRpYy5TUEVFRF9NSU5fTUVBU1VSRU1FTlRfQ09VTlQpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IGxhc3QgZGlmZiB2YWx1ZXNcbiAgICAgICAgdmFyIGhpc3RvcnkgPSB0aGlzLl9oaXN0b3J5LnNsaWNlKC0xICogdGhpcy5fX3N0YXRpYy5TUEVFRF9NQVhfTUVBU1VSRU1FTlRfQ09VTlQpO1xuXG4gICAgICAgIC8vIENhbGN1bGF0ZSBhdmVyYWdlIHVwbG9hZCBzcGVlZFxuICAgICAgICB2YXIgc3VtbWFyeUJ5dGVzID0gMDtcbiAgICAgICAgdmFyIHN1bW1hcnlEdXJhdGlvbiA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaGlzdG9yeS5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN1bW1hcnlCeXRlcyArPSBoaXN0b3J5W2ldLmJ5dGVzO1xuICAgICAgICAgICAgc3VtbWFyeUR1cmF0aW9uICs9IGhpc3RvcnlbaV0uZHVyYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3VtbWFyeUJ5dGVzID09PSAwIHx8IHN1bW1hcnlEdXJhdGlvbiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChzdW1tYXJ5Qnl0ZXMgLyAoc3VtbWFyeUR1cmF0aW9uIC8gMTAwMCkpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldFBlcmNlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYnl0ZXNUb3RhbCA9IHRoaXMuZmlsZS5nZXRCeXRlc1RvdGFsKCk7XG4gICAgICAgIGlmIChieXRlc1RvdGFsID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBieXRlc1VwbG9hZGVkID0gdGhpcy5maWxlLmdldEJ5dGVzVXBsb2FkZWQoKTtcbiAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoYnl0ZXNVcGxvYWRlZCAqIDEwMCAvIGJ5dGVzVG90YWwpO1xuICAgIH1cblxufSk7XG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXG4gKiBAaWdub3JlXG4gKi9cbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcblxuLyoqXG4gKiBAY2xhc3MgRmlsZVVwLm1vZGVscy5RdWV1ZUNvbGxlY3Rpb25cbiAqIEBleHRlbmRzIEZpbGVVcC5iYXNlLkNvbXBvbmVudFxuICovXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uJywgLyoqIEBsZW5kcyBGaWxlVXAubW9kZWxzLlF1ZXVlQ29sbGVjdGlvbi5wcm90b3R5cGUgKi97XG5cbiAgICBfX2V4dGVuZHM6IEZpbGVVcC5iYXNlLkNvbXBvbmVudCxcblxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC5tb2RlbHMuUXVldWVDb2xsZWN0aW9uICove1xuXG4gICAgICAgIEVWRU5UX0FERDogJ2FkZCcsXG4gICAgICAgIEVWRU5UX1JFTU9WRTogJ3JlbW92ZSdcblxuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgICAqL1xuICAgIG1heENvbmN1cnJlbnRVcGxvYWRzOiAzLFxuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZVtdfVxuICAgICAqL1xuICAgIF9maWxlczogW10sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLm1vZGVscy5GaWxlW119IGZpbGVzXG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgdGhpcy5fZmlsZXMgPSB0aGlzLl9maWxlcy5jb25jYXQoZmlsZXMpO1xuICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9BREQsIFtmaWxlc10pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RmlsZVVwLm1vZGVscy5GaWxlW119IGZpbGVzXG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoZmlsZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBmaWxlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbGVzLmluZGV4T2YoZmlsZXNbaV0pO1xuICAgICAgICAgICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZpbGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUkVNT1ZFLCBbZmlsZXNdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZmlsZXMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldFF1ZXVlQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvdW50KFxuICAgICAgICAgICAgLyoqIEBwYXJhbSB7RmlsZVVwLm1vZGVscy5GaWxlfSBmaWxlICovXG4gICAgICAgICAgICBmdW5jdGlvbiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlLmlzU3RhdHVzUXVldWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBAcmV0dXJucyB7bnVtYmVyfVxuICAgICAqL1xuICAgIGdldFByb2Nlc3NDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY291bnQoXG4gICAgICAgICAgICAvKiogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGV9IGZpbGUgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUuaXNTdGF0dXNQcm9jZXNzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQHJldHVybnMge251bWJlcn1cbiAgICAgKi9cbiAgICBnZXRFbmRDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fY291bnQoXG4gICAgICAgICAgICAvKiogQHBhcmFtIHtGaWxlVXAubW9kZWxzLkZpbGV9IGZpbGUgKi9cbiAgICAgICAgICAgIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGUuaXNTdGF0dXNFbmQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTZWFyY2ggZmlsZSBmb3IgbmV4dCB1cGxvYWRpbmdcbiAgICAgKiBAcmV0dXJucyB7RmlsZVVwLm1vZGVscy5GaWxlfG51bGx9XG4gICAgICovXG4gICAgZ2V0TmV4dEZvclVwbG9hZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5nZXRQcm9jZXNzQ291bnQoKSA+PSB0aGlzLm1heENvbmN1cnJlbnRVcGxvYWRzKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy5fZmlsZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsZXNbaV0uaXNTdGF0dXNRdWV1ZSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIF9jb3VudDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHZhciBpQ291bnQgPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMuX2ZpbGVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKGZuKHRoaXMuX2ZpbGVzW2ldKSkge1xuICAgICAgICAgICAgICAgIGlDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpQ291bnQ7XG4gICAgfVxuXG59KTtcblxufSx7XCIuLi9GaWxlVXBcIjoyfV0sMTg6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuLyoqXHJcbiAqIEBhdXRob3IgVmxhZGltaXIgS296aGluIDxhZmZrYUBhZmZrYS5ydT5cclxuICogQGxpY2Vuc2UgTUlUXHJcbiAqL1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIEBuYW1lc3BhY2UgRmlsZVVwXHJcbiAqIEBpZ25vcmVcclxuICovXHJcbnZhciBGaWxlVXAgPSByZXF1aXJlKCcuLi9GaWxlVXAnKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXJcclxuICogQGV4dGVuZHMgRmlsZVVwLmJhc2UuQ29tcG9uZW50XHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlci5wcm90b3R5cGUgKi97XHJcblxyXG4gICAgX19leHRlbmRzOiBGaWxlVXAuYmFzZS5Db21wb25lbnQsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIEVWRU5UX1NUQVJUOiAnc3RhcnQnLFxyXG4gICAgICAgIEVWRU5UX1BST0dSRVNTOiAncHJvZ3Jlc3MnLFxyXG4gICAgICAgIEVWRU5UX0VSUk9SOiAnZXJyb3InLFxyXG4gICAgICAgIEVWRU5UX0VORF9QQVJUOiAnZW5kX3BhcnQnLFxyXG4gICAgICAgIEVWRU5UX0VORDogJ2VuZCcsXHJcblxyXG4gICAgICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgdXJsOiAnJyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgaXMgSUlTIG1heCBodHRwUnVudGltZUBtYXhSZXF1ZXN0TGVuZ3RoIHZhbHVlIHdoaWNoIGlzIDIxNDc0ODI2MjQgS2JcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIGJ5dGVzTWF4UGFydDogMjA5NzE1MSAqIDEwMjQsXHJcblxyXG4gICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgIH0sXHJcblxyXG4gICAgaXNQcm9ncmVzc1N1cHBvcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6Mn1dLDE5OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbi8qKlxyXG4gKiBAYXV0aG9yIFZsYWRpbWlyIEtvemhpbiA8YWZma2FAYWZma2EucnU+XHJcbiAqIEBsaWNlbnNlIE1JVFxyXG4gKi9cclxuXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbi8qKlxyXG4gKiBAbmFtZXNwYWNlIEZpbGVVcFxyXG4gKiBAaWdub3JlXHJcbiAqL1xyXG52YXIgRmlsZVVwID0gcmVxdWlyZSgnLi4vRmlsZVVwJyk7XHJcblxyXG5yZXF1aXJlKCcuL0Jhc2VVcGxvYWRlcicpO1xyXG5cclxuLyoqXHJcbiAqIEBjbGFzcyBGaWxlVXAudXBsb2FkZXJzLklmcmFtZVVwbG9hZGVyXHJcbiAqIEBleHRlbmRzIEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyXHJcbiAqL1xyXG5GaWxlVXAuTmVhdG5lc3MuZGVmaW5lQ2xhc3MoJ0ZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXInLCAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuSWZyYW1lVXBsb2FkZXIucHJvdG90eXBlICove1xyXG5cclxuICAgIF9fZXh0ZW5kczogRmlsZVVwLnVwbG9hZGVycy5CYXNlVXBsb2FkZXIsXHJcblxyXG4gICAgX19zdGF0aWM6IC8qKiBAbGVuZHMgRmlsZVVwLnVwbG9hZGVycy5JZnJhbWVVcGxvYWRlciAqL3tcclxuXHJcbiAgICAgICAgX0NvdW50ZXI6IDBcclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7RmlsZVVwLm1vZGVscy5GaWxlfVxyXG4gICAgICovXHJcbiAgICBmaWxlOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5mb3JtLkZvcm19XHJcbiAgICAgKi9cclxuICAgIGZvcm06IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7SFRNTEVsZW1lbnR9XHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5lcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtzdHJpbmd9XHJcbiAgICAgKi9cclxuICAgIG5hbWVQcmVmaXg6ICdGaWxlVXBJZnJhbWUnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge3N0cmluZ31cclxuICAgICAqL1xyXG4gICAgX25hbWU6ICcnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0hUTUxFbGVtZW50fVxyXG4gICAgICovXHJcbiAgICBfd3JhcHBlcjogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtIVE1MRWxlbWVudH1cclxuICAgICAqL1xyXG4gICAgX2ZyYW1lOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcnxudWxsfVxyXG4gICAgICovXHJcbiAgICBfZnJhbWVMb2FkVGltZXI6IG51bGwsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cclxuICAgICAqL1xyXG4gICAgX2lzRnJhbWVMb2FkZWQ6IGZhbHNlLFxyXG5cclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIEdlbmVyYXRlIG5hbWVcclxuICAgICAgICB0aGlzLl9uYW1lID0gdGhpcy5uYW1lUHJlZml4ICsgKCsrdGhpcy5fX3N0YXRpYy5fQ291bnRlcik7XHJcblxyXG4gICAgICAgIC8vIEluaXQgY29udGFpbmVyXHJcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSB0aGlzLmNvbnRhaW5lciB8fCBkb2N1bWVudC5ib2R5O1xyXG5cclxuICAgICAgICAvLyBSZW5kZXIgZnJhbWVcclxuICAgICAgICB0aGlzLl9pbml0Q29udGFpbmVyKCk7XHJcbiAgICAgICAgdGhpcy5faW5pdEZyYW1lKCk7XHJcbiAgICAgICAgXHJcbiAgICB9LFxyXG5cclxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgLy8gU3RhcnQgdXBsb2FkXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1RBUlQpO1xyXG4gICAgICAgIHRoaXMuZm9ybS5zdWJtaXQodGhpcy51cmwsIHRoaXMuX25hbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICBzdG9wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLl9jbGVhclRpbWVyKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLl9mcmFtZSkge1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZS5vbmxvYWQgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLl9mcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5fd3JhcHBlci5yZW1vdmVDaGlsZCh0aGlzLl9mcmFtZSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9mcmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuX19zdXBlcigpO1xyXG4gICAgfSxcclxuXHJcbiAgICBfaW5pdENvbnRhaW5lcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5fd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUud2lkdGggPSAwO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gMDtcclxuICAgICAgICB0aGlzLl93cmFwcGVyLnN0eWxlLnRvcCA9ICctMTAwcHgnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUubGVmdCA9ICctMTAwcHgnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHJcbiAgICAgICAgdGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fd3JhcHBlcik7XHJcbiAgICB9LFxyXG5cclxuICAgIF9pbml0RnJhbWU6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaXNDcmVhdGVkID0gZmFsc2U7XHJcbiAgICAgICAgdmFyIGlzSUUgPSBGaWxlVXAuaGVscGVycy5Ccm93c2VySGVscGVyLmlzSUUoKTtcclxuXHJcbiAgICAgICAgaWYgKGlzSUUgJiYgaXNJRSA8IDEwKSB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9mcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJzxpZnJhbWUgbmFtZT1cIicgKyB0aGlzLl9uYW1lICsgJ1wiPicpO1xyXG4gICAgICAgICAgICAgICAgaXNDcmVhdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgLy8gSXQgc2VlbXMgSUU5IGluIGNvbXBhdGFiaWxpdHkgbW9kZS5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFpc0NyZWF0ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcclxuICAgICAgICAgICAgdGhpcy5fZnJhbWUubmFtZSA9IHRoaXMuX25hbWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLl9mcmFtZS5zcmMgPSAnamF2YXNjcmlwdDp7fTsnO1xyXG4gICAgICAgIHRoaXMuX3dyYXBwZXIuYXBwZW5kQ2hpbGQodGhpcy5fZnJhbWUpO1xyXG5cclxuICAgICAgICAvLyBTdWJzY3JpYmUgb24gaWZyYW1lIGxvYWQgZXZlbnRzXHJcbiAgICAgICAgdGhpcy5fZnJhbWUub25yZWFkeXN0YXRlY2hhbmdlID0gdGhpcy5fb25SZWFkeVN0YXRlQ2hhbmdlLmJpbmQodGhpcyk7XHJcbiAgICAgICAgdGhpcy5fZnJhbWUub25sb2FkID0gdGhpcy5fb25Mb2FkLmJpbmQodGhpcyk7XHJcbiAgICB9LFxyXG5cclxuICAgIF9vblJlYWR5U3RhdGVDaGFuZ2U6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLl9mcmFtZS5yZWFkeVN0YXRlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ2NvbXBsZXRlJzpcclxuICAgICAgICAgICAgY2FzZSAnaW50ZXJhY3RpdmUnOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2xlYXJUaW1lcigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fZnJhbWVMb2FkVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fTG9hZEhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25SZWFkeVN0YXRlQ2hhbmdlKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyksIDEwMDApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfb25Mb2FkOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIHRoaXMuX2NsZWFyVGltZXIoKTtcclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgYWxyZWFkeSBsb2FkZWRcclxuICAgICAgICBpZiAodGhpcy5faXNGcmFtZUxvYWRlZCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX2lzRnJhbWVMb2FkZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICB2YXIgZG9jdW1lbnQgPSBudWxsO1xyXG4gICAgICAgIHZhciBzdGF0dXMgPSBudWxsO1xyXG4gICAgICAgIHZhciBlcnJvck1lc3NhZ2UgPSAnJztcclxuXHJcbiAgICAgICAgLy8gQ2F0Y2ggaWZyYW1lIGxvYWQgZXJyb3IgaW4gRmlyZWZveC5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBkb2N1bWVudCA9IHRoaXMuX2ZyYW1lLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQ7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHN0YXR1cyA9IDQwMztcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gZS50b1N0cmluZygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFzdGF0dXMpIHtcclxuICAgICAgICAgICAgdmFyIHRleHQgPSBkb2N1bWVudC5ib2R5LmlubmVyVGV4dCB8fCBkb2N1bWVudC5ib2R5LmlubmVySFRNTDtcclxuICAgICAgICAgICAgaWYgKHRleHQudG9Mb3dlckNhc2UoKSAhPT0gJ29rJyB8fCB0ZXh0ICE9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlZ2V4cCA9IC9bNDVdWzAtOV17Mn0vO1xyXG4gICAgICAgICAgICAgICAgc3RhdHVzID0gKGRvY3VtZW50LnRpdGxlLm1hdGNoKHJlZ2V4cCkgfHwgdGV4dC5tYXRjaChyZWdleHApIHx8IFs1MDBdKVswXTtcclxuICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGRvY3VtZW50LnRpdGxlICsgJ1xcbicgKyBkb2N1bWVudC5ib2R5LmlubmVyVGV4dDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0YXR1cyA+PSAyMDAgJiYgc3RhdHVzIDwgMzAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VORCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRVJST1IsIFtzdGF0dXMsIGVycm9yTWVzc2FnZV0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgIH0sXHJcblxyXG4gICAgX2NsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl9mcmFtZUxvYWRUaW1lcikge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fZnJhbWVMb2FkVGltZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn0pO1xyXG5cbn0se1wiLi4vRmlsZVVwXCI6MixcIi4vQmFzZVVwbG9hZGVyXCI6MTh9XSwyMDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4vKipcclxuICogQGF1dGhvciBWbGFkaW1pciBLb3poaW4gPGFmZmthQGFmZmthLnJ1PlxyXG4gKiBAbGljZW5zZSBNSVRcclxuICovXHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQG5hbWVzcGFjZSBGaWxlVXBcclxuICogQGlnbm9yZVxyXG4gKi9cclxudmFyIEZpbGVVcCA9IHJlcXVpcmUoJy4uL0ZpbGVVcCcpO1xyXG5cclxucmVxdWlyZSgnLi9CYXNlVXBsb2FkZXInKTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgRmlsZVVwLnVwbG9hZGVycy5YaHJVcGxvYWRlclxyXG4gKiBAZXh0ZW5kcyBGaWxlVXAudXBsb2FkZXJzLkJhc2VVcGxvYWRlclxyXG4gKi9cclxuRmlsZVVwLk5lYXRuZXNzLmRlZmluZUNsYXNzKCdGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyJywgLyoqIEBsZW5kcyBGaWxlVXAudXBsb2FkZXJzLlhoclVwbG9hZGVyLnByb3RvdHlwZSAqL3tcclxuXHJcbiAgICBfX2V4dGVuZHM6IEZpbGVVcC51cGxvYWRlcnMuQmFzZVVwbG9hZGVyLFxyXG5cclxuICAgIF9fc3RhdGljOiAvKiogQGxlbmRzIEZpbGVVcC51cGxvYWRlcnMuWGhyVXBsb2FkZXIgKi97XHJcblxyXG4gICAgICAgIGlzUHJvZ3Jlc3NTdXBwb3J0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxyXG4gICAgICovXHJcbiAgICBtZXRob2Q6ICdQVVQnLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge0ZpbGVVcC5tb2RlbHMuRmlsZX1cclxuICAgICAqL1xyXG4gICAgZmlsZTogbnVsbCxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEB0eXBlIHtudW1iZXJ9XHJcbiAgICAgKi9cclxuICAgIG1pblByb2dyZXNzVXBkYXRlSW50ZXJ2YWxNczogNTAwLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgX2xhc3RSZXBvcnRUaW1lOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge1hNTEh0dHBSZXF1ZXN0fVxyXG4gICAgICovXHJcbiAgICBfeGhyOiBudWxsLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQHR5cGUge251bWJlcn1cclxuICAgICAqL1xyXG4gICAgX2J5dGVzU3RhcnQ6IDAsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAdHlwZSB7bnVtYmVyfG51bGx9XHJcbiAgICAgKi9cclxuICAgIF9ieXRlc0VuZDogbnVsbCxcclxuXHJcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMuX2luaXRYaHIoKTtcclxuICAgICAgICB0aGlzLl9zdGFydEludGVybmFsKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIHN0b3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLl94aHIpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3hoci51cGxvYWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3hoci51cGxvYWQub25wcm9ncmVzcyA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5feGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fX3N1cGVyKCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlIFhIUiBvYmplY3QgYW5kIHN1YnNjcmliZSBvbiBpdCBldmVudHNcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgIF9pbml0WGhyOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5feGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XHJcbiAgICAgICAgdGhpcy5feGhyLnVwbG9hZC5vbnByb2dyZXNzID0gdGhpcy5fb25Qcm9ncmVzcy5iaW5kKHRoaXMpO1xyXG4gICAgICAgIHRoaXMuX3hoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSB0aGlzLl9vblJlYWR5U3RhdGVDaGFuZ2UuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLl94aHIub3Blbih0aGlzLm1ldGhvZCwgdGhpcy51cmwsIHRydWUpO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB0aGlzLl94aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoRmlsZVVwLmhlbHBlcnMuQnJvd3NlckhlbHBlci5pc1dlYmtpdCgpIHx8IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNUcmlkZW50KCkpIHtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNldFJlcXVlc3RIZWFkZXIoXCJJZi1Ob25lLU1hdGNoXCIsIFwiKlwiKTtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNldFJlcXVlc3RIZWFkZXIoXCJJZi1Nb2RpZmllZC1TaW5jZVwiLCBcIk1vbiwgMjYgSnVsIDE5OTcgMDU6MDA6MDAgR01UXCIpO1xyXG4gICAgICAgICAgICB0aGlzLl94aHIuc2V0UmVxdWVzdEhlYWRlcihcIkNhY2hlLUNvbnRyb2xcIiwgXCJuby1jYWNoZVwiKTtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNldFJlcXVlc3RIZWFkZXIoXCJYLVJlcXVlc3RlZC1XaXRoXCIsIFwiWE1MSHR0cFJlcXVlc3RcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICBfc3RhcnRJbnRlcm5hbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfU1RBUlQpO1xyXG5cclxuICAgICAgICB2YXIgaXNGRiA9IEZpbGVVcC5oZWxwZXJzLkJyb3dzZXJIZWxwZXIuaXNGaXJlZm94KCk7XHJcbiAgICAgICAgaWYgKGlzRkYgJiYgaXNGRiA8IDcpIHtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNlbmRBc0JpbmFyeSh0aGlzLmZpbGUuZ2V0RG9tT2JqZWN0KCkuZ2V0QXNCaW5hcnkoKSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBieXRlc1RvdGFsID0gdGhpcy5maWxlLmdldEJ5dGVzVG90YWwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5fYnl0ZXNTdGFydCA9IHRoaXMuZmlsZS5nZXRCeXRlc1VwbG9hZGVkKCk7XHJcbiAgICAgICAgdGhpcy5fYnl0ZXNFbmQgPSBNYXRoLm1pbih0aGlzLl9ieXRlc1N0YXJ0ICsgdGhpcy5ieXRlc01heFBhcnQsIGJ5dGVzVG90YWwpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5fYnl0ZXNTdGFydCAmJiB0aGlzLl9ieXRlc1N0YXJ0ID49IGJ5dGVzVG90YWwpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfRU5EKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ2hlY2sgcGFydGlhbCB1cGxvYWRcclxuICAgICAgICBpZiAodGhpcy5fYnl0ZXNTdGFydCA+IDAgfHwgdGhpcy5fYnl0ZXNFbmQgPCBieXRlc1RvdGFsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX3hoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC1SYW5nZVwiLCBcImJ5dGVzIFwiICsgdGhpcy5fYnl0ZXNTdGFydCArIFwiLVwiICsgKHRoaXMuX2J5dGVzRW5kIC0gMSkgKyBcIi9cIiArIGJ5dGVzVG90YWwpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuX2J5dGVzRW5kIDwgYnl0ZXNUb3RhbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLnNlbmQodGhpcy5maWxlLmdldERvbU9iamVjdCgpLnNsaWNlKHRoaXMuX2J5dGVzU3RhcnQsIHRoaXMuX2J5dGVzRW5kKSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl94aHIuc2VuZCh0aGlzLmZpbGUuZ2V0RG9tT2JqZWN0KCkuc2xpY2UodGhpcy5fYnl0ZXNTdGFydCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5feGhyLnNlbmQodGhpcy5maWxlLmdldERvbU9iamVjdCgpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxyXG4gICAgICogQHByb3RlY3RlZFxyXG4gICAgICovXHJcbiAgICBfb25Qcm9ncmVzczogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICB2YXIgaU5vdyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuX2xhc3RSZXBvcnRUaW1lICYmIGlOb3cgLSB0aGlzLl9sYXN0UmVwb3J0VGltZSA8IHRoaXMubWluUHJvZ3Jlc3NVcGRhdGVJbnRlcnZhbE1zKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fbGFzdFJlcG9ydFRpbWUgPSBpTm93O1xyXG5cclxuICAgICAgICB2YXIgYnl0ZXNVcGxvYWRlZCA9IHRoaXMuX2J5dGVzU3RhcnQgKyBldmVudC5sb2FkZWQ7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKHRoaXMuX19zdGF0aWMuRVZFTlRfUFJPR1JFU1MsIFtieXRlc1VwbG9hZGVkXSk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICpcclxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBldmVudFxyXG4gICAgICogQHByb3RlY3RlZFxyXG4gICAgICovXHJcbiAgICBfb25SZWFkeVN0YXRlQ2hhbmdlOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgIGlmICh0aGlzLl94aHIucmVhZHlTdGF0ZSAhPT0gNCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5feGhyLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5feGhyLnN0YXR1cyA8IDMwMCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fYnl0ZXNFbmQgPCB0aGlzLmZpbGUuZ2V0Qnl0ZXNUb3RhbCgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGUuc2V0Qnl0ZXNVcGxvYWRlZCh0aGlzLl9ieXRlc0VuZCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FTkRfUEFSVCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIodGhpcy5fX3N0YXRpYy5FVkVOVF9FTkQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGVycm9yTWVzc2FnZSA9IHRoaXMuX3hoci5yZXNwb25zZVRleHQgfHwgdGhpcy5feGhyLnN0YXR1c1RleHQ7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcih0aGlzLl9fc3RhdGljLkVWRU5UX0VSUk9SLCBbdGhpcy5feGhyLnN0YXR1cywgZXJyb3JNZXNzYWdlXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59KTtcclxuXG59LHtcIi4uL0ZpbGVVcFwiOjIsXCIuL0Jhc2VVcGxvYWRlclwiOjE4fV0sMjE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3NyYy9OZWF0bmVzcycpO1xufSx7XCIuL3NyYy9OZWF0bmVzc1wiOjI0fV0sMjI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5lYXRuZXNzKSB7XG5cblx0cmV0dXJuIE5lYXRuZXNzLmNyZWF0ZUNsYXNzKCdOZWF0bmVzcy5FeGNlcHRpb24nLCAvKiogQGxlbmRzIE5lYXRuZXNzLkV4Y2VwdGlvbi5wcm90b3R5cGUgKi97XG5cblx0XHRfX2V4dGVuZHM6IEVycm9yLFxuXG5cdFx0LyoqXG5cdFx0ICogVGV4dCBtZXNzYWdlXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKi9cblx0XHRtZXNzYWdlOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogRXh0cmEgaW5mb3JtYXRpb24gZHVtcHNcblx0XHQgKiBAdHlwZSB7QXJyYXl9XG5cdFx0ICovXG5cdFx0ZXh0cmE6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBCYXNlIGNsYXNzIGZvciBpbXBsZW1lbnQgZXhjZXB0aW9uLiBUaGlzIGNsYXNzIGV4dGVuZCBmcm9tIG5hdGl2ZSBFcnJvciBhbmQgc3VwcG9ydFxuXHRcdCAqIHN0YWNrIHRyYWNlIGFuZCBtZXNzYWdlLlxuXHRcdCAqIEBjb25zdHJ1Y3RzXG5cdFx0ICogQGV4dGVuZHMgRXJyb3Jcblx0XHQgKi9cblx0XHRjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcblx0XHRcdGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHRcdFx0XHRFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCB0aGlzLmNvbnN0cnVjdG9yIHx8IHRoaXMpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLm5hbWUgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWU7XG5cdFx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlIHx8ICcnO1xuXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0dGhpcy5leHRyYSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX19zdXBlcigpO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKlxuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0dG9TdHJpbmc6IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiB0aGlzLm1lc3NhZ2U7XG5cdFx0fVxuXG5cdH0pO1xuXG59O1xufSx7fV0sMjM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKE5lYXRuZXNzKSB7XG5cblx0LyoqXG5cdCAqIEJhc2UgY2xhc3MuIEV4dGVuZCBhbGwgeW91IGJhc2UgY2xhc3NlcyBmcm9tIHRoaXMgY2xhc3MgZm9yIHRydWUgbmF2aWdhdGlvbiBpbiBJREVcblx0ICogYW5kIHN1cHBvcnQgbWV0aG9kcyBzdWNoIGFzIHtAbGluayBOZWF0bmVzcy5PYmplY3QjY2xhc3NOYW1lfVxuXHQgKiBAY2xhc3MgTmVhdG5lc3MuT2JqZWN0XG5cdCAqL1xuXHRyZXR1cm4gTmVhdG5lc3MuY3JlYXRlQ2xhc3MoJ05lYXRuZXNzLk9iamVjdCcsIHtcblxuXHRcdC8qKlxuXHRcdCAqIExpbmsgdG8gdXNlZCBjbGFzcy4gSWYgeW91IGFjY2VzcyB0byB0aGlzIHByb3BlcnR5IGluIGV4dGVuZHMgY2xhc3NlcywgdGhlbiB5b3UgZ2l2ZSB0b3AtbGV2ZWwgY2xhc3MuXG5cdFx0ICogQHR5cGUgeyp9XG5cdFx0ICovXG5cdFx0X19zdGF0aWM6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBGdWxsIGN1cnJlbnQgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlIFJldHVybnMgdmFsdWUgZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzc1xuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9fY2xhc3NOYW1lOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogVW5pcXVlIGluc3RhbmNlIG5hbWVcblx0XHQgKiBAZXhhbXBsZSBSZXR1cm5zIHZhbHVlIGV4YW1wbGVcblx0XHQgKiAgYXBwLk15Q2xhc3M1MFxuXHRcdCAqIEB0eXBlIHtzdHJpbmd9XG5cdFx0ICogQHByb3RlY3RlZFxuXHRcdCAqL1xuXHRcdF9faW5zdGFuY2VOYW1lOiBudWxsLFxuXG5cdFx0LyoqXG5cdFx0ICogRnVsbCBwYXJlbnQgKGV4dGVuZHMpIGNsYXNzIG5hbWUgd2l0aCBuYW1lc3BhY2Vcblx0XHQgKiBAZXhhbXBsZSBSZXR1cm5zIHZhbHVlIGV4YW1wbGVcblx0XHQgKiAgYXBwLk15QmFzZUNsYXNzXG5cdFx0ICogQHR5cGUge3N0cmluZ31cblx0XHQgKiBAcHJvdGVjdGVkXG5cdFx0ICovXG5cdFx0X19wYXJlbnRDbGFzc05hbWU6IG51bGwsXG5cblx0XHQvKipcblx0XHQgKiBSZXR1cm5zIGZ1bGwgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUNsYXNzXG5cdFx0ICogQHJldHVybnMge3N0cmluZ31cblx0XHQgKi9cblx0XHRjbGFzc05hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX19jbGFzc05hbWU7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgdW5pcXVlIGluc3RhbmNlIG5hbWVcblx0XHQgKiBAZXhhbXBsZVxuXHRcdCAqICBhcHAuTXlDbGFzc1xuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0Y2xhc3NJbnN0YW5jZU5hbWU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX19pbnN0YW5jZU5hbWU7XG5cdFx0fSxcblxuXHRcdC8qKlxuXHRcdCAqIFJldHVybnMgZnVsbCBwYXJlbnQgY2xhc3MgbmFtZSB3aXRoIG5hbWVzcGFjZVxuXHRcdCAqIEBleGFtcGxlXG5cdFx0ICogIGFwcC5NeUJhc2VDbGFzc1xuXHRcdCAqIEByZXR1cm5zIHtzdHJpbmd9XG5cdFx0ICovXG5cdFx0cGFyZW50Q2xhc3NOYW1lOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9fcGFyZW50Q2xhc3NOYW1lO1xuXHRcdH0sXG5cblx0XHQvKipcblx0XHQgKiBDYWxsIHBhcmVudCBjbGFzcyBtZXRob2RzIHRocm91Z2ggdGhpcyBtZXRob2QuIFRoaXMgbWV0aG9kIHN1cHBvcnQgb25seSBzeW5jaHJvbm91cyBuZXN0ZWQgY2FsbHMuXG5cdFx0ICogQHBhcmFtIHsuLi4qfVxuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKi9cblx0XHRfX3N1cGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0fVxuXG5cdH0pO1xuXG59O1xuXG59LHt9XSwyNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cclxudmFyIGV4dGVuZENsYXNzID0gcmVxdWlyZSgnLi9leHRlbmRDbGFzcycpO1xyXG52YXIgZm9ybWF0cyA9IHJlcXVpcmUoJy4vZm9ybWF0cycpO1xyXG5cclxuLy8gRm9yIC5ub0NvbmZsaWN0KCkgaW1wbGVtZW50YXRpb25cclxudmFyIGhhc1ByZXZpb3VzTmVhdG5lc3MgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ05lYXRuZXNzJyk7XHJcbnZhciBwcmV2aW91c05lYXRuZXNzID0gaGFzUHJldmlvdXNOZWF0bmVzcyA/IHdpbmRvdy5OZWF0bmVzcyA6IG51bGw7XHJcblxyXG4vKipcclxuICogTmVhdG5lc3MgY2xhc3NcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzXHJcbiAqL1xyXG52YXIgTmVhdG5lc3MgPSBmdW5jdGlvbigpIHtcclxuXHJcblx0LyoqXHJcblx0ICpcclxuXHQgKiBAdHlwZSB7b2JqZWN0fVxyXG5cdCAqL1xyXG5cdHRoaXMuX2NvbnRleHQgPSB7fTtcclxuXHJcblx0dGhpcy5fY29udGV4dEtleXMgPSB7fTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5ld0NvbnRleHRcclxuICogQHBhcmFtIHtib29sZWFufSBbcmVtb3ZlR2xvYmFsXSBTZXQgdHJ1ZSBmb3IgcmVtb3ZlIE5lYXRuZXNzIG9iamVjdCBmcm9tIHdpbmRvdyAoYnJvd3NlciBnbG9iYWwgb2JqZWN0KVxyXG4gKiBAcmV0dXJucyB7TmVhdG5lc3N9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubmV3Q29udGV4dCA9IGZ1bmN0aW9uKHJlbW92ZUdsb2JhbCkge1xyXG5cdHJlbW92ZUdsb2JhbCA9IHJlbW92ZUdsb2JhbCB8fCBmYWxzZTtcclxuXHJcblx0aWYgKHJlbW92ZUdsb2JhbCkge1xyXG5cdFx0dGhpcy5ub0NvbmZsaWN0KCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbmV3IE5lYXRuZXNzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5tb3ZlQ29udGV4dFxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IG5ld0NvbnRleHQgTmV3IGNvbnRleHQgb2JqZWN0XHJcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlbW92ZUZyb21PbGRdIFNldCB0cnVlIGZvciByZW1vdmUga2V5cyBmcm9tIG9sZCBjb250ZXh0XHJcbiAqIEByZXR1cm5zIHtOZWF0bmVzc31cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5tb3ZlQ29udGV4dCA9IGZ1bmN0aW9uKG5ld0NvbnRleHQsIHJlbW92ZUZyb21PbGQpIHtcclxuXHRyZW1vdmVGcm9tT2xkID0gcmVtb3ZlRnJvbU9sZCB8fCBmYWxzZTtcclxuXHJcblx0Zm9yICh2YXIga2V5IGluIHRoaXMuX2NvbnRleHRLZXlzKSB7XHJcblx0XHRpZiAodGhpcy5fY29udGV4dEtleXMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRuZXdDb250ZXh0W2tleV0gPSB0aGlzLl9jb250ZXh0W2tleV07XHJcblx0XHRcdGlmIChyZW1vdmVGcm9tT2xkKSB7XHJcblx0XHRcdFx0ZGVsZXRlIHRoaXMuX2NvbnRleHRba2V5XTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHR0aGlzLl9jb250ZXh0ID0gbmV3Q29udGV4dDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5vQ29uZmxpY3RcclxuICogQHJldHVybnMge05lYXRuZXNzfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcclxuXHQvLyBSb290IG5hbWVzcGFjZSBvYmplY3RcclxuXHR2YXIgcm9vdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID8gd2luZG93IDoge307XHJcblxyXG5cdGlmIChoYXNQcmV2aW91c05lYXRuZXNzKSB7XHJcblx0XHRyb290Lk5lYXRuZXNzID0gcHJldmlvdXNOZWF0bmVzcztcclxuXHR9IGVsc2Uge1xyXG5cdFx0ZGVsZXRlIHJvb3QuTmVhdG5lc3M7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLm5hbWVzcGFjZVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gbmFtZSBGdWxsIG5hbWVzcGFjZSBuYW1lXHJcbiAqIEByZXR1cm5zIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUubmFtZXNwYWNlID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuXHRuYW1lID0gbmFtZSB8fCAnJztcclxuXHJcblx0dmFyIG5hbWVQYXJ0cyA9IG5hbWUuc3BsaXQoJy4nKTtcclxuXHR2YXIgY3VycmVudFNjb3BlID0gdGhpcy5fY29udGV4dDtcclxuXHJcblx0aWYgKCFuYW1lKSB7XHJcblx0XHRyZXR1cm4gY3VycmVudFNjb3BlO1xyXG5cdH1cclxuXHJcblx0Ly8gRmluZCBvciBjcmVhdGVcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVQYXJ0cy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHNjb3BlTmFtZSA9IG5hbWVQYXJ0c1tpXTtcclxuXHRcdGlmIChpID09PSAwKSB7XHJcblx0XHRcdHRoaXMuX2NvbnRleHRLZXlzW3Njb3BlTmFtZV0gPSB0cnVlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghY3VycmVudFNjb3BlW3Njb3BlTmFtZV0pIHtcclxuXHRcdFx0Y3VycmVudFNjb3BlW3Njb3BlTmFtZV0gPSB7XHJcblx0XHRcdFx0X19jbGFzc05hbWU6IG5hbWVQYXJ0cy5zbGljZSgwLCBpKS5qb2luKCcuJyksXHJcblx0XHRcdFx0X19wYXJlbnRDbGFzc05hbWU6IG51bGxcclxuXHRcdFx0fTtcclxuXHRcdH1cclxuXHRcdGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZVtzY29wZU5hbWVdO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIGN1cnJlbnRTY29wZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNZXRob2QgZm9yIGRlZmluZSBjbGFzc1xyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLmNyZWF0ZUNsYXNzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcbiAqIEBwYXJhbSB7KGZ1bmN0aW9ufG9iamVjdHxudWxsKX0gb3B0aW9uc09yRXh0ZW5kXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG90eXBlUHJvcGVydGllc11cclxuICogQHBhcmFtIHtvYmplY3R9IFtzdGF0aWNQcm9wZXJ0aWVzXVxyXG4gKiBAcmV0dXJuIHtvYmplY3R9XHJcbiAqL1xyXG5OZWF0bmVzcy5wcm90b3R5cGUuY3JlYXRlQ2xhc3MgPSBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzKSB7XHJcblx0dmFyIHBhcmFtcyA9IGZvcm1hdHMucGFyc2VGb3JtYXQoZ2xvYmFsTmFtZSwgb3B0aW9uc09yRXh0ZW5kLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdGF0aWNQcm9wZXJ0aWVzKTtcclxuXHJcblx0Ly8gU3VwcG9ydCBleHRlbmRzIGFuZCBtaXhpbnMgYXMgc3RyaW5ncyBjbGFzcyBuYW1lc1xyXG5cdGlmICh0eXBlb2YgcGFyYW1zWzJdID09PSAnc3RyaW5nJykge1xyXG5cdFx0cGFyYW1zWzJdID0gdGhpcy5uYW1lc3BhY2UocGFyYW1zWzJdKTtcclxuICAgICAgICBpZiAoIXBhcmFtc1sxXSAmJiBwYXJhbXNbMl0gJiYgdHlwZW9mIHBhcmFtc1syXS5fX2NsYXNzTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgcGFyYW1zWzFdID0gZm9ybWF0cy5wYXJzZUZ1bGxOYW1lKHBhcmFtc1syXS5fX2NsYXNzTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cdH1cclxuXHR2YXIgbWl4aW5zID0gcGFyYW1zWzZdO1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0aWYgKHR5cGVvZiBtaXhpbnNbaV0gPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdG1peGluc1tpXSA9IHRoaXMubmFtZXNwYWNlKG1peGluc1tpXSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBTaG93IGVycm9yIGlmIG5vdCBkZWZpbmVkIGV4dGVuZGVkIGNsYXNzXHJcblx0aWYgKHBhcmFtc1syXSAhPT0gbnVsbCAmJiB0eXBlb2YgcGFyYW1zWzJdICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHR0aHJvdyBuZXcgRXJyb3IoJ05vdCBmb3VuZCBleHRlbmQgY2xhc3MgZm9yIGAnICsgZ2xvYmFsTmFtZSArICdgLicpO1xyXG5cdH1cclxuXHJcblx0dmFyIG5ld0NsYXNzID0gZXh0ZW5kQ2xhc3MocGFyYW1zWzBdLCBwYXJhbXNbMV0sIHBhcmFtc1syXSwgcGFyYW1zWzZdLCBwYXJhbXNbM10sIHBhcmFtc1s0XSwgcGFyYW1zWzddKTtcclxuXHRmb3JtYXRzLmFwcGx5Q2xhc3NDb25maWcobmV3Q2xhc3MsIHBhcmFtc1s1XSwgcGFyYW1zWzBdLCBwYXJhbXNbMV0pO1xyXG5cclxuXHRyZXR1cm4gbmV3Q2xhc3M7XHJcbn07XHJcblxyXG4vKipcclxuICogTWV0aG9kIGZvciBkZWZpbmUgY2xhc3NcclxuICogQGZ1bmN0aW9uIE5lYXRuZXNzLnByb3RvdHlwZS5kZWZpbmVDbGFzc1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gZ2xvYmFsTmFtZVxyXG4gKiBAcGFyYW0geyhmdW5jdGlvbnxvYmplY3R8bnVsbCl9IG9wdGlvbnNPckV4dGVuZFxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvdHlwZVByb3BlcnRpZXNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUNsYXNzID0gZnVuY3Rpb24gKGdsb2JhbE5hbWUsIG9wdGlvbnNPckV4dGVuZCwgcHJvdG90eXBlUHJvcGVydGllcywgc3RhdGljUHJvcGVydGllcykge1xyXG5cdHZhciBuZXdDbGFzcyA9IHRoaXMuY3JlYXRlQ2xhc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuXHR2YXIgbmFtZU9iamVjdCA9IGZvcm1hdHMucGFyc2VGdWxsTmFtZShnbG9iYWxOYW1lKTtcclxuXHJcblx0dGhpcy5uYW1lc3BhY2UobmFtZU9iamVjdC5uYW1lc3BhY2UpW25hbWVPYmplY3QubmFtZV0gPSBuZXdDbGFzcztcclxuXHRyZXR1cm4gbmV3Q2xhc3M7XHJcbn07XHJcblxyXG4vKipcclxuICogTWV0aG9kIGZvciBkZWZpbmUgZW51bVxyXG4gKiBAZnVuY3Rpb24gTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUNsYXNzXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBnbG9iYWxOYW1lXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybiB7b2JqZWN0fVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLmRlZmluZUVudW0gPSBmdW5jdGlvbiAoZ2xvYmFsTmFtZSwgc3RhdGljUHJvcGVydGllcykge1xyXG5cdHZhciBuZXdDbGFzcyA9IHRoaXMuY3JlYXRlQ2xhc3MoZ2xvYmFsTmFtZSwgbnVsbCwge30sIHN0YXRpY1Byb3BlcnRpZXMpO1xyXG5cdHZhciBuYW1lT2JqZWN0ID0gZm9ybWF0cy5wYXJzZUZ1bGxOYW1lKGdsb2JhbE5hbWUpO1xyXG5cclxuXHR0aGlzLm5hbWVzcGFjZShuYW1lT2JqZWN0Lm5hbWVzcGFjZSlbbmFtZU9iamVjdC5uYW1lXSA9IG5ld0NsYXNzO1xyXG5cdHJldHVybiBuZXdDbGFzcztcclxufTtcclxuXHJcbnZhciBuZWF0bmVzcyA9IG1vZHVsZS5leHBvcnRzID0gbmV3IE5lYXRuZXNzKCk7XHJcblxyXG4vLyBXZWIgYnJvd3NlciBleHBvcnRcclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0d2luZG93Lk5lYXRuZXNzID0gbmVhdG5lc3M7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7TmVhdG5lc3MucHJvdG90eXBlLk9iamVjdH1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5PYmplY3QgPSByZXF1aXJlKCcuL05lYXRuZXNzLk9iamVjdCcpKG5lYXRuZXNzKTtcclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7TmVhdG5lc3MucHJvdG90eXBlLkV4Y2VwdGlvbn1cclxuICovXHJcbk5lYXRuZXNzLnByb3RvdHlwZS5FeGNlcHRpb24gPSByZXF1aXJlKCcuL05lYXRuZXNzLkV4Y2VwdGlvbicpKG5lYXRuZXNzKTtcclxuXHJcbi8qKlxyXG4gKiBAdHlwZSB7c3RyaW5nfVxyXG4gKi9cclxuTmVhdG5lc3MucHJvdG90eXBlLnZlcnNpb24gPSAnJUpPSU5UU19DVVJSRU5UX1ZFUlNJT04lJztcclxuXG59LHtcIi4vTmVhdG5lc3MuRXhjZXB0aW9uXCI6MjIsXCIuL05lYXRuZXNzLk9iamVjdFwiOjIzLFwiLi9leHRlbmRDbGFzc1wiOjI1LFwiLi9mb3JtYXRzXCI6MjZ9XSwyNTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG52YXIgaXNFdmFsRW5hYmxlID0gdHJ1ZTtcclxudmFyIGluc3RhbmNlQ291bnRlciA9IDA7XHJcblxyXG52YXIgX25vb3AgPSBmdW5jdGlvbigpIHtcclxufTtcclxuXHJcbnZhciBfY3JlYXRlRnVuY3Rpb24gPSBmdW5jdGlvbihuYW1lT2JqZWN0LCBjb25zdHJ1Y3Rvcikge1xyXG5cdGlmICghaXNFdmFsRW5hYmxlIHx8ICFuYW1lT2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkgeyByZXR1cm4gY29uc3RydWN0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfVxyXG5cdH1cclxuXHJcblx0dmFyIG5hbWVSZWdFeHAgPSAvW15hLXokX1xcLl0vaTtcclxuXHR2YXIgbmFtZSA9IG5hbWVPYmplY3QubmFtZSB8fCAnRnVuY3Rpb24nO1xyXG5cdHZhciBuYW1lUGFydHMgPSBuYW1lT2JqZWN0Lmdsb2JhbE5hbWUuc3BsaXQoJy4nKTtcclxuXHJcblx0Ly8gQ3JlYXRlIHJvb3Qgb2JqZWN0XHJcblx0dmFyIHJvb3ROYW1lID0gbmFtZVBhcnRzLnNoaWZ0KCk7XHJcblx0dmFyIGNzO1xyXG5cclxuXHRyb290TmFtZSA9IHJvb3ROYW1lLnJlcGxhY2UobmFtZVJlZ0V4cCwgJycpO1xyXG5cdGV2YWwoJ3ZhciAnICsgcm9vdE5hbWUgKyAnID0gY3MgPSB7fTsnKTtcclxuXHJcblx0Ly8gQ3JlYXRlIGZha2UgbmFtZXNwYWNlIG9iamVjdFxyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbmFtZVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHR2YXIgc2NvcGVOYW1lID0gbmFtZVBhcnRzW2ldO1xyXG5cdFx0aWYgKCFjc1tzY29wZU5hbWVdKSB7XHJcblx0XHRcdGNzW3Njb3BlTmFtZV0gPSB7fTtcclxuXHRcdH1cclxuXHRcdGNzID0gY3Nbc2NvcGVOYW1lXTtcclxuXHR9XHJcblxyXG5cdHZhciBmdW5jO1xyXG5cdHZhciBmdWxsTmFtZSA9IChuYW1lT2JqZWN0Lm5hbWVzcGFjZSA/IG5hbWVPYmplY3QubmFtZXNwYWNlICsgJy4nIDogJycpICsgbmFtZTtcclxuXHJcblx0ZnVsbE5hbWUgPSBmdWxsTmFtZS5yZXBsYWNlKG5hbWVSZWdFeHAsICcnKTtcclxuXHRldmFsKCdmdW5jID0gJyArIGZ1bGxOYW1lICsgJyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH0nKTtcclxuXHJcblx0cmV0dXJuIGZ1bmM7XHJcbn07XHJcblxyXG52YXIgX2lzU3RyaWN0T2JqZWN0ID0gZnVuY3Rpb24gKG9iaikge1xyXG5cdGlmICghb2JqIHx8IHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IG9iaiBpbnN0YW5jZW9mIFJlZ0V4cCB8fCBvYmogaW5zdGFuY2VvZiBEYXRlKSB7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cclxuXHR2YXIgYm9vbCA9IHRydWU7XHJcblx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0Ym9vbCA9IGJvb2wgJiYgb2JqLmhhc093blByb3BlcnR5KGtleSk7XHJcblx0fVxyXG5cdHJldHVybiBib29sO1xyXG59O1xyXG5cclxudmFyIF9jbG9uZSA9IGZ1bmN0aW9uKG9iaikge1xyXG5cdGlmICghX2lzU3RyaWN0T2JqZWN0KG9iaikpIHtcclxuXHRcdHJldHVybiBvYmo7XHJcblx0fVxyXG5cclxuXHR2YXIgY29weSA9IG9iai5jb25zdHJ1Y3RvcigpO1xyXG5cdGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuXHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRjb3B5W2tleV0gPSBfY2xvbmUob2JqW2tleV0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHRyZXR1cm4gY29weTtcclxufTtcclxuXHJcbnZhciBfY2xvbmVPYmpJblByb3RvID0gZnVuY3Rpb24ob2JqKSB7XHJcblx0Zm9yICh2YXIga2V5IGluIG9iaikge1xyXG5cdFx0aWYgKHR5cGVvZiBvYmogPT09IFwib2JqZWN0XCIpIHtcclxuXHRcdFx0b2JqW2tleV0gPSBfY2xvbmUob2JqW2tleV0pO1xyXG5cdFx0fVxyXG5cdH1cclxufTtcclxuXHJcbnZhciBfY292ZXJWaXJ0dWFsID0gZnVuY3Rpb24gKGNoaWxkTWV0aG9kLCBwYXJlbnRNZXRob2QsIHN1cGVyTmFtZSkge1xyXG5cdHJldHVybiBmdW5jdGlvbiAoKSB7XHJcblx0XHR2YXIgY3VycmVudFN1cGVyID0gdGhpc1tzdXBlck5hbWVdO1xyXG5cdFx0dGhpc1tzdXBlck5hbWVdID0gcGFyZW50TWV0aG9kO1xyXG5cdFx0dmFyIHIgPSBjaGlsZE1ldGhvZC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdFx0dGhpc1tzdXBlck5hbWVdID0gY3VycmVudFN1cGVyO1xyXG5cdFx0cmV0dXJuIHI7XHJcblx0fTtcclxufTtcclxuXHJcbnZhciBfZXh0ZW5kV2l0aFN1cGVyID0gZnVuY3Rpb24gKGNoaWxkQ2xhc3MsIG5ld1Byb3BlcnRpZXMsIHN1cGVyTmFtZSkge1xyXG5cdGlmICghbmV3UHJvcGVydGllcykge1xyXG5cdFx0cmV0dXJuO1xyXG5cdH1cclxuXHJcblx0Ly8gRXh0ZW5kIGFuZCBzZXR1cCB2aXJ0dWFsIG1ldGhvZHNcclxuXHRmb3IgKHZhciBrZXkgaW4gbmV3UHJvcGVydGllcykge1xyXG5cdFx0aWYgKCFuZXdQcm9wZXJ0aWVzLmhhc093blByb3BlcnR5KGtleSkpIHtcclxuXHRcdFx0Y29udGludWU7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIHZhbHVlID0gbmV3UHJvcGVydGllc1trZXldO1xyXG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBjaGlsZENsYXNzW2tleV0gPT0gJ2Z1bmN0aW9uJyAmJiBjaGlsZENsYXNzW2tleV0gIT09IF9ub29wKSB7XHJcblx0XHRcdGNoaWxkQ2xhc3Nba2V5XSA9IF9jb3ZlclZpcnR1YWwodmFsdWUsIGNoaWxkQ2xhc3Nba2V5XSwgc3VwZXJOYW1lKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNoaWxkQ2xhc3Nba2V5XSA9IF9jbG9uZSh2YWx1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBEZWZhdWx0IHN0YXRlXHJcblx0aWYgKCFjaGlsZENsYXNzW3N1cGVyTmFtZV0pIHtcclxuXHRcdGNoaWxkQ2xhc3Nbc3VwZXJOYW1lXSA9IF9ub29wO1xyXG5cdH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFeHRlbmQgY2xhc3NcclxuICogQHBhcmFtIHtvYmplY3R9IG5hbWVPYmplY3RcclxuICogQHBhcmFtIHtvYmplY3R9IHBhcmVudE5hbWVPYmplY3RcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW3BhcmVudENsYXNzXVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbbWl4aW5zXVxyXG4gKiBAcGFyYW0ge29iamVjdH0gW3Byb3RvdHlwZVByb3BlcnRpZXNdXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbc3RhdGljUHJvcGVydGllc11cclxuICogQHJldHVybnMge2Z1bmN0aW9ufSBOZXcgY2xhc3NcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG5hbWVPYmplY3QsIHBhcmVudE5hbWVPYmplY3QsIHBhcmVudENsYXNzLCBtaXhpbnMsIHByb3RvdHlwZVByb3BlcnRpZXMsIHN0YXRpY1Byb3BlcnRpZXMsIHN1cGVyTmFtZSkge1xyXG5cdHBhcmVudENsYXNzID0gcGFyZW50Q2xhc3MgfHwgX25vb3A7XHJcblx0bWl4aW5zID0gbWl4aW5zIHx8IFtdO1xyXG5cclxuXHQvLyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBuZXcgc3ViY2xhc3MgaXMgZWl0aGVyIGRlZmluZWQgYnkgeW91XHJcblx0Ly8gKHRoZSBcImNvbnN0cnVjdG9yXCIgcHJvcGVydHkgaW4geW91ciBgZXh0ZW5kYCBkZWZpbml0aW9uKSwgb3IgZGVmYXVsdGVkXHJcblx0Ly8gYnkgdXMgdG8gc2ltcGx5IGNhbGwgdGhlIHBhcmVudCdzIGNvbnN0cnVjdG9yLlxyXG5cdHZhciBjb25zdHJ1Y3RvciA9IHByb3RvdHlwZVByb3BlcnRpZXMgJiYgcHJvdG90eXBlUHJvcGVydGllcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/XHJcblx0XHRfY292ZXJWaXJ0dWFsKHByb3RvdHlwZVByb3BlcnRpZXMuY29uc3RydWN0b3IsIHBhcmVudENsYXNzLCBzdXBlck5hbWUpIDpcclxuXHRcdHBhcmVudENsYXNzO1xyXG5cdHZhciBjaGlsZENsYXNzID0gX2NyZWF0ZUZ1bmN0aW9uKG5hbWVPYmplY3QsIGZ1bmN0aW9uKCkge1xyXG5cdFx0aWYgKCF0aGlzLl9faW5zdGFuY2VOYW1lKSB7XHJcblx0XHRcdF9jbG9uZU9iakluUHJvdG8odGhpcyk7XHJcblx0XHRcdHRoaXMuX19pbnN0YW5jZU5hbWUgID0gbmFtZU9iamVjdC5nbG9iYWxOYW1lICsgaW5zdGFuY2VDb3VudGVyKys7XHJcblx0XHR9XHJcblx0XHRjb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG5cdH0pO1xyXG5cclxuXHQvLyBBZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLCBpZiBzdXBwbGllZC5cclxuXHRmb3IgKHZhciBwcm9wIGluIHBhcmVudENsYXNzKSB7XHJcblx0XHRjaGlsZENsYXNzW3Byb3BdID0gcGFyZW50Q2xhc3NbcHJvcF07XHJcblx0fVxyXG5cdF9leHRlbmRXaXRoU3VwZXIoY2hpbGRDbGFzcywgc3RhdGljUHJvcGVydGllcywgc3VwZXJOYW1lKTtcclxuXHJcblx0Ly8gU2V0IHRoZSBwcm90b3R5cGUgY2hhaW4gdG8gaW5oZXJpdCBmcm9tIGBwYXJlbnRgLCB3aXRob3V0IGNhbGxpbmdcclxuXHQvLyBgcGFyZW50YCdzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxyXG5cdHZhciBTdXJyb2dhdGUgPSBfY3JlYXRlRnVuY3Rpb24ocGFyZW50TmFtZU9iamVjdCwgX25vb3ApO1xyXG5cdFN1cnJvZ2F0ZS5wcm90b3R5cGUgPSBwYXJlbnRDbGFzcy5wcm90b3R5cGU7XHJcblxyXG5cdGNoaWxkQ2xhc3MucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xyXG5cclxuXHQvLyBDb3B5IG9iamVjdHMgZnJvbSBjaGlsZCBwcm90b3R5cGVcclxuXHRmb3IgKHZhciBwcm9wMiBpbiBwYXJlbnRDbGFzcy5wcm90b3R5cGUpIHtcclxuXHRcdGlmIChwYXJlbnRDbGFzcy5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkocHJvcDIpICYmIHByb3AyICE9PSAnY29uc3RydWN0b3InKSB7XHJcblx0XHRcdGNoaWxkQ2xhc3MucHJvdG90eXBlW3Byb3AyXSA9IF9jbG9uZShwYXJlbnRDbGFzcy5wcm90b3R5cGVbcHJvcDJdKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIEFkZCBwcm90b3R5cGUgcHJvcGVydGllcyAoaW5zdGFuY2UgcHJvcGVydGllcykgdG8gdGhlIHN1YmNsYXNzLFxyXG5cdC8vIGlmIHN1cHBsaWVkLlxyXG5cdGlmIChwcm90b3R5cGVQcm9wZXJ0aWVzKSB7XHJcblx0XHRfZXh0ZW5kV2l0aFN1cGVyKGNoaWxkQ2xhc3MucHJvdG90eXBlLCBwcm90b3R5cGVQcm9wZXJ0aWVzLCBzdXBlck5hbWUpO1xyXG5cdH1cclxuXHJcblx0Ly8gQWRkIHByb3RvdHlwZSBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzIGZyb20gbWl4aW5zXHJcblx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtaXhpbnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRmb3IgKHZhciBtaXhpblByb3AgaW4gbWl4aW5zW2ldLnByb3RvdHlwZSkge1xyXG5cdFx0XHQvLyBTa2lwIHByaXZhdGVcclxuXHRcdFx0aWYgKG1peGluUHJvcC5zdWJzdHIoMCwgMikgPT09ICdfXycpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGV4aXN0cyBwcm9wZXJ0eSBvciBtZXRob2QuIE1peGluIGNhbiBvbmx5IGFkZCBwcm9wZXJ0aWVzLCBidXQgbm8gcmVwbGFjZSBpdFxyXG5cdFx0XHRpZiAodHlwZW9mIGNoaWxkQ2xhc3MucHJvdG90eXBlW21peGluUHJvcF0gPT09ICdmdW5jdGlvbicgfHwgY2hpbGRDbGFzcy5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkobWl4aW5Qcm9wKSkge1xyXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvcignVHJ5IHRvIHJlcGxhY2UgcHJvdG90eXBlIHByb3BlcnR5IGAnICsgbWl4aW5Qcm9wICsgJ2AgaW4gY2xhc3MgYCcgKyBjaGlsZENsYXNzLl9fY2xhc3NOYW1lICsgJ2AgYnkgbWl4aW4gYCcgKyBtaXhpbnNbaV0uX19jbGFzc05hbWUgKyAnYCcpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGNoaWxkQ2xhc3MucHJvdG90eXBlW21peGluUHJvcF0gPSBtaXhpbnNbaV0ucHJvdG90eXBlW21peGluUHJvcF07XHJcblx0XHR9XHJcblx0fVxyXG5cdC8vIEFkZCBzdGF0aWMgcHJvcGVydGllcyBhbmQgbWV0aG9kcyBmcm9tIG1peGluc1xyXG5cdGZvciAodmFyIGkgPSAwLCBsID0gbWl4aW5zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgbWl4aW5Qcm9wIGluIG1peGluc1tpXSkge1xyXG5cdFx0XHQvLyBTa2lwIHByaXZhdGVcclxuXHRcdFx0aWYgKG1peGluUHJvcC5zdWJzdHIoMCwgMikgPT09ICdfXycpIHtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gQ2hlY2sgZm9yIGV4aXN0cyBwcm9wZXJ0eSBvciBtZXRob2QuIE1peGluIGNhbiBvbmx5IGFkZCBwcm9wZXJ0aWVzLCBidXQgbm8gcmVwbGFjZSBpdFxyXG5cdFx0XHRpZiAodHlwZW9mIGNoaWxkQ2xhc3NbbWl4aW5Qcm9wXSA9PT0gJ2Z1bmN0aW9uJyB8fCBjaGlsZENsYXNzLmhhc093blByb3BlcnR5KG1peGluUHJvcCkpIHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ1RyeSB0byByZXBsYWNlIHN0YXRpYyBwcm9wZXJ0eSBgJyArIG1peGluUHJvcCArICdgIGluIGNsYXNzIGAnICsgY2hpbGRDbGFzcy5fX2NsYXNzTmFtZSArICdgIGJ5IG1peGluIGAnICsgbWl4aW5zW2ldLl9fY2xhc3NOYW1lICsgJ2AnKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjaGlsZENsYXNzW21peGluUHJvcF0gPSBtaXhpbnNbaV1bbWl4aW5Qcm9wXTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBjaGlsZENsYXNzO1xyXG59O1xyXG5cbn0se31dLDI2OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbnZhciBGT1JNQVRfSk9JTlRTX1YwMiA9ICduZWF0bmVzc192MDInO1xyXG52YXIgRk9STUFUX0pPSU5UU19WMTAgPSAnbmVhdG5lc3NfdjEwJztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG5cclxuXHQvKipcclxuXHQgKiBEZXRlY3QgZm9ybWF0IGFuZCByZXR1cm4gY2xhc3MgcGFyYW1zXHJcblx0ICogQHBhcmFtIHtzdHJpbmd9IGdsb2JhbE5hbWVcclxuXHQgKiBAcGFyYW0geyhmdW5jdGlvbnxvYmplY3R8bnVsbCl9IG9wdGlvbnNPckV4dGVuZFxyXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBbcHJvdG9Qcm9wc11cclxuXHQgKiBAcGFyYW0ge29iamVjdH0gW3N0YXRpY1Byb3BzXVxyXG5cdCAqIEByZXR1cm5zIHtvYmplY3R9XHJcblx0ICovXHJcblx0cGFyc2VGb3JtYXQ6IGZ1bmN0aW9uIChnbG9iYWxOYW1lLCBvcHRpb25zT3JFeHRlbmQsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XHJcblx0XHR2YXIgbmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShnbG9iYWxOYW1lKTtcclxuXHRcdHZhciBwYXJlbnROYW1lT2JqZWN0ID0gbnVsbDtcclxuXHRcdHZhciBwYXJlbnRDbGFzcyA9IG51bGw7XHJcblx0XHR2YXIgcHJvdG90eXBlUHJvcGVydGllcyA9IG51bGw7XHJcblx0XHR2YXIgc3RhdGljUHJvcGVydGllcyA9IG51bGw7XHJcblx0XHR2YXIgZm9ybWF0ID0gbnVsbDtcclxuXHRcdHZhciBtaXhpbnMgPSBbXTtcclxuXHJcblx0XHQvLyBOZWF0bmVzcyB2MC4yIChvbGQpIGZvcm1hdFxyXG5cdFx0aWYgKG9wdGlvbnNPckV4dGVuZCA9PT0gbnVsbCB8fCB0eXBlb2Ygb3B0aW9uc09yRXh0ZW5kID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdHBhcmVudENsYXNzID0gb3B0aW9uc09yRXh0ZW5kO1xyXG5cdFx0XHRwcm90b3R5cGVQcm9wZXJ0aWVzID0gcHJvdG9Qcm9wcztcclxuXHRcdFx0c3RhdGljUHJvcGVydGllcyA9IHN0YXRpY1Byb3BzO1xyXG5cdFx0XHRmb3JtYXQgPSBGT1JNQVRfSk9JTlRTX1YwMjtcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDbGFzcyAmJiB0eXBlb2YgcGFyZW50Q2xhc3MuZGVidWdDbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50TmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShwYXJlbnRDbGFzcy5kZWJ1Z0NsYXNzTmFtZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdC8vIE5lYXRuZXNzIHYxLjAgZm9ybWF0XHJcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zT3JFeHRlbmQgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdGlmIChvcHRpb25zT3JFeHRlbmQuaGFzT3duUHJvcGVydHkoJ19fZXh0ZW5kcycpKSB7XHJcblx0XHRcdFx0cGFyZW50Q2xhc3MgPSBvcHRpb25zT3JFeHRlbmQuX19leHRlbmRzO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19leHRlbmRzO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX3N0YXRpYycpKSB7XHJcblx0XHRcdFx0c3RhdGljUHJvcGVydGllcyA9IG9wdGlvbnNPckV4dGVuZC5fX3N0YXRpYztcclxuXHRcdFx0XHRkZWxldGUgb3B0aW9uc09yRXh0ZW5kLl9fc3RhdGljO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAob3B0aW9uc09yRXh0ZW5kLmhhc093blByb3BlcnR5KCdfX21peGlucycpKSB7XHJcblx0XHRcdFx0bWl4aW5zID0gbWl4aW5zLmNvbmNhdChvcHRpb25zT3JFeHRlbmQuX19taXhpbnMpO1xyXG5cdFx0XHRcdGRlbGV0ZSBvcHRpb25zT3JFeHRlbmQuX19taXhpbnM7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKG9wdGlvbnNPckV4dGVuZC5oYXNPd25Qcm9wZXJ0eSgnX19taXhpbicpKSB7XHJcblx0XHRcdFx0bWl4aW5zID0gbWl4aW5zLmNvbmNhdChvcHRpb25zT3JFeHRlbmQuX19taXhpbik7XHJcblx0XHRcdFx0ZGVsZXRlIG9wdGlvbnNPckV4dGVuZC5fX21peGluO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmb3JtYXQgPSBGT1JNQVRfSk9JTlRTX1YxMDtcclxuXHRcdFx0cHJvdG90eXBlUHJvcGVydGllcyA9IG9wdGlvbnNPckV4dGVuZDtcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDbGFzcyAmJiB0eXBlb2YgcGFyZW50Q2xhc3MuX19jbGFzc05hbWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0cGFyZW50TmFtZU9iamVjdCA9IHRoaXMucGFyc2VGdWxsTmFtZShwYXJlbnRDbGFzcy5fX2NsYXNzTmFtZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gW1xyXG5cdFx0XHRuYW1lT2JqZWN0LFxyXG5cdFx0XHRwYXJlbnROYW1lT2JqZWN0LFxyXG5cdFx0XHRwYXJlbnRDbGFzcyxcclxuXHRcdFx0cHJvdG90eXBlUHJvcGVydGllcyxcclxuXHRcdFx0c3RhdGljUHJvcGVydGllcyxcclxuXHRcdFx0Zm9ybWF0LFxyXG5cdFx0XHRtaXhpbnMsXHJcblx0XHRcdGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnX3N1cGVyJyA6ICdfX3N1cGVyJ1xyXG5cdFx0XTtcclxuXHR9LFxyXG5cclxuXHRhcHBseUNsYXNzQ29uZmlnOiBmdW5jdGlvbihuZXdDbGFzcywgZm9ybWF0LCBuYW1lT2JqZWN0LCBwYXJlbnROYW1lT2JqZWN0KSB7XHJcblx0XHQvLyBTZXQgX19jbGFzc05hbWUgZm9yIGFsbCBmb3JtYXRzXHJcblx0XHRuZXdDbGFzcy5fX2NsYXNzTmFtZSA9IG5ld0NsYXNzLnByb3RvdHlwZS5fX2NsYXNzTmFtZSA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZTtcclxuXHJcblx0XHR2YXIgY2xhc3NOYW1lS2V5ID0gZm9ybWF0ID09PSBGT1JNQVRfSk9JTlRTX1YwMiA/ICdkZWJ1Z0NsYXNzTmFtZScgOiAnX19jbGFzc05hbWUnO1xyXG5cdFx0dmFyIHBhcmVudENsYXNzTmFtZUtleSA9IGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnJyA6ICdfX3BhcmVudENsYXNzTmFtZSc7XHJcblx0XHR2YXIgc3RhdGljTmFtZUtleSA9IGZvcm1hdCA9PT0gRk9STUFUX0pPSU5UU19WMDIgPyAnX3N0YXRpYycgOiAnX19zdGF0aWMnO1xyXG5cclxuXHRcdG5ld0NsYXNzW2NsYXNzTmFtZUtleV0gPSBuZXdDbGFzcy5wcm90b3R5cGVbY2xhc3NOYW1lS2V5XSA9IG5hbWVPYmplY3QuZ2xvYmFsTmFtZTtcclxuXHRcdGlmIChwYXJlbnRDbGFzc05hbWVLZXkpIHtcclxuXHRcdFx0bmV3Q2xhc3NbcGFyZW50Q2xhc3NOYW1lS2V5XSA9IG5ld0NsYXNzLnByb3RvdHlwZVtwYXJlbnRDbGFzc05hbWVLZXldID0gcGFyZW50TmFtZU9iamVjdCA/IChwYXJlbnROYW1lT2JqZWN0Lmdsb2JhbE5hbWUgfHwgbnVsbCkgOiBudWxsO1xyXG5cdFx0fVxyXG5cdFx0bmV3Q2xhc3Nbc3RhdGljTmFtZUtleV0gPSBuZXdDbGFzcy5wcm90b3R5cGVbc3RhdGljTmFtZUtleV0gPSBuZXdDbGFzcztcclxuXHJcblx0XHRyZXR1cm4gbmV3Q2xhc3M7XHJcblx0fSxcclxuXHJcblx0cGFyc2VGdWxsTmFtZTogZnVuY3Rpb24oZ2xvYmFsTmFtZSkge1xyXG5cdFx0Ly8gU3BsaXQgbmFtZXNwYWNlXHJcblx0XHR2YXIgcG9zID0gZ2xvYmFsTmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG5cclxuXHRcdHJldHVybiB7XHJcblx0XHRcdGdsb2JhbE5hbWU6IGdsb2JhbE5hbWUsXHJcblx0XHRcdG5hbWU6IHBvcyAhPT0gLTEgPyBnbG9iYWxOYW1lLnN1YnN0cihwb3MgKyAxKSA6IGdsb2JhbE5hbWUsXHJcblx0XHRcdG5hbWVzcGFjZTogcG9zICE9PSAtMSA/IGdsb2JhbE5hbWUuc3Vic3RyKDAsIHBvcykgOiAnJ1xyXG5cdFx0fTtcclxuXHR9XHJcblxyXG59O1xyXG5cbn0se31dLDI3OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvRmlsZVVwJyk7XG5cbnJlcXVpcmUoJy4vbGliL2Jhc2UvQ29tcG9uZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL0VsZW1lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvRXhjZXB0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi9iYXNlL01hbmFnZXInKTtcbnJlcXVpcmUoJy4vbGliL2Jhc2UvT2JqZWN0Jyk7XG5yZXF1aXJlKCcuL2xpYi9mb3JtL0Zvcm0nKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vRm9ybUVsZW1lbnQnKTtcbnJlcXVpcmUoJy4vbGliL2Zvcm0vSW5wdXRFbGVtZW50Jyk7XG5yZXF1aXJlKCcuL2xpYi9oZWxwZXJzL0Jyb3dzZXJIZWxwZXInKTtcbnJlcXVpcmUoJy4vbGliL2hlbHBlcnMvQ2xhc3NIZWxwZXInKTtcbnJlcXVpcmUoJy4vbGliL2hlbHBlcnMvVXJsSGVscGVyJyk7XG5yZXF1aXJlKCcuL2xpYi9tYW5hZ2Vycy9RdWV1ZU1hbmFnZXInKTtcbnJlcXVpcmUoJy4vbGliL21vZGVscy9GaWxlJyk7XG5yZXF1aXJlKCcuL2xpYi9tb2RlbHMvRmlsZVByb2dyZXNzJyk7XG5yZXF1aXJlKCcuL2xpYi9tb2RlbHMvUXVldWVDb2xsZWN0aW9uJyk7XG5yZXF1aXJlKCcuL2xpYi91cGxvYWRlcnMvQmFzZVVwbG9hZGVyJyk7XG5yZXF1aXJlKCcuL2xpYi91cGxvYWRlcnMvSWZyYW1lVXBsb2FkZXInKTtcbnJlcXVpcmUoJy4vbGliL3VwbG9hZGVycy9YaHJVcGxvYWRlcicpO1xuXG59LHtcIi4vbGliL0ZpbGVVcFwiOjIsXCIuL2xpYi9iYXNlL0NvbXBvbmVudFwiOjMsXCIuL2xpYi9iYXNlL0VsZW1lbnRcIjo0LFwiLi9saWIvYmFzZS9FeGNlcHRpb25cIjo1LFwiLi9saWIvYmFzZS9NYW5hZ2VyXCI6NixcIi4vbGliL2Jhc2UvT2JqZWN0XCI6NyxcIi4vbGliL2Zvcm0vRm9ybVwiOjgsXCIuL2xpYi9mb3JtL0Zvcm1FbGVtZW50XCI6OSxcIi4vbGliL2Zvcm0vSW5wdXRFbGVtZW50XCI6MTAsXCIuL2xpYi9oZWxwZXJzL0Jyb3dzZXJIZWxwZXJcIjoxMSxcIi4vbGliL2hlbHBlcnMvQ2xhc3NIZWxwZXJcIjoxMixcIi4vbGliL2hlbHBlcnMvVXJsSGVscGVyXCI6MTMsXCIuL2xpYi9tYW5hZ2Vycy9RdWV1ZU1hbmFnZXJcIjoxNCxcIi4vbGliL21vZGVscy9GaWxlXCI6MTUsXCIuL2xpYi9tb2RlbHMvRmlsZVByb2dyZXNzXCI6MTYsXCIuL2xpYi9tb2RlbHMvUXVldWVDb2xsZWN0aW9uXCI6MTcsXCIuL2xpYi91cGxvYWRlcnMvQmFzZVVwbG9hZGVyXCI6MTgsXCIuL2xpYi91cGxvYWRlcnMvSWZyYW1lVXBsb2FkZXJcIjoxOSxcIi4vbGliL3VwbG9hZGVycy9YaHJVcGxvYWRlclwiOjIwfV19LHt9LFsxXSk7XG4iXSwiZmlsZSI6ImZpbGV1cC1jb3JlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
