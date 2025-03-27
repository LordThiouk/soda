"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart } from "@/components/charts/LineChart";
import { DetectionMonitor } from "@/components/realtime/DetectionMonitor";
import { ChannelStatusMonitor } from "@/components/realtime/ChannelStatusMonitor";

// Données de simulation pour le graphique en temps réel
const generateLiveData = () => {
  return Array.from({ length: 30 }, (_, i) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - (30 - i));
    
    return {
      timestamp: now.toISOString(),
      value: Math.floor(Math.random() * 10) + 1,
    };
  });
};

const channels = [
  { id: 1, name: "RTS1" },
  { id: 2, name: "2STV" },
  { id: 3, name: "TFM" },
  { id: 4, name: "SenTV" },
  { id: 5, name: "RDV" },
];

export default function RealtimePage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [liveData] = useState(generateLiveData());

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Transformer les données pour le graphique
  const chartData = liveData.map(item => ({
    date: formatTime(item.timestamp),
    detections: item.value,
  }));

  // Série pour le graphique
  const series = [
    { id: "detections", name: "Détections" }
  ];

  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Surveillance en Temps Réel</h1>
          <p className="text-muted-foreground">
            Surveillez les détections et le statut des chaînes en direct
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-6 mb-6">
        <Card className="md:col-span-4 lg:col-span-4">
          <CardHeader>
            <CardTitle>Activité de Détection</CardTitle>
            <CardDescription>
              Détections par minute en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <LineChart 
              data={chartData} 
              series={series} 
              xAxisKey="date" 
              showGrid={true}
              curveType="natural"
              showLegend={false}
            />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>
              Affiner la surveillance en temps réel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="channel-select">Chaîne</Label>
                <Select 
                  onValueChange={(value) => setSelectedChannel(value)}
                  defaultValue=""
                >
                  <SelectTrigger id="channel-select">
                    <SelectValue placeholder="Toutes les chaînes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les chaînes</SelectItem>
                    {channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id.toString()}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="detections" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="detections">Détections en direct</TabsTrigger>
          <TabsTrigger value="channels">Statut des chaînes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detections">
          <DetectionMonitor 
            channelId={selectedChannel ? parseInt(selectedChannel) : undefined} 
            limit={20} 
            autoRefresh={true} 
          />
        </TabsContent>
        
        <TabsContent value="channels">
          <ChannelStatusMonitor limit={20} autoRefresh={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 