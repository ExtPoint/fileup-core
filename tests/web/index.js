import $ from 'jquery';
import FileUp from '../../index';
import DropArea from '../../lib/form/DropArea';
import File from '../../lib/models/File';
import QueueCollection from '../../lib/models/QueueCollection';

const uploader = window.uploader = new FileUp({
    backendUrl: 'server.php',
    dropArea: {
        enable: true,
        container: $('<div />')
            .appendTo('body')
            .css({
                width: 300,
                height: 200,
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#ddd'
            })
            .get(0)
    },
    uploaderConfigs: {
        xhr: {
            bytesMaxPart: 5000000
        }
    }
});

const container = $('body');

uploader.dropArea.on(DropArea.EVENT_DRAG_OVER, function() {
    $(uploader.dropArea.container).css({background: 'burlywood'});
});
uploader.dropArea.on(DropArea.EVENT_DRAG_LEAVE, function() {
    $(uploader.dropArea.container).css({background: '#ddd'});
});

container.find('.uploader-browse').on('click', function () {
    uploader.browse();
});

uploader.queue.on(QueueCollection.EVENT_ADD, function (files) {
    /**
     * @param {File} file
     * @returns {string}
     **/
    const getStatusText = file => {
        return file.isStatusEnd() ? file.getResult() : file.getStatus();
    };
    /**
     * @param {File} file
     * @returns {string}
     **/
    const getProgressText = file => {
        return [
            Math.round(file.getBytesUploaded() / 1000) + ' of ' + Math.round(file.getBytesTotal() / 1000) + ' kb',
            file.progress.getPercent() + '%',
            file.progress.getTimeLeft() + 's left',
            (Math.round(file.progress.getSpeed() / 1000) / 1000) + 'Mb/s'
        ].join(', ');
    };

    $.each(files,
        /**
         * @param {number} i
         * @param {File} file
         * @returns {void}
         **/
        (i, file) => {
            var li = $('<li />')
                .appendTo(container.find('.uploader-list'))
                .append(
                    $('<span class="status" style="padding-right: 10px; color: darkgreen;" />').text(getStatusText(file))
                )
                .append(
                    $('<span class="name" />').text(file.getName())
                )
                .append(
                    $('<div class="actions" />').append(
                        $('<button />')
                            .text('Pause')
                            .on('click', function () {
                                file.pause();
                                $(this).text($(this).text() === 'Pause' ? 'Resume' : 'Pause');
                            })
                    )
                )
                .append(
                    $('<div class="progress" />').text(getProgressText(file))
                )
                .append(
                    $('<div class="error" style="color: darkred;" />')
                );

            file.on([File.EVENT_STATUS], function () {
                li.find('.actions').toggle(file.isStatusProcess() || file.isStatusPause());
                li.find('.status').text(getStatusText(file));
                if (file.isStatusEnd() && file.isResultError()) {
                    li.find('.error').text(file.getResultHttpStatus() + ': ' + file.getResultHttpMessage());
                }
            });
            file.on(File.EVENT_PROGRESS, function () {
                li.find('.progress').text(getProgressText(file));
            });
        });
});