module.exports = require('./npm');

if (typeof window !== 'undefined') {
    window.FileUp = module.exports;
}