import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function NewOrderDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Simular criação da ordem
    const newOrder = {
      client: formData.get("client"),
      vehicle: formData.get("vehicle"),
      service: formData.get("service"),
      description: formData.get("description"),
    };

    console.log("Nova ordem criada:", newOrder);
    
    toast({
      title: "Ordem de Serviço Criada",
      description: "A nova ordem foi criada com sucesso!",
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Ordem
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              name="client"
              placeholder="Nome do cliente"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vehicle">Veículo</Label>
            <Input
              id="vehicle"
              name="vehicle"
              placeholder="Ex: Honda Civic 2020"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Tipo de Serviço</Label>
            <Select name="service" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revisao">Revisão</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="reparo">Reparo</SelectItem>
                <SelectItem value="diagnostico">Diagnóstico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva o problema ou serviço solicitado"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Ordem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}