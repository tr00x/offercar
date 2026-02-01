export function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      ...(isToday ? {} : { month: 'short', day: 'numeric' })
    }).format(date)
  } catch {
    return ''
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

export function getMessagePreview(message: string, type: number): string {
  switch (type) {
    case 2:
      return '🚗 Car listing'
    case 3:
      return '📹 Video'
    case 4:
      return '📷 Photo'
    default:
      return message.length > 50 ? message.substring(0, 50) + '...' : message
  }
}

export function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
