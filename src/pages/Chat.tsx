import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Send,
  User,
  Loader2,
  Check,
  CheckCheck,
  AlertCircle,
  Paperclip,
  X,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChat } from '@/store/chat'
import { useAuth } from '@/store/auth'
import { getImageUrl } from '@/api/client'
import { getCarById } from '@/api/cars'
import { getPublicProfile } from '@/api/profile'
import { uploadChatMediaV2 } from '@/api/chat'
import { CarCard } from '@/components/cars/CarCard'
import type { MessageStatus, MessageType, LocalMessage } from '@/types'

function ChatCarCard({ carId }: { carId: number }) {
  const { data: car, isLoading } = useQuery({
    queryKey: ['car', carId],
    queryFn: () => getCarById(carId),
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  if (isLoading) return <div className="h-48 w-64 bg-muted animate-pulse rounded-lg" />
  if (!car) return null

  return (
    <div className="w-64 sm:w-72">
      <CarCard car={car} variant="grid" showActions={false} />
    </div>
  )
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageStatusIcon({ status }: { status?: MessageStatus }) {
  switch (status) {
    case 'pending':
      return <Loader2 className="h-3 w-3 animate-spin" />
    case 'sent':
      return <CheckCheck className="h-3 w-3" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-red-500" />
    default:
      return <Check className="h-3 w-3" />
  }
}

export function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const {
    conversations,
    messages,
    connectionStatus,
    isLoadingMessages,
    sendMessage,
    setActiveChat,
    loadMessages,
    deleteMessage,
  } = useChat()

  const [inputMessage, setInputMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userId = id ? parseInt(id, 10) : null
  const chatMessages = userId ? messages[userId] || [] : []
  const conversation = conversations.find((c) => c.user_id === userId)

  // Fetch user profile for header info
  const { data: userProfile } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => (userId ? getPublicProfile(userId) : null),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hour
  })

  const isConnected = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting' || connectionStatus === 'reconnecting'

  // Determine display info
  const displayName = userProfile?.company_name || userProfile?.name || userProfile?.username || conversation?.username || `User ${userId}`
  const roleId = userProfile?.role_id
  const city = userProfile?.city?.name
  const avatar = userProfile?.avatar || conversation?.avatar
  const showAvatar = roleId && roleId >= 2 && avatar

  const getRoleLabel = (id?: number) => {
    switch (id) {
      case 2: return 'Dealer'
      case 3: return 'Logist'
      case 4: return 'Broker'
      case 5: return 'Service'
      default: return 'User'
    }
  }

  // Set active chat on mount, clear on unmount
  useEffect(() => {
    if (userId) {
      setActiveChat(userId)
      loadMessages(userId)
    }
    return () => {
      setActiveChat(null)
    }
  }, [userId, setActiveChat, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages.length])

  // Handle car context from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const carId = params.get('carId')
    if (carId && !inputMessage) {
      const link = `${window.location.origin}/cars/${carId}`
      setInputMessage(link)
    }
  }, [location.search, inputMessage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResend = (msg: LocalMessage) => {
    if (!userId || !isConnected) return
    
    // Remove failed message
    deleteMessage(userId, msg.localId || msg.id)
    
    // Send again
    if (msg.type === 2 || msg.type === 4) {
      // For now, we can only resend text or car links easily. 
      // Media resend would require keeping the file, which we don't persist.
      // But if it's type 4 and message is a URL, we can resend.
      sendMessage(userId, msg.message, msg.type)
    } else {
      sendMessage(userId, msg.message, 1)
    }
  }

  const handleSend = async () => {
    if ((!inputMessage.trim() && !selectedFile) || !userId || !isConnected) return

    if (selectedFile) {
      setIsUploading(true)
      try {
        const { url, type } = await uploadChatMediaV2(selectedFile)
        sendMessage(userId, url, type as MessageType)
        handleRemoveFile()
      } catch (error) {
        console.error('Upload failed:', error)
        alert('Failed to upload file. Please try again.')
      } finally {
        setIsUploading(false)
      }
      return
    }

    sendMessage(userId, inputMessage.trim())
    setInputMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Invalid chat</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {showAvatar ? (
                  <img
                    src={getImageUrl(avatar as string, 's')}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold truncate">
                    {displayName}
                  </h2>
                  {roleId && roleId >= 2 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                      {getRoleLabel(roleId)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {city && (
                    <>
                      <span>{city}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {/* Loading */}
          {isLoadingMessages && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Messages */}
          {!isLoadingMessages && chatMessages.length === 0 && (
            <div className="flex items-center justify-center py-12 text-center">
              <div>
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          )}

          {chatMessages.map((msg, index) => {
            const isMine = msg.sender_id === user?.id
            const showAvatar =
              !isMine &&
              (index === 0 || chatMessages[index - 1]?.sender_id !== msg.sender_id)

            return (
              <div
                key={msg.id || msg.localId || index}
                className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
              >
                {/* Avatar placeholder for alignment */}
                {!isMine && (
                  <div className="w-8 h-8 mr-2 shrink-0">
                    {showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {conversation?.avatar ? (
                          <img
                            src={getImageUrl(conversation.avatar, 's')}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2',
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border rounded-bl-md',
                    msg.status === 'failed' && 'opacity-70'
                  )}
                >
                  {/* Message content based on type */}
                  {msg.type === 2 ? (
                    <ChatCarCard carId={parseInt(msg.message)} />
                  ) : msg.type === 4 ? (
                    <img
                      src={getImageUrl(msg.message, 'm')}
                      alt="Shared image"
                      className="max-w-full rounded-lg"
                    />
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      {msg.message.match(/\/cars\/(\d+)/) && (
                        <div className="mt-2">
                          <ChatCarCard
                            carId={parseInt(msg.message.match(/\/cars\/(\d+)/)![1])}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time and status */}
                  <div
                    className={cn(
                      'flex items-center gap-1.5 mt-1',
                      isMine ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <span
                      className={cn(
                        'text-xs',
                        isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {formatMessageTime(msg.created_at)}
                    </span>
                    {isMine && (
                      <span
                        className={cn(
                          'text-primary-foreground/70',
                          msg.status === 'failed' && 'text-red-300'
                        )}
                      >
                        {msg.status === 'failed' ? (
                          <button
                            onClick={() => handleResend(msg)}
                            className="hover:text-white transition-colors p-0.5 rounded"
                            title="Resend message"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        ) : (
                          <MessageStatusIcon status={msg.status} />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        {selectedFile && (
          <div className="px-4 py-2 border-b border-border flex items-center gap-3 bg-muted/30">
            <div className="relative group">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="h-16 w-16 object-cover rounded-md border border-border" 
                />
              ) : (
                <div className="h-16 w-16 bg-background rounded-md border border-border flex items-center justify-center">
                  <Paperclip className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={handleRemoveFile}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
        )}
        <div className="container mx-auto px-4 py-3">
          {!isConnected && (
            <div className="mb-3 text-center">
              <span className="text-sm text-yellow-500">
                {isConnecting ? 'Connecting to chat...' : 'You are offline. Messages cannot be sent.'}
              </span>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isUploading}
            >
              <Paperclip className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Input
              placeholder={isConnected ? 'Type a message...' : 'Waiting for connection...'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || isUploading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={(!inputMessage.trim() && !selectedFile) || !isConnected || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
