import { apiClient } from './client'
import type { ChatConversation, ChatMessage } from '@/types'

interface ConversationsResponse {
  data: ChatConversation[]
}

interface MessagesResponse {
  data: {
    conversation_id: number
    messages: ChatMessage[]
  }
}

// Get all conversations for the current user
export async function getConversations(): Promise<ChatConversation[]> {
  const response = await apiClient.get<ConversationsResponse>('/ws/conversations')
  return response.data.data || []
}

// Get messages for a specific conversation
export async function getConversationMessages(
  conversationId: number,
  lastId?: number
): Promise<{ conversationId: number; messages: ChatMessage[] }> {
  const params = lastId ? { last_id: lastId } : {}
  const response = await apiClient.get<MessagesResponse>(
    `/ws/conversations/${conversationId}/messages`,
    { params }
  )
  return {
    conversationId: response.data.data?.conversation_id || conversationId,
    messages: response.data.data?.messages || [],
  }
}

// Upload chat media
export async function uploadChatMediaV2(file: File): Promise<{ url: string; type: number }> {
  console.log('Uploading chat media V2...', file.name)
  const formData = new FormData()
  
  // Determine type based on file
  let type = 4 // Image default
  if (file.type.startsWith('video/')) {
    type = 3
  }
  
  // Append file with specific name if needed, similar to other uploads
  formData.append('file', file)
  
  // Try /api/v1/chat/upload endpoint
  const response = await apiClient.post<{ data: { url: string } }>('/api/v1/chat/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  
  return {
    url: response.data.data.url,
    type,
  }
}
