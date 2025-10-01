import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Calendar as CalendarIcon, DollarSign, Users, Package, ClipboardList, TrendingUp, AlertCircle, Ban, Wrench, BarChart2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

// Tipos
type ServiceOrder = Database['public']['Tables']['service_orders']['Row'] & {
  clients: { name: string } | null;
};
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

// Tipagem para os itens dentro do JSONB da Ordem de Serviço
interface ServiceItem {
  type: 'Serviço' | 'Peça';
  description: string;
  quantity: number;
  unitPrice: number;
}

interface ReportData {
  // Financeiro
  totalRevenue: number;
  potentialRevenue: number;
  completedOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  averageTicket: number;
  revenueByDay: { date: string; faturamento: number }[];
  
  // Clientes
  newClientsCount: number;
  topClients: { name: string | null; total: number }[];
  
  // Serviços e Peças
  topServices: { name: string; value: number }[];
  
  // Estoque
  stockValueByCost: number;
  stockValueBySale: number;
  lowStockItemsCount: number;
  inventoryItems: InventoryItem[];
}

// Cores para o gráfico de pizza
const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'];

// **CORREÇÃO 2 APLICADA AQUI**
// O tipo do parâmetro 'clients' foi ajustado para corresponder à query do Supabase.
function processReportData(orders: ServiceOrder[], inventory: InventoryItem[], clients: Pick<Client, 'id' | 'name' | 'created_at'>[]): ReportData {
  const completedOrders = orders.filter(o => o.status === 'Concluído');
  const pendingOrders = orders.filter(o => ['Orçamento', 'Aguardando aprovação', 'Em andamento'].includes(o.status));
  const cancelledOrders = orders.filter(o => o.status === 'Cancelado');

  const totalRevenue = completedOrders.reduce((acc, order) => acc + (order.total_value || 0), 0);
  const potentialRevenue = pendingOrders.reduce((acc, order) => acc + (order.total_value || 0), 0);
  const completedOrdersCount = completedOrders.length;
  
  const revenueByDay = completedOrders.reduce((acc, order) => {
    const day = format(new Date(order.created_at), "dd/MM");
    acc[day] = (acc[day] || 0) + (order.total_value || 0);
    return acc;
  }, {} as Record<string, number>);

  const topClients = completedOrders.reduce((acc, order) => {
    const clientName = order.clients?.name || 'Cliente Avulso';
    acc[clientName] = (acc[clientName] || 0) + (order.total_value || 0);
    return acc;
  }, {} as Record<string, number>);

  const serviceCounts = completedOrders
    // **CORREÇÃO 1 APLICADA AQUI**
    // Usamos 'as unknown as ServiceItem[]' para converter o tipo Json de forma segura.
    .flatMap(o => (Array.isArray(o.items) ? o.items as unknown as ServiceItem[] : []))
    .reduce((acc, item) => {
      if (item?.description) {
        acc[item.description] = (acc[item.description] || 0) + (item.quantity || 1);
      }
      return acc;
    }, {} as Record<string, number>);

  return {
    totalRevenue,
    potentialRevenue,
    completedOrdersCount,
    pendingOrdersCount: pendingOrders.length,
    cancelledOrdersCount: cancelledOrders.length,
    averageTicket: completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0,
    revenueByDay: Object.entries(revenueByDay).map(([date, faturamento]) => ({ date, faturamento })).sort((a,b) => a.date.localeCompare(b.date)),
    newClientsCount: clients.length,
    topClients: Object.entries(topClients).sort(([, a], [, b]) => b - a).slice(0, 10).map(([name, total]) => ({ name, total })),
    topServices: Object.entries(serviceCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value })),
    stockValueByCost: inventory.reduce((acc, item) => acc + (item.current_stock * item.cost_price), 0),
    stockValueBySale: inventory.reduce((acc, item) => acc + (item.current_stock * item.sale_price), 0),
    lowStockItemsCount: inventory.filter(i => i.current_stock <= i.minimum_stock).length,
    inventoryItems: inventory,
  };
}


