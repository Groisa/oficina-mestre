import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Edit, Trash, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/auth";

type Category = Database['public']['Tables']['categories']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type TableName = keyof Database['public']['Tables'];
type ManagableItem = Category | Supplier;

interface ManagementListProps {
  title: string;
  items: ManagableItem[];
  onSave: (tableName: TableName, name: string, itemId?: number) => Promise<void>;
  onDelete: (tableName: TableName, itemId: number) => Promise<void>;
  tableName: TableName;
  // Adicionado para verificar permissões
  userId: string | null | undefined;
  isAdmin: boolean;
}

function ManagementList({ title, items, onSave, onDelete, tableName, userId, isAdmin }: ManagementListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<ManagableItem | null>(null);
  const [itemName, setItemName] = useState("");

  const handleOpenDialog = (item: ManagableItem | null = null) => {
    setCurrentItem(item);
    setItemName(item ? item.name || '' : "");
    setIsDialogOpen(true);
  };

  const handleSaveClick = () => {
    if (currentItem) {
      onSave(tableName, itemName, currentItem.id);
    } else {
      onSave(tableName, itemName);
    }
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
          {items.map((item) => {
            // Lógica para verificar se o utilizador pode editar/apagar
            const canManage = isAdmin || (item.user_id && item.user_id === userId);
            return (
              <div key={item.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
                <span>{item.name}</span>
                {/* Mostra os botões apenas se o utilizador tiver permissão */}
                {canManage && (
                  <div className="space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(tableName, item.id)}><Trash className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            );
          })}
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

function UserManagement({ users, onUpdate, onDelete, onCreate }: { users: Profile[], onUpdate: () => void, onDelete: (userId: string) => Promise<void>, onCreate: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', role: 'mecanico' });
  
  const handleOpenDialog = (user: Profile | null = null) => {
    setCurrentUser(user);
    if (user) {
      setFormData({ email: '', password: '', full_name: user.full_name || '', role: user.role || 'mecanico' });
    } else {
      setFormData({ email: '', password: '', full_name: '', role: 'mecanico' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (currentUser) {
      const { error } = await supabase.from('profiles').update({ full_name: formData.full_name, role: formData.role as any }).eq('id', currentUser.id);
      if (error) alert(`Erro ao atualizar usuário: ${error.message}`);
      else onUpdate();
    } else {
       if (!formData.email || !formData.password || !formData.full_name) {
         alert("Por favor, preencha todos os campos para criar um novo usuário.");
         return;
       }
       const { error } = await supabase.rpc('create_new_user', {
         email: formData.email,
         password: formData.password,
         full_name: formData.full_name,
         role: formData.role
       });
       if (error) alert(`Erro ao criar usuário: ${error.message}`);
       else onCreate();
    }
    setIsDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Usuários</CardTitle>
        <Button size="sm" onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Adicionar Usuário</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50">
              <div>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.role}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="icon" onClick={() => handleOpenDialog(user)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(user.id)}><Trash className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{currentUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                <DialogDescription>
                    {currentUser ? 'Altere o nome e a permissão do usuário.' : 'Preencha os dados para criar um novo usuário.'}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Input
                    name="full_name"
                    placeholder="Nome Completo"
                    value={formData.full_name}
                    onChange={handleChange}
                />
                {!currentUser && (
                    <>
                        <Input
                            name="email"
                            type="email"
                            placeholder="E-mail"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <Input
                            name="password"
                            type="password"
                            placeholder="Senha"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </>
                )}
                <Select onValueChange={handleRoleChange} value={formData.role}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a permissão" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="mecanico">Mecânico</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function SettingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth(); 
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const [categoriesRes, suppliersRes, usersRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('suppliers').select('*').order('name'),
        isAdmin ? supabase.from('profiles').select('*').order('full_name') : Promise.resolve({ data: [], error: null })
    ]);

    if (categoriesRes.error || suppliersRes.error || usersRes.error) {
      console.error(categoriesRes.error || suppliersRes.error || usersRes.error);
    } else {
      setCategories(categoriesRes.data || []);
      setSuppliers(suppliersRes.data || []);
      if (isAdmin) {
          setUsers(usersRes.data || []);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [isAdmin, authLoading]);

  const handleSaveItem = async (tableName: TableName, name: string, itemId?: number) => {
    if (!name.trim()) return;

    const query = itemId
      ? supabase.from(tableName).update({ name } as any).eq('id', itemId)
      : supabase.from(tableName).insert({ name } as any);

    const { error } = await query;
    if (error) console.error(`Erro ao salvar em ${tableName}:`, error.message);
    else await fetchData();
  };

  const handleDeleteItem = async (tableName: TableName, itemId: number) => {
    if (window.confirm("Tem certeza que deseja excluir? Esta ação não pode ser desfeita.")) {
      const { error } = await supabase.from(tableName).delete().eq('id', itemId);
      if (error) {
        alert(`Erro ao excluir: ${error.message}\n\nEste item pode estar sendo usado em outro cadastro.`);
      } else {
        await fetchData();
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário? Esta ação é irreversível.")) {
        const { error } = await supabase.rpc('delete_user_by_id', {
            user_id_to_delete: userId
        });
        if (error) {
            alert(`Erro ao excluir usuário: ${error.message}`);
        } else {
            await fetchData();
        }
    }
  };

  if (loading || authLoading) {
    return <p>Carregando configurações...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie os cadastros e usuários do sistema</p>
      </div>
      <Tabs defaultValue={isAdmin ? "users" : "categories"}>
        <TabsList>
          {isAdmin && <TabsTrigger value="users">Usuários</TabsTrigger>}
          <TabsTrigger value="categories">Categorias de Itens</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
        </TabsList>
        {isAdmin && (
          <TabsContent value="users" className="mt-4">
              <UserManagement
                  users={users}
                  onUpdate={fetchData}
                  onDelete={handleDeleteUser}
                  onCreate={fetchData}
              />
          </TabsContent>
        )}
        <TabsContent value="categories" className="mt-4">
          <ManagementList 
            title="Categorias" 
            items={categories} 
            onSave={handleSaveItem} 
            onDelete={handleDeleteItem} 
            tableName="categories"
            userId={user?.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ManagementList 
            title="Fornecedores" 
            items={suppliers} 
            onSave={handleSaveItem} 
            onDelete={handleDeleteItem} 
            tableName="suppliers"
            userId={user?.id}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

