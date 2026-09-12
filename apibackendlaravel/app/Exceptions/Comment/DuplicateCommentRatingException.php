<?php

namespace App\Exceptions\Comment;

use App\Exceptions\ApiException;

class DuplicateCommentRatingException extends ApiException
{
    public function __construct()
    {
        parent::__construct('شما قبلاً برای این مورد امتیاز ثبت کرده‌اید.');
    }

    public function errorCode(): string
    {
        return 'COMMENT_DUPLICATE_RATING';
    }

    public function statusCode(): int
    {
        return 409;
    }

    public function userMessage(): string
    {
        return $this->getMessage();
    }
}