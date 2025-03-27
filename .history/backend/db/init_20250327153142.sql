-- Script d'initialisation de la base de données SODAV Monitor
-- Ce script crée toutes les tables nécessaires pour le fonctionnement du système

-- Table des utilisateurs
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ajout d'un commentaire à la table users
COMMENT ON TABLE public.users IS 'Stocke les informations des utilisateurs de SODAV Monitor.';

-- Table des chansons
CREATE TABLE public.songs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  isrc TEXT UNIQUE,
  fingerprint TEXT UNIQUE,
  duration INTEGER, -- durée en secondes
  release_year INTEGER,
  genre TEXT,
  album_art_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.songs IS 'Catalogue des chansons détectées par le système.';

-- Table des stations (chaînes radio et TV)
CREATE TABLE public.channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('radio', 'tv')), -- radio ou tv
  url TEXT NOT NULL,
  logo_url TEXT,
  country TEXT DEFAULT 'Sénégal',
  language TEXT DEFAULT 'Français',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.channels IS 'Informations sur les chaînes radio et TV surveillées.';

-- Table des logs de diffusion (airplay)
CREATE TABLE public.airplay_logs (
  id SERIAL PRIMARY KEY,
  song_id INTEGER REFERENCES public.songs(id),
  channel_id INTEGER REFERENCES public.channels(id),
  play_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- durée de diffusion en secondes
  confidence FLOAT, -- niveau de confiance de la détection (0-100)
  fingerprint_data JSONB, -- données brutes du fingerprint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.airplay_logs IS 'Enregistrement des diffusions détectées par le système.';

-- Table des corrections manuelles
CREATE TABLE public.manual_corrections (
  id SERIAL PRIMARY KEY,
  airplay_log_id INTEGER REFERENCES public.airplay_logs(id),
  corrected_song_id INTEGER REFERENCES public.songs(id),
  correction_reason TEXT,
  corrected_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.manual_corrections IS 'Corrections manuelles des erreurs de détection.';

-- Table pour la gestion des API keys
CREATE TABLE public.api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  permissions JSONB,
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.api_keys IS 'Clés API pour l''accès programmatique au système.';

-- Table des rapports générés
CREATE TABLE public.reports (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
  file_url TEXT,
  generated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE public.reports IS 'Rapports générés par le système.';

-- Indexation pour les requêtes fréquentes
CREATE INDEX idx_songs_artist ON public.songs(artist);
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_fingerprint ON public.songs(fingerprint);
CREATE INDEX idx_songs_isrc ON public.songs(isrc);

CREATE INDEX idx_airplay_logs_timestamp ON public.airplay_logs(play_timestamp);
CREATE INDEX idx_airplay_logs_channel ON public.airplay_logs(channel_id);
CREATE INDEX idx_airplay_logs_song ON public.airplay_logs(song_id);

CREATE INDEX idx_manual_corrections_airplay ON public.manual_corrections(airplay_log_id);
CREATE INDEX idx_manual_corrections_corrector ON public.manual_corrections(corrected_by);

-- Activez RLS (Row Level Security) sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airplay_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs
-- Les utilisateurs sont visibles par tous les utilisateurs connectés
CREATE POLICY "Users are viewable by all users"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seul l'utilisateur peut modifier ses propres informations
CREATE POLICY "Users can update own record"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Politique pour les administrateurs qui peuvent tout faire
CREATE POLICY "Admins have full access to users"
  ON public.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique pour les chansons
-- Toutes les chansons sont visibles par les utilisateurs authentifiés
CREATE POLICY "Songs are viewable by authenticated users"
  ON public.songs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seuls les administrateurs et les gestionnaires peuvent ajouter/modifier/supprimer
CREATE POLICY "Only admins and managers can modify songs"
  ON public.songs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Politique similaire pour les autres tables
-- Pour les channels
CREATE POLICY "Channels are viewable by authenticated users"
  ON public.channels FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and managers can modify channels"
  ON public.channels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Pour airplay_logs
CREATE POLICY "Airplay logs are viewable by authenticated users"
  ON public.airplay_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and managers can modify airplay logs"
  ON public.airplay_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Pour manual_corrections
CREATE POLICY "Manual corrections are viewable by authenticated users"
  ON public.manual_corrections FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and managers can create manual corrections"
  ON public.manual_corrections FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Pour api_keys
CREATE POLICY "API keys are viewable by their owners"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage their own API keys"
  ON public.api_keys FOR ALL
  USING (auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Pour reports
CREATE POLICY "Reports are viewable by authenticated users"
  ON public.reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view and create reports"
  ON public.reports FOR INSERT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only owners and admins can delete reports"
  ON public.reports FOR DELETE
  USING (
    auth.uid() = generated_by OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  ); 