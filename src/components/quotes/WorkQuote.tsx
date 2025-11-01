import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

const quotes = [
  {
    text: "Le temps est votre bien le plus précieux, car c'est le seul que vous ne pourrez jamais récupérer.",
    author: "Anonyme"
  },
  {
    text: "Celui qui maîtrise son temps maîtrise sa vie.",
    author: "Proverbe"
  },
  {
    text: "Le travail bien fait n'a pas besoin d'éloge, il parle de lui-même.",
    author: "Sagesse populaire"
  },
  {
    text: "La ponctualité est la politesse des rois.",
    author: "Louis XVIII"
  },
  {
    text: "Ne remets pas à demain ce que tu peux faire aujourd'hui.",
    author: "Proverbe"
  },
  {
    text: "Le temps perdu ne se rattrape jamais.",
    author: "Proverbe français"
  },
  {
    text: "La clé n'est pas de donner la priorité à ce qui est dans votre agenda, mais de planifier vos priorités.",
    author: "Stephen Covey"
  },
  {
    text: "Un objectif sans plan n'est qu'un souhait.",
    author: "Antoine de Saint-Exupéry"
  },
  {
    text: "Le repos fait partie du travail.",
    author: "Proverbe chinois"
  },
  {
    text: "Choisissez un travail que vous aimez et vous n'aurez pas à travailler un seul jour de votre vie.",
    author: "Confucius"
  }
];

export const WorkQuote = () => {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 8000); // Change quote every 8 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="flex items-start gap-4">
        <Quote className="h-8 w-8 text-primary/30 flex-shrink-0 mt-1" />
        <div className="flex-1 animate-fade-in" key={currentQuote}>
          <p className="text-lg font-medium text-foreground/90 italic leading-relaxed mb-2">
            "{quotes[currentQuote].text}"
          </p>
          <p className="text-sm text-muted-foreground font-medium">
            — {quotes[currentQuote].author}
          </p>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="flex gap-1.5 mt-6">
        {quotes.map((_, index) => (
          <div
            key={index}
            className={`h-1 rounded-full transition-all duration-500 ${
              index === currentQuote
                ? "flex-1 bg-gradient-to-r from-primary to-accent"
                : "w-8 bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
