-- Script 2: Création des index pour optimiser les performances

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

-- Index pour les notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read); 