<?php

namespace App\Http\Requests\Api\V1\Comment;

use App\Enums\CommentableType;
use App\Models\Comment;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint: both authenticated members and guests may comment.
        return true;
    }

    public function rules(): array
    {
        $isGuest = ! $this->user();

        return [
            'commentable_type' => ['required', 'string', Rule::in(array_column(CommentableType::cases(), 'value'))],
            'commentable_id' => ['required', 'string'],
            'parent_id' => ['nullable', 'string', 'exists:comments,id'],
            'body' => ['required', 'string', 'max:2000'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'guest_name' => [Rule::requiredIf($isGuest), 'nullable', 'string', 'max:100'],
            'guest_email' => [Rule::requiredIf($isGuest), 'nullable', 'email', 'max:190'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Defense-in-depth: strip HTML tags before validation, even
            // though the frontend never renders comment body as raw HTML.
            'body' => is_string($this->body) ? strip_tags($this->body) : $this->body,
        ]);
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $this->validateCommentableExists($validator);
            $this->validateRatingOnlyOnProduct($validator);
            $this->validateReplyDepth($validator);
        });
    }

    private function validateCommentableExists(ValidatorContract $validator): void
    {
        $type = CommentableType::tryFrom((string) $this->input('commentable_type'));

        if ($type === null) {
            return; // already caught by the 'commentable_type' rule above
        }

        $modelClass = $type->modelClass();

        if (! $modelClass::whereKey($this->input('commentable_id'))->exists()) {
            $validator->errors()->add('commentable_id', 'مورد نظر یافت نشد.');
        }
    }

    private function validateRatingOnlyOnProduct(ValidatorContract $validator): void
    {
        if ($this->filled('rating') && $this->input('commentable_type') !== CommentableType::Product->value) {
            $validator->errors()->add('rating', 'امتیازدهی فقط برای محصولات مجاز است.');
        }
    }

    private function validateReplyDepth(ValidatorContract $validator): void
    {
        $parentId = $this->input('parent_id');

        if ($parentId === null) {
            return;
        }

        $parent = Comment::query()->find($parentId);

        if ($parent === null) {
            return; // already caught by the 'exists' rule above
        }

        if ($parent->parent_id !== null) {
            $validator->errors()->add('parent_id', 'امکان پاسخ به یک پاسخ وجود ندارد.');
        }

        if ($parent->commentable_type !== $this->input('commentable_type')
            || $parent->commentable_id !== (string) $this->input('commentable_id')
        ) {
            $validator->errors()->add('parent_id', 'پاسخ باید به همان مورد تعلق داشته باشد.');
        }
    }
}