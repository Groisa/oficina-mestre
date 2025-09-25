import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Phone, 
  Mail,
  Car,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ClientList() {
  const [searchTerm, setSearchTerm] = useState("");

  const clients = [
    {
      id: 1,
      name: "João Silva",
      email: "joao.silva@email.com",
      phone: "(11) 99999-8888",
      vehicles: 2,
      lastService: "2024-01-15",
      status: "Ativo"
    },
    {
      id: 2,
      name: "Maria Santos",
      email: "maria.santos@email.com",
      phone: "(11) 88888-7777",
      vehicles: 1,
      lastService: "2024-01-10",
      status: "Ativo"
    },
    {
      id: 3,
      name: "Pedro Costa",
      email: "pedro.costa@email.com",
      phone: "(11) 77777-6666",
      vehicles: 3,
      lastService: "2023-12-20",
      status: "Inativo"
    },
    {
      id: 4,
      name: "Ana Lima",
      email: "ana.lima@email.com",
      phone: "(11) 66666-5555",
      vehicles: 1,
      lastService: "2024-01-20",
      status: "Ativo"
    },
    {
      id: 5,
      name: "Carlos Oliveira",
      email: "carlos.oliveira@email.com",
      phone: "(11) 55555-4444",
      vehicles: 2,
      lastService: "2024-01-18",
      status: "Ativo"
    },
  ];

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da oficina
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{client.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {client.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {client.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Car className="h-3 w-3" />
                      <span>{client.vehicles} veículo(s)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Último serviço: {new Date(client.lastService).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <Badge 
                    variant={client.status === "Ativo" ? "default" : "outline"}
                  >
                    {client.status}
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
                      <DropdownMenuItem>Veículos</DropdownMenuItem>
                      <DropdownMenuItem>Histórico de Serviços</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}