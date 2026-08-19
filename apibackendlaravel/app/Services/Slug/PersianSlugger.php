<?php

namespace App\Services\Slug;

class PersianSlugger
{
    // یکسان‌سازی کاراکترهای عربی به معادل فارسی رایج
    private const CHAR_MAP = [
        'ك' => 'ک', 'ي' => 'ی', 'ؤ' => 'و', 'إ' => 'ا',
        'أ' => 'ا', 'ة' => 'ه', 'ۀ' => 'ه', 'ء' => '',
    ];

    private const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    private const ARABIC_DIGITS  = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    private const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    /**
     * تبدیل متن ترکیبی فارسی/انگلیسی/عدد به اسلاگ امن برای URL.
     * مثال: "گوشی آیفون 16ProMAX" → "گوشی-آیفون-16promax"
     */
    public function slug(string $text): string
    {
        $text = strtr($text, self::CHAR_MAP);
        $text = str_replace(self::PERSIAN_DIGITS, self::ENGLISH_DIGITS, $text);
        $text = str_replace(self::ARABIC_DIGITS, self::ENGLISH_DIGITS, $text);

        // حذف اعراب عربی (تشکیل/حرکات)
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06ED}]/u', '', $text);

        // نیم‌فاصله (ZWNJ) به خط تیره تبدیل بشه، نه حذف بشه (تا کلمات به‌هم نچسبن)
        $text = str_replace("\xE2\x80\x8C", '-', $text);

        // حروف لاتین کوچک بشن، فارسی دست‌نخورده می‌مونه (حروف بزرگ/کوچک نداره)
        $text = mb_strtolower($text, 'UTF-8');

        // فقط حروف فارسی/عربی (بلوک یونیکد Arabic که فارسی هم توشه)، لاتین، عدد، خط‌تیره مجازن
        $text = preg_replace('/[^\p{Arabic}a-z0-9\-]+/u', ' ', $text);

        // فاصله‌ها به خط‌تیره تبدیل، خط‌تیره‌های تکراری یکی بشن، از ابتدا/انتها حذف بشن
        $text = preg_replace('/[\s]+/u', '-', trim($text));
        $text = preg_replace('/-+/', '-', $text);
        $text = trim($text, '-');

        return $text;
    }
}