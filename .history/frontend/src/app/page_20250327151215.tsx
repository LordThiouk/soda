import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header avec navigation simple */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-xl">SODAV</span>
            <span className="text-muted-foreground text-sm">Monitor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Inscription</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Section héro */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-24 bg-gradient-to-b from-background to-muted">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-primary">Surveillance</span> des diffusions musicales <span className="text-accent">simplifiée</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Système automatisé de surveillance des radios et chaînes TV sénégalaises pour une gestion transparente des droits d'auteur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">Commencer maintenant</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Section fonctionnalités */}
      <section className="py-12 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fonctionnalités principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Surveillance en temps réel</h3>
              <p className="text-muted-foreground">Détection automatique des morceaux diffusés sur les radios et chaînes TV sénégalaises.</p>
            </div>
            
            <div className="border border-border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4 text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Rapports détaillés</h3>
              <p className="text-muted-foreground">Génération de rapports précis pour une distribution transparente des droits d'auteur.</p>
            </div>
            
            <div className="border border-border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Corrections manuelles</h3>
              <p className="text-muted-foreground">Possibilité de corriger manuellement les morceaux mal identifiés pour garantir l'exactitude des données.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-border bg-muted py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SODAV Monitor. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
