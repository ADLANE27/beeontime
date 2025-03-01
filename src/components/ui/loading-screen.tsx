
import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Chargement..." }: LoadingScreenProps) => {
  return null; // Completely disabled loading screen
};
