import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex flex-col items-start">
              <span className="font-bold text-primary text-xl">SODAV</span>
              <span className="text-muted-foreground text-sm">Monitor</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
            Tableau de bord
          </Link>
          <Link href="/analytics" className="text-foreground hover:text-primary transition-colors">
            Analyses
          </Link>
          <Link href="/reports" className="text-foreground hover:text-primary transition-colors">
            Rapports
          </Link>
          <Link href="/settings" className="text-foreground hover:text-primary transition-colors">
            Paramètres
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Inscription</Link>
          </Button>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors">
                  Tableau de bord
                </Link>
                <Link href="/analytics" className="text-foreground hover:text-primary transition-colors">
                  Analyses
                </Link>
                <Link href="/reports" className="text-foreground hover:text-primary transition-colors">
                  Rapports
                </Link>
                <Link href="/settings" className="text-foreground hover:text-primary transition-colors">
                  Paramètres
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 