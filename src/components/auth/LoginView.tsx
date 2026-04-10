"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Image from "next/image";

export function LoginView() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { toast } = useToast();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                toast({
                    title: "Verifica tu correo",
                    description: "Hemos enviado un enlace de confirmación a tu email.",
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Ocurrió un error inesperado",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 h-64 w-64 bg-emerald-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-aequo-gold/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md z-10"
            >
                <Card className="border-border bg-card/50 backdrop-blur-xl">
                    <CardHeader className="space-y-1 flex flex-col items-center">
                        <div className="mb-4 p-3 rounded-2xl bg-zinc-900 border border-border shadow-inner">
                            <Image
                                src="/favicon.png"
                                alt="Æquo Logo"
                                width={48}
                                height={48}
                                className="brightness-110"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                            {isSignUp ? "Crea tu cuenta" : "Bienvenido a Æquo"}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {isSignUp
                                ? "Regístrate para comenzar a valuar con IA"
                                : "Ingresa tus credenciales para acceder a la plataforma"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAuth} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="nombre@empresa.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Contraseña</Label>
                                    {!isSignUp && (
                                        <Button variant="link" className="px-0 font-normal text-xs text-muted-foreground hover:text-primary">
                                            ¿Olvidaste tu contraseña?
                                        </Button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full group" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        {isSignUp ? "Registrarse" : "Iniciar Sesión"}
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button variant="outline" type="button" disabled={loading}>
                                Google
                            </Button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                            {isSignUp ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="font-medium text-emerald-500 hover:text-emerald-400 underline-offset-4 hover:underline"
                            >
                                {isSignUp ? "Inicia sesión" : "Regístrate gratis"}
                            </button>
                        </p>
                    </CardFooter>
                </Card>

                <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
                    Al continuar, aceptas nuestros{" "}
                    <a href="#" className="underline hover:text-foreground">Términos de Servicio</a> y{" "}
                    <a href="#" className="underline hover:text-foreground">Política de Privacidad</a>.
                </p>
            </motion.div>
        </div>
    );
}
