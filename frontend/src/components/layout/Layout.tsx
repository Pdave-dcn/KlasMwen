import { useState } from "react";

import PostForm from "@/features/PostCreation/components/PostForm";
import PostTypeSelector from "@/features/PostCreation/components/PostTypeSelector";
import type { PostType } from "@/zodSchemas/post.zod";

import MobileTabBar from "./MobileSidebar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleTypeSelect = (type: PostType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedType(null);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar - show only on md+ */}
      <aside className="hidden md:block w-auto lg:w-60 lg:border-r shrink-0">
        <Sidebar
          onCreateClick={() => {
            setShowTypeSelector(true);
          }}
        />
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>

      <MobileTabBar
        onCreateClick={() => {
          setShowTypeSelector(true);
        }}
      />

      <PostTypeSelector
        open={showTypeSelector}
        onSelect={handleTypeSelect}
        onClose={() => setShowTypeSelector(false)}
      />

      <PostForm
        open={showForm}
        onClose={handleFormClose}
        postType={selectedType}
      />
    </div>
  );
};

export default Layout;
