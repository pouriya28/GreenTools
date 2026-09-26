<?php

namespace Database\Factories;

use App\Enums\CommentStatus;
use App\Models\Comment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'commentable_type' => 'product',
            'commentable_id'   => Product::factory(),
            'user_id'          => User::factory(),
            'guest_name'       => null,
            'guest_email'      => null,
            'edit_token_hash'  => null,
            'parent_id'        => null,
            'body'             => $this->faker->paragraph(),
            'rating'           => $this->faker->numberBetween(1, 5),
            'status'           => CommentStatus::Pending,
            'created_at'       => now(),
            'updated_at'       => now(),
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => CommentStatus::Pending]);
    }

    public function approved(): static
    {
        return $this->state(['status' => CommentStatus::Approved]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => CommentStatus::Rejected]);
    }

    public function guest(): static
    {
        $rawToken = Str::random(40);
        return $this->state([
            'user_id'         => null,
            'guest_name'      => $this->faker->name(),
            'guest_email'     => $this->faker->safeEmail(),
            'edit_token_hash' => hash('sha256', $rawToken),
            '_raw_token'      => $rawToken, // transient, not persisted
        ]);
    }

    public function forProduct(Product $product): static
    {
        return $this->state([
            'commentable_type' => 'product',
            'commentable_id'   => $product->id,
        ]);
    }

    public function asReply(Comment $parent): static
    {
        return $this->state([
            'parent_id'        => $parent->id,
            'commentable_type' => $parent->commentable_type,
            'commentable_id'   => $parent->commentable_id,
        ]);
    }
}
