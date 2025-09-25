import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, X, ArrowLeft, Edit, CheckCircle } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Database } from "../../integrations/supabase/types";

// Tipos do Supabase
type DbClient = Database['public']['Tables']['clients']['Row'];
type DbVehicle = Database['public']['Tables']['vehicles']['Row'];
type DbServiceOrder = Database['public']['Tables']['service_orders']['Row'];
export type OrderStatus = 'Aguardando aprovação' | 'Em andamento' | 'Concluído' | 'Cancelado';

// Tipo para os itens dentro do JSONB
export interface ServiceItem {
  type: 'Serviço' | 'Peça';
  description: string;
  quantity: number;
  unitPrice: number;
}

// Tipo combinado para uso no frontend
type ServiceOrderWithRelations = DbServiceOrder & {
  clients: Pick<DbClient, 'id' | 'name' | 'phone' | 'email'> | null;
  vehicles: Pick<DbVehicle, 'id' | 'model' | 'license_plate' | 'year'> & { makes: { name: string } | null } | null;
};

function OrderForm({ onSave, onCancel, clients, vehicles, initialData = null }: {
  onSave: (data: any, orderId?: number) => void;
  onCancel: () => void;
  clients: DbClient[];
  vehicles: DbVehicle[];
  initialData?: ServiceOrderWithRelations | null;
}) {

  const isEditing = !!initialData;
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialData?.clients?.id || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(initialData?.vehicles?.id || null);
  const [items, setItems] = useState<ServiceItem[]>(initialData?.items as any[] || [{ type: 'Serviço', description: '', quantity: 1, unitPrice: 0 }]);
  const [observations, setObservations] = useState(initialData?.observations || '');

  const handleAddItem = () => setItems([...items, { type: 'Serviço', description: '', quantity: 1, unitPrice: 0 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const handleItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId) {
      alert("Cliente e Veículo são obrigatórios.");
      return;
    }
    const total_value = calculateTotal();
    const dataToSave = {
      client_id: selectedClientId,
      vehicle_id: selectedVehicleId,
      items,
      observations,
      total_value,
    };
    onSave(dataToSave, initialData?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">{isEditing ? `Editar OS #${initialData?.id}` : "Nova Ordem de Serviço"}</h1><p className="text-muted-foreground">Preencha os detalhes abaixo.</p></div>
        <Button variant="outline" onClick={onCancel}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cliente</Label>
                <Select value={selectedClientId?.toString()} onValueChange={(v) => { setSelectedClientId(Number(v)); setSelectedVehicleId(null); }} required disabled={clients.length === 0}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.length > 0 ? (
                      clients.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)
                    ) : (
                      <SelectItem value="no-clients" disabled>Nenhum cliente cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Veículo</Label>
                <Select value={selectedVehicleId?.toString()} onValueChange={(v) => setSelectedVehicleId(Number(v))} disabled={!selectedClientId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
                  <SelectContent>{vehicles.filter((v) => v.client_id === selectedClientId).map((v) => <SelectItem key={v.id} value={v.id.toString()}>{`${v.model} - ${v.license_plate}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Serviços e Peças</Label>
              <div className="space-y-2 mt-2 border p-4 rounded-md">
                {items.map((item, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 space-y-2"><Label className="text-xs">Descrição</Label><Input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required /></div>
                    <div className="w-24 space-y-2"><Label className="text-xs">Qtd.</Label><Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} min={1} required /></div>
                    <div className="w-32 space-y-2"><Label className="text-xs">Valor Unit.</Label><Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))} min={0} required /></div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} disabled={items.length <= 1}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}><Plus className="mr-2 h-4 w-4" /> Adicionar Item</Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} /></div>
          </CardContent>
          <CardFooter className="flex justify-end"><Button type="submit">{isEditing ? "Salvar Alterações" : "Criar Ordem de Serviço"}</Button></CardFooter>
        </Card>
      </form>
    </div>
  );
}


// Componente Principal
export function ServiceOrderPage() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithRelations | null>(null);
  const [orders, setOrders] = useState<ServiceOrderWithRelations[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data: ordersData, error: ordersError } = await supabase.from('service_orders').select(`*, clients(*), vehicles(*)`).order('created_at', { ascending: false });
    const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
    console.log(clientsData);
    const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');

    console.log(ordersData, clientsData, vehiclesData);
    setOrders(ordersData as any || []);
    setClients(clientsData || []);
    setVehicles(vehiclesData || []);

    setLoading(false);
  }

  useEffect(() => {
    console.log(clients)
  }, [clients])

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData: any, orderId?: number) => {
    if (orderId) { // Editando
      const { error } = await supabase.from('service_orders').update(formData).eq('id', orderId);
      if (error) console.error("Erro ao atualizar:", error.message);
    } else { // Criando
      const { error } = await supabase.from('service_orders').insert([formData]);
      if (error) console.error("Erro ao criar:", error.message);
    }
    await fetchData();
    setView('list');
    setSelectedOrder(null);
  };

  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    const { error } = await supabase.from('service_orders').update({ status }).eq('id', orderId);
    if (error) console.error("Erro ao atualizar status:", error.message);
    else await fetchData();
    setView('list');
  };

  const handleSelectOrder = (order: ServiceOrderWithRelations) => {
    setSelectedOrder(order);
    setView('details');
  };

  const renderView = () => {
    switch (view) {
      case 'form':
        return <OrderForm onSave={handleSave} onCancel={() => setView('list')} clients={clients} vehicles={vehicles} initialData={selectedOrder} />;
      case 'details':
        return <ServiceOrderDetail order={selectedOrder!} onBack={() => setView('list')} onEdit={(order) => { setSelectedOrder(order); setView('form'); }} onUpdateStatus={handleUpdateStatus} />;
      case 'list':
      default:
        return <ServiceOrderList orders={orders} onSelectOrder={handleSelectOrder} onCreateNew={() => { setSelectedOrder(null); setView('form'); }} />;
    }
  };

  if (loading) return <p>Carregando ordens de serviço...</p>;

  return renderView();
}

// Componente da Lista
function ServiceOrderList({ orders, onSelectOrder, onCreateNew }: {
  orders: ServiceOrderWithRelations[];
  onSelectOrder: (order: ServiceOrderWithRelations) => void;
  onCreateNew: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Ordens de Serviço</CardTitle>
        <Button onClick={onCreateNew}><Plus className="mr-2 h-4 w-4" />Nova OS</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} onClick={() => onSelectOrder(order)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-bold">#{order.id}</TableCell>
                <TableCell>{order.clients?.name || 'Cliente não encontrado'}</TableCell>
                <TableCell>{order.vehicles ? `${order.vehicles.makes?.name || ''} ${order.vehicles.model}` : 'N/A'}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Badge>{order.status}</Badge></TableCell>
                <TableCell className="text-right font-medium">{order.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Componente de Detalhes
function ServiceOrderDetail({ order, onBack, onEdit, onUpdateStatus }: {
  order: ServiceOrderWithRelations;
  onBack: () => void;
  onEdit: (order: ServiceOrderWithRelations) => void;
  onUpdateStatus: (orderId: number, status: OrderStatus) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit(order)}><Edit className="mr-2 h-4" />Editar</Button>
          <Button onClick={() => onUpdateStatus(order.id, 'Concluído')} disabled={order.status === 'Concluído'}><CheckCircle className="mr-2 h-4" />Concluir OS</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div><CardTitle className="text-2xl">Ordem de Serviço #{order.id}</CardTitle><p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div>
            <Badge className="text-base">{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div><h3 className="font-semibold text-lg">Cliente</h3><p>{order.clients?.name}</p><p>{order.clients?.phone}</p><p>{order.clients?.email}</p></div>
            <div><h3 className="font-semibold text-lg">Veículo</h3><p>{order.vehicles?.makes?.name} {order.vehicles?.model}</p><p>Placa: {order.vehicles?.license_plate}</p><p>Ano: {order.vehicles?.year}</p></div>
          </div>
          <Tabs defaultValue="items">
            <TabsList><TabsTrigger value="items">Itens e Custos</TabsTrigger><TabsTrigger value="observations">Observações</TabsTrigger></TabsList>
            <TabsContent value="items" className="mt-4">
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qtd.</TableHead><TableHead className="text-right">Vl. Unit.</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(order.items as any[])?.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="text-right">{Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      <TableCell className="text-right">{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4">
                <div className="w-full max-w-sm space-y-2">
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{order.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="observations" className="mt-4"><p>{order.observations || "Nenhuma observação."}</p></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}