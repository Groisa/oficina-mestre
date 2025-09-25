import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client"; // Ajuste o caminho se necessário
import { Database } from "@/integrations/supabase/types"; // Ajuste o caminho se necessário
import { Calendar as CalendarIcon, DollarSign, Users, Package, ClipboardList } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { cn } from "@/lib/utils";

// Tipos
type ServiceOrder = Database['public']['Tables']['service_orders']['Row'] & {
  clients: { name: string } | null;
};
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

interface ReportData {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  revenueByDay: { date: string; faturamento: number }[];
  filteredOrders: ServiceOrder[];
  stockValue: number;
  lowStockItemsCount: number;
  inventoryItems: InventoryItem[];
  newClientsCount: number;
  topClients: { name: string | null; total: number }[];
  topServices: { name: string; value: number }[];
}

// Cores para o gráfico de pizza
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

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
        const { data: orders, error: ordersError } = await supabase
          .from("service_orders")
          .select("*, clients(name)")
          .gte("created_at", date.from.toISOString())
          .lte("created_at", date.to.toISOString())
          .order("created_at", { ascending: false });

        const { data: inventory, error: inventoryError } = await supabase
          .from("inventory_items")
          .select("*");

        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, created_at")
          .gte("created_at", date.from.toISOString())
          .lte("created_at", date.to.toISOString());

        if (ordersError || inventoryError || clientsError) {
          throw ordersError || inventoryError || clientsError;
        }

        // Processamento dos dados
        const totalRevenue = orders.reduce((acc, order) => acc + order.total_value, 0);
        const totalOrders = orders.length;

        const revenueByDay = orders.reduce((acc, order) => {
          const day = format(new Date(order.created_at), "dd/MM");
          acc[day] = (acc[day] || 0) + order.total_value;
          return acc;
        }, {} as Record<string, number>);

        const topClients = orders.reduce((acc, order) => {
          const clientName = order.clients?.name || 'Cliente Desconhecido';
          acc[clientName] = (acc[clientName] || 0) + order.total_value;
          return acc;
        }, {} as Record<string, number>);

        // LINHA CORRIGIDA AQUI
        const serviceCounts = orders.flatMap(o => Array.isArray(o.items) ? o.items : [])
          // ADICIONAMOS O TIPO DO "item" AQUI
          .reduce((acc, item: { description?: string; quantity?: number }) => {
            if (item && item.description) {
              acc[item.description] = (acc[item.description] || 0) + (item.quantity || 1);
            }
            return acc;
          }, {} as Record<string, number>);


        setData({
          totalRevenue,
          totalOrders,
          averageTicket: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          revenueByDay: Object.entries(revenueByDay).map(([date, faturamento]) => ({ date, faturamento })),
          filteredOrders: orders as ServiceOrder[],
          stockValue: inventory.reduce((acc, item) => acc + (item.current_stock * item.unit_price), 0),
          lowStockItemsCount: inventory.filter(i => i.current_stock <= i.minimum_stock).length,
          inventoryItems: inventory,
          newClientsCount: clients.length,
          topClients: Object.entries(topClients).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, total]) => ({ name, total })),
          topServices: Object.entries(serviceCounts)
            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
            .slice(0, 5)
            .map(([name, value]) => ({ name, value: value as number })),
        });

      } catch (error) {
        console.error("Erro ao processar dados dos relatórios:", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, [date]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise de desempenho da oficina</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <p>Carregando relatórios...</p>
      ) : !data ? (
        <p>Não foi possível carregar os dados.</p>
      ) : (
        <Tabs defaultValue="financial">
          <TabsList>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="inventory">Estoque</TabsTrigger>
            <TabsTrigger value="services">Serviços e Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader><CardTitle>Faturamento Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
              <Card><CardHeader><CardTitle>Total de Ordens</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.totalOrders}</p></CardContent></Card>
              <Card><CardHeader><CardTitle>Ticket Médio</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Faturamento por Dia</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis width={80} tickFormatter={(value) => `R$${value}`} />
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                    <Legend />
                    <Bar dataKey="faturamento" fill="#8884d8" name="Faturamento" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card><CardHeader><CardTitle>Valor Total em Estoque</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.stockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></CardContent></Card>
              <Card><CardHeader><CardTitle>Itens com Estoque Baixo</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{data.lowStockItemsCount}</p></CardContent></Card>
            </div>
            <Card>
              <CardHeader><CardTitle>Lista de Itens em Estoque</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Estoque Atual</TableHead><TableHead>Estoque Mínimo</TableHead><TableHead className="text-right">Preço Unitário</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.inventoryItems.map(item => (
                      <TableRow key={item.id} className={item.current_stock <= item.minimum_stock ? 'bg-destructive/10' : ''}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.current_stock}</TableCell>
                        <TableCell>{item.minimum_stock}</TableCell>
                        <TableCell className="text-right">{item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Top 5 Serviços/Peças</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={data.topServices} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                        {data.topServices.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Top 10 Clientes por Faturamento</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Valor Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {data.topClients.map(client => (
                        <TableRow key={client.name}>
                          <TableCell>{client.name}</TableCell>
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