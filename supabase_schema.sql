-- 1. Tables principales

-- Table des événements
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    password TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table des uploads (photos)
CREATE TABLE public.uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    file_url TEXT NOT NULL,
    uploader_name TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Configuration du Storage
-- Note: Assurez-vous de créer manuellement le bucket "event-photos" s'il n'existe pas.
-- Ou utilisez le code ci-dessous si vous avez les permissions directes.
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- 3. Sécurité (RLS)

-- Rendre les tables visibles par défaut
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- Politiques pour EVENTS
CREATE POLICY "Les événements publics sont consultables par tous" 
ON public.events FOR SELECT USING (true);

CREATE POLICY "Seul le propriétaire peut modifier ses événements" 
ON public.events FOR ALL 
USING (auth.uid() = owner_id);

-- Politiques pour UPLOADS
CREATE POLICY "Tout le monde peut voir les photos d'un événement" 
ON public.uploads FOR SELECT USING (true);

CREATE POLICY "Tout le monde peut uploader une photo" 
ON public.uploads FOR INSERT WITH CHECK (true);

-- Politiques pour STORAGE (event-photos)
CREATE POLICY "Accès public en lecture aux photos"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'event-photos');

CREATE POLICY "Upload public autorisé dans event-photos"
ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'event-photos');
