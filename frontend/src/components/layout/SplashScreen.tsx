import { BookOpen } from "lucide-react";

const SplashScreen = () => (
  <div className="flex items-center justify-center h-screen dark:text-primary">
    <div className="flex items-center gap-2 text-3xl md:text-5xl font-bold animate-pulse">
      <BookOpen className="w-7 h-7 md:w-10 md:h-10" />
      KlasMwen
    </div>
  </div>
);

export default SplashScreen;
