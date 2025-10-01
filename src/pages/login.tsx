import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export function LoginPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error, data } = await supabase.auth.signInWithPassword({ email: email, password: password });
        console.log({ error, data });
        console.log(error,data)
        if (error) {
            setError(error.message); 'q'
        } else {
            window.location.href = '/'; // Redireciona para a página principal
        }
        setLoading(false);
    };

 
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40">
            <Tabs defaultValue="login" className="w-[400px]">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Entrar</TabsTrigger>
                </TabsList>

                {/* Formulário de Login */}
                <TabsContent value="login">
                    <form onSubmit={handleLogin}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Acessar Sistema</CardTitle>
                                <CardDescription>
                                    Bem-vindo de volta! Insira suas credenciais para continuar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="email-login">Email</Label>
                                    <Input id="email-login" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="password-login">Senha</Label>
                                    <Input id="password-login" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col items-stretch">
                                {error && <p className="text-sm text-center text-red-500 mb-4">{error}</p>}
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Entrar
                                </Button>
                            </CardFooter>
                        </Card>
                    </form>
                </TabsContent>

             
            </Tabs>
        </div>
    );
}
