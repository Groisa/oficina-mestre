import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InventoryList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const inventory = [
    {
      id: 1,
      name: "Óleo Motor 5W30",
      category: "Lubrificantes",
      supplier: "Shell",
      currentStock: 15,
      minimumStock: 10,
      unitPrice: 45.90,
      lastUpdate: "2024-01-20"
    },
    {
      id: 2,
      name: "Filtro de Ar",
      category: "Filtros",
      supplier: "Mann Filter",
      currentStock: 8,
      minimumStock: 15,
      unitPrice: 28.50,
      lastUpdate: "2024-01-18"
    },
    {
      id: 3,
      name: "Pastilha de Freio Dianteira",
      category: "Freios",
      supplier: "TRW",
      currentStock: 12,
      minimumStock: 8,
      unitPrice: 89.90,
      lastUpdate: "2024-01-19"
    },
    {
      id: 4,
      name: "Vela de Ignição NGK",
      category: "Motor",
      supplier: "NGK",
      currentStock: 25,
      minimumStock: 20,
      unitPrice: 15.90,
      lastUpdate: "2024-01-21"
    },
    {
      id: 5,
      name: "Correia Dentada",
      category: "Motor",
      supplier: "Gates",
      currentStock: 3,
      minimumStock: 10,
      unitPrice: 125.00,
      lastUpdate: "2024-01-17"
    },
  ];

  const categories = ["all", "Lubrificantes", "Filtros", "Freios", "Motor"];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) return { status: "Baixo", variant: "destructive" as const };
    if (current <= minimum * 1.2) return { status: "Atenção", variant: "outline" as const };
    return { status: "Normal", variant: "default" as const };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
          <p className="text-muted-foreground">
            Controle de peças e materiais
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.slice(1).map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo do Estoque */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                <p className="text-2xl font-bold text-warning">
                  {inventory.filter(item => item.currentStock < item.minimumStock).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">
                  R$ {inventory.reduce((acc, item) => acc + (item.currentStock * item.unitPrice), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Estoque ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item.currentStock, item.minimumStock);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>{item.supplier}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Estoque</p>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.currentStock}</span>
                        {item.currentStock < item.minimumStock && (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Preço Unit.</p>
                      <p className="font-medium">
                        R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <Badge variant={stockStatus.variant}>
                      {stockStatus.status}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Adicionar Estoque</DropdownMenuItem>
                        <DropdownMenuItem>Histórico</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}