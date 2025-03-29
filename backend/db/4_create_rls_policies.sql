-- Script 4: Configuration des Row Level Security (RLS) policies

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
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

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

-- Policy pour les notifications: les utilisateurs ne voient que leurs propres notifications
CREATE POLICY "Les utilisateurs voient leurs propres notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id); 