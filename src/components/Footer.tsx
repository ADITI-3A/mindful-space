import { Brain, Heart } from "lucide-react";

export const Footer = () => (
  <footer className="container py-10 mt-16">
    <div className="glass rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 font-display text-lg">
        <Brain className="w-5 h-5 text-primary" /> MindEase
      </div>
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        Built with <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> for mental wellness · Helpline: <strong className="text-foreground">14416</strong>
      </p>
      <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MindEase</p>
    </div>
  </footer>
);
