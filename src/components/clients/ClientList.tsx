import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, Car, MoreHorizontal, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../../integrations/supabase/client";
import { Database } from "../../integrations/supabase/types";

type Client = Database['public']['Tables']['clients']['Row'];
type ClientWithVehicleCount = Client & { vehicles: { count: number }[] };

function ClientForm({ onSave, onCancel, initialData = null }: { onSave: (formData: Omit<Client, 'id' | 'created_at'>, clientId?: number) => void, onCancel: () => void, initialData?: Client | null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    status: initialData?.status || "Ativo",
  });
  const isEditing = !!initialData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">{isEditing ? "Editar Cliente" : "Novo Cliente"}</h1><p className="text-muted-foreground">Preencha os dados abaixo.</p></div>
        <Button variant="outline" onClick={() => onCancel()}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Nome Completo</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required /></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={formData.email ?? ''} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" value={formData.phone ?? ''} onChange={handleChange} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label>
              <Select name="status" onValueChange={(value) => setFormData(prev => ({...prev, status: value}))} value={formData.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end"><Button type="submit">{isEditing ? "Salvar Alterações" : "Adicionar Cliente"}</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}

export function ClientList() {
  const [view, setView] = useState('list');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<ClientWithVehicleCount[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase.from('clients').select(`*, vehicles(count)`).order('name', { ascending: true });
    if (error) {
      console.error('Erro ao buscar clientes:', error);
      setClients([]);
    } else {
      setClients((data as any[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  const handleSave = async (formData: Omit<Client, 'id' | 'created_at'>, clientId?: number) => {
    const query = clientId ? supabase.from('clients').update(formData).eq('id', clientId) : supabase.from('clients').insert([formData]);
    const { error } = await query;
    if (error) {
      console.error("Erro ao salvar:", error.message);
    } else {
      await fetchClients();
      setView('list');
      setEditingClient(null);
    }
  };

  const handleDelete = async (clientId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente? A ação não pode ser desfeita.")) {
      const { data: vehicles, error: vehicleError } = await supabase.from('vehicles').select('id').eq('client_id', clientId);
      
      if (vehicleError) {
        console.error("Erro ao verificar veículos:", vehicleError.message);
        return;
      }
      
      if (vehicles && vehicles.length > 0) {
        alert("Não é possível excluir o cliente pois ele possui veículos cadastrados.");
        return;
      }

      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (error) {
        console.error("Erro ao deletar:", error.message);
      } else {
        await fetchClients();
      }
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (view === 'form') {
    return <ClientForm onSave={handleSave} onCancel={() => { setView('list'); setEditingClient(null); }} initialData={editingClient} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Clientes</h1><p className="text-muted-foreground">Gerencie os clientes da oficina</p></div>
        <Button onClick={() => { setEditingClient(null); setView('form'); }}><Plus className="h-4 w-4 mr-2" />Novo Cliente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardHeader><CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? <p>Carregando...</p> : filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">{client.name.split(' ').map(n => n[0]).join('')}</div>
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center"><Mail className="h-3 w-3 mr-1" />{client.email || 'N/A'}</div>
                      <div className="flex items-center"><Phone className="h-3 w-3 mr-1" />{client.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center space-x-1"><Car className="h-3 w-3" /><span>{client.vehicles[0]?.count ?? 0} veículo(s)</span></div>
                  </div>
                  <Badge variant={client.status === "Ativo" ? "default" : "outline"}>{client.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingClient(client); setView('form'); }}>Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(client.id)}>Excluir</DropdownMenuItem>
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

