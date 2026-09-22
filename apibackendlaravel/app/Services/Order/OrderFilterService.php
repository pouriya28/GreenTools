<?php

namespace App\Services\Order;

use App\DTOs\Order\OrderFilterDTO;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class OrderFilterService 
{
    public function paginate(OrderFilterDTO $filters): LengthAwarePaginator
    {
        $query = Order::query()
            ->withCount('items')
            // برای نمایش نام/شماره خریدار در لیست بدون N+1 کوئری
            ->with('addressSnapshot');

        $this->applyStatusFilter($query, $filters);
        $this->applyDateRangeFilter($query, $filters);
        $this->applySearchFilter($query, $filters);

        return $query
            ->latest('id')
            ->paginate($filters->perPage, ['*'], 'page', $filters->page)
            ->withQueryString();
    }

    private function applyStatusFilter(Builder $query, OrderFilterDTO $filters): void
    {
        // status از whitelist ثابت enum (via FormRequest Rule::in) میاد، پس امن است.
        if ($filters->status) {
            $query->where('status', $filters->status);
        }
    }

    private function applyDateRangeFilter(Builder $query, OrderFilterDTO $filters): void
    {
        // whereDate روی created_at: مقایسه‌ی روزانه (calendar-day)، نه بازه‌ی دقیق ساعت.
        if ($filters->dateFrom) {
            $query->whereDate('created_at', '>=', $filters->dateFrom);
        }
        if ($filters->dateTo) {
            $query->whereDate('created_at', '<=', $filters->dateTo);
        }
    }

    private function applySearchFilter(Builder $query, OrderFilterDTO $filters): void
    {
        if (!$filters->search) {
            return;
        }

        // نام/شماره‌ی خریدار روی User نیست — روی OrderAddressSnapshot است
        // (اسنپ‌شات غیرقابل‌تغییر زمان خرید)، پس سرچ باید از طریق آن رابطه باشد.
        $search = $this->escapeLike($filters->search);

        $query->whereHas('addressSnapshot', function (Builder $q) use ($search) {
            $q->where('recipient_name', 'like', "%{$search}%")
                ->orWhere('recipient_phone', 'like', "%{$search}%");
        });
    }

    private function escapeLike(string $value): string
    {
        // escape کردن wildcard های LIKE - همون دلیل ProductFilterService:
        // بدون این، %، _ و \ کاربر به‌عنوان کاراکتر خاص SQL تفسیر می‌شن.
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}