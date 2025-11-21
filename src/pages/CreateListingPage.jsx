import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function CreateListingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id: listingId } = useParams()
  const isEditMode = !!listingId

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [listingType, setListingType] = useState('sale')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('good')
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [retailPrice, setRetailPrice] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [city, setCity] = useState('')
  const [photos, setPhotos] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imagesToDelete, setImagesToDelete] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingListing, setFetchingListing] = useState(false)
  const [error, setError] = useState('')

  // Categories and subcategories
  const categories = {
    basketball: ['Shoes', 'Jerseys', 'Balls', 'Accessories'],
    soccer: ['Cleats', 'Jerseys', 'Balls', 'Shin Guards'],
    swimming: ['Goggles', 'Swimsuits', 'Caps', 'Accessories'],
    tennis: ['Rackets', 'Balls', 'Shoes', 'Apparel'],
    volleyball: ['Balls', 'Nets', 'Knee Pads', 'Shoes'],
    other: ['General', 'Accessories', 'Training Equipment'],
  }

  // Fetch listing data if in edit mode
  useEffect(() => {
    if (isEditMode && user) {
      fetchListingData()
    }
  }, [listingId, user])

  const fetchListingData = async () => {
    try {
      setFetchingListing(true)
      setError('')

      // Fetch listing with images
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select(`
          *,
          listing_images(id, image_url, display_order)
        `)
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      // Check if user owns this listing
      if (listing.user_id !== user.id) {
        setError('You do not have permission to edit this listing')
        navigate('/dashboard/listings')
        return
      }

      // Pre-fill form with existing data
      setTitle(listing.title || '')
      setCategory(listing.category || '')
      setSubcategory(listing.subcategory || '')
      setListingType(listing.listing_type || 'sale')
      setDescription(listing.description || '')
      setCondition(listing.condition || 'good')
      setBrand(listing.brand || '')
      setPrice(listing.price?.toString() || '')
      setRetailPrice(listing.retail_price?.toString() || '')
      setQuantity(listing.quantity || 1)
      setCity(listing.city || '')

      // Sort images by display_order and set existing images
      const sortedImages = (listing.listing_images || []).sort((a, b) => a.display_order - b.display_order)
      setExistingImages(sortedImages)
    } catch (error) {
      console.error('Error fetching listing:', error)
      setError('Failed to load listing data')
    } finally {
      setFetchingListing(false)
    }
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setSubcategory('') // Reset subcategory when category changes
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)

    // Limit to 5 photos total (existing + new)
    const totalPhotos = existingImages.length - imagesToDelete.length + photos.length + files.length
    if (totalPhotos > 5) {
      setError('Maximum 5 photos allowed')
      return
    }

    // Create preview URLs
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))

    setPhotos([...photos, ...newPhotos])
    setError('')
  }

  const removePhoto = (index) => {
    const newPhotos = [...photos]
    URL.revokeObjectURL(newPhotos[index].preview) // Clean up memory
    newPhotos.splice(index, 1)
    setPhotos(newPhotos)
  }

  const removeExistingImage = (imageId) => {
    setImagesToDelete([...imagesToDelete, imageId])
  }

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!title || !category || !listingType || !condition || !price || !city) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Check if we have at least one photo (existing or new)
      const remainingExistingImages = existingImages.length - imagesToDelete.length
      if (remainingExistingImages + photos.length === 0) {
        setError('Please add at least one photo')
        setLoading(false)
        return
      }

      if (parseFloat(price) <= 0) {
        setError('Price must be greater than 0')
        setLoading(false)
        return
      }

      let targetListingId = listingId

      // 1. Create or Update listing in database
      if (isEditMode) {
        // UPDATE existing listing
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            title,
            description,
            category,
            subcategory,
            listing_type: listingType,
            condition,
            brand,
            price: parseFloat(price),
            retail_price: retailPrice ? parseFloat(retailPrice) : null,
            quantity: parseInt(quantity),
            city,
            updated_at: new Date().toISOString(),
          })
          .eq('id', listingId)

        if (updateError) throw updateError
      } else {
        // INSERT new listing
        const { data: listing, error: listingError } = await supabase
          .from('listings')
          .insert({
            user_id: user.id,
            title,
            description,
            category,
            subcategory,
            listing_type: listingType,
            condition,
            brand,
            price: parseFloat(price),
            retail_price: retailPrice ? parseFloat(retailPrice) : null,
            quantity: parseInt(quantity),
            city,
            status: isDraft ? 'draft' : 'active',
          })
          .select()
          .single()

        if (listingError) throw listingError
        targetListingId = listing.id
      }

      // 2. Delete marked images if in edit mode
      if (isEditMode && imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('listing_images')
          .delete()
          .in('id', imagesToDelete)

        if (deleteError) throw deleteError
      }

      // 3. Upload new photos to storage
      if (photos.length > 0) {
        const uploadedImages = []
        const startingIndex = remainingExistingImages

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i]
          const fileExt = photo.file.name.split('.').pop()
          const fileName = `${targetListingId}/${Date.now()}-${i}.${fileExt}`

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, photo.file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName)

          uploadedImages.push({
            listing_id: targetListingId,
            image_url: urlData.publicUrl,
            display_order: startingIndex + i,
          })
        }

        // 4. Save new image URLs to database
        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(uploadedImages)

        if (imagesError) throw imagesError
      }

      // Success! Navigate to the listing
      navigate(`/listings/${targetListingId}`)
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} listing:`, err)
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`)
    } finally {
      setLoading(false)
    }
  }

  if (fetchingListing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading listing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">{isEditMode ? 'Edit Listing' : 'Create New Listing'}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-8">
          {/* Section 1: What are you listing? */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">What are you listing?</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Used Nike Mercurial Soccer Cleats - Size 11"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="basketball">Basketball</option>
                    <option value="soccer">Soccer</option>
                    <option value="swimming">Swimming</option>
                    <option value="tennis">Tennis</option>
                    <option value="volleyball">Volleyball</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!category}
                  >
                    <option value="">Select subcategory</option>
                    {category && categories[category].map((sub) => (
                      <option key={sub} value={sub.toLowerCase().replace(' ', '_')}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Listing Type <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="sale"
                      checked={listingType === 'sale'}
                      onChange={(e) => setListingType(e.target.value)}
                      className="mr-2"
                    />
                    For Sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="rent"
                      checked={listingType === 'rent'}
                      onChange={(e) => setListingType(e.target.value)}
                      className="mr-2"
                    />
                    For Rent
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="exchange"
                      checked={listingType === 'exchange'}
                      onChange={(e) => setListingType(e.target.value)}
                      className="mr-2"
                    />
                    For Exchange
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tell us about the item */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Tell us about the item</h2>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Blue Nike Vapor cleats Size 10. Worn for 5 games. A few scuffs from normal use..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="new">New (with tags)</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good (minor wear)</option>
                    <option value="used">Used (visible wear)</option>
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Nike, Adidas, Wilson"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Photos */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Photos <span className="text-red-500">*</span></h2>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-gray-600 font-medium">Drag & drop photos here, or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">Maximum 5 photos. First photo will be the cover.</p>
                </div>
              </label>
            </div>

            {/* Photo Previews - Existing and New */}
            {(existingImages.length > 0 || photos.length > 0) && (
              <div className="grid grid-cols-5 gap-4 mt-4">
                {/* Existing Images */}
                {existingImages.map((image, index) => {
                  if (imagesToDelete.includes(image.id)) return null

                  return (
                    <div key={`existing-${image.id}`} className="relative aspect-square">
                      <img
                        src={image.image_url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* New Photos */}
                {photos.map((photo, index) => {
                  const displayIndex = existingImages.length - imagesToDelete.length + index
                  return (
                    <div key={`new-${index}`} className="relative aspect-square">
                      <img
                        src={photo.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                      {displayIndex === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 4: Set your terms */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Set your terms</h2>

            <div className="space-y-4">
              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Listing Price (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retail Price (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value="Latvia"
                    disabled
                    className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select City</option>
                    <option value="Rīga">Rīga</option>
                    <option value="Daugavpils">Daugavpils</option>
                    <option value="Liepāja">Liepāja</option>
                    <option value="Jelgava">Jelgava</option>
                    <option value="Jūrmala">Jūrmala</option>
                    <option value="Ventspils">Ventspils</option>
                    <option value="Rēzekne">Rēzekne</option>
                    <option value="Valmiera">Valmiera</option>
                    <option value="Jēkabpils">Jēkabpils</option>
                    <option value="Ogre">Ogre</option>
                    <option value="Salaspils">Salaspils</option>
                    <option value="Tukums">Tukums</option>
                    <option value="Cēsis">Cēsis</option>
                    <option value="Sigulda">Sigulda</option>
                    <option value="Olaine">Olaine</option>
                    <option value="Kuldīga">Kuldīga</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (isEditMode ? 'Updating...' : 'Publishing...') : (isEditMode ? 'Update Listing' : 'Post Listing')}
            </button>
            {!isEditMode && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
              >
                Save as Draft
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateListingPage
