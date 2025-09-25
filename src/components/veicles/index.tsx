import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Car, User, Calendar, MoreHorizontal, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../../integrations/supabase/client";

// Componente do Formulário (usado internamente)
function VehicleForm({ onSave, onCancel, clients, initialData = null }) {
  const [formData, setFormData] = useState({
    make: initialData?.make || "",
    model: initialData?.model || "",
    year: initialData?.year || "",
    license_plate: initialData?.license_plate || "",
    client_id: initialData?.client_id || "",
  });

  const isEditing = !!initialData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{isEditing ? "Editar Veículo" : "Novo Veículo"}</h1>
          <p className="text-muted-foreground">Preencha os dados abaixo.</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista
        </Button>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="make">Marca</Label><Input id="make" name="make" value={formData.make} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="model">Modelo</Label><Input id="model" name="model" value={formData.model} onChange={handleChange} required /></div>
              <div className="space-y-2"><Label htmlFor="year">Ano</Label><Input id="year" name="year" type="number" value={formData.year} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="license_plate">Placa</Label><Input id="license_plate" name="license_plate" value={formData.license_plate} onChange={handleChange} required /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id">Cliente</Label>
              <Select name="client_id" onValueChange={(value) => handleSelectChange('client_id', value)} value={formData.client_id} required>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">{isEditing ? "Salvar Alterações" : "Adicionar Veículo"}</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export function VehicleList() {
  const [view, setView] = useState('list'); 
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchVehicles() {
    setLoading(true);
    const { data, error } = await supabase.from('vehicles').select(`id, make, model, year, license_plate, client_id, clients ( name )`).order('make', { ascending: true });
    if (error) {
      console.error('Erro ao buscar veículos:', error);
    } else {
      setVehicles(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    async function fetchInitialData() {
      await fetchVehicles();
      const { data: clientData, error } = await supabase.from('clients').select('id, name');
      if (error) console.error('Erro ao buscar clientes:', error);
      else setClients(clientData || []);
    }
    fetchInitialData();
  }, []);

  const handleSave = async (formData, vehicleId) => {
    if (vehicleId) { // Editando
      const { error } = await supabase.from('vehicles').update(formData).eq('id', vehicleId);
      if (error) console.error("Erro ao atualizar:", error.message);
    } else { // Criando
      const { error } = await supabase.from('vehicles').insert([formData]);
      if (error) console.error("Erro ao criar:", error.message);
    }
    await fetchVehicles();
    setView('list');
    setEditingVehicle(null);
  };
  
  const handleDelete = async (vehicleId) => {
    if(window.confirm("Tem certeza que deseja excluir este veículo?")) {
        const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
        if (error) console.error("Erro ao deletar:", error.message);
        else await fetchVehicles();
    }
  }

  const filteredVehicles = vehicles.filter(v =>
    v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.clients.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (view === 'form') {
    return <VehicleForm onSave={handleSave} onCancel={() => { setView('list'); setEditingVehicle(null); }} clients={clients} initialData={editingVehicle} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground">Gerencie os veículos da oficina</p>
        </div>
        <Button onClick={() => { setEditingVehicle(null); setView('form'); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por marca, modelo, placa ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? <p>Carregando veículos...</p> : filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"><Car className="h-5 w-5"/></div>
                  <div>
                    <h3 className="font-medium text-foreground">{vehicle.make} {vehicle.model}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="font-mono bg-muted px-2 py-0.5 rounded">{vehicle.license_plate}</div>
                      <div className="flex items-center"><User className="h-3 w-3 mr-1" />{vehicle.clients?.name || 'Sem cliente'}</div>
                      <div className="flex items-center"><Calendar className="h-3 w-3 mr-1" />{vehicle.year}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingVehicle(vehicle); setView('form'); }}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(vehicle.id)} className="text-red-500">Excluir</DropdownMenuItem>
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

