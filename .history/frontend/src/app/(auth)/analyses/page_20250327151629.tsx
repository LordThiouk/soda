import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par chaîne</CardTitle>
            <CardDescription>
              Nombre de diffusions par chaîne sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-muted-foreground">Graphique en camembert</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Évolution temporelle</CardTitle>
            <CardDescription>
              Évolution des diffusions sur la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-muted-foreground">Graphique en ligne</p>
            </div>
          </CardContent>
        </Card>
      </div>

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