'use client';

import React, { ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Mettre à jour l'état pour afficher l'UI de secours
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Vous pouvez également enregistrer l'erreur dans un service de reporting
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Afficher le fallback personnalisé ou une UI par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 max-w-md mx-auto mt-8">
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Une erreur est survenue</AlertTitle>
            <AlertDescription>
              <p className="mt-2 mb-4 text-sm">
                {this.state.error?.message || "Une erreur inattendue s'est produite dans l'application."}
              </p>
              <Button variant="outline" onClick={this.resetError}>
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 