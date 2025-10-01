import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ClipboardList, 
  Car, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut // Ícone de logout adicionado
} from "lucide-react";
import { useAuth } from "@/hooks/auth"; // Importando o hook de autenticação

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
  },
  {
    id: "vehicles", 
    label: "Veículos",
    icon: Car,
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: Package,
  },
  {
    id: "orders",
    label: "Ordens de Serviço",
    icon: ClipboardList,
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings,
  },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut } = useAuth(); // Acedendo à função signOut do contexto

  return (
    <div className={cn(
      "relative flex h-screen flex-col bg-gradient-to-b from-primary to-primary-hover transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <Car className="h-5 w-5 text-accent-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-primary-foreground">AutoTech</h2>
              <p className="text-sm text-primary-foreground/80">Sistema de Oficina</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-primary-foreground hover:bg-primary-hover"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start text-primary-foreground hover:bg-primary-hover transition-all duration-300",
                activeTab === item.id && "bg-secondary text-secondary-foreground hover:bg-secondary/90",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => onTabChange(item.id)}
            >
              <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
              {!isCollapsed && item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4">
        <div className={cn(
          "rounded-lg bg-primary-hover/50 p-3",
          isCollapsed && "text-center"
        )}>
          {!isCollapsed ? (
            <>
              <p className="text-sm font-medium text-primary-foreground">Sistema Ativo</p>
              <p className="text-xs text-primary-foreground/80">Versão 1.0.0</p>
            </>
          ) : (
            <div className="h-2 w-2 rounded-full bg-green-400 mx-auto" />
          )}
        </div>
        
        {/* Botão de Logout Adicionado */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-primary-foreground hover:bg-primary-hover mt-2",
            isCollapsed && "justify-center px-2"
          )}
          onClick={signOut}
        >
          <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
          {!isCollapsed && "Sair"}
        </Button>
      </div>
    </div>
  );
}
