-- Script 1: Création des tables de base pour SODAV Monitor

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

-- Table pour stocker les notifications
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.notifications IS 'Notifications utilisateur du système.'; 