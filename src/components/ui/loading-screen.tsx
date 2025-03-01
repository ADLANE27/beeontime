
import React from "react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Chargement..." }: LoadingScreenProps) => {
  return (
    <div className="flex justify-center items-center p-4">
      <span>{message}</span>
    </div>
  );
};
