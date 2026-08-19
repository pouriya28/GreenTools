<?php

namespace App\Http\Requests\Api\V1\Category;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(
            'create',
            Category::class
        ) ?? false;
    }

    public function rules(): array
    {
        return [
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('categories', 'id')
                    ->whereNull('deleted_at'),
            ],

            'name' => [
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

    public function messages(): array
    {
        return [
            'parent_id.exists' =>
                'دسته‌بندی والد انتخاب‌شده معتبر نیست.',

            'name.required' =>
                'نام دسته‌بندی الزامی است.',

            'tag_ids.max' =>
                'تعداد تگ‌های انتخاب‌شده بیش از حد مجاز است.',

            'tag_ids.*.distinct' =>
                'یک تگ نمی‌تواند چند بار ارسال شود.',
        ];
    }
}