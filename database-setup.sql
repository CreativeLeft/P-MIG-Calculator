-- Supabase Database Setup for P-MIG Calculator
-- Run these SQL commands in your Supabase SQL Editor

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_tier TEXT DEFAULT 'free', -- 'free', 'small_indie', 'veteran_indie'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calculations_history table to store user calculations
CREATE TABLE IF NOT EXISTS calculations_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id),
    game_name TEXT,
    game_type TEXT, -- 'singleplayer' or 'multiplayer'
    selected_tags TEXT[], -- Array of selected genre tags
    scope_type TEXT, -- 'compact', 'standard', 'high'
    dev_time_months INTEGER,
    team_size INTEGER,
    marketing_cost DECIMAL,
    country_origin TEXT,
    wishlist_count INTEGER,
    price_a DECIMAL,
    price_b DECIMAL,
    price_c DECIMAL,
    price_d DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculations_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for calculations_history
CREATE POLICY "Users can view own calculations" ON calculations_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON calculations_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
