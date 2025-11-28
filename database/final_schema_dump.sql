-- ==============================================================================
-- SPORTSWAP FINAL DATABASE SCHEMA
-- Extracted from Live Supabase Database
-- ==============================================================================

-- 1. PROFILES
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text NOT NULL UNIQUE,
    bio text,
    profile_picture_url text,
    cover_photo_url text,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Profile Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. LISTINGS
CREATE TABLE public.listings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    subcategory text,
    listing_type text NOT NULL CHECK (listing_type IN ('sale', 'rent', 'exchange')),
    condition text NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'used')),
    brand text,
    price numeric(10, 2) NOT NULL,
    retail_price numeric(10, 2),
    quantity integer DEFAULT 1,
    city text NOT NULL,
    status text DEFAULT 'active' CHECK (status IN ('active', 'sold', 'draft')),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Listing Policies
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for listings" ON listings FOR SELECT USING (status = ANY (ARRAY['active'::text, 'sold'::text]));
CREATE POLICY "Users can create listings" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own listings" ON listings FOR SELECT USING (auth.uid() = user_id);

-- 3. LISTING IMAGES
CREATE TABLE public.listing_images (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Image Policies
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for listing_images" ON listing_images FOR SELECT USING (
    listing_id IN (SELECT id FROM listings WHERE status = ANY (ARRAY['active'::text, 'sold'::text]))
);
CREATE POLICY "Users can insert images for own listings" ON listing_images FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_images.listing_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete images from own listings" ON listing_images FOR DELETE USING (
    EXISTS (SELECT 1 FROM listings WHERE id = listing_images.listing_id AND user_id = auth.uid())
);

-- 4. FAVORITES
CREATE TABLE public.favorites (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, listing_id)
);
-- Favorites Policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 5. CONVERSATIONS
CREATE TABLE public.conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(listing_id, buyer_id, seller_id)
);
-- Conversation Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own conversations" ON conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can update their own conversations" ON conversations FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 6. MESSAGES
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);
-- Message Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);
CREATE POLICY "Users can send messages in their conversations" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (buyer_id = auth.uid() OR seller_id = auth.uid()))
);

-- 7. OFFERS
CREATE TABLE public.offers (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    message text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered', 'withdrawn')),
    counter_amount numeric(10, 2),
    counter_message text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
-- Offer Policies
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view offers" ON offers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create offers" ON offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update their own offers" ON offers FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update offers on their listings" ON offers FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM listings WHERE id = offers.listing_id)
);

-- 8. TRANSACTIONS
CREATE TABLE public.transactions (
    id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    offer_id uuid REFERENCES offers(id) ON DELETE SET NULL,
    final_price numeric(10, 2) NOT NULL CHECK (final_price > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    CHECK (buyer_id <> seller_id)
);
-- Transaction Policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Authenticated users can create transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can update their transactions" ON transactions FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 9. REVIEWS
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id uuid NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewed_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(transaction_id, reviewer_id),
    CHECK (reviewer_id <> reviewed_id)
);
-- Review Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their transactions" ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (SELECT 1 FROM transactions WHERE id = reviews.transaction_id AND (buyer_id = auth.uid() OR seller_id = auth.uid())) AND
    auth.uid() <> reviewed_id
);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users can delete their own reviews" ON reviews FOR DELETE USING (auth.uid() = reviewer_id);