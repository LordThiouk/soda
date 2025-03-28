-- Script d'initialisation de la base de données SODAV Monitor
-- Ce script crée toutes les tables nécessaires pour le fonctionnement du système

-- Table des utilisateurs
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  is_active BOOLEAN DEFAULT TRUE,
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
  musicbrainz_id TEXT,  -- ID MusicBrainz pour référence externe
  spotify_id TEXT,      -- ID Spotify pour référence externe
  metadata JSONB,       -- Autres métadonnées (sources, IDs externes, scores)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.songs IS 'Catalogue des chansons détectées par le système avec métadonnées enrichies.';

-- Table des stations (chaînes radio et TV)
CREATE TABLE public.channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('radio', 'tv')), -- radio ou tv
  url TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  country TEXT DEFAULT 'Sénégal',
  language TEXT DEFAULT 'Français',
  homepage TEXT,
  bitrate INTEGER,
  codec TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
  metadata JSONB,  -- Données supplémentaires (géolocalisation, tags, clics, votes, etc.)
  last_check_status BOOLEAN, -- Résultat du dernier test de disponibilité
  last_check_time TIMESTAMP WITH TIME ZONE, -- Date du dernier test
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.channels IS 'Informations détaillées sur les chaînes radio et TV surveillées.';

-- Table des logs de diffusion (airplay)
CREATE TABLE public.airplay_logs (
  id SERIAL PRIMARY KEY,
  song_id INTEGER REFERENCES public.songs(id),
  channel_id INTEGER REFERENCES public.channels(id),
  play_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Heure de début de diffusion
  end_timestamp TIMESTAMP WITH TIME ZONE, -- Heure de fin de diffusion (calculée)
  duration INTEGER, -- durée de diffusion en secondes
  playback_position FLOAT, -- position de l'échantillon dans la chanson en secondes
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL, -- moment exact de la détection
  confidence FLOAT, -- niveau de confiance de la détection (0-100)
  fingerprint_data JSONB, -- données brutes du fingerprint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.airplay_logs IS 'Enregistrement des diffusions détectées par le système avec temps de jeu précis.';

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

-- Table des tests de disponibilité
CREATE TABLE public.availability_tests (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES public.channels(id),
  status BOOLEAN NOT NULL, -- true = disponible, false = non disponible
  response_time INTEGER, -- temps de réponse en ms
  error_message TEXT,
  tested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tables pour la surveillance en temps réel

-- Table des sessions de surveillance
CREATE TABLE public.monitoring_sessions (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES public.channels(id),
  interval_seconds INTEGER NOT NULL DEFAULT 60,
  callback_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'stopped', 'failed')),
  status_reason TEXT, -- Raison du changement de statut
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  last_detection_at TIMESTAMP WITH TIME ZONE,
  detection_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des détections de la surveillance
CREATE TABLE public.monitoring_detections (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES public.monitoring_sessions(id),
  detection_id INTEGER REFERENCES public.airplay_logs(id),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des erreurs de surveillance
CREATE TABLE public.monitoring_errors (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES public.monitoring_sessions(id),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table de statistiques par jour
CREATE TABLE public.daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  channel_id INTEGER REFERENCES public.channels(id),
  song_id INTEGER REFERENCES public.songs(id),
  play_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- durée totale en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, channel_id, song_id)
);

-- Création des indexs pour optimiser les performances
CREATE INDEX idx_songs_artist ON public.songs(artist);
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_fingerprint ON public.songs(fingerprint);
CREATE INDEX idx_songs_isrc ON public.songs(isrc);

CREATE INDEX idx_airplay_logs_timestamp ON public.airplay_logs(play_timestamp);
CREATE INDEX idx_airplay_logs_end_timestamp ON public.airplay_logs(end_timestamp);
CREATE INDEX idx_airplay_logs_channel ON public.airplay_logs(channel_id);
CREATE INDEX idx_airplay_logs_song ON public.airplay_logs(song_id);
CREATE INDEX idx_airplay_logs_detected_at ON public.airplay_logs(detected_at);

CREATE INDEX idx_channels_status ON public.channels(status);
CREATE INDEX idx_channels_type ON public.channels(type);

CREATE INDEX idx_monitoring_sessions_status ON public.monitoring_sessions(status);
CREATE INDEX idx_monitoring_sessions_channel ON public.monitoring_sessions(channel_id);

CREATE INDEX idx_monitoring_detections_session ON public.monitoring_detections(session_id);
CREATE INDEX idx_monitoring_detections_detection ON public.monitoring_detections(detection_id);

CREATE INDEX idx_daily_stats_date ON public.daily_stats(date);
CREATE INDEX idx_daily_stats_channel ON public.daily_stats(channel_id);
CREATE INDEX idx_daily_stats_song ON public.daily_stats(song_id);

-- Création des fonctions et triggers

-- Mise à jour automatique du timestamp "updated_at"
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at sur les chansons
CREATE TRIGGER update_songs_modtime
BEFORE UPDATE ON public.songs
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Trigger pour mettre à jour updated_at sur les chaînes
CREATE TRIGGER update_channels_modtime
BEFORE UPDATE ON public.channels
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Fonction pour mettre à jour les statistiques quotidiennes
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  play_date DATE;
BEGIN
  -- Récupérer la date de diffusion
  play_date := DATE(NEW.play_timestamp);
  
  -- Mettre à jour ou insérer une nouvelle entrée dans daily_stats
  INSERT INTO public.daily_stats (date, channel_id, song_id, play_count, total_duration)
  VALUES (play_date, NEW.channel_id, NEW.song_id, 1, COALESCE(NEW.duration, 0))
  ON CONFLICT (date, channel_id, song_id)
  DO UPDATE SET
    play_count = daily_stats.play_count + 1,
    total_duration = daily_stats.total_duration + COALESCE(NEW.duration, 0),
    updated_at = now();
    
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour les statistiques lors de l'ajout d'une nouvelle diffusion
CREATE TRIGGER update_stats_on_new_airplay
AFTER INSERT ON public.airplay_logs
FOR EACH ROW
EXECUTE PROCEDURE update_daily_stats();

-- Policies de sécurité pour RLS (Row Level Security)

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.airplay_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

-- Policy de base: tous les utilisateurs peuvent voir la majorité des données
CREATE POLICY "Données visibles pour tous les utilisateurs authentifiés" 
ON public.songs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Données visibles pour tous les utilisateurs authentifiés" 
ON public.channels FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Données visibles pour tous les utilisateurs authentifiés" 
ON public.airplay_logs FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Données visibles pour tous les utilisateurs authentifiés" 
ON public.daily_stats FOR SELECT 
USING (auth.role() = 'authenticated');

-- Policy pour modification: réservée aux admins et managers
CREATE POLICY "Modification réservée aux admins et managers" 
ON public.songs FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role IN ('admin', 'manager')
));

