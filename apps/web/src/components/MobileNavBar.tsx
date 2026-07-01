"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Zap, ShoppingCart, Folder, Shield } from "lucide-react";

export default function MobileNavBar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Explorer", href: "/search", icon: Search },
    { name: "Circuits", href: "/circuits", icon: Zap },
    { name: "BOM", href: "/bom", icon: ShoppingCart },
    { name: "Workspace", href: "/projects", icon: Folder },
    { name: "Admin", href: "/admin", icon: Shield },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 dark:bg-background/80 backdrop-blur-lg border-t border-border px-4 pt-2.5 pb-4 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Match active route exactly, or check if it starts with the href (excluding home '/')
        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              isActive 
                ? "text-blue-500 dark:text-blue-400" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? "stroke-[2.5px] scale-110" : "stroke-[2px]"}`} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
