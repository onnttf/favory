import { z } from "zod"

export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  tags: string[]
  collectionId: string | null
  favicon?: string
  sort: number
  createdAt: string
  updatedAt: string
}

export interface Collection {
  id: string
  name: string
  color: string
  parentId: string | null
  bookmarkCount: number
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  count: number
}

// Zod schemas for API validation
export const BookmarkCreateSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  collectionId: z.string().nullable().default(null),
  favicon: z.string().optional(),
})

export const BookmarkUpdateSchema = z.object({
  url: z.string().url().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  collectionId: z.string().nullable().optional(),
  favicon: z.string().optional(),
})

export const CollectionCreateSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  parentId: z.string().nullable().default(null),
})

export const CollectionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  parentId: z.string().nullable().optional(),
})
