const ProfileStats = ({
  stats,
}: {
  stats: { posts: number; followers: number; following: number };
}) => (
  <div className="flex justify-around md:justify-start gap-8 py-4 border-t border-b border-border md:border-none">
    {["posts", "followers", "following"].map((key) => (
      <div key={key} className="text-center">
        <div className="text-lg font-semibold text-foreground">
          {stats[key as keyof typeof stats]}
        </div>
        <div className="text-xs text-muted-foreground">{key}</div>
      </div>
    ))}
  </div>
);

export default ProfileStats;
