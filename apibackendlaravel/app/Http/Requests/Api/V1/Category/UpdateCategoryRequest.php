<?php

namespace App\Http\Requests\Api\V1\Category;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $category = $this->route('category');

        return $category instanceof Category
            && $this->user()?->can(
                'update',
                $category
            );
    }

    public function rules(): array
    {
        /** @var Category $category */
        $category = $this->route('category');

        return [
            'parent_id' => [
                'nullable',
                'integer',

                Rule::exists('categories', 'id')
                    ->whereNull('deleted_at'),

                Rule::notIn([$category->id]),

                function ($attribute, $value, $fail) use ($category) {
                    if ($value === null) {
                        return;
                    }

                    $parentId = (int) $value;

                    if ($category->hasDescendant($parentId)) {
                        $fail(
                            'نمی‌توان یکی از زیردسته‌های همین دسته را به‌عنوان والد انتخاب کرد.'
                        );
                    }
                },
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:150',
            ],

            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'meta' => [
                'nullable',
                'array',
            ],

            'meta.meta_title' => [
                'nullable',
                'string',
                'max:180',
            ],

            'meta.meta_description' => [
                'nullable',
                'string',
                'max:300',
            ],

            'tag_ids' => [
                'nullable',
                'array',
                'max:50',
            ],

            'tag_ids.*' => [
                'integer',
                'distinct',
                'exists:tags,id',
            ],
        ];
    }
}