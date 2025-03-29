"use client";

import { createClient } from "@supabase/supabase-js";

// Default environment values for development (these would be in .env.local in production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
// Using a dummy anon key for development - this won't actually connect to a real Supabase instance
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key provided:", !!supabaseKey);

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour s'abonner aux nouvelles notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (payload: any) => void
) => {
  const subscription = supabase
    .channel(`user_notifications_${userId}`)
    .on(
      "postgres_changes",
      { 
        event: "INSERT", 
        schema: "public", 
        table: "notifications", 
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

// Fonction pour marquer les notifications comme lues
export const markNotificationAsRead = async (notificationId: number) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return null;
  }

  return data;
};

// Fonction pour récupérer les notifications non lues
export const fetchUnreadNotifications = async (userId: string) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("read", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }

  return data;
};

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