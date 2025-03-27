"use client";

import { createClient } from "@supabase/supabase-js";

// Environnement par défaut pour le développement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour s'abonner aux nouvelles détections
export const subscribeToNewDetections = (
  channelId: number | null = null,
  callback: (payload: any) => void
) => {
  let subscription;

  if (channelId) {
    // S'abonner aux détections pour une chaîne spécifique
    subscription = supabase
      .channel("airplay_logs_by_channel")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "airplay_logs",
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => callback(payload)
      )
      .subscribe();
  } else {
    // S'abonner à toutes les nouvelles détections
    subscription = supabase
      .channel("all_airplay_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "airplay_logs" },
        (payload) => callback(payload)
      )
      .subscribe();
  }

  // Retourner une fonction pour se désabonner
  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
};

// S'abonner aux mises à jour du statut des chaînes
export const subscribeToChannelStatus = (callback: (payload: any) => void) => {
  const subscription = supabase
    .channel("channel_status_updates")
    .on(
      "postgres_changes",
      { 
        event: "UPDATE", 
        schema: "public", 
        table: "channels", 
        filter: "last_check_status=is.not.null" 
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
};

// S'abonner à la génération de rapports
export const subscribeToReportGeneration = (
  userId: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`report_updates_${userId}`)
    .on(
      "postgres_changes",
      { 
        event: "*", 
        schema: "public", 
        table: "reports", 
        filter: `user_id=eq.${userId}` 
      },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
};

// Fonctions helper pour obtenir des données en temps réel
export const fetchRecentDetections = async (limit = 10) => {
  const { data, error } = await supabase
    .from("airplay_logs")
    .select(`
      id, play_timestamp, end_timestamp, duration, detected_at,
      songs!inner(id, title, artist, album, isrc),
      channels!inner(id, name, logo_url)
    `)
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent detections:", error);
    return [];
  }

  return data;
};

export const fetchChannelStatuses = async () => {
  const { data, error } = await supabase
    .from("channels")
    .select("id, name, status, last_check_status, last_check_time")
    .order("name");

  if (error) {
    console.error("Error fetching channel statuses:", error);
    return [];
  }

  return data;
};

export default supabase; 