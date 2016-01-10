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
