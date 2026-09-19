<?php

namespace App\Models;

use App\Models\Concerns\HasMeta;
use App\Models\Concerns\HasTags;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
class Category extends Model
{
    use HasUlids,HasFactory, SoftDeletes, HasTags, HasMeta;

    /**
     * Root = depth 0
     *
     * بنابراین با MAX_DEPTH = 4
     * بیشترین تعداد level برابر 5 سطح است:
     *
     * 0 → 1 → 2 → 3 → 4
     */
    public const MAX_DEPTH = 4;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
        'description',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        
        'is_active' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')
            ->orderBy('name');
    }

    public function childrenRecursive(): HasMany
    {
        return $this->children()->with('childrenRecursive');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRootLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * عمق Category را محاسبه می‌کند.
     *
     * این متد فقط برای بررسی یک node استفاده می‌شود.
     * منطق جلوگیری از انتقال subtree در Service انجام می‌شود.
     */
    public function depth(): int
    {
        $depth = 0;
        $node = $this;

        while ($node->parent_id !== null) {
            $node = $node->parent;

            if (! $node) {
                break;
            }

            $depth++;

            // دفاع در برابر داده خراب/cycle موجود در DB.
            if ($depth > self::MAX_DEPTH + 1) {
                throw new \LogicException(
                    'ساختار درخت دسته‌بندی نامعتبر است.'
                );
            }
        }

        return $depth;
    }

    /**
     * بررسی می‌کند آیا Category مشخص‌شده descendant این Category است یا نه.
     */
    public function hasDescendant(string $candidateId): bool
    {
        if ($this->id === $candidateId) {
            return false;
        }

        $children = $this->relationLoaded('children')
            ? $this->children
            : $this->children()->get();

        foreach ($children as $child) {
            if ($child->id === $candidateId) {
                return true;
            }

            if ($child->hasDescendant($candidateId)) {
                return true;
            }
        }

        return false;
    }
}