"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToNewDetections, fetchRecentDetections } from "@/lib/supabase";

interface Detection {
  id: number;
  play_timestamp: string;
  end_timestamp: string | null;
  duration: number | null;
  detected_at: string;
  songs: {
    id: number;
    title: string;
    artist: string;
    album: string | null;
    isrc: string | null;
  };
  channels: {
    id: number;
    name: string;
    logo_url: string | null;
  };
}

interface DetectionMonitorProps {
  channelId?: number | null;
  limit?: number;
  showHeader?: boolean;
  className?: string;
  autoRefresh?: boolean;
}

export default function DetectionMonitor({
  channelId = null,
  limit = 10,
  showHeader = true,
  className = "",
  autoRefresh = true
}: DetectionMonitorProps) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  // Formater la date et l'heure
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Formater la durée en mm:ss
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Charger les détections initiales
  const loadDetections = async () => {
    setLoading(true);
    try {
      const data = await fetchRecentDetections(limit);
      // Ensure each detection has the proper structure before adding it to state
      const formattedData = data.map((det: any) => {
        return {
          id: det.id,
          play_timestamp: det.play_timestamp,
          end_timestamp: det.end_timestamp,
          duration: det.duration,
          detected_at: det.detected_at,
          songs: Array.isArray(det.songs) && det.songs.length > 0 ? det.songs[0] : det.songs,
          channels: Array.isArray(det.channels) && det.channels.length > 0 ? det.channels[0] : det.channels
        } as Detection;
      });
      setDetections(formattedData);
    } catch (error) {
      console.error("Failed to fetch detections:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les nouvelles détections
  const handleNewDetection = (payload: any) => {
    const newDetection = payload.new;
    
    // Fetch the complete detection with joined data
    fetchRecentDetections(1).then(data => {
      if (data && data.length > 0) {
        // Format the detection data
        const formattedDetection = {
          id: data[0].id,
          play_timestamp: data[0].play_timestamp,
          end_timestamp: data[0].end_timestamp,
          duration: data[0].duration,
          detected_at: data[0].detected_at,
          songs: Array.isArray(data[0].songs) && data[0].songs.length > 0 ? data[0].songs[0] : data[0].songs,
          channels: Array.isArray(data[0].channels) && data[0].channels.length > 0 ? data[0].channels[0] : data[0].channels
        } as Detection;
        
        setDetections(prevDetections => {
          // Add to the beginning and ensure we don't exceed our limit
          const newDetections = [formattedDetection, ...prevDetections];
          return newDetections.slice(0, limit);
        });
      }
    });
  };

  // S'abonner aux nouvelles détections
  useEffect(() => {
    loadDetections();

    let unsubscribe: () => void;
    
    if (autoRefresh) {
      unsubscribe = subscribeToNewDetections(
        channelId,
        handleNewDetection
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [channelId, limit, autoRefresh]);

  // Animation pour les nouvelles détections
  const getItemStyle = (index: number) => {
    if (index === 0) {
      return "animate-pulse bg-green-50 dark:bg-green-900/20";
    }
    return index % 2 === 0 ? "bg-muted/50" : "bg-background";
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Détections en temps réel</CardTitle>
              <CardDescription>
                {channelId 
                  ? "Diffusions détectées sur la chaîne sélectionnée" 
                  : "Dernières diffusions détectées sur toutes les chaînes"}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              En direct
            </Badge>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Chargement des détections...
          </div>
        ) : detections.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucune détection récente
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-2 text-left font-medium">Titre</th>
                  <th className="py-3 px-2 text-left font-medium">Artiste</th>
                  <th className="py-3 px-2 text-left font-medium">Chaîne</th>
                  <th className="py-3 px-2 text-left font-medium">Début</th>
                  <th className="py-3 px-2 text-left font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((detection, index) => (
                  <tr key={detection.id} className={getItemStyle(index)}>
                    <td className="py-3 px-2 font-medium">{detection.songs.title}</td>
                    <td className="py-3 px-2">{detection.songs.artist}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center">
                        {detection.channels.logo_url && (
                          <img 
                            src={detection.channels.logo_url} 
                            alt={detection.channels.name}
                            className="w-6 h-6 mr-2 rounded-full"
                          />
                        )}
                        {detection.channels.name}
                      </div>
                    </td>
                    <td className="py-3 px-2">{formatDateTime(detection.play_timestamp)}</td>
                    <td className="py-3 px-2">{formatDuration(detection.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 