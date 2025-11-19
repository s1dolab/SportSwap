import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function AccountSettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    profile_picture_url: '',
    cover_photo_url: '',
  })

  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState(null)
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          username: data.username || '',
          bio: data.bio || '',
          profile_picture_url: data.profile_picture_url || '',
          cover_photo_url: data.cover_photo_url || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile data' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setIsDirty(true)
  }

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    try {
      setUploadingProfilePic(true)
      setMessage({ type: '', text: '' })

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, profile_picture_url: publicUrl }))
      setProfilePictureFile(file)
      setIsDirty(true)
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setMessage({ type: 'error', text: 'Failed to upload profile picture' })
    } finally {
      setUploadingProfilePic(false)
    }
  }

  const handleCoverPhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    try {
      setUploadingCover(true)
      setMessage({ type: '', text: '' })

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/cover-${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, cover_photo_url: publicUrl }))
      setCoverPhotoFile(file)
      setIsDirty(true)
    } catch (error) {
      console.error('Error uploading cover photo:', error)
      setMessage({ type: 'error', text: 'Failed to upload cover photo' })
    } finally {
      setUploadingCover(false)
    }
  }

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({ ...prev, profile_picture_url: '' }))
    setProfilePictureFile(null)
    setIsDirty(true)
  }

  const handleRemoveCoverPhoto = () => {
    setFormData(prev => ({ ...prev, cover_photo_url: '' }))
    setCoverPhotoFile(null)
    setIsDirty(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      // Validate username format
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
        setMessage({
          type: 'error',
          text: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
        })
        setSaving(false)
        return
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          bio: formData.bio,
          profile_picture_url: formData.profile_picture_url,
          cover_photo_url: formData.cover_photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) {
        if (profileError.code === '23505') { // Unique constraint violation
          setMessage({ type: 'error', text: 'Username is already taken' })
        } else {
          throw profileError
        }
        setSaving(false)
        return
      }

      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: formData.username }
      })

      if (authError) throw authError

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setIsDirty(false)

      // Dispatch custom event to notify other components (e.g., Header)
      window.dispatchEvent(new Event('profileUpdated'))
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-600 mt-1">Manage your profile and account preferences</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6 max-w-2xl">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="username"
            />
            <p className="text-sm text-gray-500 mt-1">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <div className="flex items-center space-x-4">
              {formData.profile_picture_url && (
                <img
                  src={formData.profile_picture_url}
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div className="flex-grow">
                <div className="flex gap-2">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {uploadingProfilePic ? 'Uploading...' : 'Choose Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingProfilePic}
                      className="hidden"
                    />
                  </label>
                  {formData.profile_picture_url && (
                    <button
                      type="button"
                      onClick={handleRemoveProfilePicture}
                      className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="text-sm font-medium">Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Cover Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Photo
            </label>
            <div className="space-y-3">
              {formData.cover_photo_url && (
                <img
                  src={formData.cover_photo_url}
                  alt="Cover preview"
                  className="w-full h-32 rounded-lg object-cover border-2 border-gray-200"
                />
              )}
              <div className="flex gap-2">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {uploadingCover ? 'Uploading...' : 'Choose Image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverPhotoUpload}
                    disabled={uploadingCover}
                    className="hidden"
                  />
                </label>
                {formData.cover_photo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveCoverPhoto}
                    className="inline-flex items-center px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="text-sm font-medium">Remove</span>
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-500">
                JPG, PNG or GIF (max 5MB). Recommended: 1500x500 pixels
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {isDirty && (
                <div className="flex items-center text-amber-600">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-medium">Save your changes before leaving!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Account Information */}
      <div className="border-t border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Account ID:</span>
            <span className="font-mono text-xs text-gray-700">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Member since:</span>
            <span className="font-medium text-gray-900">
              {new Date(user?.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage
