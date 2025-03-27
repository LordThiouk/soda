import Link from "next/link";
import { Bell, BarChart3, Settings, Headphones, PieChart, HomeIcon, Activity } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 bg-primary text-primary-foreground flex flex-col border-r">
        <div className="p-4 border-b flex items-center justify-center md:justify-start">
          <div className="hidden md:block font-bold text-lg">SODAV Monitor</div>
          <div className="block md:hidden text-xl font-bold">SM</div>
        </div>
        <nav className="p-2 flex-1">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Tableau de bord</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/realtime"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Activity className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Temps réel</span>
              </Link>
            </li>
            <li>
              <Link
                href="/analyses"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <BarChart3 className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Analyses</span>
              </Link>
            </li>
            <li>
              <Link
                href="/rapports"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <PieChart className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Rapports</span>
              </Link>
            </li>
            <li>
              <Link
                href="/stations"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Headphones className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Stations</span>
              </Link>
            </li>
            <li>
              <Link
                href="/parametres"
                className="flex items-center p-2 rounded-md hover:bg-primary-foreground/10 text-primary-foreground/80 hover:text-primary-foreground"
              >
                <Settings className="h-5 w-5 mr-3" />
                <span className="hidden md:inline-block">Paramètres</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center justify-center md:justify-between">
            <div className="hidden md:block text-sm">John Doe</div>
            <button className="p-2 rounded-md hover:bg-primary-foreground/10">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
} 