<?php

namespace App\Http\Requests\Api\V1\Comment;

use App\Models\Comment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var Comment $comment */
        $comment = $this->route('comment');

        // The guest edit token (if any) travels only via httpOnly cookie,
        // never in the request body.
        return Gate::allows('update', [$comment, $this->cookie("comment_edit_token_{$comment->id}")]);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'body' => is_string($this->body) ? strip_tags($this->body) : $this->body,
        ]);
    }
}