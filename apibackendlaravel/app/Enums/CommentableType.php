<?php
// app/Enums/CommentableType.php
namespace App\Enums;

use App\Models\Product;

enum CommentableType: string
{
    case Product = 'product';
    // case BlogPost = 'blog_post'; // بعد از پیاده‌سازی ماژول بلاگ اضافه می‌شود

    public function modelClass(): string
    {
        return match ($this) {
            self::Product => Product::class,
        };
    }
}