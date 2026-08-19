<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'is_active' => $this->is_active,

            'tags' => $this->whenLoaded('tags', fn () => $this->tags->pluck('name')),
            'meta' => $this->whenLoaded('meta', fn () => $this->meta ? [
                'meta_title' => $this->meta->meta_title,
                'meta_description' => $this->meta->meta_description,
            ] : null),

            'children' => $this->resolveChildren(),
            'created_at' => $this->created_at?->toIso8601String(),
            'deleted_at' => $this->deleted_at?->toIso8601String(),
        ];
    }

    /**
     * چون کنترلرها بسته به مورد یا 'childrenRecursive' (کل درخت، پابلیک +
     * لیست ادمین) یا 'children' (یک سطح) رو eager-load می‌کنن، این‌جا هر
     * دو رو چک می‌کنیم — وگرنه با whenLoaded('children') ساده، وقتی فقط
     * childrenRecursive لود شده بود (اسم رابطه فرق داره)، همیشه خالی
     * برمی‌گشت و کل درخت زیرشاخه‌ها از کلاینت مخفی می‌موند.
     */
    private function resolveChildren()
    {
        if ($this->relationLoaded('childrenRecursive')) {
            return CategoryResource::collection($this->childrenRecursive);
        }
        if ($this->relationLoaded('children')) {
            return CategoryResource::collection($this->children);
        }
        return $this->whenLoaded('children');
    }
}