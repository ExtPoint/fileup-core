<?php

class FileUpException extends Exception {

    // Upload errors, see http://php.net/manual/en/features.file-upload.errors.php
    const UPLOAD_ERR_OK = 0;
    const UPLOAD_ERR_INI_SIZE = 1;
    const UPLOAD_ERR_FORM_SIZE = 2;
    const UPLOAD_ERR_PARTIAL = 3;
    const UPLOAD_ERR_NO_FILE = 4;
    const UPLOAD_ERR_NO_TMP_DIR = 6;
    const UPLOAD_ERR_CANT_WRITE = 7;
    const UPLOAD_ERR_EXTENSION = 8;

    // Custom FileUp errors
    const CODE_NOT_FOUND_NAME = '50051';
    const CODE_NOT_FOUND_FILE = '50052';
    const CODE_INCORRECT_CONTENT_RANGE = '50053';
    const CODE_CANNOT_MOVE_UPLOADED_FILE = '50054';
    const CODE_DESTINATION_DIR_NOT_WRITABLE = '50055';

}

class FileUp {

    public $destinationDir;
    public $postFile;
    public $chunk = 1024;

    public function __construct() {
        // Set defaults
        $this->destinationDir = __DIR__;
        $this->postFile = reset($_FILES);
    }

    public function upload() {
        // Create destination directory, if no exists
        if (!file_exists($this->destinationDir)) {
            mkdir($this->destinationDir, 777, true);
        }

        // Check directory is writable
        if (!is_writable($this->destinationDir)) {
            throw new FileUpException('Destination directory is not writable.', FileUpException::CODE_DESTINATION_DIR_NOT_WRITABLE);
        }

        return !empty($this->postFile) ?
            $this->uploadPost() :
            $this->uploadPut();
    }

    protected function getFilePath($name) {
        return rtrim($this->destinationDir, '/') . '/' . $name;
    }

    protected function uploadPost() {
        $files = [];
        $postFiles = $this->normalizePostFiles($this->postFile);

        foreach ($postFiles as $file) {
            // Check PHP upload errors
            if ($file['error']) {
                throw new FileUpException('Upload error.', $file['error']);
            }

            $filePath = $this->getFilePath($file['name']);

            // Move uploaded file
            if (!copy($file['tmp_name'], $filePath)) {
                throw new FileUpException('Cannot move uploaded file', FileUpException::CODE_CANNOT_MOVE_UPLOADED_FILE);
            }

            $files[] = [
                'name' => $file['name'],
                'path' => $filePath,
                'size' => $file['size'],
                'type' => $file['type'],
            ];
        }

        return $files;
    }

    protected function uploadPut() {
        // Parse the Content-Disposition header
        $fileName = null;
        if (!empty($_SERVER['HTTP_CONTENT_DISPOSITION'])) {
            $fileName = rawurldecode(preg_replace('/(^[^"]+")|("$)/', '', $_SERVER['HTTP_CONTENT_DISPOSITION']));
        }
        if (!$fileName) {
            throw new FileUpException('Not found file name.', FileUpException::CODE_NOT_FOUND_NAME);
        }

        $filePath = $this->getFilePath($fileName);

        // Parse the Content-Range header, which has the following form:
        // Content-Range: bytes 0-524287/2000000
        $contentRange = null;
        if (!empty($_SERVER['HTTP_CONTENT_RANGE']) && preg_match('/([0-9]+)-([0-9]+)\/([0-9]+)/', $_SERVER['HTTP_CONTENT_RANGE'], $match)) {
            $contentRange = [
                'start' => $match[1],
                'end' => $match[2],
                'total' => $match[3],
            ];

            // Check file exists and correct size
            if ($contentRange['start'] > 0 && !is_file($filePath)) {
                throw new FileUpException('Not found file for append content.', FileUpException::CODE_NOT_FOUND_FILE);
            }

            $backendFileSize = filesize($filePath);

            // Check file size on server
            if ($contentRange['start'] > $backendFileSize) {
                throw new FileUpException('Incorrect content range size for append content.', FileUpException::CODE_INCORRECT_CONTENT_RANGE);
            }

            // Truncate file, if it more than content-range start
            if ($contentRange['start'] < $backendFileSize) {
                $handle = fopen($filePath, 'r+');
                ftruncate($handle, $contentRange['start']);
                rewind($handle);
                fclose($handle);
            }
        }

        // Upload file content
        file_put_contents(
            $filePath,
            fopen('php://input', 'r'),
            $contentRange && $contentRange['start'] > 0 ? FILE_APPEND : 0
        );

        // Get file size
        $fileSize = null;
        if ($contentRange) {
            $fileSize = $contentRange['total'];
        } elseif (!empty($_SERVER['CONTENT_LENGTH'])) {
            $fileSize = $_SERVER['CONTENT_LENGTH'];
        } else {
            $fileSize = filesize($filePath);
        }

        // Get file type
        $fileType = null;
        if (!empty($_SERVER['CONTENT_TYPE'])) {
            $fileType = $_SERVER['CONTENT_TYPE'];
        } else {
            $fileType = filetype($filePath);
        }

        return [
            [
                'name' => $fileName,
                'path' => $filePath,
                'size' => $fileSize,
                'type' => $fileType,
            ]
        ];
    }

    /**
     * @param array $file
     * @return array
     */
    protected function normalizePostFiles($file) {
        if (!is_array($file['name'])) {
            return [$file];
        }

        $files = [];
        foreach ($file as $key => $values) {
            foreach ($values as $i => $value) {
                if (!isset($files[$i])) {
                    $files[$i] = [];
                }
                $files[$i][$key] = $value;
            }
        }
        return $files;
    }

}

$fileUp = new FileUp();
$fileUp->destinationDir = __DIR__ . '/tmp';
try {
    $fileUp->upload();
} catch (Exception $e) {
    header('HTTP/1.0 500 Error');
    throw $e;
}