"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { AreaChart, BarChart } from "@/components/ui/charts";
import { 
  ArrowDown, 
  ArrowUp, 
  BarChartIcon, 
  CalendarIcon, 
  DownloadIcon,
  FilterIcon,
  MusicIcon,
  RadioIcon,
  Share2Icon
} from "lucide-react";

// Données simulées pour les artistes
const topArtistes = [
  { nom: "Youssou N'Dour", diffusions: 145, variation: 12 },
  { nom: "Wally Seck", diffusions: 132, variation: -5 },
  { nom: "Viviane Chidid", diffusions: 98, variation: 8 },
  { nom: "Pape Diouf", diffusions: 87, variation: 15 },
  { nom: "Baba Maal", diffusions: 76, variation: 3 },
];

// Données simulées pour les titres
const topTitres = [
  { titre: "Birima", artiste: "Youssou N'Dour", diffusions: 68, variation: 5 },
  { titre: "Sante Yalla", artiste: "Wally Seck", diffusions: 54, variation: -2 },
  { titre: "Sama Choice", artiste: "Viviane Chidid", diffusions: 48, variation: 10 },
  { titre: "Xaritou Dine", artiste: "Pape Diouf", diffusions: 43, variation: 7 },
  { titre: "Baayo", artiste: "Baba Maal", diffusions: 39, variation: -1 },
];

// Données simulées pour le graphique des diffusions par mois
const diffusionsParMois = [
  { mois: "Jan", diffusions: 1245 },
  { mois: "Fév", diffusions: 1345 },
  { mois: "Mar", diffusions: 1530 },
  { mois: "Avr", diffusions: 1620 },
  { mois: "Mai", diffusions: 1480 },
  { mois: "Juin", diffusions: 1390 },
  { mois: "Juil", diffusions: 1650 },
  { mois: "Août", diffusions: 1720 },
  { mois: "Sep", diffusions: 1810 },
  { mois: "Oct", diffusions: 1930 },
  { mois: "Nov", diffusions: 1850 },
  { mois: "Déc", diffusions: 1720 },
];

// Données simulées pour le graphique des chaînes
const diffusionsParChaine = [
  { chaine: "RTS 1", diffusions: 870 },
  { chaine: "TFM", diffusions: 760 },
  { chaine: "2STV", diffusions: 640 },
  { chaine: "SenTV", diffusions: 580 },
  { chaine: "iRadio", diffusions: 520 },
  { chaine: "Zik FM", diffusions: 490 },
  { chaine: "RFM", diffusions: 450 },
  { chaine: "DTV", diffusions: 380 },
];

// Données simulées pour le graphique des heures
const diffusionsParHeure = Array.from({ length: 24 }, (_, i) => {
  // Plus de diffusions pendant les heures de pointe
  let diffusions = 0;
  if (i >= 6 && i <= 9) { // Matin
    diffusions = 80 + Math.floor(Math.random() * 40);
  } else if (i >= 12 && i <= 14) { // Midi
    diffusions = 70 + Math.floor(Math.random() * 30);
  } else if (i >= 17 && i <= 22) { // Soir
    diffusions = 90 + Math.floor(Math.random() * 50);
  } else {
    diffusions = 20 + Math.floor(Math.random() * 30);
  }
  
  return { 
    heure: `${i}h`, 
    diffusions 
  };
});

export default function AnalysesPage() {
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState("mois");

  // Format des données pour les graphiques
  const donneesParMois = {
    data: diffusionsParMois,
    index: "mois",
    categories: ["diffusions"],
    colors: ['#00853F'], // Vert du drapeau sénégalais
    valueFormatter: (value: number) => `${value} diffusions`,
  };

  const donneesParChaine = {
    data: diffusionsParChaine,
    index: "chaine",
    categories: ["diffusions"],
    colors: ['#FDEF42'], // Jaune du drapeau sénégalais
    valueFormatter: (value: number) => `${value} diffusions`,
  };

  const donneesParHeure = {
    data: diffusionsParHeure,
    index: "heure",
    categories: ["diffusions"],
    colors: ['#E31B23'], // Rouge du drapeau sénégalais
    valueFormatter: (value: number) => `${value} diffusions`,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analyses & Statistiques</h1>
          <p className="text-muted-foreground">Explorez les tendances de diffusion de la musique</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker />
          <Button variant="outline" size="icon">
            <Share2Icon className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <DownloadIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total des diffusions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">18,540</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span>12.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Artistes diffusés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">632</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span>8.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Titres uniques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">1,845</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span>15.3%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chaînes monitorées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">24</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUp className="mr-1 h-4 w-4" />
                <span>4.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphiques en onglets */}
      <Tabs defaultValue="evolution">
        <TabsList className="mb-4">
          <TabsTrigger value="evolution">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Évolution
          </TabsTrigger>
          <TabsTrigger value="chaines">
            <RadioIcon className="h-4 w-4 mr-2" />
            Par chaîne
          </TabsTrigger>
          <TabsTrigger value="horaires">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Par horaire
          </TabsTrigger>
          <TabsTrigger value="artistes">
            <MusicIcon className="h-4 w-4 mr-2" />
            Top artistes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Évolution des diffusions</CardTitle>
                <Select defaultValue="mois" onValueChange={setPeriodeSelectionnee}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semaine">Cette semaine</SelectItem>
                    <SelectItem value="mois">Ce mois</SelectItem>
                    <SelectItem value="trimestre">Ce trimestre</SelectItem>
                    <SelectItem value="annee">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <CardDescription>
                Nombre total de diffusions musicales par période
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <AreaChart 
                data={donneesParMois.data}
                index={donneesParMois.index}
                categories={donneesParMois.categories}
                colors={donneesParMois.colors}
                valueFormatter={donneesParMois.valueFormatter}
                showLegend={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chaines">
          <Card>
            <CardHeader>
              <CardTitle>Diffusions par chaîne</CardTitle>
              <CardDescription>
                Nombre de diffusions musicales par chaîne pour la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <BarChart
                data={donneesParChaine.data}
                index={donneesParChaine.index}
                categories={donneesParChaine.categories}
                colors={donneesParChaine.colors}
                valueFormatter={donneesParChaine.valueFormatter}
                showLegend={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="horaires">
          <Card>
            <CardHeader>
              <CardTitle>Diffusions par tranche horaire</CardTitle>
              <CardDescription>
                Répartition des diffusions musicales en fonction de l'heure de la journée
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <BarChart 
                data={donneesParHeure.data}
                index={donneesParHeure.index}
                categories={donneesParHeure.categories}
                colors={donneesParHeure.colors}
                valueFormatter={donneesParHeure.valueFormatter}
                showLegend={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="artistes">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 des artistes</CardTitle>
                <CardDescription>
                  Artistes les plus diffusés sur la période
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topArtistes.map((artiste, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <span className="font-medium">{artiste.nom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{artiste.diffusions}</span>
                        <div className={`flex items-center text-xs ${artiste.variation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {artiste.variation > 0 ? (
                            <ArrowUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 mr-1" />
                          )}
                          <span>{Math.abs(artiste.variation)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top 5 des titres</CardTitle>
                <CardDescription>
                  Titres les plus diffusés sur la période
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topTitres.map((titre, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-muted w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{titre.titre}</span>
                          <span className="text-xs text-muted-foreground">{titre.artiste}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{titre.diffusions}</span>
                        <div className={`flex items-center text-xs ${titre.variation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {titre.variation > 0 ? (
                            <ArrowUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 mr-1" />
                          )}
                          <span>{Math.abs(titre.variation)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 