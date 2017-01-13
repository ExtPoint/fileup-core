/**
 * @author Vladimir Kozhin <affka@affka.ru>
 * @license MIT
 */

'use strict';

import Component from '../base/Component';
import BrowserHelper from '../helpers/BrowserHelper';

export default class DropArea extends Component {

    preInit() {
        /**
         * @type {boolean}
         */
        this._enable = false;

        /**
         * @type {HTMLElement}
         */
        this.container = null;

        /**
         * @type {HTMLElement}
         */
        this._mask = null;

        /**
         * @type {object}
         */
        this._files = {};

        this._readLevel = 0;

        super.preInit(...arguments);
    }

    init() {
        this.container = this.container || document.body;
        this._initContainerEvents();
        this._initMask();
    }

    _initContainerEvents() {
        if (this.container) {
            this.container.ondragover = this._enable ? this._onDragOver.bind(this) : null;
            this.container.ondragleave = this._enable ? this._onDragLeave.bind(this) : null;
            this.container.ondrop = this._enable ? this._onDrop.bind(this) : null;
        }
    }

    _initMask() {
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
    }

    /**
     *
     * @param {boolean} value
     */
    setEnable(value) {
        this._enable = value && BrowserHelper.isFileDropSupport();
        this._initContainerEvents();
    }

    /**
     *
     * @returns {boolean}
     */
    getEnable() {
        return this._enable;
    }

    _onDragOver(event) {
        event.preventDefault();

        if (event.target !== this._mask) {
            this._mask.style.display = 'block';
        }

        if (event.dataTransfer) {
            var dtTypes = event.dataTransfer.types;
            if (dtTypes) {
                // FF
                if (dtTypes.contains && !dtTypes.contains('Files')) {
                    return;
                }

                // Chrome
                if (dtTypes.indexOf && dtTypes.indexOf('Files') === -1) {
                    return;
                }
            }

            event.dataTransfer.dropEffect = 'copy';
        }

        this.trigger(DropArea.EVENT_DRAG_OVER, [event]);
    }

    _onDragLeave(event) {
        event.preventDefault();

        if (event.target === this._mask) {
            this._mask.style.display = 'none';
        }

        this.trigger(DropArea.EVENT_DRAG_LEAVE, [event]);
    }

    _onDrop(event) {
        event.preventDefault();

        this._mask.style.display = 'none';

        if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
            this._readDataTransferItems(event.dataTransfer.items);
        } else {
            this._readDataTransferFiles(event.dataTransfer.files);
        }

        this.trigger(DropArea.EVENT_DROP, [event]);
    }

    _readDataTransferItems(items) {
        var entries = [];
        for (var i = 0, l = items.length; i < l; i++) {
            var entry = items[i].webkitGetAsEntry();
            if (entry !== null) {
                entries.push(entry);
            }
        }

        this._readDirectoryEntries(entries, '');
    }

    _readDirectoryEntries(entries, relativePath) {
        this._readLevel++;

        for (var i = 0, l = entries.length; i < l; i++) {
            (entry => {
                var path = (relativePath ? relativePath + '/' : '') + entry.name;

                if (entry.isDirectory) {
                    entry.createReader().readEntries(
                        subEntries => {
                            this._readDirectoryEntries(subEntries, path);
                        },
                        e => {
                            throw e;
                        }
                    );
                    this._readDirectoryEntries(entry, entry.name + '/');
                } else if (entry.isFile) {
                    this._readLevel++;
                    entry.file(
                        file => {
                            this._files[path] = file;

                            this._readLevel--;
                            this._readDirectoryEntries([], path);
                        },
                        e => {
                            throw e;
                        }
                    );
                }
            })(entries[i]);
        }
        this._readLevel--;

        if (this._readLevel === 0) {
            this._onReadDataTransfer();
        }
    }

    _readDataTransferFiles(files) {
        for (var i = 0, l = files.length; i < l; i++) {
            var file = files[i];

            // Skip folders
            if (!file.type && file.size === 0) {
                continue;
            }

            this._files[file.name] = file;
        }

        this._onReadDataTransfer();
    }

    _onReadDataTransfer() {
        this.trigger(DropArea.EVENT_SUBMIT, [this._files]);
        this._files = {};
    }

}

DropArea.EVENT_SUBMIT = 'submit';
DropArea.EVENT_DRAG_OVER = 'drag_over';
DropArea.EVENT_DRAG_LEAVE = 'drag_leave';
DropArea.EVENT_DROP = 'drop';
