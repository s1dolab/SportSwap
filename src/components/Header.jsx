import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function Header() {
  const { user, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Fetch user profile picture
  useEffect(() => {
    if (user) {
      fetchProfilePicture()
    } else {
      setProfilePicture(null)
    }

    // Listen for profile updates
    const handleProfileUpdate = () => {
      if (user) {
        fetchProfilePicture()
      }
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [user])

  const fetchProfilePicture = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfilePicture(data?.profile_picture_url)
    } catch (error) {
      console.error('Error fetching profile picture:', error)
    }
  }

  // Fetch unread message count
  useEffect(() => {
    let channel

    if (user) {
      fetchUnreadCount()
      channel = subscribeToMessages()
    } else {
      setUnreadCount(0)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const fetchUnreadCount = async () => {
    try {
      // Get all conversations where user is buyer or seller
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

      if (convError) throw convError

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0)
        return
      }

      const conversationIds = conversations.map(c => c.id)

      // Count unread messages in those conversations
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .is('read_at', null)

      if (countError) throw countError
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh unread count on any message change
          fetchUnreadCount()
        }
      )
      .subscribe()

    return channel
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      setDropdownOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/browse?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const username = user?.user_metadata?.username || 'User'

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              SportSwap
            </div>
          </Link>

          {/* Middle: Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for sports equipment..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          {/* Right: Actions */}
          <div className="flex items-center space-x-6">
            <Link to="/favorites" className="text-gray-600 hover:text-blue-600 transition" title="Favorites">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            <Link to="/messages" className="relative text-gray-600 hover:text-blue-600 transition" title="Messages">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/listings/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Post an Ad
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                >
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt={username}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium">@{username}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      to={`/profile/${username}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard/listings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Manage My Listings
                    </Link>
                    <Link
                      to="/dashboard/history"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders / History
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-blue-600 hover:text-blue-700 font-medium transition"
              >
                Log In / Register
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Megamenu */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 h-12 text-sm">
            <Link to="/browse" className="text-gray-700 hover:text-blue-600 font-medium transition">
              All Categories
            </Link>
            <Link to="/browse?category=basketball" className="text-gray-600 hover:text-blue-600 transition">
              Basketball
            </Link>
            <Link to="/browse?category=soccer" className="text-gray-600 hover:text-blue-600 transition">
              Soccer
            </Link>
            <Link to="/browse?category=swimming" className="text-gray-600 hover:text-blue-600 transition">
              Swimming
            </Link>
            <Link to="/browse?category=tennis" className="text-gray-600 hover:text-blue-600 transition">
              Tennis
            </Link>
            <Link to="/browse?category=volleyball" className="text-gray-600 hover:text-blue-600 transition">
              Volleyball
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
