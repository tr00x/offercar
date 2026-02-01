import type { ChatMessage, ChatUser, WSMessage, MessageType } from '@/types'

// Use proxy in dev mode to handle CORS, direct connection in prod
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const WS_URL = import.meta.env.DEV 
  ? `${protocol}//${window.location.host}/api/ws`
  : 'wss://api.mashynbazar.com/ws'

const PING_INTERVAL = 25000 // 25 seconds
const RECONNECT_DELAY = 3000 // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 10

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface ChatWebSocketCallbacks {
  onConnectionStatusChange?: (status: ConnectionStatus) => void
  onNewMessage?: (chatUser: ChatUser) => void
  onMessageAck?: (targetUserId: number, createdAt: string) => void
  onError?: (error: string) => void
}

class ChatWebSocketService {
  private ws: WebSocket | null = null
  private token: string = ''
  private currentUserId: number | null = null
  private callbacks: ChatWebSocketCallbacks = {}
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private shouldReconnect = true
  private connectionStatus: ConnectionStatus = 'disconnected'

  setCallbacks(callbacks: ChatWebSocketCallbacks) {
    this.callbacks = callbacks
  }

  setCurrentUserId(userId: number | null) {
    this.currentUserId = userId
  }

  getCurrentUserId() {
    return this.currentUserId
  }

  getConnectionStatus() {
    return this.connectionStatus
  }

  private updateConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status
    this.callbacks.onConnectionStatusChange?.(status)
  }

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WS] Already connected or connecting')
      return
    }

    this.token = token
    this.shouldReconnect = true
    this.updateConnectionStatus('connecting')

    const url = `${WS_URL}?token=${encodeURIComponent(token)}`
    console.log('[WS] Connecting to:', WS_URL)

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('[WS] Connected successfully')
        this.reconnectAttempts = 0
        this.updateConnectionStatus('connected')
        this.startPingInterval()
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onerror = () => {
        // WebSocket errors don't provide much detail for security reasons
        console.error('[WS] Error event received')
        // Don't call error callback here - wait for onclose which has more info
      }

      this.ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event.code, event.reason, event.wasClean)
        this.stopPingInterval()

        // Provide meaningful error messages based on close code
        if (event.code === 1006) {
          // Abnormal closure - could be network issue, CORS, or server unavailable
          console.error('[WS] Abnormal closure - check network/CORS/server')
          this.callbacks.onError?.('Connection lost unexpectedly')
        } else if (event.code === 1015) {
          console.error('[WS] TLS handshake failed')
          this.callbacks.onError?.('Secure connection failed')
        }

        this.updateConnectionStatus('disconnected')

        if (this.shouldReconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('[WS] Failed to create WebSocket:', error)
      this.updateConnectionStatus('disconnected')
      this.callbacks.onError?.('Failed to connect')
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.stopPingInterval()
    this.clearReconnectTimer()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.updateConnectionStatus('disconnected')
  }

  private scheduleReconnect() {
    this.clearReconnectTimer()
    this.reconnectAttempts++
    this.updateConnectionStatus('reconnecting')

    console.log(`[WS] Scheduling reconnect attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`)

    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect && this.token) {
        this.connect(this.token)
      }
    }, RECONNECT_DELAY)
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private startPingInterval() {
    this.stopPingInterval()
    this.pingInterval = setInterval(() => {
      this.sendPing()
    }, PING_INTERVAL)
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private sendPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const pingMessage: WSMessage = {
        event: 'ping',
        target_user_id: this.currentUserId || 0,
        data: '',
      }
      this.ws.send(JSON.stringify(pingMessage))
    }
  }

  private handleMessage(data: string) {
    try {
      const message: WSMessage = JSON.parse(data)

      switch (message.event) {
        case 'ping':
          // Server is checking if we're online - respond with pong
          this.sendPing()
          break

        case 'connected':
        case 'new_message':
          this.handleNewMessage(message.data)
          break

        case 'ack':
          this.handleAck(message)
          break

        case 'error':
          console.error('[WS] Server error:', message.data)
          this.callbacks.onError?.(String(message.data) || 'Unknown error')
          break

        default:
          console.log('[WS] Unknown event:', message.event)
      }
    } catch (error) {
      console.error('[WS] Failed to parse message:', error)
    }
  }

  private handleNewMessage(data: unknown) {
    if (!Array.isArray(data) || data.length === 0) return

    const userData = data[0] as {
      id: number
      username: string
      avatar?: string
      last_active_date?: string
      messages?: ChatMessage[]
    }

    if (!userData) return

    // Filter out system messages and messages from self
    const messages = (userData.messages || []).filter(
      (msg) => msg.sender_id !== 0 && msg.sender_id !== this.currentUserId
    )

    if (messages.length === 0) return

    const chatUser: ChatUser = {
      id: userData.id,
      username: userData.username,
      avatar: userData.avatar,
      last_active_date: userData.last_active_date,
      messages,
    }

    this.callbacks.onNewMessage?.(chatUser)

    // Send acknowledgment for received messages
    for (const msg of messages) {
      this.sendAck(userData.id, msg.created_at)
    }
  }

  private handleAck(message: WSMessage) {
    const targetUserId = message.target_user_id
    const createdAt = message.data as string

    if (targetUserId && createdAt) {
      this.callbacks.onMessageAck?.(targetUserId, createdAt)
    }
  }

  private sendAck(targetUserId: number, createdAt: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return

    const ackMessage: WSMessage = {
      event: 'ack',
      target_user_id: targetUserId,
      data: createdAt,
    }
    this.ws.send(JSON.stringify(ackMessage))
  }

  sendPrivateMessage(
    targetUserId: number,
    message: string,
    type: MessageType = 1
  ): string | null {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('[WS] Cannot send message: not connected')
      return null
    }

    const now = new Date()
    const createdAt = this.formatDateForBackend(now)

    const wsMessage: WSMessage = {
      event: 'private_message',
      target_user_id: targetUserId,
      data: {
        message,
        type,
        time: createdAt,
        target_user_id: targetUserId,
      },
    }

    this.ws.send(JSON.stringify(wsMessage))
    return createdAt
  }

  private formatDateForBackend(date: Date): string {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    const seconds = String(date.getUTCSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Singleton instance
export const chatWebSocket = new ChatWebSocketService()
