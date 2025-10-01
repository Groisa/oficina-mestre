import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Package, AlertTriangle, TrendingUp, TrendingDown, MoreHorizontal, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Item = Database['public']['Tables']['inventory_items']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type ItemWithRelations = Item & { categories: Category | null; suppliers: Supplier | null; };

function InventoryForm({ onSave, onCancel, initialData, categories, suppliers, onAddNewCategory, onAddNewSupplier }: { onSave: Function, onCancel: Function, initialData?: Item | null, categories: Category[], suppliers: Supplier[], onAddNewCategory: Function, onAddNewSupplier: Function }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    current_stock: initialData?.current_stock || 0,
    minimum_stock: initialData?.minimum_stock || 0,
    cost_price: initialData?.cost_price || 0,
    sale_price: initialData?.sale_price || 0,
    category_id: initialData?.category_id || null,
    supplier_id: initialData?.supplier_id || null,
  });
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const isEditing = !!initialData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    const newCategory = await onAddNewCategory(newCategoryName.trim());
    if (newCategory) {
      setFormData(prev => ({ ...prev, category_id: newCategory.id }));
      setNewCategoryName("");
      setIsCategoryDialogOpen(false);
    }
  };
  
  const handleSaveNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    const newSupplier = await onAddNewSupplier(newSupplierName.trim());
    if (newSupplier) {
      setFormData(prev => ({ ...prev, supplier_id: newSupplier.id }));
      setNewSupplierName("");
      setIsSupplierDialogOpen(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">{isEditing ? "Editar Item" : "Novo Item no Estoque"}</h1><p className="text-muted-foreground">Preencha os detalhes do item.</p></div>
        <Button variant="outline" onClick={() => onCancel()}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Nome do Item</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required/></div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="category_id">Categoria</Label>
                <div className="flex items-center gap-2">
                  <Select name="category_id" onValueChange={value => handleSelectChange('category_id', value)} value={formData.category_id?.toString()}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Plus className="h-4 w-4"/></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader><div className="py-4"><Input placeholder="Nome da categoria" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} /></div><DialogFooter><Button onClick={handleSaveNewCategory}>Salvar</Button></DialogFooter></DialogContent></Dialog>
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="supplier_id">Fornecedor</Label>
                <div className="flex items-center gap-2">
                  <Select name="supplier_id" onValueChange={value => handleSelectChange('supplier_id', value)} value={formData.supplier_id?.toString()}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="icon"><Plus className="h-4 w-4"/></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader><div className="py-4"><Input placeholder="Nome do fornecedor" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} /></div><DialogFooter><Button onClick={handleSaveNewSupplier}>Salvar</Button></DialogFooter></DialogContent></Dialog>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="cost_price">Preço de Custo (R$)</Label><Input id="cost_price" name="cost_price" type="number" step="0.01" value={formData.cost_price} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="sale_price">Preço de Venda (R$)</Label><Input id="sale_price" name="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={handleChange} /></div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="current_stock">Estoque Atual</Label><Input id="current_stock" name="current_stock" type="number" value={formData.current_stock} onChange={handleChange} /></div>
              <div className="space-y-2"><Label htmlFor="minimum_stock">Estoque Mínimo</Label><Input id="minimum_stock" name="minimum_stock" type="number" value={formData.minimum_stock} onChange={handleChange} /></div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end"><Button type="submit">{isEditing ? "Salvar Alterações" : "Adicionar Item"}</Button></CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Componente Principal
