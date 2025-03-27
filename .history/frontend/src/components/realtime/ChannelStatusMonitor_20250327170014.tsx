"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { subscribeToChannelStatus, fetchChannelStatuses } from "@/lib/supabase";

interface ChannelStatus {
  id: number;
  name: string;
  status: string;
  last_check_status: boolean | null;
  last_check_time: string | null;
}

interface ChannelStatusMonitorProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  autoRefresh?: boolean;
}

export default function ChannelStatusMonitor({
  limit = 10,
  showHeader = true,
  className = "",
  autoRefresh = true
}: ChannelStatusMonitorProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Formater la date et l'heure
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Jamais";
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

  // Charger les statuts initiaux
  const loadChannelStatuses = async () => {
    setLoading(true);
    try {
      const data = await fetchChannelStatuses();
      setChannels(data.slice(0, limit) as ChannelStatus[]);
    } catch (error) {
      console.error("Failed to fetch channel statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer les mises à jour de statut
  const handleStatusUpdate = (payload: any) => {
    const updatedChannel = payload.new;
    
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id === updatedChannel.id) {
          return {
            ...channel,
            status: updatedChannel.status,
            last_check_status: updatedChannel.last_check_status,
            last_check_time: updatedChannel.last_check_time
          } as ChannelStatus;
        }
        return channel;
      });
    });
  };

  // S'abonner aux mises à jour de statut
  useEffect(() => {
    loadChannelStatuses();

    let unsubscribe: () => void;
    
    if (autoRefresh) {
      unsubscribe = subscribeToChannelStatus(handleStatusUpdate);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [limit, autoRefresh]);

  // Obtenir le style de badge en fonction du statut
  const getStatusBadge = (status: boolean | null) => {
    if (status === null) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          Non testé
        </Badge>
      );
    }
    
    if (status) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          En ligne
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
        Hors ligne
      </Badge>
    );
  };

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle>Statut des chaînes</CardTitle>
          <CardDescription>
            État des chaînes surveillées en temps réel
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Chargement des statuts...
          </div>
        ) : channels.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucune chaîne configurée
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-2 text-left font-medium">Chaîne</th>
                  <th className="py-3 px-2 text-left font-medium">Type</th>
                  <th className="py-3 px-2 text-left font-medium">Statut</th>
                  <th className="py-3 px-2 text-left font-medium">Dernière vérification</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel, index) => (
                  <tr 
                    key={channel.id} 
                    className={index % 2 === 0 ? "bg-muted/50" : "bg-background"}
                  >
                    <td className="py-3 px-2 font-medium">{channel.name}</td>
                    <td className="py-3 px-2 capitalize">{channel.status}</td>
                    <td className="py-3 px-2">{getStatusBadge(channel.last_check_status)}</td>
                    <td className="py-3 px-2">{formatDateTime(channel.last_check_time)}</td>
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