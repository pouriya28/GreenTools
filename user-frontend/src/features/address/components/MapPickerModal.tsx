import { useEffect, useRef, useState } from "react"
import { useReverseGeocode } from "../hooks/useReverseGeocode"
import type { ReverseGeocodeResult } from "../types/Address"
import type { PlaceSearchResult } from "../api/mapApi"
import { IconClose, IconMapPin, IconCheck } from "./icons"
import { AddressSearch } from "./AddressSearch"

interface MapPickerModalProps {
    open: boolean
    onClose: () => void
    onConfirm: (result: ReverseGeocodeResult & { latitude: number; longitude: number }) => void
}

const DEFAULT_CENTER: [number, number] = [35.6892, 51.389] // تهران به عنوان پیش‌فرض اولیه

// SDK رسمی نشان برای Leaflet (اسکریپت + استایل) — دقیقاً همان چیزی که در مستندات
// platform.neshan.org/sdk/web-sdk-getting-started معرفی شده است. با این روش دیگر
// لازم نیست URL کاشی را دستی بسازیم؛ خود اسکریپت L.Map را طوری Patch می‌کند که
// با پاس‌دادن key/maptype، کاشی‌های صحیح (و دامنه/سهمیه مرتبط با کلید «نقشه وب») را
// خودش مدیریت می‌کند.
const NESHAN_SDK_JS = "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.js"
const NESHAN_SDK_CSS = "https://static.neshan.org/sdk/leaflet/1.4.0/leaflet.css"

declare global {
    interface Window {
        L?: typeof import("leaflet") & {
            Map: new (
                el: HTMLElement,
                options: {
                    key: string
                    maptype?: string
                    poi?: boolean
                    traffic?: boolean
                    center: [number, number]
                    zoom: number
                },
            ) => import("leaflet").Map
        }
    }
}

let neshanSdkPromise: Promise<void> | null = null

/** اسکریپت/استایل SDK رسمی نشان را یک‌بار لود می‌کند و برای فراخوانی‌های بعدی همان Promise را برمی‌گرداند. */
function loadNeshanLeafletSdk(): Promise<void> {
    if (neshanSdkPromise) return neshanSdkPromise
    neshanSdkPromise = new Promise<void>((resolve, reject) => {
        if (window.L) {
            resolve()
            return
        }
        if (!document.querySelector(`link[href="${NESHAN_SDK_CSS}"]`)) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = NESHAN_SDK_CSS
            document.head.appendChild(link)
        }
        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${NESHAN_SDK_JS}"]`)
        if (existingScript) {
            existingScript.addEventListener("load", () => resolve())
            existingScript.addEventListener("error", () => reject(new Error("neshan-sdk-load-failed")))
            return
        }
        const script = document.createElement("script")
        script.src = NESHAN_SDK_JS
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("neshan-sdk-load-failed"))
        document.head.appendChild(script)
    })
    return neshanSdkPromise
}

function IconLocateGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
    )
}

/**
 * مدال انتخاب آدرس از روی نقشه (SDK رسمی نشان برای Leaflet) + جستجوی آدرس +
 * دکمهٔ «موقعیت من». منطق جابجایی نقشه/رنگ‌بندی قبلی دست نخورده مانده است.
 *
 * امنیت: کلید API نشان فقط از طریق متغیر محیطی VITE_NESHAN_API_KEY خوانده می‌شود
 * (هیچ‌وقت hardcode نمی‌شود). جستجوی آدرس مستقیماً از فرانت به Neshan زده نمی‌شود؛
 * از طریق بک‌اند (POST /v1/map/search) پروکسی می‌شود چون آن سرویس با کلید نوع
 * «سرویس‌ها» کار می‌کند که نباید در مرورگر افشا شود.
 *
 * نکتهٔ مهم: کلید API نقشه باید از نوع «نقشه وب» در پنل نشان ساخته شده باشد و
 * دامنهٔ فعلی (برای توسعه: localhost) باید در «دامنه‌های مجاز» همان کلید اضافه شده باشد.
 */
