"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Play, Loader2, Radio, Tv, AlertTriangle, Clock, StopCircle } from "lucide-react";
import DetectionMonitor from "@/components/realtime/DetectionMonitor";
import ChannelStatusMonitor from "@/components/realtime/ChannelStatusMonitor";
import { LineChart } from "@/components/ui/charts";
import { useRealtimeDetections } from "@/lib/hooks/useRealtimeDetections";
import detectionService, { MonitoringSession } from "@/services/detectionService";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function RealtimePage() {
  // Liste des chaînes disponibles
  const channels = [
    { id: "all", name: "Toutes les chaînes" },
    { id: "1", name: "RTS 1" },
    { id: "2", name: "TFM" },
    { id: "3", name: "2STV" },
    { id: "4", name: "iRadio" },
    { id: "5", name: "ZIK FM" },
  ];

  // État pour stocker la chaîne sélectionnée
  const [selectedChannel, setSelectedChannel] = useState("all");
  
  // État pour les sessions de surveillance
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  
  // Utilisation du hook pour les détections en temps réel
  const { 
    detections,
    loading,
    error,
    lastUpdated,
    refresh
  } = useRealtimeDetections({
    channelId: selectedChannel === "all" ? null : Number(selectedChannel),
    limit: 25,
    refreshInterval: 30000 // 30 secondes
  });

  // Charger les sessions de surveillance actives
  useEffect(() => {
    const fetchMonitoringSessions = async () => {
      setIsLoadingSessions(true);
      try {
        const sessions = await detectionService.getActiveMonitoringSessions();
        setMonitoringSessions(sessions);
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
    
    fetchMonitoringSessions();
    
    // Mise en place d'un interval pour rafraîchir les sessions toutes les 30 secondes
    const refreshInterval = setInterval(fetchMonitoringSessions, 30000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);
  
  // Arrêter une session de surveillance
  const handleStopMonitoring = async (sessionId: string, channelId: string, channelName: string) => {
    setIsStoppingSession(true);
    try {
      await detectionService.stopMonitoringSession(
        channelId,
        "Arrêt manuel depuis le tableau de bord"
      );
      
      // Retirer la session de la liste
      setMonitoringSessions(prev => 
        prev.filter(session => session.id !== sessionId)
      );
      
      toast({
        title: "Succès",
        description: `Surveillance de ${channelName} arrêtée avec succès`,
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

  // Préparation des données pour le graphique de ligne
  const generateActivityData = () => {
    // Créer un tableau d'horodatages pour les dernières 24 heures, avec un intervalle d'une heure
    const now = new Date();
    const timestamps = Array.from({ length: 24 }, (_, i) => {
      const date = new Date(now);
      date.setHours(now.getHours() - 23 + i);
      date.setMinutes(0);
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date;
    });

    // Générer des données pour chaque horodatage
    return timestamps.map(timestamp => {
      const hour = timestamp.getHours();
      // Plus d'activité pendant les heures de grande écoute (8h-10h et 16h-20h)
      let intensity = 0;
      if (hour >= 8 && hour <= 10) {
        intensity = 0.7 + Math.random() * 0.3; // Entre 0.7 et 1.0
      } else if (hour >= 16 && hour <= 20) {
        intensity = 0.6 + Math.random() * 0.4; // Entre 0.6 et 1.0
      } else if (hour >= 22 || hour <= 5) {
        intensity = 0.1 + Math.random() * 0.2; // Entre 0.1 et 0.3 (nuit)
      } else {
        intensity = 0.3 + Math.random() * 0.4; // Entre 0.3 et 0.7 (reste de la journée)
      }
      
      // Déterminez le nombre de détections en fonction de l'intensité (entre 0 et 20)
      const detectionCount = Math.floor(intensity * 20);
      
      return {
        timestamp: timestamp.toISOString(),
        detections: detectionCount
      };
    });
  };

  const [activityData, setActivityData] = useState(generateActivityData());

  // Mettre à jour les données d'activité périodiquement pour simuler les données en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityData(currentData => {
        // Supprimer la première entrée et ajouter une nouvelle à la fin
        const newData = [...currentData.slice(1)];
        const lastTimestamp = new Date(currentData[currentData.length - 1].timestamp);
        const newTimestamp = new Date(lastTimestamp);
        newTimestamp.setHours(lastTimestamp.getHours() + 1);
        
        // Déterminez l'intensité en fonction de l'heure
        const hour = newTimestamp.getHours();
        let intensity = 0;
        if (hour >= 8 && hour <= 10) {
          intensity = 0.7 + Math.random() * 0.3;
        } else if (hour >= 16 && hour <= 20) {
          intensity = 0.6 + Math.random() * 0.4;
        } else if (hour >= 22 || hour <= 5) {
          intensity = 0.1 + Math.random() * 0.2;
        } else {
          intensity = 0.3 + Math.random() * 0.4;
        }
        
        const detectionCount = Math.floor(intensity * 20);
        
        newData.push({
          timestamp: newTimestamp.toISOString(),
          detections: detectionCount
        });
        
        return newData;
      });
    }, 60000); // Mise à jour toutes les minutes pour la démo

    return () => clearInterval(interval);
  }, []);

  // Formater les horodatages pour l'affichage sur le graphique
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getHours()}h`;
  };

  // Données formatées pour le graphique
  const chartData = {
    data: activityData,
    categories: activityData.map(d => formatTime(d.timestamp)),
    colors: ['#059669'],
    valueFormatter: (value: number) => String(value),
    showLegend: false,
    startEndOnly: false,
    showXAxis: true,
    showYAxis: true,
    yAxisWidth: 40,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Surveillance en temps réel</h1>
        <div className="text-sm text-muted-foreground">
          {lastUpdated && (
            <span>Dernière mise à jour: {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Section des sessions de surveillance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Sessions de surveillance actives</CardTitle>
            <CardDescription>
              {isLoadingSessions ? 
                "Chargement des sessions..." : 
                `${monitoringSessions.length} session(s) active(s)`}
            </CardDescription>
          </div>
          <Link href="/stations">
            <Button variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" />
              Gérer les sessions
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : monitoringSessions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Aucune session active</AlertTitle>
              <AlertDescription>
                Vous n'avez aucune session de surveillance en cours. 
                Rendez-vous sur la page des stations pour en démarrer une.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monitoringSessions.map(session => (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{session.channel?.name || `Canal #${session.channel_id}`}</CardTitle>
                        <CardDescription className="text-xs">
                          {session.detection_count} détection(s)
                        </CardDescription>
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
                  </CardHeader>
                  <CardContent className="pt-0 pb-2">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>Intervalle: {session.interval_seconds}s</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        {session.channel?.type === 'radio' ? (
                          <Radio className="mr-1 h-3 w-3" />
                        ) : (
                          <Tv className="mr-1 h-3 w-3" />
                        )}
                        <span>Type: {session.channel?.type || 'inconnu'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Démarré: {new Date(session.started_at).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="w-full"
                      disabled={isStoppingSession}
                      onClick={() => handleStopMonitoring(session.id, session.channel_id, session.channel?.name || `Canal #${session.channel_id}`)}
                    >
                      {isStoppingSession ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <StopCircle className="mr-1 h-3 w-3" />
                      )}
                      Arrêter
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carte d'activité de détection */}
      <Card>
        <CardHeader>
          <CardTitle>Activité de détection (24h)</CardTitle>
        </CardHeader>
        <CardContent className="h-64 md:h-80">
          <LineChart
            className="h-full"
            data={chartData.data}
            index="timestamp"
            categories={['detections']}
            colors={chartData.colors}
            valueFormatter={chartData.valueFormatter}
            showLegend={chartData.showLegend}
            startEndOnly={chartData.startEndOnly}
            showXAxis={chartData.showXAxis}
            showYAxis={chartData.showYAxis}
            yAxisWidth={chartData.yAxisWidth}
          />
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Chaîne</label>
              <Select
                value={selectedChannel}
                onValueChange={(value: string) => setSelectedChannel(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une chaîne" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets pour les moniteurs */}
      <Tabs defaultValue="detections">
        <TabsList>
          <TabsTrigger value="detections">Détections</TabsTrigger>
          <TabsTrigger value="statuses">Statuts des chaînes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detections" className="mt-4">
          <DetectionMonitor 
            channelId={selectedChannel === "all" ? undefined : Number(selectedChannel)} 
            autoRefresh={true}
            limit={10}
          />
        </TabsContent>
        
        <TabsContent value="statuses" className="mt-4">
          <ChannelStatusMonitor autoRefresh={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 