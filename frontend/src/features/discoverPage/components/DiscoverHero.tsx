import { Sparkles } from "lucide-react";

const DiscoverHero = () => {
  return (
    <section className="py-20 px-4 text-center bg-linear-to-b from-primary/10 dark:from-primary/20 to-accent/5 dark:to-accent/15">
      <div className="container mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">By Students, For Students</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Welcome to KlasMwen
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          <span className="font-semibold text-foreground">KlasMwen</span> (from
          Haitian Creole "<em>klas mwen</em>", meaning "<em>my class</em>
          ") is an educational social platform designed for students to connect,
          collaborate, and grow together.
        </p>
      </div>
    </section>
  );
};

export default DiscoverHero;
