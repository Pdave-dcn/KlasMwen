import { useLocation } from "react-router-dom";

import PostCreationForm from "@/features/PostCreation/components/postForm/PostCreationForm";
import PostTypeSelector from "@/features/PostCreation/components/PostTypeSelector";
import PostEditForm from "@/features/postEdit/components/PostEditForm";
import { usePostCreationFlow } from "@/hooks/usePostCreationFlow";
import { useReportSubmission } from "@/hooks/useReportSubmission";
import { usePostEditStore } from "@/stores/postEdit.store";
import { useReportModalStore } from "@/stores/reportModal.store";

import { ReportDialog } from "../modals/ReportDialog";

import MobileTabBar from "./MobileTabBar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const {
    isPostTypeModalOpen,
    isPostCreationModalOpen,
    postType,
    openPostTypeModal,
    selectPostType,
    close,
  } = usePostCreationFlow();

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

  return (
    <div className="flex h-screen w-full">
      <aside
        className={`
          hidden md:block shrink-0 border-r
          ${isModDashboard ? "md:w-auto lg:w-auto" : "md:w-auto lg:w-60"}
        `}
      >
        <Sidebar onCreateClick={openPostTypeModal} />
      </aside>

      <div
        id="app-scroll-container"
        className="flex-1 overflow-auto pb-10 md:pb-0"
      >
        {children}
      </div>

      <MobileTabBar onCreateClick={openPostTypeModal} />

      <PostTypeSelector
        open={isPostTypeModalOpen}
        onSelect={selectPostType}
        onClose={close}
      />

      <PostCreationForm
        open={isPostCreationModalOpen}
        onClose={close}
        postType={postType}
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
