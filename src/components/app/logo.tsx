import { DatabaseZap } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <DatabaseZap className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold tracking-tight text-foreground">
        DataForge <span className="text-primary">AI</span>
      </h1>
    </div>
  );
}
