import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart } from "@/components/charts/AreaChart";
import DetectionMonitor from "@/components/realtime/DetectionMonitor";
import ChannelStatusMonitor from "@/components/realtime/ChannelStatusMonitor";

// Données de démonstration pour le graphique des tendances
const trendData = [
  { date: "Lun", count: 124 },
  { date: "Mar", count: 165 },
  { date: "Mer", count: 147 },
  { date: "Jeu", count: 189 },
  { date: "Ven", count: 238 },
  { date: "Sam", count: 267 },
  { date: "Dim", count: 186 },
];

export default function DashboardPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Aperçu des diffusions musicales détectées
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button>Générer un rapport</Button>
          <Button variant="outline">Exporter</Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Diffusions aujourd&apos;hui
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground">
              +12.5% par rapport à hier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Artistes diffusés
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-muted-foreground">
              +4.2% par rapport à hier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chaînes surveillées
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Toutes les chaînes sont actives
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Précision de détection
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">96.2%</div>
            <p className="text-xs text-muted-foreground">
              +1.2% par rapport à la semaine dernière
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques et tableaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Tendances de diffusion</CardTitle>
            <CardDescription>
              Diffusions musicales au cours des 7 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AreaChart data={trendData} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top artistes</CardTitle>
            <CardDescription>
              Les artistes les plus diffusés aujourd&apos;hui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Youssou N'Dour", "Wally Seck", "Viviane Chidid", "Pape Diouf", "Aida Samb"].map(
                (artist, index) => (
                  <div
                    key={artist}
                    className="flex items-center justify-between border-b border-border pb-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{index + 1}. {artist}</div>
                    </div>
                    <div className="font-medium">
                      {Math.floor(Math.random() * 20) + 5} diffusions
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surveillance en temps réel */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2 mb-6">
        <ChannelStatusMonitor />
        <DetectionMonitor limit={5} />
      </div>

      {/* Dernières détections */}
      <DetectionMonitor limit={10} autoRefresh={false} showHeader={true} />
    </div>
  );
} 