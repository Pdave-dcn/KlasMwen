import { Bell, Construction } from "lucide-react";

const NotificationsPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Bell className="h-24 w-24 text-muted-foreground" />
            <Construction className="h-10 w-10 text-primary absolute -bottom-2 -right-2" />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-3">Notifications</h1>

        <p className="text-muted-foreground text-lg mb-2">
          We're working on something great!
        </p>

        <p className="text-muted-foreground">
          The notifications feature is currently under development. Soon you'll
          be able to stay updated with all your important activity here.
        </p>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Coming soon: Real-time notifications, activity updates, and more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
