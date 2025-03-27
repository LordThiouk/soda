import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { PieChart } from "@/components/charts/PieChart";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Données de démonstration pour les graphiques
const channelData = [
  { name: "RTS1", value: 156 },
  { name: "TFM", value: 124 },
  { name: "2STV", value: 98 },
  { name: "SenTV", value: 87 },
  { name: "RDV", value: 76 },
  { name: "Autres", value: 106 },
];

const artistData = [
  { name: "Youssou N'Dour", value: 42 },
  { name: "Wally Seck", value: 35 },
  { name: "Viviane Chidid", value: 28 },
  { name: "Pape Diouf", value: 23 },
  { name: "Aida Samb", value: 19 },
];

const weeklyData = [
  { date: "10/05", RTS1: 24, TFM: 18, "2STV": 15 },
  { date: "11/05", RTS1: 27, TFM: 21, "2STV": 14 },
  { date: "12/05", RTS1: 25, TFM: 19, "2STV": 16 },
  { date: "13/05", RTS1: 30, TFM: 22, "2STV": 18 },
  { date: "14/05", RTS1: 33, TFM: 20, "2STV": 19 },
  { date: "15/05", RTS1: 31, TFM: 24, "2STV": 17 },
  { date: "16/05", RTS1: 29, TFM: 23, "2STV": 16 },
];

const weeklySeries = [
  { dataKey: "RTS1", color: "#00853F" },
  { dataKey: "TFM", color: "#FDEF42" },
  { dataKey: "2STV", color: "#BC0032" },
];

export default function AnalysesPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyses</h1>
          <p className="text-muted-foreground">
            Analysez en détail les diffusions par période, chaîne ou artiste
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button>Analyser</Button>
          <Button variant="outline">Exporter</Button>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Affinez votre analyse en fonction de vos besoins
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="date-start">Date de début</Label>
              <Input id="date-start" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-end">Date de fin</Label>
              <Input id="date-end" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Chaîne</Label>
              <select
                id="channel"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Toutes les chaînes</option>
                <option value="rts1">RTS1</option>
                <option value="2stv">2STV</option>
                <option value="tfm">TFM</option>
                <option value="rdv">RDV</option>
                <option value="sentv">Sen TV</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="artist">Artiste</Label>
              <Input id="artist" placeholder="Nom de l'artiste" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualisations */}
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="channels">Par chaîne</TabsTrigger>
          <TabsTrigger value="artists">Par artiste</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution par chaîne</CardTitle>
                <CardDescription>
                  Répartition des diffusions sur les différentes chaînes
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <PieChart data={channelData} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top artistes</CardTitle>
                <CardDescription>
                  Les 5 artistes les plus diffusés
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <BarChart 
                  data={artistData} 
                  xAxisKey="name" 
                  yAxisKey="value" 
                  barKey="value" 
                  rotateLabels
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des diffusions par chaîne</CardTitle>
              <CardDescription>
                Nombre de diffusions quotidiennes sur les principales chaînes
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <LineChart 
                data={weeklyData} 
                series={weeklySeries}
                xAxisKey="date"
                height={400}
                showGrid
                showLegend
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="artists">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par artiste</CardTitle>
              <CardDescription>
                Nombre de diffusions par artiste
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <BarChart 
                data={artistData.sort((a, b) => b.value - a.value)} 
                xAxisKey="name" 
                yAxisKey="value" 
                barKey="value"
                layout="vertical"
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendances de diffusion</CardTitle>
              <CardDescription>
                Évolution des diffusions au cours du temps
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <LineChart 
                data={weeklyData} 
                series={[{ dataKey: "RTS1", color: "#00853F" }]}
                xAxisKey="date"
                height={400}
                showGrid
                curveType="natural"
                strokeWidth={2}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tableau des résultats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Résultats détaillés</CardTitle>
          <CardDescription>
            Liste détaillée des diffusions selon les filtres sélectionnés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-2 text-left font-medium">Date</th>
                  <th className="py-3 px-2 text-left font-medium">Heure</th>
                  <th className="py-3 px-2 text-left font-medium">Chaîne</th>
                  <th className="py-3 px-2 text-left font-medium">Titre</th>
                  <th className="py-3 px-2 text-left font-medium">Artiste</th>
                  <th className="py-3 px-2 text-left font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0 ? "bg-muted/50" : "bg-background"
                    }
                  >
                    <td className="py-3 px-2">
                      {new Date().toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3 px-2">
                      {Math.floor(Math.random() * 12) + 10}:
                      {Math.floor(Math.random() * 60)
                        .toString()
                        .padStart(2, "0")}
                    </td>
                    <td className="py-3 px-2">
                      {["RTS1", "2STV", "TFM", "RDV", "Sen TV"][
                        Math.floor(Math.random() * 5)
                      ]}
                    </td>
                    <td className="py-3 px-2">
                      Titre de chanson {Math.floor(Math.random() * 100) + 1}
                    </td>
                    <td className="py-3 px-2">
                      {
                        ["Youssou N'Dour", "Wally Seck", "Viviane Chidid", "Pape Diouf", "Aida Samb"][
                          Math.floor(Math.random() * 5)
                        ]
                      }
                    </td>
                    <td className="py-3 px-2">
                      {Math.floor(Math.random() * 5) + 2}:
                      {Math.floor(Math.random() * 60)
                        .toString()
                        .padStart(2, "0")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <Button variant="outline" size="sm">
                Précédent
              </Button>
              <Button variant="outline" size="sm">
                Suivant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 