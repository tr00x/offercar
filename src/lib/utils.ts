import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ApiError } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  const err = error as ApiError
  let msg = err.response?.data?.message || err.message || defaultMessage
  
  if (typeof msg === 'object' && msg !== null) {
    msg = msg.ru || msg.en || msg.tk || JSON.stringify(msg)
  }
  
  return String(msg)
}
