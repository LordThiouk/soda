"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Radio, Tv, MoreVertical, Wifi, Check, X } from "lucide-react";
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
  
  // Filtrer les stations en fonction du terme de recherche et de l'onglet actif
  const filteredStations = [...mockRadioStations, ...mockTVStations].filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         station.url.toLowerCase().includes(searchValue.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "radio") return matchesSearch && station.type === "radio";
    if (activeTab === "tv") return matchesSearch && station.type === "tv";
    if (activeTab === "active") return matchesSearch && station.status === "active";
    if (activeTab === "inactive") return matchesSearch && station.status === "inactive";
    
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
        <TabsList className="grid grid-cols-5 w-full">
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
                Utilisez le menu déroulant pour gérer les stations
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 