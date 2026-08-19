import { useRef, useState } from "react"
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_UPLOAD,
  MAX_IMAGE_SIZE_BYTES,
} from "../../api/productsApi"
import {
  useDeleteProductImage,
  useSetPrimaryProductImage,
  useUploadProductImages,
} from "../../hooks/useProductMediaMutations"
import type { ProductImage } from "../../types"

interface ProductImageGridProps {
  productId: number
  images: ProductImage[]
}

function formatSizeError(fileName: string) {
  return `"${fileName}" بزرگ‌تر از ۵ مگابایت است و آپلود نمی‌شود.`
}

export function ProductImageGrid({ productId, images }: ProductImageGridProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useUploadProductImages(productId)
  const primaryMutation = useSetPrimaryProductImage(productId)
  const deleteMutation = useDeleteProductImage(productId)

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList)
    setLocalError(null)

    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      setLocalError(`در هر بار حداکثر ${MAX_IMAGES_PER_UPLOAD} عکس می‌توانید اضافه کنید.`)
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setLocalError(`فرمت "${file.name}" مجاز نیست. فقط JPEG، PNG یا WebP.`)
        if (inputRef.current) inputRef.current.value = ""
        return
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setLocalError(formatSizeError(file.name))
        if (inputRef.current) inputRef.current.value = ""
        return
      }
    }

    // الف متن هر عکس را از روی نام فایل (بدون پسوند) پیش‌فرض پر می‌کنیم؛ ادمین می‌تواند بعداً از روی تکمه‌ی UI ویرایش کند.
    const altTexts = files.map((file) => file.name.replace(/\.[^/.]+$/, ""))

    uploadMutation.mutate(
      { files, altTexts },
      {
        onError: () => setLocalError("آپلود عکس‌ها ناموفق بود."),
      },
    )
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-1">عکس‌های محصول</p>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          افزودن عکس
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(event) => handleFilesSelected(event.target.files)}
        />
      </div>

      {localError && <p className="text-xs text-danger">{localError}</p>}

      {sortedImages.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-text-2">
          هنوز عکسی اضافه نشده.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {sortedImages.map((image) => (
            <div key={image.id} className="group relative overflow-hidden rounded-md border border-border">
              <img src={image.url} alt={image.alt_text ?? ""} className="h-24 w-full object-cover" />

              <button
                type="button"
                title="تصویر شاخص"
                disabled={image.is_primary || primaryMutation.isPending}
                onClick={() => primaryMutation.mutate(image.id)}
                className={`absolute top-1 right-1 rounded-full p-1 transition-colors ${
                  image.is_primary ? "bg-warning text-warning-foreground" : "bg-bg-1/80 text-text-2 hover:text-warning"
                }`}
              >
                <Star className="h-4 w-4" fill={image.is_primary ? "currentColor" : "none"} />
              </button>

              <button
                type="button"
                title="حذف عکس"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(image.id)}
                className="absolute bottom-1 left-1 rounded-full bg-bg-1/80 p-1 text-danger opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {image.is_primary && (
                <span className="absolute bottom-1 right-1 rounded bg-warning px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground">
                  شاخص
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