CREATE POLICY "Modification réservée aux admins et managers" 
ON public.channels FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role IN ('admin', 'manager')
));

CREATE POLICY "Modification réservée aux admins" 
ON public.users FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'admin'
));

CREATE POLICY "Modification réservée aux admins" 
ON public.api_keys FOR ALL 
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'admin'
));

-- Données de test pour développement (à commenter en production)
INSERT INTO public.songs (title, artist, album, isrc) VALUES
('Africa', 'Toto', 'Toto IV', 'USSM17900028'),
('Désolé', 'Sexion d''Assaut', 'L''École des points vitaux', 'FR9W11000795'),
('Wakanda', 'Djuna Djanana', 'Kaysha Collection Vol.2', 'FRUM71600053'),
('Mbeuguel', 'Youssou N''Dour', 'Joko', 'GBAYE0200013');

-- Exemple de chaînes sénégalaises
INSERT INTO public.channels (name, type, url, country, language) VALUES
('RTS1', 'tv', 'https://example.com/rts1', 'Sénégal', 'Français/Wolof'),
('TFM', 'tv', 'https://example.com/tfm', 'Sénégal', 'Français/Wolof'),
('RFM', 'radio', 'https://rfm_radio.org', 'Sénégal', 'Français/Wolof'),
('Dakar Musique', 'radio', 'https://dakar.music.stream', 'Sénégal', 'Français/Wolof'); 