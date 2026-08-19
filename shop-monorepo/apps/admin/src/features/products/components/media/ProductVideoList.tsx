import { useState } from "react"
import { Loader2, Trash2, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEOS_PER_PRODUCT,
  MAX_VIDEO_SIZE_BYTES,
  type VideoSourceType,
} from "../../api/productsApi"
import { useDeleteProductVideo, useUploadProductVideo } from "../../hooks/useProductMediaMutations"
import type { ProductVideo } from "../../types"

interface ProductVideoListProps {
  productId: number
  videos: ProductVideo[]
}

const SOURCE_LABELS: Record<VideoSourceType, string> = {
  upload: "اپلود فایل",
  youtube: "یوتیوب",
  aparat: "اپارات",
  external: "لینک خارجی",
}

export function ProductVideoList({ productId, videos }: ProductVideoListProps) {
  const [sourceType, setSourceType] = useState<VideoSourceType>("youtube")
  const [title, setTitle] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const uploadMutation = useUploadProductVideo(productId)
  const deleteMutation = useDeleteProductVideo(productId)

  const sortedVideos = [...videos].sort((a, b) => a.sort_order - b.sort_order)
  const reachedLimit = sortedVideos.length >= MAX_VIDEOS_PER_PRODUCT

  function resetForm() {
    setTitle("")
    setExternalUrl("")
    setFile(null)
  }

  function handleFileChange(selected: File | null) {
    setFormError(null)
    if (!selected) {
      setFile(null)
      return
    }
    if (!ALLOWED_VIDEO_TYPES.includes(selected.type)) {
      setFormError("فرمت ویدیو مجاز نیست. فقط MP4، WebM یا OGG.")
      setFile(null)
      return
    }
    if (selected.size > MAX_VIDEO_SIZE_BYTES) {
      setFormError("حجم ویدیو بزرگ‌تر از ۵۰ مگابایت است.")
      setFile(null)
      return
    }
    setFile(selected)
  }

  function handleSubmit() {
    setFormError(null)

    if (reachedLimit) {
      setFormError(`حداکثر ${MAX_VIDEOS_PER_PRODUCT} ویدیو برای هر محصول مجاز است.`)
      return
    }

    if (sourceType === "upload") {
      if (!file) {
        setFormError("اول یک فایل ویدیوی انتخاب کن.")
        return
      }
      uploadMutation.mutate(
        { source_type: "upload", title: title.trim() || null, video: file },
        {
          onSuccess: () => resetForm(),
          onError: () => setFormError("افزودن ویدیو ناموفق بود."),
        },
      )
      return
    }

    if (!externalUrl.trim()) {
      setFormError("لینک ویدیو رو وارد کن.")
      return
    }

    uploadMutation.mutate(
      { source_type: sourceType, title: title.trim() || null, external_url: externalUrl.trim() },
      {
        onSuccess: () => resetForm(),
        onError: () => setFormError("افزودن ویدیو ناموفق بود."),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-text-1">ویدیوهای محصول</p>

      {sortedVideos.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-text-2">
          هنوز ویدیوی اضافه نشده.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sortedVideos.map((video) => (
            <li key={video.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <Video className="h-4 w-4 shrink-0 text-text-2" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm text-text-1">{video.title || video.url}</span>
                  <span className="text-xs text-text-2">{SOURCE_LABELS[video.source_type]}</span>
                </div>
              </div>
              <button
                type="button"
                title="حذف ویدیو"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(video.id)}
                className="shrink-0 rounded-full p-1 text-danger hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!reachedLimit && (
        <div className="flex flex-col gap-2 rounded-md border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_source_type">منبع</Label>
              <Select
                value={sourceType}
                onValueChange={(value) => {
                  setSourceType(value as VideoSourceType)
                  setFormError(null)
                }}
              >
                <SelectTrigger id="video_source_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">یوتیوب</SelectItem>
                  <SelectItem value="aparat">اپارات</SelectItem>
                  <SelectItem value="external">لینک خارجی</SelectItem>
                  <SelectItem value="upload">اپلود فایل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_title">عنوان (اختیاری)</Label>
              <Input id="video_title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          </div>

          {sourceType === "upload" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_file">فایل ویدیو (حداکثر ۵۰ مگابایت)</Label>
              <input
                id="video_file"
                type="file"
                accept={ALLOWED_VIDEO_TYPES.join(",")}
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="text-sm text-text-2"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video_url">لینک ویدیو</Label>
              <Input
                id="video_url"
                placeholder="https://..."
                value={externalUrl}
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </div>
          )}

          {formError && <p className="text-xs text-danger">{formError}</p>}

          <Button type="button" size="sm" onClick={handleSubmit} disabled={uploadMutation.isPending} className="self-start">
            {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            افزودن ویدیو
          </Button>
        </div>
      )}
    </div>
  )
}
