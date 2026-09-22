<?php
// app/Enums/CommentAuthorRole.php
namespace App\Enums;

enum CommentAuthorRole: string
{
    case Guest = 'guest';
    case Member = 'member';
    case Support = 'support';
}