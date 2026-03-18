import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, "")
  } catch {
    const match = url.match(/^(?:https?:\/\/)?([^/]+)/)
    return match ? match[1].replace(/^www\./, "") : url
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