export function InventoryList() {
  const [view, setView] = useState('list');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [inventory, setInventory] = useState<ItemWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data: items, error: itemsError } = await supabase.from('inventory_items').select(`*, categories(name), suppliers(name)`).order('name');
    const { data: cats, error: catsError } = await supabase.from('categories').select('*').order('name');
    const { data: supps, error: suppsError } = await supabase.from('suppliers').select('*').order('name');
    if (itemsError || catsError || suppsError) console.error(itemsError || catsError || suppsError);
    else {
      setInventory(items as ItemWithRelations[] || []);
      setCategories(cats || []);
      setSuppliers(supps || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (formData: Omit<Item, 'id' | 'created_at' | 'last_update'>, itemId?: number) => {
    const dataToSave = { ...formData, last_update: new Date().toISOString() };
    const query = itemId ? supabase.from('inventory_items').update(dataToSave).eq('id', itemId) : supabase.from('inventory_items').insert([dataToSave]);
    const { error } = await query;
    if (error) console.error("Erro ao salvar:", error.message);
    else { await fetchData(); setView('list'); setEditingItem(null); }
  };

  const handleAddNewCategory = async (name: string) => {
    const { data, error } = await supabase.from('categories').insert({ name }).select().single();
    if (error) { console.error("Erro ao adicionar categoria:", error); return null; }
    else { setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); return data; }
  };
  
  const handleAddNewSupplier = async (name: string) => {
    const { data, error } = await supabase.from('suppliers').insert({ name }).select().single();
    if (error) { console.error("Erro ao adicionar fornecedor:", error); return null; }
    else { setSuppliers(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name))); return data; }
  };
  
  const handleDelete = async (itemId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este item?")) {
      const { error } = await supabase.from('inventory_items').delete().eq('id', itemId);
      if (error) console.error("Erro ao deletar:", error.message);
      else await fetchData();
    }
  };

  const filteredInventory = inventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) || item.suppliers?.name.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === "all" || item.category_id?.toString() === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (current: number, minimum: number) => {
    if (current < minimum) return { status: "Baixo", variant: "destructive" as const };
    if (current <= minimum * 1.2) return { status: "Atenção", variant: "outline" as const };
    return { status: "Normal", variant: "default" as const };
  };

  const totalValue = inventory.reduce((acc, item) => acc + (item.current_stock * item.cost_price), 0);
  const lowStockCount = inventory.filter(item => item.current_stock < item.minimum_stock).length;

  if (view === 'form') {
    return <InventoryForm onSave={handleSave} onCancel={() => { setView('list'); setEditingItem(null); }} initialData={editingItem} categories={categories} suppliers={suppliers} onAddNewCategory={handleAddNewCategory} onAddNewSupplier={handleAddNewSupplier} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Estoque</h1><p className="text-muted-foreground">Controle de peças e materiais</p></div>
        <div className="flex space-x-2">
          <Button onClick={() => { setEditingItem(null); setView('form'); }}><Plus className="h-4 w-4 mr-2" />Novo Item</Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por nome ou fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><Package className="h-5 w-5 text-primary" /><div><p className="text-sm text-muted-foreground">Itens Únicos</p><p className="text-2xl font-bold">{inventory.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><AlertTriangle className="h-5 w-5 text-destructive" /><div><p className="text-sm text-muted-foreground">Estoque Baixo</p><p className="text-2xl font-bold text-destructive">{lowStockCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center space-x-2"><TrendingUp className="h-5 w-5 text-emerald-500" /><div><p className="text-sm text-muted-foreground">Valor do Estoque (Custo)</p><p className="text-2xl font-bold">{totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Itens do Estoque ({filteredInventory.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? <p>Carregando...</p> : filteredInventory.map((item) => {
              const stockStatus = getStockStatus(item.current_stock, item.minimum_stock);
              return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-primary" /></div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate" title={item.name}>{item.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="truncate">{item.categories?.name || 'N/A'}</span><span>•</span><span className="truncate">{item.suppliers?.name || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Estoque</p>
                      <div className="flex items-center justify-center space-x-1 font-medium">
                        <span>{item.current_stock}</span>
                        <span className="text-muted-foreground">/ {item.minimum_stock}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Custo</p>
                      <p className="font-medium text-sm">{item.cost_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Venda</p>
                      <p className="font-medium text-sm">{item.sale_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    <Badge variant={stockStatus.variant} className="hidden sm:inline-flex">{stockStatus.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingItem(item); setView('form'); }}>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(item.id)}>Excluir</DropdownMenuItem>
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

