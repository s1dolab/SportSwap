import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import ProductCard from '../components/ProductCard'

function PublicProfilePage() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available') // 'available' or 'sold'
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setNotFound(false)

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setProfile(profileData)

      // Fetch user's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images(image_url, display_order),
          profiles:user_id(username, profile_picture_url)
        `)
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: false })

      if (listingsError) throw listingsError

      // Format listings with images
      const formattedListings = listingsData.map((listing) => ({
        ...listing,
        images: listing.listing_images.sort((a, b) => a.display_order - b.display_order),
      }))

      setListings(formattedListings)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter listings by status
  const availableListings = listings.filter(l => l.status === 'active')
  const soldListings = listings.filter(l => l.status === 'sold')

  // Calculate stats
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''

  const handleSendMessage = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    // Check if there are any active listings to message about
    if (availableListings.length === 0) {
      alert('This user has no active listings to message about.')
      return
    }

    try {
      // Use the first active listing as the conversation topic
      const listing = availableListings[0]

      // Check if a conversation already exists for this listing between buyer and seller
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', profile.id)

      if (fetchError) throw fetchError

      if (existingConversations && existingConversations.length > 0) {
        // Conversation exists, navigate to it
        navigate(`/messages?conversation=${existingConversations[0].id}`)
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: profile.id,
            last_message_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (createError) throw createError

        // Navigate to the new conversation
        navigate(`/messages?conversation=${newConversation.id}`)
      }
    } catch (error) {
      console.error('Error creating/finding conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  // Check if viewing own profile
  const isOwnProfile = user && profile && user.id === profile.id

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-12 text-center">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">User not found</h3>
            <p className="text-gray-600 mb-6">
              The profile you're looking for doesn't exist.
            </p>
            <Link
              to="/browse"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Cover Photo */}
        <div className="w-full aspect-[3/1] bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden rounded-xl mb-6">
          {profile.cover_photo_url && (
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-grow mt-4 md:mt-0">
              <h1 className="text-3xl font-bold text-gray-900">@{profile.username}</h1>
              {profile.bio && (
                <p className="text-gray-600 mt-2">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-4">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{availableListings.length}</span>
                  <span className="text-gray-600 ml-2">Active Listings</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900">{soldListings.length}</span>
                  <span className="text-gray-600 ml-2">Sold Items</span>
                </div>
                <div>
                  <span className="text-gray-600">Member since</span>
                  <span className="text-gray-900 font-semibold ml-2">{memberSince}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 mt-4 md:mt-0">
              {isOwnProfile ? (
                <Link
                  to="/dashboard/settings"
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium inline-block text-center"
                >
                  Edit Profile
                </Link>
              ) : (
                <button
                  onClick={handleSendMessage}
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Send Message
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="mt-8">
          {/* Tabs */}
          <div className="bg-white rounded-t-lg shadow border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`py-4 font-medium border-b-2 transition ${
                  activeTab === 'available'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Available ({availableListings.length})
              </button>
              <button
                onClick={() => setActiveTab('sold')}
                className={`py-4 font-medium border-b-2 transition ${
                  activeTab === 'sold'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Sold ({soldListings.length})
              </button>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="bg-white rounded-b-lg shadow p-6">
            {activeTab === 'available' ? (
              availableListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {availableListings.map((listing) => (
                    <ProductCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
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
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No active listings</h3>
                  <p className="text-gray-600">
                    This user doesn't have any active listings at the moment.
                  </p>
                </div>
              )
            ) : (
              soldListings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {soldListings.map((listing) => (
                    <ProductCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No sold items</h3>
                  <p className="text-gray-600">
                    This user hasn't sold any items yet.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProfilePage
