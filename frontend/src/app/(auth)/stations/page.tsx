"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Radio, Tv, MoreVertical, Wifi, Check, X, Play, StopCircle, AlertTriangle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import detectionService, { MonitoringSession } from "@/services/detectionService";
import stationService from "@/services/stationService";

// Simuler des données de stations pour le moment
// À remplacer par des appels API réels
const mockRadioStations = [
  { id: 1, name: "RFM Sénégal", type: "radio", url: "https://stream.rfm.sn/rfm", status: "active", bitrate: "128 kbps", codec: "MP3", country: "Sénégal", language: "Français/Wolof", tags: ["music", "news"] },
  { id: 2, name: "Sud FM", type: "radio", url: "https://stream.sudfm.sn/sudfm", status: "active", bitrate: "96 kbps", codec: "MP3", country: "Sénégal", language: "Français/Wolof", tags: ["talk", "news"] },
  { id: 3, name: "Zik FM", type: "radio", url: "https://stream.zikfm.sn/zikfm", status: "inactive", bitrate: "128 kbps", codec: "AAC", country: "Sénégal", language: "Français/Wolof", tags: ["music", "entertainment"] },
  { id: 4, name: "RTS Radio", type: "radio", url: "https://stream.rts.sn/radio", status: "active", bitrate: "64 kbps", codec: "MP3", country: "Sénégal", language: "Français/Wolof", tags: ["public", "news"] },
];

const mockTVStations = [
  { id: 5, name: "RTS 1", type: "tv", url: "https://stream.rts.sn/rts1", status: "active", bitrate: "1.5 Mbps", codec: "H.264", country: "Sénégal", language: "Français/Wolof", tags: ["public", "entertainment"] },
  { id: 6, name: "2STV", type: "tv", url: "https://stream.2stv.sn/live", status: "active", bitrate: "2 Mbps", codec: "H.264", country: "Sénégal", language: "Français/Wolof", tags: ["entertainment", "music"] },
  { id: 7, name: "TFM", type: "tv", url: "https://stream.tfm.sn/live", status: "inactive", bitrate: "1.8 Mbps", codec: "H.264", country: "Sénégal", language: "Français/Wolof", tags: ["entertainment", "news"] },
];

