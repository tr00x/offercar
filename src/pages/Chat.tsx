import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Send, User, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stub messages for demo
const stubMessages = [
  {
    id: 1,
    text: 'Hi! Is this car still available?',
    isMine: false,
    timestamp: '10:30 AM',
  },
  {
    id: 2,
    text: 'Yes, it is! Would you like to schedule a viewing?',
    isMine: true,
    timestamp: '10:32 AM',
  },
  {
    id: 3,
    text: 'That would be great. Is tomorrow afternoon okay?',
    isMine: false,
    timestamp: '10:35 AM',
  },
  {
    id: 4,
    text: 'Tomorrow at 3 PM works for me. I\'ll send you the address.',
    isMine: true,
    timestamp: '10:36 AM',
  },
]

const stubCar = {
  id: 1,
  title: 'BMW X5 2021',
  price: 45000,
  image: '/placeholder-car.svg',
}

export function Chat() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(stubMessages)

  const handleSend = () => {
    if (!message.trim()) return

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: message,
        isMine: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem-env(safe-area-inset-bottom))] md:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/messages">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">John Doe</h2>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Car info banner */}
      <div className="bg-secondary/50 border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <Link to={`/cars/${stubCar.id}`} className="flex items-center gap-3 hover:opacity-80">
            <div className="w-12 h-9 rounded bg-muted overflow-hidden">
              <img src={stubCar.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{stubCar.title}</p>
              <p className="text-xs text-primary">${stubCar.price.toLocaleString()}</p>
            </div>
            <Car className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Notice */}
      <div className="bg-primary/5 border-b border-primary/20">
        <div className="container mx-auto px-4 py-2">
          <p className="text-xs text-center text-muted-foreground">
            Chat functionality is coming soon. This is a preview of the interface.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  msg.isMine
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border rounded-bl-md'
                )}
              >
                <p className="text-sm">{msg.text}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    msg.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
