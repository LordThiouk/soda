"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { RefreshCcw, Music, Radio, Tv, Info, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import detectionService, { Detection, MonitoringSession } from '@/services/detectionService';

interface DetectionMonitorProps {
  channelId?: number;
  sessionId?: string;
  autoRefresh?: boolean;
  limit?: number;
}

const DetectionMonitor: React.FC<DetectionMonitorProps> = ({
  channelId,
  sessionId,
  autoRefresh = true,
  limit = 10
}) => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeSession, setActiveSession] = useState<MonitoringSession | null>(null);

  const fetchDetections = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      
      if (sessionId) {
        // Si un ID de session est fourni, récupérer les détections de cette session
        const sessionDetails = await detectionService.getMonitoringSessionDetails(sessionId);
        setActiveSession(sessionDetails.session);
        
        // Transformer les détections de session au format Detection
        result = {
          detections: sessionDetails.detections.map(sd => ({
            id: sd.detection_id,
            song_id: sd.song?.id || '',
            detection_time: sd.detected_at,
            start_time: sd.detected_at,
            confidence: 100, // Valeur par défaut
            status: 'confirmed',
            created_at: sd.detected_at,
            updated_at: sd.detected_at,
            song: sd.song,
            channel: sessionDetails.session.channel
          } as Detection)),
          total: sessionDetails.detections.length
        };
      } else {
        // Sinon, récupérer les détections récentes avec les filtres standards
        result = await detectionService.getRecentDetections({
          channel_id: channelId?.toString(),
          limit,
          page: 1
        });
      }
      
      setDetections(result.detections);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Erreur lors de la récupération des détections:', err);
      setError('Impossible de charger les détections');
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les détections"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetections();
    
    // Mise en place de l'actualisation automatique
    let refreshInterval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      refreshInterval = setInterval(fetchDetections, 15000); // 15 secondes
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [channelId, sessionId, limit]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmée
          </Badge>
        );
      case 'corrected':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Info className="h-3 w-3 mr-1" />
            Corrigée
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>
          {sessionId ? 
            `Détections de session${activeSession ? ` - ${activeSession.channel?.name || ''}` : ''}` :
            'Détections récentes'}
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchDetections}
                disabled={loading}
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualiser les données</p>
              {lastUpdated && (
                <p className="text-xs text-muted-foreground">
                  Dernière mise à jour: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : detections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucune détection disponible</p>
            {channelId && <p className="text-sm">Essayez de sélectionner une autre chaîne</p>}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {detections.map((detection) => (
                <div key={detection.id} className="flex items-start space-x-4 p-2 rounded-lg border">
                  <div className="bg-slate-100 rounded-md p-2 flex-shrink-0">
                    <Music className="h-8 w-8 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium truncate">{detection.song?.title || 'Titre inconnu'}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {detection.song?.artist || 'Artiste inconnu'}
                          {detection.song?.album && ` • ${detection.song.album}`}
                        </p>
                      </div>
                      {getStatusBadge(detection.status)}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <div className="flex items-center text-xs text-muted-foreground">
                        {detection.channel?.type === 'radio' ? (
                          <Radio className="h-3 w-3 mr-1" />
                        ) : (
                          <Tv className="h-3 w-3 mr-1" />
                        )}
                        <span>{detection.channel?.name || 'Chaîne inconnue'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground ml-auto">
                        {formatTimestamp(detection.detection_time)}
                      </div>
                    </div>
                    {detection.song?.isrc && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          ISRC: {detection.song.isrc}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default DetectionMonitor; 