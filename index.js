import FileUp from './lib/FileUp';

if (typeof window !== 'undefined') {
    var prev = window.FileUp;
    FileUp.noConflict = function() {
        window.FileUp = prev;
        return FileUp;
    };
}

export default FileUp;