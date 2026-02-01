import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  const err = error as { response?: { data?: { message?: string | object } }, message?: string }
  let msg = err.response?.data?.message || err.message || defaultMessage
  
  if (typeof msg === 'object' && msg !== null) {
    const localizedMsg = msg as { ru?: string; en?: string; tk?: string }
    msg = localizedMsg.ru || localizedMsg.en || localizedMsg.tk || JSON.stringify(msg)
  }
  
  return String(msg)
}
