<?php

namespace App\Exceptions\Comment;

use App\Exceptions\ApiException;

class CommentEditWindowExpiredException extends ApiException
{
    public function __construct()
    {
        parent::__construct('مهلت ویرایش این نظر به پایان رسیده است.');
    }

    public function errorCode(): string
    {
        return 'COMMENT_EDIT_WINDOW_EXPIRED';
    }

    public function statusCode(): int
    {
        return 403;
    }

    public function userMessage(): string
    {
        return $this->getMessage();
    }
}