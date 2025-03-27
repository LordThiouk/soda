"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  File, 
  FileSpreadsheet, 
  FileType, 
  FileText,
  MoreVertical,
  Plus,
  Search,
  Trash,
  CalendarIcon,
  ArrowUpDown
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Rapports simulés
const rapports = [
  {
    id: "1",
    nom: "Rapport mensuel - Octobre 2023",
    type: "Mensuel",
    format: "PDF",
    dateCreation: "2023-10-31T10:15:00Z",
    statut: "Terminé",
    creePar: "John Doe",
    taille: "2.4 MB"
  },
  {
    id: "2",
    nom: "Rapport trimestriel - Q3 2023",
    type: "Trimestriel",
    format: "XLSX",
    dateCreation: "2023-10-15T14:30:00Z",
    statut: "Terminé",
    creePar: "John Doe",
    taille: "3.8 MB"
  },
  {
    id: "3",
    nom: "Rapport TFM - Septembre 2023",
    type: "Chaîne spécifique",
    format: "CSV",
    dateCreation: "2023-09-30T09:45:00Z",
    statut: "Terminé",
    creePar: "Sarah Smith",
    taille: "1.2 MB"
  },
  {
    id: "4",
    nom: "Rapport RTS1 - Semaine 40",
    type: "Hebdomadaire",
    format: "PDF",
    dateCreation: "2023-10-10T11:20:00Z",
    statut: "Terminé",
    creePar: "John Doe",
    taille: "1.7 MB"
  },
  {
    id: "5",
    nom: "Rapport annuel 2022",
    type: "Annuel",
    format: "XLSX",
    dateCreation: "2023-01-15T16:10:00Z",
    statut: "Terminé",
    creePar: "Sarah Smith",
    taille: "5.1 MB"
  },
  {
    id: "6",
    nom: "Rapport Youssou N'Dour",
    type: "Artiste spécifique",
    format: "PDF",
    dateCreation: "2023-10-05T08:45:00Z",
    statut: "Terminé",
    creePar: "John Doe",
    taille: "1.8 MB"
  },
  {
    id: "7",
    nom: "Rapport génération en cours",
    type: "Mensuel",
    format: "PDF",
    dateCreation: "2023-11-05T14:20:00Z",
    statut: "En cours",
    progression: 45,
    creePar: "John Doe",
    taille: "- -"
  }
];

