import { navItems } from "./constants";
import { MoreMenu } from "./MoreMenu";
import { NavItem } from "./NavItem";

interface MobileTabBarProps {
  onCreateClick: () => void;
}

const MobileTabBar = ({ onCreateClick }: MobileTabBarProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-sm md:hidden">
      <ul className="flex justify-around py-2">
        {navItems.map((item) => (
          <NavItem key={item.title} item={item} onCreateClick={onCreateClick} />
        ))}
        <MoreMenu />
      </ul>
    </nav>
  );
};

export default MobileTabBar;