export default function StationsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [stations, setStations] = useState([...mockRadioStations, ...mockTVStations]);
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [intervalValue, setIntervalValue] = useState(60);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  
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
  
  // Filtrer les stations en fonction du terme de recherche et de l'onglet actif
  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         station.url.toLowerCase().includes(searchValue.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "radio") return matchesSearch && station.type === "radio";
    if (activeTab === "tv") return matchesSearch && station.type === "tv";
    if (activeTab === "active") return matchesSearch && station.status === "active";
    if (activeTab === "inactive") return matchesSearch && station.status === "inactive";
    if (activeTab === "monitoring") {
      const sessionIds = monitoringSessions.map(session => session.channel_id);
      return matchesSearch && sessionIds.includes(station.id.toString());
    }
    
    return matchesSearch;
  });

  // Simuler l'importation de stations radio
  const handleImportRadioStations = () => {
    // Normalement, cela déclencherait un appel API
    alert("Importation des stations radio depuis RadioBrowser API...");
  };

  // Simuler le test d'une station
  const handleTestStation = (stationId: number) => {
    // Normalement, cela déclencherait un appel API
    alert(`Test de la station ${stationId} en cours...`);
  };
  
  // Démarrer une session de surveillance
  const handleStartMonitoring = async () => {
    if (!selectedStation) return;
    
    setIsStartingSession(true);
    try {
      const result = await detectionService.startMonitoringSession(
        selectedStation.id.toString(),
        { interval_seconds: intervalValue }
      );
      
      setMonitoringSessions(prev => [...prev, result]);
      
      toast({
        title: "Succès",
        description: `Surveillance de ${selectedStation.name} démarrée avec succès`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur lors du démarrage de la surveillance:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la surveillance",
        variant: "destructive",
      });
    } finally {
      setIsStartingSession(false);
    }
  };
  
  // Arrêter une session de surveillance
  const handleStopMonitoring = async (stationId: number) => {
    setIsStoppingSession(true);
    try {
      await detectionService.stopMonitoringSession(
        stationId.toString(),
        "Arrêt manuel depuis l'interface"
      );
      
      // Retirer la session de la liste
      setMonitoringSessions(prev => 
        prev.filter(session => session.channel_id !== stationId.toString())
      );
      
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
  
  // Vérifier si une station est en cours de surveillance
  const isMonitoring = (stationId: number) => {
    return monitoringSessions.some(
      session => session.channel_id === stationId.toString() && session.status === 'active'
    );
  };
  
  // Obtenir la session de surveillance d'une station
  const getMonitoringSession = (stationId: number) => {
    return monitoringSessions.find(
      session => session.channel_id === stationId.toString()
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Stations</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleImportRadioStations}>
            <Radio className="mr-2 h-4 w-4" />
            Importer des stations
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une station
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher des stations..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1"
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="radio" className="flex items-center">
            <Radio className="mr-2 h-4 w-4" />
            Radio
          </TabsTrigger>
          <TabsTrigger value="tv" className="flex items-center">
            <Tv className="mr-2 h-4 w-4" />
            TV
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            Actives
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center">
            <X className="mr-2 h-4 w-4" />
            Inactives
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center">
            <Play className="mr-2 h-4 w-4" />
            En surveillance
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Stations {activeTab !== "all" ? activeTab : ""}</CardTitle>
              <CardDescription>
                {filteredStations.length} station(s) trouvée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Qualité</TableHead>
                      <TableHead>Surveillance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium">{station.name}</TableCell>
                        <TableCell>
                          {station.type === "radio" ? (
                            <Badge variant="outline" className="flex items-center w-fit">
                              <Radio className="mr-1 h-3 w-3" />
                              Radio
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center w-fit">
                              <Tv className="mr-1 h-3 w-3" />
                              TV
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{station.url}</TableCell>
                        <TableCell>
                          {station.status === "active" ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <Wifi className="mr-1 h-3 w-3" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              <X className="mr-1 h-3 w-3" />
                              Inactif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>{station.bitrate}</p>
                            <p className="text-muted-foreground">{station.codec}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isMonitoring(station.id) ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge className="bg-blue-100 text-blue-800 cursor-help">
                                    <Play className="mr-1 h-3 w-3" />
                                    En cours
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Intervalle: {getMonitoringSession(station.id)?.interval_seconds}s</p>
                                  <p>Détections: {getMonitoringSession(station.id)?.detection_count}</p>
                                  <p>Démarré le: {new Date(getMonitoringSession(station.id)?.started_at || "").toLocaleString()}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              <StopCircle className="mr-1 h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleTestStation(station.id)}>
                                Tester
                              </DropdownMenuItem>
                              <DropdownMenuItem>Modifier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {isMonitoring(station.id) ? (
                                <DropdownMenuItem 
                                  onClick={() => handleStopMonitoring(station.id)}
                                  disabled={isStoppingSession}
                                  className="text-red-600"
                                >
                                  <StopCircle className="mr-2 h-4 w-4" />
                                  Arrêter la surveillance
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedStation(station);
                                    setIsDialogOpen(true);
                                  }}
                                  disabled={station.status !== "active"}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Démarrer la surveillance
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {monitoringSessions.length > 0 ? 
                  `${monitoringSessions.length} sessions de surveillance actives` : 
                  "Aucune session de surveillance active"}
              </div>
              {monitoringSessions.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab("monitoring")}>
                  <Play className="mr-2 h-4 w-4" />
                  Voir les sessions actives
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Dialog pour configurer une nouvelle session de surveillance */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer la surveillance en temps réel</DialogTitle>
            <DialogDescription>
              Configurez la fréquence de surveillance pour {selectedStation?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interval">
                Intervalle de détection (secondes)
              </Label>
              <div className="flex items-center space-x-4">
                <Slider
                  id="interval"
                  min={30}
                  max={300}
                  step={30}
                  value={[intervalValue]}
                  onValueChange={(value) => setIntervalValue(value[0])}
                />
                <span className="w-12 text-center font-medium">
                  {intervalValue}s
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                L'intervalle recommandé est entre 60 et 120 secondes pour une détection optimale.
              </p>
            </div>
            
            <div className="flex items-center space-x-2 rounded-md border p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div className="ml-2 text-sm text-muted-foreground">
                La surveillance en temps réel consomme des ressources système. Nous vous recommandons
                de limiter le nombre de sessions actives simultanées.
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleStartMonitoring} disabled={isStartingSession}>
              {isStartingSession ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Démarrage...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Démarrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 