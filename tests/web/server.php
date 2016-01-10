<?php

//header('HTTP/1.0 401 Unauthorized');


var_dump($_SERVER);exit();

$content_range_header = $_SERVER['HTTP_CONTENT_RANGE'];
$content_range = !empty($_SERVER['HTTP_CONTENT_RANGE']) ? preg_split('/[^0-9]+/', $_SERVER['HTTP_CONTENT_RANGE']) : null;

$append_file = $content_range && is_file($file_path) &&
    $file->size > $this->get_file_size($file_path);
if ($uploaded_file && is_uploaded_file($uploaded_file)) {
    // multipart/formdata uploads (POST method uploads)
    if ($append_file) {
        file_put_contents(
            $file_path,
            fopen($uploaded_file, 'r'),
            FILE_APPEND
        );
    } else {
        move_uploaded_file($uploaded_file, $file_path);
    }
} else {
    // Non-multipart uploads (PUT method support)
    file_put_contents(
        $file_path,
        fopen('php://input', 'r'),
        $append_file ? FILE_APPEND : 0
    );
}