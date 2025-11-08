import { Settings, Construction } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Settings className="h-24 w-24 text-muted-foreground" />
            <Construction className="h-10 w-10 text-primary absolute -bottom-2 -right-2" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Settings</h1>

        <p className="text-muted-foreground text-lg mb-2">
          We're working on something great!
        </p>

        <p className="text-muted-foreground">
          The settings page is currently under development. Soon you'll be able
          to customize your experience and manage your preferences here.
        </p>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Coming soon: Profile settings, privacy controls, notification
            preferences, and more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
