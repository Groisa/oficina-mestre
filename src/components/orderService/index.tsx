import { useEffect, useState, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, X, MoreHorizontal, ArrowLeft, Edit, Trash, PackagePlus, Printer, Warehouse } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";
import { Database } from "../../integrations/supabase/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useReactToPrint } from 'react-to-print';

// Tipos
type DbClient = Database['public']['Tables']['clients']['Row'];
type DbVehicle = Database['public']['Tables']['vehicles']['Row'];
type DbServiceOrder = Database['public']['Tables']['service_orders']['Row'];
type DbInventoryItem = Database['public']['Tables']['inventory_items']['Row'];
export type OrderStatus = 'Orçamento' | 'Aguardando aprovação' | 'Em andamento' | 'Concluído' | 'Cancelado';
const ALL_STATUSES: OrderStatus[] = ['Orçamento', 'Aguardando aprovação', 'Em andamento', 'Concluído', 'Cancelado'];

export interface ServiceItem {
  inventory_item_id?: number;
  type: 'Serviço' | 'Peça';
  description: string;
  quantity: number;
  unitPrice: number;
}
type QuickAddItem = {
  name: string;
  current_stock: number;
  cost_price: number;
  sale_price: number;
}

type ServiceOrderWithRelations = DbServiceOrder & {
  clients: Pick<DbClient, 'id' | 'name' | 'phone' | 'email'> | null;
  vehicles: Pick<DbVehicle, 'id' | 'make' | 'model' | 'license_plate' | 'year'> | null;
};

