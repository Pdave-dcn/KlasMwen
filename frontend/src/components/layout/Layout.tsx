import { useState } from "react";

import PostForm from "@/features/PostCreation/components/postForm/PostForm";
import PostTypeSelector from "@/features/PostCreation/components/PostTypeSelector";
import PostEditForm from "@/features/postEdit/components/PostEditForm";
import { usePostEditStore } from "@/stores/postEdit.store";
import type { PostType } from "@/zodSchemas/post.zod";

import MobileTabBar from "./MobileSidebar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [showPostCreationForm, setShowPostCreationForm] = useState(false);

  const { isOpen, closeEditForm } = usePostEditStore();

  const handleTypeSelect = (type: PostType) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    setShowPostCreationForm(true);
  };

  const handlePostCreationFormClose = () => {
    setShowPostCreationForm(false);
    setSelectedType(null);
  };

  return (
    <div className="flex h-screen w-full">
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
        open={showPostCreationForm}
        onClose={handlePostCreationFormClose}
        postType={selectedType}
      />

      <PostEditForm open={isOpen} onClose={closeEditForm} />
    </div>
  );
};

export default Layout;
