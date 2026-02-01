import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageCircle, Search, Loader2, Filter } from 'lucide-react'
import { useChat } from '@/store/chat'
import { getImageUrl } from '@/api/client'
import { getPublicProfile } from '@/api/profile'
import { cn } from '@/lib/utils'
import { formatTime, getInitials, getMessagePreview } from '@/lib/chat-utils'
import type { ThirdPartyProfile } from '@/types'

export function Messages() {
  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    getUnreadCount,
  } = useChat()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'dealer' | 'logist' | 'broker' | 'service' | 'user'>('all')

  // Fetch profiles for all conversations to get roles
  const profileQueries = useQueries({
    queries: conversations.map((conv) => ({
      queryKey: ['publicProfile', conv.user_id],
      queryFn: () => getPublicProfile(conv.user_id),
      staleTime: 1000 * 60 * 60, // 1 hour
    })),
  })

  // Create a map of userId -> profile data
  const profilesMap = conversations.reduce((acc, conv, index) => {
    const profile = profileQueries[index].data
    if (profile) {
      acc[conv.user_id] = profile
    }
    return acc
  }, {} as Record<number, ThirdPartyProfile>)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.username.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (activeFilter === 'unread') {
      if (getUnreadCount(conv.user_id) === 0) return false
    }

    if (roleFilter !== 'all') {
      const profile = profilesMap[conv.user_id]
      const roleId = profile?.role_id || 1 // Default to user if unknown

      switch (roleFilter) {
        case 'dealer':
          return roleId === 2
        case 'logist':
          return roleId === 3
        case 'broker':
          return roleId === 4
        case 'service':
          return roleId === 5
        case 'user':
          return roleId === 1 || !roleId
        default:
          return true
      }
    }

    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 relative">
                <Filter className="h-4 w-4" />
                {(activeFilter !== 'all' || roleFilter !== 'all') && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border shadow-md" align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={activeFilter} onValueChange={(v) => setActiveFilter(v as 'all' | 'unread')}>
                <DropdownMenuRadioItem value="all">All Messages</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="unread">Unread Only</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | 'dealer' | 'logist' | 'broker' | 'service' | 'user')}>
                <DropdownMenuRadioItem value="all">All Roles</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dealer">Dealers</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="logist">Logistics</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="broker">Brokers</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="service">Services</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="user">Users</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Loading state */}
        {isLoadingConversations && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Conversation list */}
        {!isLoadingConversations && filteredConversations.length > 0 && (
          <div className="space-y-3">
            {filteredConversations.map((conv) => {
              const unreadCount = getUnreadCount(conv.user_id)
              const hasUnread = unreadCount > 0

              return (
                <Link key={conv.id || conv.user_id} to={`/chat/${conv.user_id}`}>
                  <Card
                    className={cn(
                      'hover:border-primary/50 transition-all duration-200',
                      hasUnread && 'border-primary/30 bg-primary/5 shadow-sm'
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                            {conv.avatar ? (
                              <img
                                src={getImageUrl(conv.avatar)}
                                alt={conv.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-muted-foreground">
                                {getInitials(conv.username)}
                              </span>
                            )}
                          </div>
                          {/* Online Status Indicator (Optional) */}
                          {/* <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" /> */}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn("font-semibold truncate", hasUnread ? "text-foreground" : "text-muted-foreground")}>
                              {conv.username}
                            </h3>
                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                              {formatTime(conv.last_active_date)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              hasUnread ? "font-medium text-foreground" : "text-muted-foreground"
                            )}>
                              {getMessagePreview(conv.last_message, conv.last_message_type)}
                            </p>
                            {unreadCount > 0 && (
                              <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center shrink-0">
                                {unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoadingConversations && filteredConversations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">No messages found</h3>
            <p className="text-sm">
              {searchQuery || activeFilter !== 'all' || roleFilter !== 'all'
                ? "Try adjusting your filters"
                : "Start a conversation to see messages here"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
