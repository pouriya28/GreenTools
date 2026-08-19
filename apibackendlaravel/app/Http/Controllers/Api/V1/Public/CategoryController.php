<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::query()
            ->active()
            ->rootLevel()
            ->with(['childrenRecursive', 'tags', 'meta'])
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function show(string $slug)
    {
        $category = Category::query()
            ->where('slug', $slug)
            ->active()
            ->with(['childrenRecursive', 'tags', 'meta'])
            ->firstOrFail();

        return new CategoryResource($category);
    }
}