export function MapPickerModal({ open, onClose, onConfirm }: MapPickerModalProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<import("leaflet").Map | null>(null)
    const markerRef = useRef<import("leaflet").Marker | null>(null)
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [isMapReady, setIsMapReady] = useState(false)
    const [mapError, setMapError] = useState(false)
    const [gpsState, setGpsState] = useState<"idle" | "loading" | "error">("idle")
    const reverseGeocode = useReverseGeocode()

    useEffect(() => {
        if (!open || !mapContainerRef.current) return
        let cancelled = false

        const apiKey = import.meta.env.VITE_NESHAN_API_KEY as string | undefined
        if (!apiKey) {
            // eslint-disable-next-line no-console
            console.error("VITE_NESHAN_API_KEY در محیط فرانت ست نشده — نقشه بارگذاری نمی‌شود.")
            setMapError(true)
            return
        }

        loadNeshanLeafletSdk()
            .then(() => {
                if (cancelled || !mapContainerRef.current || !window.L) return
                const L = window.L

                const map = new L.Map(mapContainerRef.current, {
                    key: apiKey,
                    maptype: "standard-day",
                    poi: true,
                    traffic: false,
                    center: DEFAULT_CENTER,
                    zoom: 13,
                })

                const marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map)
                function handleMarkerMove() {
                    const pos = marker.getLatLng()
                    setCoords({ lat: pos.lat, lng: pos.lng })
                }
                marker.on("dragend", handleMarkerMove)
                map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
                    marker.setLatLng(e.latlng)
                    handleMarkerMove()
                })

                mapRef.current = map
                markerRef.current = marker
                setCoords({ lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] })
                setIsMapReady(true)
            })
            .catch((error) => {
                if (cancelled) return
                // eslint-disable-next-line no-console
                console.error("خطا در بارگذاری SDK نقشهٔ نشان (اتصال اینترنت یا مسدودسازی دامنه را بررسی کنید):", error)
                setMapError(true)
            })

        return () => {
            cancelled = true
            mapRef.current?.remove()
            mapRef.current = null
            markerRef.current = null
            setIsMapReady(false)
            setMapError(false)
            setGpsState("idle")
        }
    }, [open])

    function moveTo(lat: number, lng: number, zoom = 16) {
        markerRef.current?.setLatLng([lat, lng])
        mapRef.current?.setView([lat, lng], zoom)
        setCoords({ lat, lng })
    }

    function handleSelectSearchResult(result: PlaceSearchResult) {
        moveTo(result.latitude, result.longitude)
    }

    function handleUseCurrentLocation() {
        if (!navigator.geolocation) {
            setGpsState("error")
            return
        }
        setGpsState("loading")
        navigator.geolocation.getCurrentPosition(
            (position) => {
                moveTo(position.coords.latitude, position.coords.longitude)
                setGpsState("idle")
            },
            () => {
                // کاربر دسترسی موقعیت را رد کرده یا مرورگر/سیستم اجازه نداده؛ خطای
                // فنی به کنسول نمی‌رود چون این یک رفتار عادی کاربر است، نه باگ.
                setGpsState("error")
            },
            { enableHighAccuracy: true, timeout: 10_000 },
        )
    }

    async function handleConfirm() {
        if (!coords) return
        try {
            const result = await reverseGeocode.mutateAsync({ latitude: coords.lat, longitude: coords.lng })
            onConfirm({ ...result, latitude: coords.lat, longitude: coords.lng })
        } catch {
            // Failure is already toasted globally by the axios interceptor; keep the modal open so the user can retry.
        }
    }

    if (!open) return null

    return (
        <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative flex w-full sm:max-w-lg h-[85vh] sm:h-[80vh] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border bg-background shadow-[0_0_40px_var(--primary-glow)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3.5">
                    <h2 className="text-sm sm:text-base font-bold text-text">انتخاب آدرس از نقشه</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-primary/10"
                    >
                        <IconClose className="h-5 w-5" />
                    </button>
                </div>
                <div className="relative flex-1">
                    <div ref={mapContainerRef} className="absolute inset-0" />
                    {!isMapReady && !mapError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-surface text-muted text-sm">
                            در حال بارگذاری نقشه…
                        </div>
                    )}
                    {mapError && (
                        <div className="pointer-events-none absolute inset-x-3 top-3 rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-center text-xs text-error">
                            نقشه بارگذاری نشد؛ کنسول مرورگر را بررسی کنید (کلید API از نوع «نقشه وب» و دامنهٔ مجاز را در پنل نشان چک کنید).
                        </div>
                    )}
                    {isMapReady && (
                        <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000]">
                            <div className="pointer-events-auto">
                                <AddressSearch center={coords} onSelect={handleSelectSearchResult} />
                            </div>
                        </div>
                    )}
                    {isMapReady && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                            <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface/90 px-3 py-1.5 text-xs text-text-secondary shadow">
                                <IconMapPin className="h-3.5 w-3.5 text-primary" />
                                نشانگر را روی آدرس مورد نظر بکشید یا روی نقشه کلیک کنید
                            </div>
                        </div>
                    )}
                    {gpsState === "error" && (
                        <div className="pointer-events-none absolute inset-x-3 top-16 rounded-2xl border border-error/40 bg-error/10 px-3 py-2 text-center text-xs text-error">
                            دسترسی به موقعیت مکانی امکان‌پذیر نبود؛ لطفاً دسترسی موقعیت را در مرورگر فعال کنید یا نقشه را دستی جابجا کنید.
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 border-t border-border bg-surface px-4 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 rounded-2xl border border-border text-text-secondary text-sm font-medium transition hover:bg-background"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={!isMapReady || gpsState === "loading"}
                        aria-label="استفاده از موقعیت فعلی"
                        title="استفاده از موقعیت فعلی"
                        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-border text-text-secondary transition hover:bg-background disabled:opacity-60"
                    >
                        <IconLocateGlyph className={`h-5 w-5 ${gpsState === "loading" ? "animate-pulse" : ""}`} />
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!coords || reverseGeocode.isPending}
                        className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-bold text-background shadow-[0_0_25px_var(--primary-glow)] transition hover:bg-primary-hover disabled:opacity-60 disabled:shadow-none"
                    >
                        {reverseGeocode.isPending ? (
                            "در حال دریافت آدرس…"
                        ) : (
                            <>
                                تایید موقعیت
                                <IconCheck className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
