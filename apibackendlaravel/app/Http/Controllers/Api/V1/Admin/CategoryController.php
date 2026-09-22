<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Category\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\Category\CategoryService;

class CategoryController extends Controller
{
    public function __construct(private CategoryService $categoryService) {}

    public function index()
    {
        $this->authorize('viewAny', Category::class);

        $categories = Category::query()
            ->rootLevel()
            ->with(['children.tags', 'children.meta', 'tags', 'meta'])
            ->orderBy('name')
            ->get();

        return CategoryResource::collection($categories);
    }

    public function store(StoreCategoryRequest $request)
    {
        $category = $this->categoryService->create($request->validated(), $request->user()->id);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(UpdateCategoryRequest $request, Category $category)
    {
        // دفاع دوم علاوه بر authorize() داخل UpdateCategoryRequest — Defense in Depth
        $this->authorize('update', $category);

        $category = $this->categoryService->update($category, $request->validated());

        return new CategoryResource($category);
    }

    public function destroy(Category $category)
    {
        // قبلاً اینجا 'manage' بود که یعنی permission نامرتبط هم اجازه حذف می‌داد؛ الان دقیقاً 'delete'
        $this->authorize('delete', $category);

        try {
            $this->categoryService->delete($category);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'دسته‌بندی با موفقیت حذف شد.']);
    }

    public function trash()
    {
        $this->authorize('viewTrash', Category::class);

        $categories = Category::onlyTrashed()->orderByDesc('deleted_at')->get();

        return CategoryResource::collection($categories);
    }

    public function restore(string $id)
    {
        $this->authorize('restore', Category::class);

        $category = Category::onlyTrashed()->findOrFail($id);
        $category = $this->categoryService->restore($category);

        return new CategoryResource($category);
    }

    public function forceDestroy(string $id)
    {
        $this->authorize('forceDelete', Category::class);

        $category = Category::onlyTrashed()->findOrFail($id);

        try {
            $this->categoryService->forceDelete($category);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'دسته‌بندی برای همیشه حذف شد.']);
    }
}