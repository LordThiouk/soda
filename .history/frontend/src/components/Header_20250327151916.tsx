import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Header() {
  const navItems = [
    { label: "Tableau de bord", href: "/dashboard" },
    { label: "Analyses", href: "/analyses" },
    { label: "Rapports", href: "/rapports" },
    { label: "Paramètres", href: "/parametres" },
  ];

  return (
    <header className="sticky top-0 z-10 w-full border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-primary text-xl">SODAV</span>
            <span className="text-muted-foreground text-sm">Monitor</span>
          </Link>
        </div>

        {/* Navigation bureau */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Inscription</Link>
            </Button>
          </div>

          {/* Menu mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login">Connexion</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/signup">Inscription</Link>
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
} 