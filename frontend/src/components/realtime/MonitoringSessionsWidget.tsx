"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { 
  Play, 
  StopCircle, 
  Clock, 
  Radio, 
  Tv, 
  AlertTriangle, 
  Loader2, 
  PlusCircle 
} from "lucide-react";
import Link from "next/link";
import detectionService, { MonitoringSession } from '@/services/detectionService';

interface MonitoringSessionsWidgetProps {
  compact?: boolean;
  onSessionSelect?: (sessionId: string) => void;
}

const MonitoringSessionsWidget: React.FC<MonitoringSessionsWidgetProps> = ({
  compact = false,
  onSessionSelect
}) => {
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const activeSessions = await detectionService.getActiveMonitoringSessions();
      setSessions(activeSessions);
    } catch (error) {
      console.error("Erreur lors du chargement des sessions de surveillance:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les sessions de surveillance",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };
  
  useEffect(() => {
    fetchSessions();
    
    // Mise en place d'un interval pour rafraîchir les sessions toutes les 30 secondes
    const refreshInterval = setInterval(fetchSessions, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    if (onSessionSelect) {
      onSessionSelect(sessionId);
    }
  };
  
  const handleStopSession = async (e: React.MouseEvent, sessionId: string, channelId: string) => {
    e.stopPropagation();
    setIsStoppingSession(true);
    try {
      await detectionService.stopMonitoringSession(
        channelId,
        "Arrêt manuel depuis le widget de surveillance"
      );
      
      // Retirer la session de la liste
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: "Succès",
        description: "Surveillance arrêtée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'arrêt de la surveillance:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'arrêter la surveillance",
        variant: "destructive",
      });
    } finally {
      setIsStoppingSession(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Sessions de surveillance</CardTitle>
            <Badge>{sessions.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {isLoadingSessions ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Aucune session active
            </div>
          ) : (
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {sessions.map(session => (
                  <div 
                    key={session.id} 
                    className="flex justify-between items-center p-2 rounded-md border hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {session.channel?.type === 'radio' ? (
                        <Radio className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Tv className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="font-medium truncate">
                        {session.channel?.name || `Canal #${session.channel_id}`}
                      </span>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {session.detection_count}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Link href="/stations" className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <Play className="h-3 w-3 mr-2" />
              Gérer les sessions
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Sessions de surveillance actives</CardTitle>
            <CardDescription>
              {isLoadingSessions ? 
                "Chargement des sessions..." : 
                `${sessions.length} session(s) active(s)`}
            </CardDescription>
          </div>
          <Link href="/stations">
            <Button variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingSessions ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Aucune session active</AlertTitle>
            <AlertDescription>
              Vous n'avez aucune session de surveillance en cours.
              Rendez-vous sur la page des stations pour en démarrer une.
            </AlertDescription>
          </Alert>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map(session => (
                <div 
                  key={session.id} 
                  className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                    selectedSessionId === session.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'
                  }`}
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{session.channel?.name || `Canal #${session.channel_id}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        {session.channel?.type === 'radio' ? (
                          <span className="flex items-center">
                            <Radio className="h-3 w-3 mr-1" />
                            Radio
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Tv className="h-3 w-3 mr-1" />
                            TV
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge 
                      className={session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}
                    >
                      {session.status === 'active' ? (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {session.status}
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>Intervalle: {session.interval_seconds}s</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Badge variant="outline" className="text-xs mr-2">
                        {session.detection_count}
                      </Badge>
                      <span className="text-muted-foreground">détections</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Démarré le {formatDate(session.started_at)}
                    </div>
                    {session.last_detection_at && (
                      <div className="text-xs text-muted-foreground">
                        Dernière détection: {formatDate(session.last_detection_at)}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    disabled={isStoppingSession}
                    onClick={(e) => handleStopSession(e, session.id, session.channel_id)}
                  >
                    {isStoppingSession ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <StopCircle className="mr-1 h-3 w-3" />
                    )}
                    Arrêter la surveillance
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default MonitoringSessionsWidget; 