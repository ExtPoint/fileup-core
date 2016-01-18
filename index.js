module.exports = require('./npm');

if (typeof window !== 'undefined') {
    var prev = window.FileUp;
    var FileUp = window.FileUp = module.exports;
    FileUp.noConflict = function() {
        window.FileUp = prev;
        return FileUp;
    }
}