import MobileTabBar from "./MobileSidebar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-full">
      {/* Sidebar - show only on md+ */}
      <aside className="hidden md:block w-auto lg:w-60 lg:border-r shrink-0">
        <Sidebar />
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>

      <MobileTabBar />
    </div>
  );
};

export default Layout;
