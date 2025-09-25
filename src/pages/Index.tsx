import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClientList } from "@/components/clients/ClientList";
import { InventoryList } from "@/components/inventory/InventoryList";
import { ServiceOrderPage } from "@/components/orderService";
import { VehicleList } from "@/components/veicles";
import { SettingsPage } from "@/components/configs";
import { ReportsPage } from "@/components/dashboard/Dashboard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ReportsPage />;
      case "clients":
        return <ClientList />;
      case "inventory":
        return <InventoryList />;
      case "vehicles":
        return (
          <VehicleList />
        );
      case "orders":
        return (
          <ServiceOrderPage />
        );
      case "settings":
        return (
         <SettingsPage/>
        );
      default:
        return <ReportsPage />;
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