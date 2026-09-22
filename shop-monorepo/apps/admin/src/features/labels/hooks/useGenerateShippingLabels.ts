import { useMutation } from "@tanstack/react-query"
import { generateShippingLabels } from "../api/labelsApi"
import type { GenerateShippingLabelsPayload, ShippingLabelSheet } from "../types/Label"

export function useGenerateShippingLabels() {
	return useMutation<ShippingLabelSheet, unknown, GenerateShippingLabelsPayload>({
		mutationFn: generateShippingLabels,
	})
}