export function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      if (!date?.from || !date?.to) return;
      setLoading(true);

      try {
        const fromDate = date.from.toISOString();
        const toDate = date.to.toISOString();

        const { data: orders, error: ordersError } = await supabase
          .from("service_orders").select("*, clients(name)")
          .gte("created_at", fromDate).lte("created_at", toDate);

        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory_items").select("*");

        const { data: clients, error: clientsError } = await supabase
          .from("clients").select("id, name, created_at")
          .gte("created_at", fromDate).lte("created_at", toDate);

        if (ordersError || inventoryError || clientsError) {
          throw ordersError || inventoryError || clientsError;
        }

        const processedData = processReportData(orders as ServiceOrder[], inventory, clients);
        setData(processedData);

      } catch (error) {
        console.error("Erro ao carregar dados dos relatórios:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [date]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Análise</h1>
          <p className="text-muted-foreground">Visão geral do desempenho do seu negócio.</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button id="date" variant={"outline"} className={cn("w-full sm:w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/y")} - {format(date.to, "dd/MM/y")}</>) : (format(date.from, "dd/MM/y"))) : (<span>Selecione um período</span>)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (<p>Carregando relatórios...</p>) : !data ? (<p>Não foi possível carregar os dados.</p>) : (
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="inventory">Estoque</TabsTrigger>
            <TabsTrigger value="clients">Clientes & Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Faturamento (Concluído)</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">Baseado em {data.completedOrdersCount} ordens concluídas</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Receita Potencial</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.potentialRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-muted-foreground">{data.pendingOrdersCount} ordens em aberto</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Novos Clientes</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">+{data.newClientsCount}</div><p className="text-xs text-muted-foreground">No período selecionado</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle><AlertCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{data.lowStockItemsCount} itens</div><p className="text-xs text-muted-foreground">Abaixo ou no nível mínimo</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Faturamento por Dia (Ordens Concluídas)</CardTitle></CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`} />
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <Bar dataKey="faturamento" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
             <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ticket Médio</CardTitle><BarChart2 className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{data.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ordens Concluídas</CardTitle><ClipboardList className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{data.completedOrdersCount}</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Ordens Canceladas</CardTitle><Ban className="h-4 w-4 text-muted-foreground"/></CardHeader><CardContent><p className="text-2xl font-bold">{data.cancelledOrdersCount}</p></CardContent></Card>
              </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
             <div className="grid gap-4 md:grid-cols-2">
                <Card><CardHeader><CardTitle>Valor em Estoque (Custo)</CardTitle><CardDescription>Soma de (estoque atual * preço de custo)</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{data.stockValueByCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
                <Card><CardHeader><CardTitle>Potencial de Venda</CardTitle><CardDescription>Soma de (estoque atual * preço de venda)</CardDescription></CardHeader><CardContent><p className="text-2xl font-bold">{data.stockValueBySale.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
              </div>
            <Card>
              <CardHeader><CardTitle>Lista de Itens em Estoque</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Estoque Mínimo</TableHead><TableHead className="text-right">Preço de Custo</TableHead><TableHead className="text-right">Preço de Venda</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.inventoryItems.map(item => (
                      <TableRow key={item.id} className={item.current_stock <= item.minimum_stock ? 'bg-destructive/10' : ''}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>{item.minimum_stock}</TableCell>
                        <TableCell className="text-right">{item.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        <TableCell className="text-right">{item.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Top 5 Serviços & Peças (por Quantidade)</CardTitle><CardDescription>Baseado em ordens concluídas</CardDescription></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={data.topServices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                        {data.topServices.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} unidades`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top 10 Clientes (por Faturamento)</CardTitle><CardDescription>Baseado em ordens concluídas</CardDescription></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Valor Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.topClients.map(client => (
                        <TableRow key={client.name}>
                          <TableCell className="font-medium">{client.name}</TableCell>
                          <TableCell className="text-right">{client.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}