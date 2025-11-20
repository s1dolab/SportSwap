import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ConversationView from '../components/ConversationView'

function MessagesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversationId, setSelectedConversationId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let channel

    if (!user) {
      navigate('/auth')
      return
    }

    fetchConversations()
    channel = subscribeToConversationUpdates()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  useEffect(() => {
    // Check if there's a conversation ID in URL params after conversations are loaded
    const conversationId = searchParams.get('conversation')
    if (conversationId && conversations.length > 0) {
      // Verify the conversation exists in the list
      const conversationExists = conversations.some(c => c.id === conversationId)
      if (conversationExists) {
        setSelectedConversationId(conversationId)
      }
    }
  }, [searchParams, conversations])

  const fetchConversations = async (options = {}) => {
    const { silent = false, allowAutoSelect = true } = options

    try {
      // Only show loading spinner on initial load, not background updates
      if (!silent) {
        setLoading(true)
      }

      // Fetch conversations with messages
      const { data: conversationsData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          messages(content, created_at, sender_id, read_at)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (convError) throw convError

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([])
        if (!silent) {
          setLoading(false)
        }
        return
      }

      // Get all unique user IDs and listing IDs
      const userIds = [...new Set(conversationsData.flatMap(c => [c.buyer_id, c.seller_id]))]
      const listingIds = [...new Set(conversationsData.map(c => c.listing_id).filter(Boolean))]

      // Fetch all profiles at once
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // Create a map of profiles by ID for quick lookup
      const profilesMap = {}
      profilesData?.forEach(profile => {
        profilesMap[profile.id] = profile
      })

      // Fetch all listings at once
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, title, price')
        .in('id', listingIds)

      if (listingsError) throw listingsError

      // Create a map of listings by ID
      const listingsMap = {}
      listingsData?.forEach(listing => {
        listingsMap[listing.id] = listing
      })

      // Fetch listing images for all listings
      const { data: imagesData } = await supabase
        .from('listing_images')
        .select('listing_id, image_url, display_order')
        .in('listing_id', listingIds)
        .order('display_order')

      // Group images by listing_id
      const imagesMap = {}
      imagesData?.forEach(img => {
        if (!imagesMap[img.listing_id]) {
          imagesMap[img.listing_id] = []
        }
        imagesMap[img.listing_id].push(img)
      })

      // Format conversations with the other user's info and last message
      const formattedConversations = conversationsData.map((conv) => {
        const isUserBuyer = conv.buyer_id === user.id
        const otherUserId = isUserBuyer ? conv.seller_id : conv.buyer_id
        const otherUser = profilesMap[otherUserId]
        const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null

        // Get listing with images
        const listing = conv.listing_id && listingsMap[conv.listing_id] ? {
          ...listingsMap[conv.listing_id],
          listing_images: imagesMap[conv.listing_id] || []
        } : null

        // Count unread messages
        const unreadCount = conv.messages?.filter(
          msg => msg.sender_id !== user.id && !msg.read_at
        ).length || 0

        return {
          ...conv,
          listing,
          otherUser,
          lastMessage,
          unreadCount,
        }
      })

      setConversations(formattedConversations)

      // Use functional state update to avoid stale closure issues
      setSelectedConversationId(prevSelectedId => {
        // If we already have a selection, preserve it
        if (prevSelectedId) {
          const stillExists = formattedConversations.some(c => c.id === prevSelectedId)
          // Keep the selection if it still exists, otherwise clear it
          return stillExists ? prevSelectedId : null
        }

        // Only auto-select on initial load, never during background updates
        if (!allowAutoSelect) {
          return prevSelectedId
        }

        // Auto-select logic for initial page load
        const conversationIdFromUrl = searchParams.get('conversation')
        if (conversationIdFromUrl && formattedConversations.length > 0) {
          // If URL has conversation ID, select it if it exists
          const conversationExists = formattedConversations.some(c => c.id === conversationIdFromUrl)
          if (conversationExists) {
            return conversationIdFromUrl
          }
        }

        // Auto-select first conversation only if no selection and no URL param
        if (formattedConversations.length > 0) {
          return formattedConversations[0].id
        }

        return null
      })
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      // Only clear loading state if it was set
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const subscribeToConversationUpdates = () => {
    const channel = supabase
      .channel(`conversation-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Refresh conversations list silently (no loading spinner)
          // and preserve current selection (no auto-select)
          fetchConversations({ silent: true, allowAutoSelect: false })
        }
      )
      .subscribe()

    return channel
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>

        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="grid grid-cols-12 h-full">
            {/* Conversations List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-200 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-gray-600 text-sm">
                    Start a conversation by messaging a seller on a listing
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversationId(conversation.id)}
                    className={`w-full p-4 border-b border-gray-200 hover:bg-gray-50 transition text-left ${
                      selectedConversationId === conversation.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Other user's profile picture */}
                      {conversation.otherUser?.profile_picture_url ? (
                        <img
                          src={conversation.otherUser.profile_picture_url}
                          alt={conversation.otherUser.username}
                          className="w-12 h-12 aspect-square rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            @{conversation.otherUser?.username || 'User'}
                          </span>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatTime(conversation.lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">
                          {conversation.listing?.title}
                        </p>
                        {conversation.lastMessage && (
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                          }`}>
                            {conversation.lastMessage.sender_id === user.id ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {conversation.unreadCount > 0 && (
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Conversation View */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {selectedConversation ? (
                <ConversationView
                  conversation={selectedConversation}
                  onMessageSent={() => fetchConversations({ silent: true, allowAutoSelect: false })}
                />
              ) : (
                <div className="flex-grow flex items-center justify-center p-8">
                  <div className="text-center">
                    <svg
                      className="w-20 h-20 text-gray-300 mx-auto mb-4"
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
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
