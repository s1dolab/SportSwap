import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import MakeOfferModal from '../components/MakeOfferModal'

function ListingDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [images, setImages] = useState([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [makeOfferModalOpen, setMakeOfferModalOpen] = useState(false)

  useEffect(() => {
    fetchListing()
  }, [id])

  useEffect(() => {
    if (user && listing) {
      checkIfFavorited()
    }
  }, [user, listing])

  const fetchListing = async () => {
    try {
      // Fetch listing with user profile info
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:user_id(username, profile_picture_url)
        `)
        .eq('id', id)
        .single()

      if (listingError) throw listingError

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('listing_images')
        .select('*')
        .eq('listing_id', id)
        .order('display_order')

      if (imagesError) throw imagesError

      setListing(listingData)
      setImages(imagesData)
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkIfFavorited = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setIsFavorited(true)
      }
    } catch (error) {
      // No favorite found, keep as false
      console.error('Error checking favorite:', error)
    }
  }

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', id)

        if (error) throw error
        setIsFavorited(false)
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            listing_id: id,
          })

        if (error) throw error
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleMessageSeller = async () => {
    if (!user) {
      navigate('/auth')
      return
    }

    try {
      // Check if a conversation already exists for this listing between buyer and seller
      const { data: existingConversations, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.user_id)

      if (fetchError) throw fetchError

      if (existingConversations && existingConversations.length > 0) {
        // Conversation exists, navigate to it
        navigate(`/messages?conversation=${existingConversations[0].id}`)
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversations')
          .insert({
            listing_id: id,
            buyer_id: user.id,
            seller_id: listing.user_id,
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

  const handleMakeOffer = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    setMakeOfferModalOpen(true)
  }

  const handleOfferSubmitted = () => {
    // Show success message
    alert('Offer submitted successfully! The seller will be notified.')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing not found</h2>
          <Link to="/browse" className="text-blue-600 hover:text-blue-700">
            Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(listing.price)

  const formattedRetailPrice = listing.retail_price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(listing.retail_price)
    : null

  const savings = listing.retail_price
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(listing.retail_price - listing.price)
    : null

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/browse?category=${listing.category}`} className="hover:text-blue-600 capitalize">
            {listing.category}
          </Link>
          {listing.subcategory && (
            <>
              <span className="mx-2">/</span>
              <Link
                to={`/browse?category=${listing.category}`}
                className="hover:text-blue-600 capitalize"
              >
                {listing.subcategory.replace('_', ' ')}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
              <div className="aspect-square relative">
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[selectedImageIndex].image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() =>
                            setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)
                          }
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg hover:bg-white transition flex items-center justify-center"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full shadow-lg hover:bg-white transition flex items-center justify-center"
                        >
                          ›
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Previews */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIndex === index ? 'border-blue-600' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={image.image_url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information & Actions */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              {/* Title & Price */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>

              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900 mb-2">{formattedPrice}</div>
                {formattedRetailPrice && (
                  <div className="text-gray-600">
                    Retail: <span className="line-through">{formattedRetailPrice}</span>
                    <span className="text-green-600 font-semibold ml-2">Save {savings}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                {user && listing.user_id === user.id ? (
                  // Owner sees Edit Listing button
                  <Link
                    to="/dashboard/listings"
                    className="w-full block bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium text-center"
                  >
                    Edit Listing
                  </Link>
                ) : (
                  // Buyers see Make Offer and Favorite buttons
                  <>
                    <button
                      onClick={handleMakeOffer}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Make Offer
                    </button>
                    <button
                      onClick={handleFavoriteClick}
                      className={`w-full py-3 rounded-lg transition font-medium border-2 ${
                        isFavorited
                          ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
                    </button>
                  </>
                )}
              </div>

              {/* Seller Information */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
                <Link
                  to={`/profile/${listing.profiles?.username || 'user'}`}
                  className="flex items-center space-x-3 mb-4 hover:bg-gray-50 p-2 rounded-lg transition"
                >
                  {listing.profiles?.profile_picture_url ? (
                    <img
                      src={listing.profiles.profile_picture_url}
                      alt={listing.profiles.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-blue-600 hover:text-blue-700">
                      @{listing.profiles?.username || 'user'}
                    </div>
                    <div className="text-sm text-gray-600">View seller profile</div>
                  </div>
                </Link>

                {/* Only show Message Seller if not the owner */}
                {(!user || listing.user_id !== user.id) && (
                  <button
                    onClick={handleMessageSeller}
                    className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition font-medium"
                  >
                    Message Seller
                  </button>
                )}
              </div>

              {/* Specifications */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{listing.category}</span>
                  </div>
                  {listing.subcategory && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subcategory:</span>
                      <span className="font-medium capitalize">{listing.subcategory.replace('_', ' ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listing Type:</span>
                    <span className="font-medium capitalize">
                      {listing.listing_type === 'sale' ? 'For Sale' :
                       listing.listing_type === 'rent' ? 'For Rent' : 'For Exchange'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span className="font-medium">
                      {listing.condition === 'new' ? 'New (with tags)' :
                       listing.condition === 'like_new' ? 'Like New' :
                       listing.condition === 'good' ? 'Good (minor wear)' :
                       'Used (visible wear)'}
                    </span>
                  </div>
                  {listing.brand && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{listing.brand}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{listing.city}, Latvia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{listing.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{listing.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Make Offer Modal */}
      {listing && (
        <MakeOfferModal
          listing={listing}
          isOpen={makeOfferModalOpen}
          onClose={() => setMakeOfferModalOpen(false)}
          onOfferSubmitted={handleOfferSubmitted}
        />
      )}
    </div>
  )
}

export default ListingDetailPage
