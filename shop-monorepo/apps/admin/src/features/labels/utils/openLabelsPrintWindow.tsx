import ReactDOMServer from "react-dom/server"
// Vite's `?raw` import gives the stylesheet as a plain string so it can be
// embedded directly into the standalone print window's <head> — that window
// has no access to the app's bundled CSS.
import shippingLabelCss from "../styles/shipping-label.css?raw"
import { ShippingLabelSheetView } from "../components/ShippingLabelSheetView"
import type { ShippingLabelSheet } from "../types/Label"

// Opens a brand-new browser tab containing ONLY the label sheet (no sidebar,
// no toolbar, no admin chrome) and triggers the native print dialog there.
// Because it's a real separate window, the admin can also just press Ctrl+P
// on it manually at any time — nothing here depends on the auto-print firing.
export function openLabelsPrintWindow(sheet: ShippingLabelSheet) {
	const bodyHtml = ReactDOMServer.renderToStaticMarkup(<ShippingLabelSheetView sheet={sheet} />)

	// IMPORTANT: no "noopener"/"noreferrer" here. Those sever the new window's
	// opener relationship, and several browsers (Chrome included) then refuse
	// document.write() on the handle we get back — the symptom is exactly a
	// blank white popup with no visible error.
	const printWindow = window.open("", "_blank")
	if (!printWindow) {
		window.alert("مرورگر باز شدن پنجره‌ی چاپ را مسدود کرد. لطفاً پاپ‌آپ (Pop-up) را برای این سایت مجاز کنید و دوباره تلاش کنید.")
		return
	}

	printWindow.document.open()
	printWindow.document.write(`<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>چاپ لیبل ارسال</title>
<style>
	body { margin: 0; background: #fff; }
	${shippingLabelCss}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`)
	printWindow.document.close()

	// Don't rely solely on `onload` — on an already-"loaded" about:blank window
	// it may never fire again after document.write() in some browsers. A short
	// timeout after document.close() is more reliable here and still gives
	// fonts/layout a tick to settle before print() opens the dialog.
	window.setTimeout(() => {
		printWindow.focus()
		printWindow.print()
	}, 150)
}