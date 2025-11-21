import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Toast from './Toast'
import { Heart, MessageSquare, ChevronDown, User, Search } from 'lucide-react'

function Header() {
  const { user, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profilePicture, setProfilePicture] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState(null)
  const dropdownRef = useRef(null)
  const megaMenuRef = useRef(null)
  const navigate = useNavigate()

  // Fetch user profile picture
  useEffect(() => {
    if (user) {
      fetchProfilePicture()
    } else {
      setProfilePicture(null)
    }

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
          fetchUnreadCount()
        }
      )
      .subscribe()

    return channel
  }

  // Subscribe to new offers
  useEffect(() => {
    let channel

    if (user) {
      channel = subscribeToOffers()
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [user])

  const subscribeToOffers = () => {
    const channel = supabase
      .channel(`offer-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'offers',
        },
        async (payload) => {
          const { data: listing, error } = await supabase
            .from('listings')
            .select('id, title, user_id')
            .eq('id', payload.new.listing_id)
            .eq('user_id', user.id)
            .single()

          if (!error && listing) {
            setToast({
              message: `New offer received on "${listing.title}"!`,
              type: 'success'
            })
          }
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
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target)) {
        setMegaMenuOpen(false)
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

  const categories = [
    { name: 'Basketball', slug: 'basketball', subcategories: ['Shoes', 'Jerseys', 'Balls', 'Accessories'] },
    { name: 'Soccer', slug: 'soccer', subcategories: ['Cleats', 'Jerseys', 'Balls', 'Shin Guards'] },
    { name: 'Swimming', slug: 'swimming', subcategories: ['Goggles', 'Swimsuits', 'Caps', 'Accessories'] },
    { name: 'Tennis', slug: 'tennis', subcategories: ['Rackets', 'Balls', 'Shoes', 'Apparel'] },
    { name: 'Volleyball', slug: 'volleyball', subcategories: ['Balls', 'Nets', 'Knee Pads', 'Shoes'] },
    { name: 'Other', slug: 'other', subcategories: ['General', 'Accessories', 'Training Equipment'] },
  ]

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Row 1: Logo, Search, Actions */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/images/logo/logo-wide.svg"
              alt="SportSwap"
              className="h-10 w-auto"
            />
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for sports equipment..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </form>

          {/* User Actions */}
          <div className="flex items-center space-x-6">
            <Link
              to="/favorites"
              className="text-gray-600 hover:text-blue-600 transition-colors"
              title="Favorites"
            >
              <Heart className="w-6 h-6" />
            </Link>

            <Link
              to="/messages"
              className="relative text-gray-600 hover:text-blue-600 transition-colors"
              title="Messages"
            >
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/listings/new"
              className="bg-blue-600 text-white px-6 py-2.5 rounded-full hover:bg-blue-700 transition font-medium shadow-md hover:shadow-lg"
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
                      className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <span className="font-medium">@{username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to={`/profile/${username}`}
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/dashboard/listings"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Manage My Listings
                    </Link>
                    <Link
                      to="/dashboard/history"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Orders / History
                    </Link>
                    <Link
                      to="/dashboard/settings"
                      className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-gray-50 transition"
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

      {/* Row 2: Navigation Links */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center space-x-8 h-14 text-sm font-medium">
            <div
              className="relative"
              ref={megaMenuRef}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition">
                <span>All Categories</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Mega Menu */}
              {megaMenuOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-screen max-w-4xl">
                  <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-8">
                    <div className="grid grid-cols-3 gap-8">
                      {categories.map((category) => (
                        <div key={category.slug}>
                          <Link
                            to={`/browse?category=${category.slug}`}
                            className="font-semibold text-gray-900 hover:text-blue-600 transition mb-3 block"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            {category.name}
                          </Link>
                          <ul className="space-y-2">
                            {category.subcategories.map((sub) => (
                              <li key={sub}>
                                <Link
                                  to={`/browse?category=${category.slug}`}
                                  className="text-sm text-gray-600 hover:text-blue-600 transition"
                                  onClick={() => setMegaMenuOpen(false)}
                                >
                                  {sub}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/browse" className="text-gray-700 hover:text-blue-600 transition">
              Browse All
            </Link>

            <Link to="/browse?sort=newest" className="text-gray-700 hover:text-blue-600 transition">
              New Arrivals
            </Link>

            <Link
              to="/#tech-stack"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault()
                  document.getElementById('tech-stack')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className="text-gray-700 hover:text-blue-600 transition"
            >
              About Project
            </Link>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </header>
  )
}

export default Header
