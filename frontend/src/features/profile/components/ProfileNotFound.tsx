import { RefreshCw, User } from "lucide-react";

import { Button } from "@/components/ui/button";

const ProfileNotFound = () => {
  return (
    <>
      {/* Mobile layout */}
      <main className="md:hidden mb-10">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            User Not Found
          </h2>
          <p className="text-gray-500 text-center mb-6">
            This profile doesn't exist or may have been removed.
          </p>
          <Button className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </main>
      {/* Desktop layout */}
      <main className="hidden md:flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-16 px-8">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <User className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-3">
            User Not Found
          </h2>
          <p className="text-gray-500 text-center mb-8 max-w-md">
            This profile doesn't exist or may have been removed. Please check
            the username and try again.
          </p>
          <Button className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </main>
      )
    </>
  );
};

export default ProfileNotFound;