// Componente: Modal de Adição Rápida de Item
function QuickAddItemDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSave: (item: QuickAddItem) => Promise<void> }) {
  const [name, setName] = useState('');
  const [current_stock, setCurrentStock] = useState(1);
  const [cost_price, setCostPrice] = useState(0);
  const [sale_price, setSalePrice] = useState(0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || sale_price <= 0) {
      alert("Nome e Preço de Venda são obrigatórios.");
      return;
    }
    await onSave({ name, current_stock, cost_price, sale_price });
    setName('');
    setCurrentStock(1);
    setCostPrice(0);
    setSalePrice(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Item ao Estoque</DialogTitle>
            <DialogDescription>Preencha os dados do novo item que será adicionado ao seu inventário.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nome do Item</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label htmlFor="stock">Estoque</Label><Input id="stock" type="number" value={current_stock} onChange={(e) => setCurrentStock(Number(e.target.value))} min={0} required /></div>
              <div className="space-y-2"><Label htmlFor="cost">Preço Custo</Label><Input id="cost" type="number" step="0.01" value={cost_price} onChange={(e) => setCostPrice(Number(e.target.value))} min={0} /></div>
              <div className="space-y-2"><Label htmlFor="sale">Preço Venda</Label><Input id="sale" type="number" step="0.01" value={sale_price} onChange={(e) => setSalePrice(Number(e.target.value))} min={0} required /></div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Salvar Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente: Formulário de OS
function OrderForm({ onSave, onCancel, clients, vehicles, inventoryItems, initialData = null, onOpenAddItemDialog }: any) {
  const isEditing = !!initialData;
  const [selectedClientId, setSelectedClientId] = useState<number | null>(initialData?.clients?.id || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(initialData?.vehicles?.id || null);
  const [items, setItems] = useState<ServiceItem[]>(initialData?.items as any[] || [{ type: 'Serviço', description: '', quantity: 1, unitPrice: 0 }]);
  const [observations, setObservations] = useState(initialData?.observations || '');
  const [status, setStatus] = useState<OrderStatus>(initialData?.status || 'Orçamento');

  const handleAddItem = (type: 'Serviço' | 'Peça') => {
    const newItem: ServiceItem = type === 'Serviço'
      ? { type: 'Serviço', description: '', quantity: 1, unitPrice: 0 }
      : { type: 'Peça', description: 'Selecione um item', quantity: 1, unitPrice: 0, inventory_item_id: undefined };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (index: number, field: keyof ServiceItem, value: any) => {
    const newItems = [...items];
    const itemToUpdate = newItems[index];

    if (field === 'quantity') {
      const newQuantity = Number(value);
      itemToUpdate.quantity = newQuantity < 1 ? null : newQuantity;
    } else if (field === 'unitPrice') {
      const newPrice = Number(value);
      itemToUpdate.unitPrice = newPrice <= 0 ? null : newPrice;
    } else {
      (itemToUpdate as any)[field] = value;
    }

    setItems(newItems);
  };

  const handleInventoryItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((item: DbInventoryItem) => item.id === Number(itemId));
    if (selectedItem) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        inventory_item_id: selectedItem.id,
        description: selectedItem.name,
        unitPrice: selectedItem.sale_price,
      };
      setItems(newItems);
    }
  };

  const calculateTotal = () => items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unitPrice)), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedVehicleId) {
      alert("Cliente e Veículo são obrigatórios.");
      return;
    }
    const total_value = calculateTotal();
    const dataToSave = { client_id: selectedClientId, vehicle_id: selectedVehicleId, items, observations, total_value, status };
    onSave(dataToSave, initialData?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-3xl font-bold">{isEditing ? `Editar OS #${initialData?.id}` : "Novo Orçamento / Ordem de Serviço"}</h1><p className="text-muted-foreground">Preencha os detalhes abaixo.</p></div>
        <Button variant="outline" onClick={onCancel}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
      </div>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Cliente</Label>
                <Select value={selectedClientId?.toString()} onValueChange={(v) => { setSelectedClientId(Number(v)); setSelectedVehicleId(null); }} required>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>{clients.map((c: DbClient) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Veículo</Label>
                <Select value={selectedVehicleId?.toString()} onValueChange={(v) => setSelectedVehicleId(Number(v))} disabled={!selectedClientId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione um veículo" /></SelectTrigger>
                  <SelectContent>{vehicles.filter((v: DbVehicle) => v.client_id === selectedClientId).map((v: DbVehicle) => <SelectItem key={v.id} value={v.id.toString()}>{`${v.make} ${v.model} - ${v.license_plate}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={status} onValueChange={(v: OrderStatus) => setStatus(v)} required>
                  <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                  <SelectContent>{ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Serviços e Peças</Label>
              <div className="space-y-3 mt-2 border p-4 rounded-md">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-2">
                    {item.type === 'Peça' ? (
                      <div className="flex-grow min-w-[150px] space-y-2"><Label className="text-xs">Peça do Estoque</Label>
                        <Select onValueChange={(value) => handleInventoryItemSelect(index, value)} value={item.inventory_item_id?.toString()}>
                          <SelectTrigger><SelectValue placeholder="Selecione uma peça..." /></SelectTrigger>
                          <SelectContent>{inventoryItems.map((invItem: DbInventoryItem) => <SelectItem key={invItem.id} value={invItem.id.toString()}>{`${invItem.name} (Estoque: ${invItem.current_stock})`}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex-grow min-w-[150px] space-y-2"><Label className="text-xs">Descrição do Serviço</Label><Input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} required /></div>
                    )}
                    <div className="flex-grow sm:flex-grow-0 w-24 space-y-2"><Label className="text-xs">Qtd.</Label><Input type="number" value={item.quantity || ''} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min={1} required /></div>
                    <div className="flex-grow sm:flex-grow-0 w-32 space-y-2"><Label className="text-xs">Valor Unit.</Label><Input type="number" step="0.01" value={item.unitPrice || ''} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} min={0} required /></div>
                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem('Serviço')}><Plus className="mr-2 h-4 w-4" /> Adicionar Serviço</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleAddItem('Peça')}><PackagePlus className="mr-2 h-4 w-4" /> Adicionar Peça</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={onOpenAddItemDialog}><Warehouse className="mr-2 h-4 w-4" /> Novo Item no Estoque</Button>
                </div>
              </div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea value={observations} onChange={(e) => setObservations(e.target.value)} /></div>
          </CardContent>
          <CardFooter className="flex justify-end"><Button type="submit">{isEditing ? "Salvar Alterações" : "Criar Orçamento / OS"}</Button></CardFooter>
        </Card>
      </form>
    </div>
  );
}

// Componente: Página Principal
export function ServiceOrderPage() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithRelations | null>(null);
  const [orders, setOrders] = useState<ServiceOrderWithRelations[]>([]);
  const [clients, setClients] = useState<DbClient[]>([]);
  const [vehicles, setVehicles] = useState<DbVehicle[]>([]);
  const [inventoryItems, setInventoryItems] = useState<DbInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    const { data: ordersData, error: ordersError } = await supabase.from('service_orders').select(`*, clients(*), vehicles(*)`).order('created_at', { ascending: false });
    const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
    const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
    const { data: inventoryData, error: inventoryError } = await supabase.from('inventory_items').select('*').order('name');

    if (ordersError || clientsError || vehiclesError || inventoryError) {
      console.error(ordersError || clientsError || vehiclesError || inventoryError);
    } else {
      setOrders(ordersData as ServiceOrderWithRelations[] || []);
      setClients(clientsData || []);
      setVehicles(vehiclesData || []);
      setInventoryItems(inventoryData || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData: any, orderId?: number) => {
    const isCreating = !orderId;
    let error;

    // Apenas debita o estoque se o status for diferente de 'Orçamento' ou 'Cancelado'
    const shouldDecrementStock = !['Orçamento', 'Cancelado'].includes(formData.status);

    if (isCreating) {
      const { error: insertError } = await supabase.from('service_orders').insert([formData]).select();
      error = insertError;
    } else {
      const { error: updateError } = await supabase.from('service_orders').update(formData).eq('id', orderId);
      error = updateError;
    }

    if (error) {
      console.error("Erro ao salvar OS:", error.message);
      return;
    }

    // Lógica para decrementar estoque
    if (shouldDecrementStock) {
      const stockUpdates = formData.items
        .filter((item: ServiceItem) => item.type === 'Peça' && item.inventory_item_id)
        .map(async (item: ServiceItem) => {
          await supabase.rpc('decrement_stock', {
            item_id: item.inventory_item_id,
            decrement_quantity: item.quantity
          });
        });
      await Promise.all(stockUpdates);
    }

    await fetchData();
    setView('list');
    setSelectedOrder(null);
  };

  const handleDelete = async (orderId: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta Ordem de Serviço?")) {
      const { error } = await supabase.from('service_orders').delete().eq('id', orderId);
      await fetchData()
      setView('list')
      if (error) console.error("Erro ao deletar:", error.message);

      else {

      };
    }
  };

  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    // Adicionar lógica de estoque aqui também se necessário
    const { error } = await supabase.from('service_orders').update({ status }).eq('id', orderId);
    if (error) console.error("Erro ao atualizar status:", error.message);
    else {
      await fetchData();
      setView('list');
    }
  };

  const handleSelectOrder = (order: ServiceOrderWithRelations) => {
    setSelectedOrder(order);
    setView('details');
  };

  const handleAddNewInventoryItem = async (newItemData: QuickAddItem) => {
    const { error } = await supabase.from('inventory_items').insert([newItemData]);
    if (error) {
      console.error("Erro ao adicionar novo item:", error);
      alert(`Não foi possível adicionar o item: ${error.message}`);
    } else {
      await fetchData();
      setIsAddItemDialogOpen(false);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'form':
        return <OrderForm onSave={handleSave} onCancel={() => setView('list')} clients={clients} vehicles={vehicles} inventoryItems={inventoryItems} initialData={selectedOrder} onOpenAddItemDialog={() => setIsAddItemDialogOpen(true)} />;
      case 'details':
        return <ServiceOrderDetail order={selectedOrder!} onBack={() => setView('list')} onEdit={(order) => { setSelectedOrder(order); setView('form'); }} onUpdateStatus={handleUpdateStatus} onDelete={handleDelete} />;
      case 'list':
      default:
        return <ServiceOrderList orders={orders} onSelectOrder={handleSelectOrder} onCreateNew={() => { setSelectedOrder(null); setView('form'); }} />;
    }
  };

  if (loading) return <p>Carregando ordens de serviço...</p>;

  return (
    <div>
      {renderView()}
      <QuickAddItemDialog
        isOpen={isAddItemDialogOpen}
        onOpenChange={setIsAddItemDialogOpen}
        onSave={handleAddNewInventoryItem}
      />
    </div>
  );
}

// Componente: Lista de OS
function ServiceOrderList({ orders, onSelectOrder, onCreateNew }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Ordens de Serviço</CardTitle>
          <p className="text-sm text-muted-foreground">Visualize e gerencie suas OS e orçamentos.</p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Novo Orçamento / OS</Button>
      </CardHeader>
      <CardContent>
        {/* Mobile View: Card List */}
        <div className="space-y-3 md:hidden">
          {orders.map((order: ServiceOrderWithRelations) => (
            <div key={order.id} onClick={() => onSelectOrder(order)} className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">#{order.id}</span>
                <Badge variant={order.status === 'Orçamento' ? 'secondary' : 'default'}>{order.status}</Badge>
              </div>
              <div>
                <p className="font-medium truncate">{order.clients?.name}</p>
                <p className="text-sm text-muted-foreground">{order.vehicles ? `${order.vehicles.make} ${order.vehicles.model}` : 'N/A'}</p>
              </div>
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                <span className="font-medium">{order.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block border rounded-lg">
          <Table>
            <TableHeader><TableRow><TableHead>OS</TableHead><TableHead>Cliente</TableHead><TableHead>Veículo</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {orders.map((order: ServiceOrderWithRelations) => (
                <TableRow key={order.id} onClick={() => onSelectOrder(order)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-bold">#{order.id}</TableCell>
                  <TableCell>{order.clients?.name}</TableCell>
                  <TableCell>{order.vehicles ? `${order.vehicles.make} ${order.vehicles.model}` : 'N/A'}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant={order.status === 'Orçamento' ? 'secondary' : 'default'}>{order.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{order.total_value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente: Detalhes da OS
function ServiceOrderDetail({ order, onBack, onEdit, onUpdateStatus, onDelete }: any) {
  const componentRef = useRef<HTMLDivElement>(null);
  const total = (order.items as ServiceItem[])?.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0) || 0;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Ordem-Servico-${order.id}`,
    pageStyle: `@page { size: A4; margin: 20mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @media print { .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <Button variant="outline" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={() => onEdit(order)}><Edit className="mr-2 h-4" />Editar</Button>
          <Button variant="outline" onClick={handlePrint}><Printer className="mr-2 h-4" />Imprimir</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">Alterar Status <MoreHorizontal className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>{ALL_STATUSES.map(status => (<DropdownMenuItem key={status} disabled={order.status === status} onClick={() => onUpdateStatus(order.id, status)}>{status}</DropdownMenuItem>))}</DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem className="text-red-500" onClick={() => onDelete(order.id)}><Trash className="mr-2 h-4 w-4" />Excluir OS</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={componentRef} className="print-area">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <CardTitle className="text-2xl">Ordem de Serviço #{order.id}</CardTitle>
                <p className="text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <Badge className="text-base mt-1 sm:mt-0">{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              <div><h3 className="font-semibold text-lg">Cliente</h3><p>{order.clients?.name}</p><p>{order.clients?.phone}</p><p className="break-all">{order.clients?.email}</p></div>
              <div><h3 className="font-semibold text-lg">Veículo</h3><p>{order.vehicles?.make} {order.vehicles?.model}</p><p>Placa: {order.vehicles?.license_plate}</p><p>Ano: {order.vehicles?.year}</p></div>
            </div>
            <Tabs defaultValue="items">
              <TabsList className="no-print"><TabsTrigger value="items">Itens e Custos</TabsTrigger><TabsTrigger value="observations">Observações</TabsTrigger></TabsList>
              <TabsContent value="items" className="mt-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table className="min-w-[500px]">
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="w-16">Qtd.</TableHead><TableHead className="text-right w-28">Vl. Unit.</TableHead><TableHead className="text-right w-28">Subtotal</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {(order.items as ServiceItem[])?.map((item, i) => (
                        <TableRow key={i}><TableCell className="font-medium">{item.description}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{Number(item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell><TableCell className="text-right">{(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4"><div className="w-full max-w-sm space-y-2"><Separator /><div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div></div></div>
              </TabsContent>
              <TabsContent value="observations" className="mt-4"><p className="whitespace-pre-wrap break-words">{order.observations || "Nenhuma observação."}</p></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}