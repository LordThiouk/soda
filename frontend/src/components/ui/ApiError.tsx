'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiErrorProps {
  error: Error | null;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}

const ApiError = ({ 
  error, 
  title = "Erreur", 
  onDismiss,
  className = "" 
}: ApiErrorProps) => {
  if (!error) return null;

  return (
    <Alert 
      variant="destructive" 
      className={`relative ${className}`}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {error.message || "Une erreur inattendue s'est produite."}
      </AlertDescription>
      {onDismiss && (
        <Button 
          variant="ghost" 
          className="absolute top-2 right-2 h-8 w-8 p-0" 
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </Button>
      )}
    </Alert>
  );
};

export default ApiError; 