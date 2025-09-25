import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ClientList } from "@/components/clients/ClientList";
import { InventoryList } from "@/components/inventory/InventoryList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "clients":
        return <ClientList />;
      case "inventory":
        return <InventoryList />;
      case "vehicles":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">Veículos</h2>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </div>
          </div>
        );
      case "orders":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">Ordens de Serviço</h2>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-muted-foreground">Configurações</h2>
              <p className="text-muted-foreground">Em desenvolvimento</p>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-dashboard">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;