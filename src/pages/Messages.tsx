import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, User } from 'lucide-react'

// Stub data for demo
const stubConversations = [
  {
    id: 1,
    userName: 'John Doe',
    lastMessage: 'Is this car still available?',
    timestamp: '2 hours ago',
    unread: true,
    carTitle: 'BMW X5 2021',
  },
  {
    id: 2,
    userName: 'Jane Smith',
    lastMessage: 'Thank you for your interest',
    timestamp: 'Yesterday',
    unread: false,
    carTitle: 'Mercedes C-Class 2020',
  },
  {
    id: 3,
    userName: 'Mike Johnson',
    lastMessage: 'Can we schedule a test drive?',
    timestamp: '3 days ago',
    unread: false,
    carTitle: 'Audi A4 2022',
  },
]

export function Messages() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        {/* Notice */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Chat functionality is coming soon. This is a preview of the interface.
            </p>
          </CardContent>
        </Card>

        {/* Conversation list */}
        <div className="space-y-3">
          {stubConversations.map((conv) => (
            <Link key={conv.id} to={`/chat/${conv.id}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{conv.userName}</h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {conv.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.carTitle}</p>
                      <p className="text-sm mt-1 truncate">
                        {conv.unread ? (
                          <span className="font-medium text-foreground">{conv.lastMessage}</span>
                        ) : (
                          conv.lastMessage
                        )}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {conv.unread && (
                      <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {stubConversations.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-muted-foreground">
                When you contact sellers or receive inquiries, they will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
