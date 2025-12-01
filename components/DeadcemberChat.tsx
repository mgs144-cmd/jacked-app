'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'

export function DeadcemberChat() {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [profiles, setProfiles] = useState<Record<string, any>>({})

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages
  useEffect(() => {
    if (!user) return

    const loadMessages = async () => {
      setLoading(true)
      try {
        const { data: chatMessages, error } = await (supabase
          .from('deadcember_chat') as any)
          .select('*')
          .order('created_at', { ascending: true })
          .limit(100)

        if (error) throw error

        if (chatMessages) {
          setMessages(chatMessages)
          
          // Load profiles for all unique user IDs
          const userIds = [...new Set(chatMessages.map((m: any) => m.user_id))]
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, full_name')
            .in('id', userIds)

          if (profilesData) {
            const profilesMap: Record<string, any> = {}
            profilesData.forEach((profile: any) => {
              profilesMap[profile.id] = profile
            })
            setProfiles(profilesMap)
          }
        }
      } catch (err) {
        console.error('Error loading messages:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('deadcember-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deadcember_chat',
        },
        async (payload) => {
          const newMessage = payload.new as any
          setMessages((prev) => [...prev, newMessage])
          
          // Load profile if not already loaded - use functional update to avoid dependency
          setProfiles((prevProfiles) => {
            if (prevProfiles[newMessage.user_id]) {
              return prevProfiles // Already loaded
            }
            
            // Load profile asynchronously
            supabase
              .from('profiles')
              .select('id, username, avatar_url, full_name')
              .eq('id', newMessage.user_id)
              .single()
              .then(({ data: profile }: any) => {
                if (profile) {
                  setProfiles((current) => ({ ...current, [profile.id]: profile }))
                }
              })
            
            return prevProfiles
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || sending) return

    setSending(true)
    try {
      const { error } = await (supabase.from('deadcember_chat') as any).insert({
        user_id: user.id,
        message: newMessage.trim(),
      })

      if (error) throw error

      setNewMessage('')
    } catch (err: any) {
      console.error('Error sending message:', err)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-6 glow-red-sm">
      <div className="flex items-center space-x-3 mb-4">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h3 className="text-white font-black text-xl">Deadcember Group Chat</h3>
      </div>

      {/* Messages */}
      <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-4 mb-4 h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: any) => {
              const profile = profiles[msg.user_id]
              const isOwnMessage = msg.user_id === user.id

              return (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden flex-shrink-0">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'User'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-gray-300 font-bold text-xs">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">
                        {profile?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div
                      className={`inline-block rounded-xl px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-primary/20 text-white'
                          : 'bg-gray-800/60 text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center space-x-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="input-field flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="btn-primary px-4 py-2.5 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  )
}

