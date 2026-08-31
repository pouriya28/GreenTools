// src/features/products/utils/purchaseRequirement.ts
import type { PurchaseRequirement } from "../types/ProductDetail";

export type PurchaseRequirementTone = "neutral" | "warning" | "danger";

// standard has no special tone (banner isn't shown for it unless support/confirmation flags are set)
export const PURCHASE_REQUIREMENT_TONE: Record<PurchaseRequirement, PurchaseRequirementTone> = {
  standard: "neutral",
  technical_consultation: "warning",
  professional_installation: "warning",
  restricted: "danger",
};