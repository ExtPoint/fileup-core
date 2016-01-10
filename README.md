# FileUp Core
JavaScript core component for upload file to server

# Features

- No dependencies required
- No browser plugins (e.g. Adobe Flash) required
- Worked without UI
- Multiple file upload
- Drag & Drop support
- Upload folders
- Upload process dimensions: progress, time left, speed
- Graceful fallback for legacy browsers
- Pause upload support
- Chunked uploads
- Customizable and extensible

# Install

## Npm

```sh
npm install fileup-core
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

```js
<script src="fileup-core.js"></script>
<script>
    var uploader = new FileUp({
        backendUrl: '/api/upload',
        // config param..
    });
    
    uploader.browse();
</script>
```

# Full config with default params

```js
    {
        backendUrl: null,
        form: {
            className: 'FileUp.form.Form',
            container: document.body,
            multiple: false
        },
        dropArea: {
            className: 'FileUp.form.DropArea',
            container: document.body,
            enable: false
        },
        queue: {
            className: 'FileUp.models.QueueCollection',
            maxConcurrentUploads: 3
        },
        queueManager: {
            className: 'FileUp.managers.QueueManager'
        },
        fileConfig: {
            className: 'FileUp.models.File',
            progress: {
                className: 'FileUp.models.FileProgress',
                speedMinMeasurement: 2,
                speedMaxMeasurement: 5
            }
        },
        uploaderConfigs: {
            iframe: {
                className: 'FileUp.uploaders.IframeUploader',
                container: document.body
            },
            xhr: {
                className: 'FileUp.uploaders.XhrUploader',
                method: 'PUT',
                minProgressUpdateIntervalMs: 500,
                bytesMaxPart: 2097151 * 1024 // ~2Gb
            }
        }
    }
```

# Backend

For example, see file tests/web/server.php
