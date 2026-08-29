import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createExchangeRateSchedule,
  deleteExchangeRateSchedule,
  fetchExchangeRateSchedules,
  updateExchangeRateSchedule,
} from "../api/exchangeRateApi"
import type { CreateSchedulePayload, UpdateSchedulePayload } from "../types"

const SCHEDULES_QUERY_KEY = ["pricing", "exchange-rate", "schedules"] as const

export function useExchangeRateSchedules() {
  return useQuery({
    queryKey: SCHEDULES_QUERY_KEY,
    queryFn: fetchExchangeRateSchedules,
  })
}

export function useCreateExchangeRateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createExchangeRateSchedule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY }),
  })
}

export function useUpdateExchangeRateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ scheduleId, payload }: { scheduleId: number; payload: UpdateSchedulePayload }) =>
      updateExchangeRateSchedule(scheduleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY }),
  })
}

export function useDeleteExchangeRateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (scheduleId: number) => deleteExchangeRateSchedule(scheduleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULES_QUERY_KEY }),
  })
}
