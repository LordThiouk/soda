import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignupPage() {
  return (
    <div className="container flex items-center justify-center py-12 md:py-24">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Entrez vos informations pour créer un compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="exemple@sodav.sn" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organisation</Label>
            <Input id="organization" placeholder="SODAV" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              J'accepte les{" "}
              <Link href="/terms" className="text-primary hover:underline">
                conditions d'utilisation
              </Link>
              {" "}et la{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                politique de confidentialité
              </Link>
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full">S'inscrire</Button>
          <div className="text-sm text-muted-foreground text-center">
            Vous avez déjà un compte?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 