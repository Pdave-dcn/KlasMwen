const ProfileError = () => {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Error loading profile
        </h1>
        <p className="text-muted-foreground mt-2">
          Something went wrong. Please try again later.
        </p>
      </div>
    </main>
  );
};

export default ProfileError;
