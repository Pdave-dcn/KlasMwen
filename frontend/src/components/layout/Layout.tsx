import { useState } from "react";

import { useLocation } from "react-router-dom";

import PostCreationForm from "@/features/PostCreation/components/postForm/PostCreationForm";
import PostTypeSelector from "@/features/PostCreation/components/PostTypeSelector";
import PostEditForm from "@/features/postEdit/components/PostEditForm";
import { useReportSubmission } from "@/hooks/useReportSubmission";
import { usePostEditStore } from "@/stores/postEdit.store";
import { useReportModalStore } from "@/stores/reportModal.store";
import type { PostType } from "@/zodSchemas/post.zod";

import { ReportDialog } from "../ReportDialog";

import MobileTabBar from "./MobileTabBar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [showPostCreationForm, setShowPostCreationForm] = useState(false);

  const { isOpen, closeEditForm } = usePostEditStore();
  const {
    isOpen: isReportModalOpen,
    contentType,
    closeReportModal,
  } = useReportModalStore();
  const { handleSubmit: handleReportSubmit } = useReportSubmission();

  const location = useLocation();

  // Check if current route is moderation dashboard
  const isModDashboard = location.pathname.startsWith("/mod/dashboard");

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
      <aside
        className={`
          hidden md:block shrink-0 border-r
          ${isModDashboard ? "md:w-auto lg:w-auto" : "md:w-auto lg:w-60"}
        `}
      >
        <Sidebar
          onCreateClick={() => {
            setShowTypeSelector(true);
          }}
        />
      </aside>

      <div className="flex-1 overflow-auto pb-10 md:pb-0">{children}</div>

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

      <PostCreationForm
        open={showPostCreationForm}
        onClose={handlePostCreationFormClose}
        postType={selectedType}
      />

      <PostEditForm open={isOpen} onClose={closeEditForm} />

      <ReportDialog
        isOpen={isReportModalOpen}
        onClose={closeReportModal}
        onSubmit={handleReportSubmit}
        contentType={contentType}
      />
    </div>
  );
};

export default Layout;
