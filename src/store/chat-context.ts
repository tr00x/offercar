import { createContext } from 'react'
import type { ChatConversation, LocalMessage, MessageType } from '@/types'
import type { ConnectionStatus } from '@/services/chatWebSocket'

export interface ChatState {
  conversations: ChatConversation[]
  messages: Record<number, LocalMessage[]> // keyed by other user's id
  activeUserId: number | null
  connectionStatus: ConnectionStatus
  isLoadingConversations: boolean
  isLoadingMessages: boolean
}

export interface ChatContextType extends ChatState {
  sendMessage: (targetUserId: number, message: string, type?: MessageType) => void
  setActiveChat: (userId: number | null) => void
  loadConversations: () => Promise<void>
  loadMessages: (userId: number) => Promise<void>
  getUnreadCount: (userId: number) => number
  getTotalUnreadCount: () => number
  markAsRead: (userId: number) => void
  deleteMessage: (userId: number, messageId: number | string) => void
}

export const ChatContext = createContext<ChatContextType | null>(null)
