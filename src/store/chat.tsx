import {
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useAuth } from './auth'
import { getAccessToken } from '@/api/auth'
import { getConversations, getConversationMessages } from '@/api/chat'
import { chatWebSocket } from '@/services/chatWebSocket'
import type {
  ChatUser,
  MessageStatus,
  MessageType,
  LocalMessage,
} from '@/types'
import { ChatContext, type ChatState } from './chat-context'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [state, setState] = useState<ChatState>({
    conversations: [],
    messages: {},
    activeUserId: null,
    connectionStatus: 'disconnected',
    isLoadingConversations: false,
    isLoadingMessages: false,
  })

  // Track pending messages for ACK
  const [pendingMessages, setPendingMessages] = useState<
    Map<string, { localId: string; targetUserId: number }>
  >(new Map())

  const handleNewMessage = useCallback((chatUser: ChatUser) => {
    setState((prev) => {
      const userId = chatUser.id
      const existingMessages = prev.messages[userId] || []

      // Add new messages that don't already exist (convert to LocalMessage)
      const newMessages: LocalMessage[] = chatUser.messages
        .filter((newMsg) => !existingMessages.some((existing) => existing.id === newMsg.id))
        .map((msg) => ({
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          message: msg.message,
          type: msg.type,
          created_at: msg.created_at,
          status: 'sent' as MessageStatus,
        }))

      if (newMessages.length === 0) return prev

      const updatedMessages: LocalMessage[] = [...existingMessages, ...newMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      // Update or add conversation
      const existingConvIndex = prev.conversations.findIndex((c) => c.user_id === userId)
      const updatedConversations = [...prev.conversations]

      if (existingConvIndex >= 0) {
        const lastMsg = newMessages[newMessages.length - 1]
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          last_message: lastMsg.message,
          last_message_type: lastMsg.type,
          last_active_date: lastMsg.created_at,
          unread_messages:
            prev.activeUserId === userId
              ? 0
              : updatedConversations[existingConvIndex].unread_messages + newMessages.length,
        }
      } else {
        // Create new conversation entry
        const lastMsg = newMessages[newMessages.length - 1]
        updatedConversations.unshift({
          id: 0, // Will be updated from server
          user_id: userId,
          username: chatUser.username,
          avatar: chatUser.avatar,
          last_message: lastMsg.message,
          last_message_type: lastMsg.type,
          last_message_id: lastMsg.id,
          unread_messages: prev.activeUserId === userId ? 0 : newMessages.length,
          last_active_date: lastMsg.created_at,
        })
      }

      // Sort conversations by last message time
      updatedConversations.sort(
        (a, b) =>
          new Date(b.last_active_date).getTime() - new Date(a.last_active_date).getTime()
      )

      return {
        ...prev,
        messages: { ...prev.messages, [userId]: updatedMessages },
        conversations: updatedConversations,
      }
    })
  }, [])

  const handleMessageAck = useCallback(
    (targetUserId: number, createdAt: string) => {
      // Find the pending message by createdAt
      const pending = Array.from(pendingMessages.entries()).find(
        ([key]) => key === createdAt
      )

      if (!pending) return

      const [, { localId }] = pending

      setState((prev) => {
        const messages = prev.messages[targetUserId]
        if (!messages) return prev

        const updatedMessages = messages.map((msg) =>
          msg.localId === localId ? { ...msg, status: 'sent' as MessageStatus } : msg
        )

        return {
          ...prev,
          messages: { ...prev.messages, [targetUserId]: updatedMessages },
        }
      })

      // Remove from pending
      setPendingMessages((prev) => {
        const newPending = new Map(prev)
        newPending.delete(createdAt)
        return newPending
      })
    },
    [pendingMessages]
  )

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      chatWebSocket.disconnect()
      return
    }

    const token = getAccessToken()
    if (!token) return

    chatWebSocket.setCurrentUserId(user.id)
    chatWebSocket.setCallbacks({
      onConnectionStatusChange: (status) => {
        setState((prev) => ({ ...prev, connectionStatus: status }))
      },
      onNewMessage: handleNewMessage,
      onMessageAck: handleMessageAck,
      onError: (error) => {
        console.error('[Chat] WebSocket error:', error)
      },
    })

    chatWebSocket.connect(token)

    const handleTokenRefresh = () => {
      const newToken = getAccessToken()
      if (newToken) {
        console.log('[Chat] Token refreshed, reconnecting WebSocket...')
        chatWebSocket.disconnect()
        chatWebSocket.connect(newToken)
      }
    }

    window.addEventListener('auth:token-refreshed', handleTokenRefresh)

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefresh)
      chatWebSocket.disconnect()
    }
  }, [isAuthenticated, user?.id, handleNewMessage, handleMessageAck])

  const loadConversations = useCallback(async () => {
    if (state.isLoadingConversations) return

    setState((prev) => ({ ...prev, isLoadingConversations: true }))

    try {
      const conversations = await getConversations()
      setState((prev) => ({ ...prev, conversations, isLoadingConversations: false }))
    } catch (error) {
      console.error('[Chat] Failed to load conversations:', error)
      setState((prev) => ({ ...prev, isLoadingConversations: false }))
    }
  }, [state.isLoadingConversations])

  // Load conversations when authenticated or connected
  useEffect(() => {
    if (isAuthenticated) {
      loadConversations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, state.connectionStatus])

  const loadMessages = async (userId: number) => {
    setState((prev) => ({ ...prev, isLoadingMessages: true }))

    try {
      // Find conversation for this user
      const conversation = state.conversations.find((c) => c.user_id === userId)
      if (!conversation?.id) {
        // No conversation yet - just clear loading state
        setState((prev) => ({ ...prev, isLoadingMessages: false }))
        return
      }

      const result = await getConversationMessages(conversation.id)
      const messages: LocalMessage[] = result.messages.map((msg) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        message: msg.message,
        type: msg.type,
        created_at: msg.created_at,
        status: 'sent' as MessageStatus,
      }))

      setState((prev) => ({
        ...prev,
        messages: { ...prev.messages, [userId]: messages },
        isLoadingMessages: false,
      }))
    } catch (error) {
      console.error('[Chat] Failed to load messages:', error)
      setState((prev) => ({ ...prev, isLoadingMessages: false }))
    }
  }

  const sendMessage = (targetUserId: number, message: string, type: MessageType = 1) => {
    if (!user?.id) return

    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    const createdAt = chatWebSocket.sendPrivateMessage(targetUserId, message, type)

    if (!createdAt) {
      console.error('[Chat] Failed to send message: not connected')
      return
    }

    // Add message locally with pending status
    const localMessage: LocalMessage = {
      id: 0,
      localId,
      sender_id: user.id,
      message,
      type,
      status: 'pending',
      created_at: createdAt,
    }

    setState((prev) => {
      const existingMessages = prev.messages[targetUserId] || []
      const updatedMessages = [...existingMessages, localMessage]

      // Update conversation
      const existingConvIndex = prev.conversations.findIndex((c) => c.user_id === targetUserId)
      const updatedConversations = [...prev.conversations]

      if (existingConvIndex >= 0) {
        updatedConversations[existingConvIndex] = {
          ...updatedConversations[existingConvIndex],
          last_message: message,
          last_message_type: type,
          last_active_date: createdAt,
        }
      }

      // Sort conversations
      updatedConversations.sort(
        (a, b) =>
          new Date(b.last_active_date).getTime() - new Date(a.last_active_date).getTime()
      )

      return {
        ...prev,
        messages: { ...prev.messages, [targetUserId]: updatedMessages },
        conversations: updatedConversations,
      }
    })

    // Track pending message
    setPendingMessages((prev) => {
      const next = new Map(prev)
      next.set(createdAt, { localId, targetUserId })
      return next
    })

    // Set timeout for failed status
    setTimeout(() => {
      setPendingMessages((prev) => {
        if (!prev.has(createdAt)) return prev

        // Mark as failed
        setState((state) => {
          const messages = state.messages[targetUserId]
          if (!messages) return state

          const updatedMessages = messages.map((msg) =>
            msg.localId === localId ? { ...msg, status: 'failed' as MessageStatus } : msg
          )

          return {
            ...state,
            messages: { ...state.messages, [targetUserId]: updatedMessages },
          }
        })

        const next = new Map(prev)
        next.delete(createdAt)
        return next
      })
    }, 5000)
  }

  const setActiveChat = (userId: number | null) => {
    setState((prev) => ({ ...prev, activeUserId: userId }))

    if (userId) {
      // Clear unread count
      markAsRead(userId)
      // Load messages if not loaded
      if (!state.messages[userId]) {
        loadMessages(userId)
      }
    }
  }

  const getUnreadCount = (userId: number): number => {
    const conv = state.conversations.find((c) => c.user_id === userId)
    return conv?.unread_messages || 0
  }

  const getTotalUnreadCount = (): number => {
    return state.conversations.reduce((sum, conv) => sum + (conv.unread_messages || 0), 0)
  }

  const markAsRead = (userId: number) => {
    setState((prev) => {
      const convIndex = prev.conversations.findIndex((c) => c.user_id === userId)
      if (convIndex < 0) return prev

      const updatedConversations = [...prev.conversations]
      updatedConversations[convIndex] = {
        ...updatedConversations[convIndex],
        unread_messages: 0,
      }

      return { ...prev, conversations: updatedConversations }
    })
  }

  const deleteMessage = (userId: number, messageId: number | string) => {
    setState((prev) => {
      const messages = prev.messages[userId]
      if (!messages) return prev

      const updatedMessages = messages.filter(
        (msg) => msg.id !== messageId && msg.localId !== messageId
      )

      return {
        ...prev,
        messages: { ...prev.messages, [userId]: updatedMessages },
      }
    })
  }

  return (
    <ChatContext.Provider
      value={{
        ...state,
        sendMessage,
        setActiveChat,
        loadConversations,
        loadMessages,
        getUnreadCount,
        getTotalUnreadCount,
        markAsRead,
        deleteMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
