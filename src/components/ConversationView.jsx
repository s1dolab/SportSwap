import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Toast from './Toast'

function ConversationView({ conversation, onMessageSent }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    let channel

    if (conversation) {
      fetchMessages()
      markMessagesAsRead()
      channel = subscribeToMessages()
    }

    return () => {
      // Cleanup subscription
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [conversation?.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)

      // Fetch messages without sender profile data
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (messagesError) throw messagesError

      if (!messagesData || messagesData.length === 0) {
        setMessages([])
        setLoading(false)
        return
      }

      // Get all unique sender IDs
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))]

      // Fetch all sender profiles at once
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', senderIds)

      if (profilesError) throw profilesError

      // Create a map of profiles by ID
      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Attach sender profile to each message
      const messagesWithProfiles = messagesData.map(message => ({
        ...message,
        sender: { id: message.sender_id },
        sender_profile: profilesMap[message.sender_id]
      }))

      setMessages(messagesWithProfiles)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      // Mark all unread messages from the other user as read
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversation.id)
        .neq('sender_id', user.id)
        .is('read_at', null)

      if (error) throw error
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the new message
          const { data: messageData, error: messageError } = await supabase
            .from('messages')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (messageError || !messageData) return

          // Fetch sender profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, username, profile_picture_url')
            .eq('id', messageData.sender_id)
            .single()

          if (!profileError && profileData) {
            const messageWithProfile = {
              ...messageData,
              sender: { id: messageData.sender_id },
              sender_profile: profileData
            }

            setMessages(prev => [...prev, messageWithProfile])

            // Mark as read if not sent by current user
            if (messageData.sender_id !== user.id) {
              await supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', messageData.id)
            }
          }
        }
      )
      .subscribe()

    return channel
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim() || sending) return

    const messageContent = newMessage.trim()
    const tempId = `temp-${Date.now()}`

    try {
      setSending(true)

      // Fetch current user profile for optimistic update
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .eq('id', user.id)
        .single()

      // Optimistic UI: Add message immediately to local state
      const optimisticMessage = {
        id: tempId,
        conversation_id: conversation.id,
        sender_id: user.id,
        content: messageContent,
        created_at: new Date().toISOString(),
        read_at: null,
        sender: { id: user.id },
        sender_profile: profileData
      }

      setMessages(prev => [...prev, optimisticMessage])
      setNewMessage('')

      // Send to database
      const { data: newMessageData, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: messageContent,
        })
        .select()
        .single()

      if (error) throw error

      // Replace temp message with real one
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? {
          ...newMessageData,
          sender: { id: user.id },
          sender_profile: profileData
        } : msg
      ))

      // Notify parent to refresh conversations list
      if (onMessageSent) {
        onMessageSent()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setToast({ message: 'Failed to send message. Please try again.', type: 'error' })

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageContent) // Restore the message text
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Header with listing info */}
        <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          {/* Listing thumbnail */}
          {conversation.listing?.listing_images?.[0]?.image_url && (
            <Link to={`/listings/${conversation.listing?.id}`}>
              <img
                src={conversation.listing.listing_images[0].image_url}
                alt={conversation.listing?.title || 'Listing'}
                className="w-12 h-12 object-cover rounded border border-gray-200"
              />
            </Link>
          )}

          <div className="flex-grow min-w-0">
            {conversation.listing ? (
              <>
                <Link
                  to={`/listings/${conversation.listing.id}`}
                  className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block"
                >
                  {conversation.listing.title}
                </Link>
                <p className="text-sm text-gray-600">
                  {formatPrice(conversation.listing.price)}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-gray-500">Listing Unavailable</p>
            )}
          </div>

          {/* Other user profile link */}
          <Link
            to={`/profile/${conversation.otherUser?.username}`}
            className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded-lg transition"
          >
            {conversation.otherUser?.profile_picture_url ? (
              <img
                src={conversation.otherUser.profile_picture_url}
                alt={conversation.otherUser.username}
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <span className="text-sm font-medium text-gray-700">
              @{conversation.otherUser?.username}
            </span>
          </Link>
        </div>
      </div>

      {/* Messages area */}
      <div ref={messagesContainerRef} className="flex-grow overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.sender_id === user.id
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs md:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                    {/* Avatar */}
                    {showAvatar && !isOwnMessage ? (
                      message.sender_profile?.profile_picture_url ? (
                        <img
                          src={message.sender_profile.profile_picture_url}
                          alt={message.sender_profile.username}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8"></div>
                    )}

                    {/* Message bubble */}
                    <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
    </>
  )
}

export default ConversationView
