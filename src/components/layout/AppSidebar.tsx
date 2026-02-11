import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Wallet,
  Settings,
  BookOpen,
  Stethoscope,
  TrendingUp,
  PiggyBank,
  History,
  FileText,
  Receipt,
  FileSpreadsheet,
  Cloud,
  CloudOff,
} from "lucide-react";
import { useCloudProfile } from "@/hooks/use-cloud-profile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Accueil",
    items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "Remplacements",
    items: [
      { name: "Cabinets", href: "/cabinets", icon: Building2 },
      { name: "Calendrier", href: "/calendrier", icon: CalendarDays },
      { name: "Historique", href: "/historique", icon: History },
    ],
  },
  {
    title: "Comptabilité",
    items: [
      { name: "Revenus", href: "/revenus", icon: TrendingUp },
      { name: "Paiements", href: "/paiements", icon: Wallet },
      { name: "Charges", href: "/charges", icon: Receipt },
      { name: "Factures", href: "/factures", icon: FileText },
      {
        name: "Déclaration fiscale",
        href: "/declaration-fiscale",
        icon: FileSpreadsheet,
      },
      { name: "Simulateur", href: "/simulateur", icon: PiggyBank },
    ],
  },
  {
    title: "Autres",
    items: [
      { name: "Ressources", href: "/ressources", icon: BookOpen },
      { name: "Paramètres", href: "/parametres", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { displayName, isConnected } = useCloudProfile();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-3",
            isCollapsed && "justify-center",
          )}
        >
          <NavLink to="/parametres" className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-primary shadow-glow shrink-0">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
          </NavLink>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                {displayName}
              </h1>
              <div className="flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <Cloud className="w-3 h-3 text-success" />
                    <span className="text-xs text-success">Cloud connecté</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Mode local
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="absolute -top-1 -right-1">
              {isConnected ? (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-success border-2 border-sidebar"
                  title="Cloud connecté"
                />
              ) : (
                <div
                  className="w-2.5 h-2.5 rounded-full bg-muted-foreground border-2 border-sidebar"
                  title="Mode local"
                />
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {navItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                      >
                        <NavLink to={item.href}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer with toggle only */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarTrigger className="w-full justify-center" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
