import { DashboardCard } from "./DashboardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  Package, 
  ClipboardList,
  TrendingUp,
  Calendar
} from "lucide-react";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";

export function Dashboard() {
  const recentOrders = [
    { id: "OS001", client: "João Silva", vehicle: "Honda Civic 2020", status: "Em Andamento", value: "R$ 850,00" },
    { id: "OS002", client: "Maria Santos", vehicle: "Toyota Corolla 2019", status: "Aguardando Peças", value: "R$ 1.200,00" },
    { id: "OS003", client: "Pedro Costa", vehicle: "Ford Ka 2018", status: "Finalizado", value: "R$ 450,00" },
    { id: "OS004", client: "Ana Lima", vehicle: "Chevrolet Onix 2021", status: "Em Andamento", value: "R$ 650,00" },
  ];

  const lowStockItems = [
    { name: "Óleo Motor 5W30", current: 3, minimum: 10 },
    { name: "Filtro de Ar", current: 2, minimum: 8 },
    { name: "Pastilha de Freio", current: 1, minimum: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema da oficina
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Hoje
          </Button>
          <NewOrderDialog />
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Faturamento Mensal"
          value="R$ 45.231,89"
          change="+20.1% em relação ao mês anterior"
          icon={DollarSign}
          variant="success"
        />
        <DashboardCard
          title="Clientes Ativos"
          value="348"
          change="+12 novos este mês"
          icon={Users}
          variant="default"
        />
        <DashboardCard
          title="Itens em Estoque"
          value="1.247"
          change="3 itens com estoque baixo"
          icon={Package}
          variant="warning"
        />
        <DashboardCard
          title="Ordens Abertas"
          value="27"
          change="8 finalizadas hoje"
          icon={ClipboardList}
          variant="accent"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ordens de Serviço Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2 text-primary" />
              Ordens de Serviço Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{order.id}</span>
                      <Badge 
                        variant={
                          order.status === "Finalizado" ? "default" : 
                          order.status === "Em Andamento" ? "secondary" : 
                          "outline"
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.client}</p>
                    <p className="text-xs text-muted-foreground">{order.vehicle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{order.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estoque Baixo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-warning" />
              Itens com Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Estoque atual: {item.current} | Mínimo: {item.minimum}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Baixo
                  </Badge>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Relatório Completo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}