# FileUp Core
JavaScript core component for upload file to server

# Features

- No dependencies required;
- No browser plugins (e.g. Adobe Flash) required;
- Worked without UI;
- Multiple file upload;
- Drag & Drop support;
- Upload folders;
- Upload process dimensions: progress, time left, speed;
- Graceful fallback for legacy browsers;
- Pause upload support;
- Chunked uploads;
- Customizable and extensible;
- Sources in es6 (friendly for extends).

# Install

## Npm

```sh
npm install fileup-core --save
```

```js
var FileUp = require('fileup-core');
var uploader = new FileUp({
    backendUrl: '/api/upload',
    // config param..
});

uploader.browse();
```

## Browser

```html
<script src="fileup-core.js"></script>
<script>
    const uploader = new FileUp({
        backendUrl: '/api/upload',
        // config param..
    });
    
    uploader.browse();
</script>
```

# Full config with default params

```js
const config = {
    backendUrl: null,
    form: {
        className: Form,
        container: document.body,
        multiple: false
    },
    dropArea: {
        className: DropArea,
        container: document.body,
        enable: false
    },
    queue: {
        className: QueueCollection,
        maxConcurrentUploads: 3
    },
    queueManager: {
        className: QueueManager
    },
    fileConfig: {
        className: File,
        progress: {
            className: FileProgress,
            speedMinMeasurement: 2,
            speedMaxMeasurement: 5
        }
    },
    uploaderConfigs: {
        iframe: {
            className: IframeUploader,
            container: document.body
        },
        xhr: {
            className: XhrUploader,
            method: 'PUT',
            minProgressUpdateIntervalMs: 500,
            bytesMaxPart: 2097151 * 1024 // ~2Gb
        }
    }
};
```

# Backend

For example, see file tests/web/server.php
