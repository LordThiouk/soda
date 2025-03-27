import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RapportsPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
          <p className="text-muted-foreground">
            Générez et consultez des rapports de diffusion personnalisés
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button>Nouveau rapport</Button>
        </div>
      </div>

      {/* Formulaire nouveau rapport */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Créer un nouveau rapport</CardTitle>
          <CardDescription>
            Configurez les paramètres de votre rapport personnalisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Nom du rapport</Label>
              <Input id="report-name" placeholder="Rapport mensuel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-type">Type de rapport</Label>
              <select
                id="report-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="complet">Rapport complet</option>
                <option value="synthese">Rapport de synthèse</option>
                <option value="artiste">Rapport par artiste</option>
                <option value="chaine">Rapport par chaîne</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-start">Période - Du</Label>
              <Input id="date-start" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-end">Au</Label>
              <Input id="date-end" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-format">Format</Label>
            <div className="flex gap-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="format-pdf"
                  name="report-format"
                  className="h-4 w-4 border-primary text-primary focus:ring-primary"
                />
                <label
                  htmlFor="format-pdf"
                  className="ml-2 text-sm font-medium"
                >
                  PDF
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="format-excel"
                  name="report-format"
                  className="h-4 w-4 border-primary text-primary focus:ring-primary"
                />
                <label
                  htmlFor="format-excel"
                  className="ml-2 text-sm font-medium"
                >
                  Excel
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="format-csv"
                  name="report-format"
                  className="h-4 w-4 border-primary text-primary focus:ring-primary"
                />
                <label
                  htmlFor="format-csv"
                  className="ml-2 text-sm font-medium"
                >
                  CSV
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Button>Générer le rapport</Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rapports */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports générés</CardTitle>
          <CardDescription>
            Historique de vos derniers rapports générés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="py-3 px-2 text-left font-medium">Nom</th>
                  <th className="py-3 px-2 text-left font-medium">Type</th>
                  <th className="py-3 px-2 text-left font-medium">Période</th>
                  <th className="py-3 px-2 text-left font-medium">Date de création</th>
                  <th className="py-3 px-2 text-left font-medium">Format</th>
                  <th className="py-3 px-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Rapport mensuel - Avril 2023",
                    type: "Rapport complet",
                    period: "01/04/2023 - 30/04/2023",
                    created: "02/05/2023",
                    format: "PDF"
                  },
                  {
                    name: "Synthèse trimestrielle",
                    type: "Rapport de synthèse",
                    period: "01/01/2023 - 31/03/2023",
                    created: "05/04/2023",
                    format: "Excel"
                  },
                  {
                    name: "Youssou N'Dour - Analyse",
                    type: "Rapport par artiste",
                    period: "01/01/2023 - 31/03/2023",
                    created: "02/04/2023",
                    format: "PDF"
                  },
                  {
                    name: "RTS1 - Q1 2023",
                    type: "Rapport par chaîne",
                    period: "01/01/2023 - 31/03/2023",
                    created: "01/04/2023",
                    format: "CSV"
                  },
                  {
                    name: "Bilan annuel 2022",
                    type: "Rapport complet",
                    period: "01/01/2022 - 31/12/2022",
                    created: "15/01/2023",
                    format: "Excel"
                  },
                ].map((report, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0 ? "bg-muted/50" : "bg-background"
                    }
                  >
                    <td className="py-3 px-2">{report.name}</td>
                    <td className="py-3 px-2">{report.type}</td>
                    <td className="py-3 px-2">{report.period}</td>
                    <td className="py-3 px-2">{report.created}</td>
                    <td className="py-3 px-2">{report.format}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Télécharger
                        </Button>
                        <Button variant="ghost" size="sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 