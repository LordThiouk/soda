import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ParametresPage() {
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez votre système SODAV Monitor
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="channels">Sources</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>
        
        {/* Onglet Profil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Modifiez vos informations personnelles et votre mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations personnelles</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-firstName">Prénom</Label>
                    <Input id="profile-firstName" defaultValue="Amadou" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-lastName">Nom</Label>
                    <Input id="profile-lastName" defaultValue="Diallo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input id="profile-email" type="email" defaultValue="amadou.diallo@sodav.sn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Téléphone</Label>
                    <Input id="profile-phone" type="tel" defaultValue="+221 77 123 45 67" />
                  </div>
                </div>
                <Button className="mt-2">Enregistrer les modifications</Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Sécurité</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Mot de passe actuel</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div></div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <Button className="mt-2">Changer le mot de passe</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Sources */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des sources</CardTitle>
              <CardDescription>
                Gérez les sources de diffusion à surveiller
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button>Ajouter une source</Button>
                </div>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-3 px-2 text-left font-medium">Chaîne</th>
                      <th className="py-3 px-2 text-left font-medium">Type</th>
                      <th className="py-3 px-2 text-left font-medium">URL</th>
                      <th className="py-3 px-2 text-left font-medium">Statut</th>
                      <th className="py-3 px-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "RTS1", type: "TV", url: "https://stream.rts.sn/rts1", status: "Actif" },
                      { name: "2STV", type: "TV", url: "https://stream.2stv.sn/live", status: "Actif" },
                      { name: "TFM", type: "TV", url: "https://stream.tfm.sn/live", status: "Actif" },
                      { name: "RFM", type: "Radio", url: "https://stream.rfm.sn/live", status: "Actif" },
                      { name: "ZIK FM", type: "Radio", url: "https://stream.zikfm.sn/live", status: "Inactif" },
                    ].map((channel, index) => (
                      <tr
                        key={index}
                        className={
                          index % 2 === 0 ? "bg-muted/50" : "bg-background"
                        }
                      >
                        <td className="py-3 px-2">{channel.name}</td>
                        <td className="py-3 px-2">{channel.type}</td>
                        <td className="py-3 px-2">{channel.url}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${channel.status === "Actif" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {channel.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Éditer
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
        </TabsContent>
        
        {/* Onglet Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notification</CardTitle>
              <CardDescription>
                Configurez vos préférences de notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Résumé quotidien</h3>
                    <p className="text-sm text-muted-foreground">
                      Recevoir un résumé quotidien des diffusions
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Alertes de statut</h3>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des alertes lorsqu'une chaîne change de statut
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b">
                  <div>
                    <h3 className="font-medium">Nouveaux rapports</h3>
                    <p className="text-sm text-muted-foreground">
                      Être notifié lorsqu'un nouveau rapport est disponible
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Alertes de modification manuelle</h3>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des notifications lorsqu'une modification manuelle est effectuée
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <h3 className="text-lg font-medium">Canaux de notification</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-notification">Email de notification</Label>
                    <Input id="email-notification" type="email" defaultValue="amadou.diallo@sodav.sn" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone-notification">Téléphone (SMS)</Label>
                    <Input id="phone-notification" type="tel" defaultValue="+221 77 123 45 67" />
                  </div>
                </div>
                <Button className="mt-4">Enregistrer les préférences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Onglet Système */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres système</CardTitle>
              <CardDescription>
                Configurez les paramètres généraux du système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration de l'analyse</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="matching-threshold">Seuil de correspondance (%)</Label>
                    <Input id="matching-threshold" type="number" min="0" max="100" defaultValue="80" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sample-rate">Taux d'échantillonnage (Hz)</Label>
                    <select
                      id="sample-rate"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="44100"
                    >
                      <option value="8000">8000 Hz</option>
                      <option value="16000">16000 Hz</option>
                      <option value="22050">22050 Hz</option>
                      <option value="44100">44100 Hz</option>
                      <option value="48000">48000 Hz</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-duration">Durée minimum (secondes)</Label>
                    <Input id="min-duration" type="number" min="1" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processing-mode">Mode de traitement</Label>
                    <select
                      id="processing-mode"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      defaultValue="realtime"
                    >
                      <option value="realtime">Temps réel</option>
                      <option value="batch">Traitement par lots</option>
                      <option value="hybrid">Hybride</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Base de données</h3>
                <div className="space-y-2">
                  <Button variant="outline">Synchroniser la base de données</Button>
                  <Button variant="outline">Exporter la base de données</Button>
                  <Button variant="outline">Sauvegarder la base de données</Button>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Maintenance</h3>
                <div className="space-y-2">
                  <Button variant="outline">Vérifier les mises à jour</Button>
                  <Button variant="outline">Nettoyer le cache</Button>
                  <Button variant="destructive">Réinitialiser le système</Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="mt-2">Enregistrer les paramètres</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 