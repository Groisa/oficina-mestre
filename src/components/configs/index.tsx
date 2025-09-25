import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "../../integrations/supabase/client";
import { Database } from "../../integrations/supabase/types";

// Tipos extraídos da base de dados
type Category = Database['public']['Tables']['categories']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type TableName = keyof Database['public']['Tables'];

// Tipo para os itens que podem ser gerenciados
type ManagableItem = Category | Supplier;

// Props para o componente de lista genérico
interface ManagementListProps {
  title: string;
  items: ManagableItem[];
  onSave: (tableName: TableName, name: string, itemId?: number) => Promise<void>;
  onDelete: (tableName: TableName, itemId: number) => Promise<void>;
  tableName: TableName;
}

// Componente reutilizável para gerenciar uma lista
function ManagementList({ title, items, onSave, onDelete, tableName }: ManagementListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ManagableItem | null>(null);
  const [itemName, setItemName] = useState("");

  const handleOpenDialog = (item: ManagableItem | null = null) => {
    setCurrentItem(item);
    setItemName(item ? item.name : "");
    setIsDialogOpen(true);
  };

  const handleSaveClick = () => {
    onSave(tableName, itemName, currentItem?.id);
    setIsDialogOpen(false);
    setCurrentItem(null);
    setItemName("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
              <span>{item.name}</span>
              <div className="space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(tableName, item.id)}><Trash className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{currentItem ? `Editar ${title.slice(0, -1)}` : `Novo ${title.slice(0, -1)}`}</DialogTitle></DialogHeader>
          <div className="py-4"><Input placeholder="Nome" value={itemName} onChange={(e) => setItemName(e.target.value)} /></div>
          <DialogFooter><Button onClick={handleSaveClick}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Componente Principal da Página de Configurações
export function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*').order('name');
    const { data: suppliersData, error: suppliersError } = await supabase.from('suppliers').select('*').order('name');

    if (categoriesError || suppliersError) {
      console.error(categoriesError || suppliersError);
    } else {
      setCategories(categoriesData || []);
      setSuppliers(suppliersData || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (tableName: TableName, name: string, itemId?: number) => {
    if (!name.trim()) return;

    const query = itemId
      ? supabase.from(tableName).update({ name } as any).eq('id', itemId)
      : supabase.from(tableName).insert({ name } as any);

    const { error } = await query;
    if (error) console.error(`Erro ao salvar em ${tableName}:`, error.message);
    else await fetchData();
  };

  const handleDelete = async (tableName: TableName, itemId: number) => {
    if (window.confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from(tableName).delete().eq('id', itemId);
      if (error) {
        alert(`Erro ao excluir: ${error.message}\n\nEste item pode estar sendo usado em outro cadastro.`);
      } else {
        await fetchData();
      }
    }
  };

  if (loading) {
    return <p>Carregando configurações...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os cadastros básicos do sistema</p>
      </div>
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorias de Itens</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-4">
          <ManagementList title="Categorias" items={categories} onSave={handleSave} onDelete={handleDelete} tableName="categories" />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ManagementList title="Fornecedores" items={suppliers} onSave={handleSave} onDelete={handleDelete} tableName="suppliers" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

