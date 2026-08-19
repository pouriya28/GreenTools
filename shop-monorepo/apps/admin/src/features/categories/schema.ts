import { z } from "zod"

export const categorySchema = z.object({
  parent_id: z.number().nullable(),
  name: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد").max(150),
  description: z.string().max(2000).nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().min(0).max(9999),
  meta_title: z.string().max(180).nullable().optional(),
  meta_description: z.string().max(300).nullable().optional(),
})

export type CategoryFormValues = z.infer<typeof categorySchema>