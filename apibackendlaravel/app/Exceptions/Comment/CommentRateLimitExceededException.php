<?php

namespace App\Exceptions\Comment;

use App\Exceptions\ApiException;

class CommentRateLimitExceededException extends ApiException
{
    public function __construct()
    {
        parent::__construct('تعداد نظرات ارسالی شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.');
    }

    public function errorCode(): string
    {
        return 'COMMENT_RATE_LIMIT_EXCEEDED';
    }

    public function statusCode(): int
    {
        return 429;
    }

    public function userMessage(): string
    {
        return $this->getMessage();
    }
}