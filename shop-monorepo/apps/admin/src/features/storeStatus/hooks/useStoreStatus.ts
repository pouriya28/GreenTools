import { useQuery } from "@tanstack/react-query"
import { fetchStoreStatus } from "../api/storeStatusApi"

export function useStoreStatus() {
	return useQuery({
		queryKey: ["store-status"],
		queryFn: fetchStoreStatus,
		// وضعیت فروشگاه ممکنه از یه تب/کاربر دیگه عوض بشه؛ هر ۳۰ ثانیه رفرش می‌شود
		// تا دکمه با واقعیت هماهنگ بمونه.
		refetchInterval: 30_000,
	})
}