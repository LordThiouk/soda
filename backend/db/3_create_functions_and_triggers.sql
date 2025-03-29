-- Script 3: Création des fonctions et triggers

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

-- Trigger pour mettre à jour updated_at sur les utilisateurs
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Trigger pour mettre à jour updated_at sur les statistiques quotidiennes
CREATE TRIGGER update_daily_stats_modtime
BEFORE UPDATE ON public.daily_stats
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