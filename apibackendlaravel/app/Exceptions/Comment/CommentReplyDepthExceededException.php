<?php

namespace App\Exceptions\Comment;

use App\Exceptions\ApiException;

class CommentReplyDepthExceededException extends ApiException
{
    public function __construct()
    {
        parent::__construct('امکان ثبت پاسخ برای یک پاسخ وجود ندارد.');
    }

    public function errorCode(): string
    {
        return 'COMMENT_REPLY_DEPTH_EXCEEDED';
    }

    public function statusCode(): int
    {
        return 422;
    }

    public function userMessage(): string
    {
        return $this->getMessage();
    }
}