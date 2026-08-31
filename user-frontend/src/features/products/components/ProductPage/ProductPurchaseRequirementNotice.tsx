// src/features/products/components/ProductPage/ProductPurchaseRequirementNotice.tsx
import { FiAlertTriangle, FiTool, FiPhoneCall } from "react-icons/fi";
import type { ProductDetail } from "../../types/ProductDetail";
import { PURCHASE_REQUIREMENT_TONE } from "../../utils/purchaseRequirement";

interface ProductPurchaseRequirementNoticeProps {
  product: ProductDetail;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}

const TONE_CLASSES: Record<string, string> = {
  neutral: "border-border bg-surface text-text-secondary",
  warning: "border-warning/40 bg-warning/10 text-warning",
  danger: "border-error/40 bg-error/10 text-error",
};

export function ProductPurchaseRequirementNotice({
  product,
  confirmed,
  onConfirmedChange,
}: ProductPurchaseRequirementNoticeProps) {
  const {
    purchase_requirement: requirement,
    purchase_requirement_label: requirementLabel,
    technical_notice: technicalNotice,
    installation_notice: installationNotice,
    compatibility_notice: compatibilityNotice,
    support_contact_enabled: supportEnabled,
    purchase_confirmation_required: confirmationRequired,
  } = product;

  const hasAnythingToShow = requirement !== "standard" || supportEnabled || confirmationRequired;
  if (!hasAnythingToShow) return null;

  const tone = PURCHASE_REQUIREMENT_TONE[requirement];
  const Icon = requirement === "restricted" ? FiAlertTriangle : FiTool;

  // Mirrors the conditional-notice logic from the admin form's ProductPurchaseRequirementFields
  const showTechnicalNotice = requirement === "technical_consultation" || requirement === "restricted";
  const showInstallationNotice = requirement === "professional_installation";
  const showCompatibilityNotice = requirement !== "standard";

  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 ${TONE_CLASSES[tone]}`} dir="rtl">
      {requirement !== "standard" && (
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium">{requirementLabel}</span>
            {showTechnicalNotice && technicalNotice && <span>{technicalNotice}</span>}
            {showInstallationNotice && installationNotice && <span>{installationNotice}</span>}
            {showCompatibilityNotice && compatibilityNotice && <span>{compatibilityNotice}</span>}
          </div>
        </div>
      )}

      {supportEnabled && (
        <a
          href="/support"
          className="flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors duration-150 hover:text-primary"
        >
          <FiPhoneCall />
          تماس با پشتیبانی قبل از خرید
        </a>
      )}

      {confirmationRequired && (
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirmedChange(event.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          شرایط خرید این محصول را مطالعه کردم و می‌پذیرم
        </label>
      )}
    </div>
  );
}