export default function RapportsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("all");
  const [selectedPeriode, setSelectedPeriode] = useState<string>("all");
  
  // Logique de filtrage des rapports
  const filteredRapports = rapports.filter(rapport => {
    // Filtre par recherche
    if (searchValue && !rapport.nom.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    // Filtre par format
    if (selectedFormat && selectedFormat !== 'all' && rapport.format !== selectedFormat) {
      return false;
    }
    // Filtre par période/type
    if (selectedPeriode && selectedPeriode !== 'all' && rapport.type !== selectedPeriode) {
      return false;
    }
    return true;
  });
  
  // Formatage de la date pour affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Fonction pour déterminer l'icône du rapport en fonction du format
  const getReportIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileType className="h-5 w-5 text-red-500" />;
      case 'XLSX':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'CSV':
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Rapports</h1>
          <p className="text-muted-foreground">Générez et consultez des rapports de diffusion</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rapport
        </Button>
      </div>
      
      <Tabs defaultValue="rapports">
        <TabsList>
          <TabsTrigger value="rapports">Mes rapports</TabsTrigger>
          <TabsTrigger value="generer">Générer un rapport</TabsTrigger>
        </TabsList>
        
        <TabsContent value="rapports" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Recherche</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher un rapport..."
                      className="pl-8"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={selectedFormat}
                    onValueChange={(value) => setSelectedFormat(value)}
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Tous les formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les formats</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="periode">Type de rapport</Label>
                  <Select
                    value={selectedPeriode}
                    onValueChange={(value) => setSelectedPeriode(value)}
                  >
                    <SelectTrigger id="periode">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="Mensuel">Mensuel</SelectItem>
                      <SelectItem value="Trimestriel">Trimestriel</SelectItem>
                      <SelectItem value="Hebdomadaire">Hebdomadaire</SelectItem>
                      <SelectItem value="Annuel">Annuel</SelectItem>
                      <SelectItem value="Chaîne spécifique">Chaîne spécifique</SelectItem>
                      <SelectItem value="Artiste spécifique">Artiste spécifique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Liste des rapports */}
          <Card>
            <CardHeader>
              <CardTitle>Rapports disponibles</CardTitle>
              <CardDescription>
                {filteredRapports.length} rapport(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-2 text-left font-medium">
                        <div className="flex items-center">
                          Nom
                          <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground" />
                        </div>
                      </th>
                      <th className="py-3 px-2 text-left font-medium">Type</th>
                      <th className="py-3 px-2 text-left font-medium">Format</th>
                      <th className="py-3 px-2 text-left font-medium">Date de création</th>
                      <th className="py-3 px-2 text-left font-medium">Statut</th>
                      <th className="py-3 px-2 text-left font-medium">Taille</th>
                      <th className="py-3 px-2 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRapports.map((rapport) => (
                      <tr key={rapport.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {getReportIcon(rapport.format)}
                            <span>{rapport.nom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">{rapport.type}</td>
                        <td className="py-3 px-2">{rapport.format}</td>
                        <td className="py-3 px-2">{formatDate(rapport.dateCreation)}</td>
                        <td className="py-3 px-2">
                          {rapport.statut === "Terminé" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Terminé
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                En cours
                              </span>
                              <Progress value={rapport.progression} className="h-1.5 w-24" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2">{rapport.taille}</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center gap-2">
                            {rapport.statut === "Terminé" && (
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Télécharger</span>
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Plus d'options</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredRapports.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    Aucun rapport ne correspond à vos critères de recherche.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet de génération de rapport */}
        <TabsContent value="generer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Générer un nouveau rapport</CardTitle>
              <CardDescription>
                Configurez les paramètres pour générer un rapport personnalisé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Type de rapport */}
              <div className="space-y-2">
                <Label htmlFor="report-type">Type de rapport</Label>
                <Select defaultValue="mensuel">
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Sélectionner un type de rapport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuel">Mensuel</SelectItem>
                    <SelectItem value="trimestriel">Trimestriel</SelectItem>
                    <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                    <SelectItem value="annuel">Annuel</SelectItem>
                    <SelectItem value="personnalise">Période personnalisée</SelectItem>
                    <SelectItem value="chaine">Chaîne spécifique</SelectItem>
                    <SelectItem value="artiste">Artiste spécifique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Période */}
              <div className="space-y-2">
                <Label htmlFor="date-range">Période</Label>
                <DateRangePicker className="w-full" />
              </div>
              
              {/* Chaînes */}
              <div className="space-y-2">
                <Label htmlFor="channels">Chaînes</Label>
                <Select defaultValue="all">
                  <SelectTrigger id="channels">
                    <SelectValue placeholder="Sélectionner des chaînes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les chaînes</SelectItem>
                    <SelectItem value="rts1">RTS 1</SelectItem>
                    <SelectItem value="tfm">TFM</SelectItem>
                    <SelectItem value="2stv">2STV</SelectItem>
                    <SelectItem value="sentv">Sen TV</SelectItem>
                    <SelectItem value="rdv">RDV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Format du rapport */}
              <div className="space-y-4">
                <Label>Format du rapport</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pdf" defaultChecked />
                    <Label htmlFor="pdf" className="flex items-center">
                      <FileType className="h-5 w-5 text-red-500 mr-2" />
                      PDF
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="xlsx" />
                    <Label htmlFor="xlsx" className="flex items-center">
                      <FileSpreadsheet className="h-5 w-5 text-green-600 mr-2" />
                      Excel (XLSX)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="csv" />
                    <Label htmlFor="csv" className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-500 mr-2" />
                      CSV
                    </Label>
                  </div>
                </div>
              </div>
              
              {/* Options avancées */}
              <div className="space-y-2">
                <Label>Options avancées</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-metadata" defaultChecked />
                    <Label htmlFor="include-metadata">Inclure les métadonnées des morceaux</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-timestamps" defaultChecked />
                    <Label htmlFor="include-timestamps">Inclure les horodatages précis</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-isrc" defaultChecked />
                    <Label htmlFor="include-isrc">Inclure les codes ISRC</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="include-charts" defaultChecked />
                    <Label htmlFor="include-charts">Inclure des graphiques (PDF uniquement)</Label>
                  </div>
                </div>
              </div>
              
              {/* Nom du rapport */}
              <div className="space-y-2">
                <Label htmlFor="report-name">Nom du rapport</Label>
                <Input id="report-name" placeholder="Rapport mensuel - Novembre 2023" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Annuler</Button>
              <Button>Générer le rapport</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 