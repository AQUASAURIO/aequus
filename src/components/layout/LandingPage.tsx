"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    Building2,
    BarChart3,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    CheckCircle2,
    PieChart,
    LineChart,
    Globe
} from "lucide-react";
import Image from "next/image";

interface LandingPageProps {
    onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
            {/* Navigation */}
            <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                <div className="container mx-auto flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-white/10">
                            <Image src="/favicon.png" alt="Logo" width={24} height={24} priority />
                        </div>
                        <span className="text-lg font-bold tracking-tight">ÆQUO</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <a href="#features" className="hover:text-emerald-500 transition-colors">Características</a>
                        <a href="#market" className="hover:text-emerald-500 transition-colors">Mercado</a>
                        <a href="#ai" className="hover:text-emerald-500 transition-colors">Inteligencia Artificial</a>
                    </div>
                    <Button
                        onClick={onLogin}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        Comenzar
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none">
                    <div className="absolute top-0 right-0 h-64 w-64 bg-emerald-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-20 left-10 h-64 w-64 bg-aequo-gold/5 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-6 relative">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest mb-6">
                                <Sparkles className="h-3 w-3" />
                                Nueva Era de Valuación Inmobiliaria
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
                                Valuación Comercial <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                                    Impulsada por IA
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Transformamos el análisis de propiedades comerciales con algoritmos avanzados y datos de mercado en tiempo real. Obtén precision estratégica en segundos.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={onLogin}
                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 h-14 px-8 text-lg font-bold rounded-2xl transition-all"
                                >
                                    Probar Æquo Gratis
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
                                >
                                    Ver Demo
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* App Preview Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-20 relative"
                    >
                        <div className="relative mx-auto max-w-5xl rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-sm">
                            <div className="rounded-xl overflow-hidden border border-white/5 bg-zinc-950 aspect-[16/9] flex items-center justify-center relative">
                                <div className="text-center p-8">
                                    <PieChart className="h-16 w-16 text-emerald-500/20 mx-auto mb-4" />
                                    <p className="text-zinc-500 font-medium">Visualización de Dashboard en Tiempo Real</p>
                                </div>
                                {/* Floating UI Elements */}
                                <div className="absolute top-10 right-10 p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/20 shadow-xl backdrop-blur-md hidden md:block">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">ANÁLISIS IA</span>
                                    </div>
                                    <div className="text-xl font-bold">$1.8M USD</div>
                                    <div className="text-[10px] text-zinc-500">Valor Estimado del Mercado</div>
                                </div>
                            </div>
                        </div>

                        {/* Glow effect under mockup */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-20 bg-emerald-500/20 blur-[80px] -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 border-t border-white/5 bg-zinc-950/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Todo lo que necesitas para valuar</h2>
                        <p className="text-zinc-500">Potencia tu flujo de trabajo con herramientas de última generación.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BarChart3,
                                title: "Análisis de Mercado",
                                desc: "Accede a tendencias de precios, volúmenes y tasas de ocupación en tiempo real."
                            },
                            {
                                icon: Sparkles,
                                title: "Valuación con IA",
                                desc: "Modelos predictivos que analizan cientos de variables para una precisión total."
                            },
                            {
                                icon: ShieldCheck,
                                title: "Reportes Certificados",
                                desc: "Genera documentos PDF profesionales listos para presentación en segundos."
                            },
                            {
                                icon: Building2,
                                title: "Gestión de Portafolio",
                                desc: "Centraliza todas tus propiedades y valuaciones históricas en un solo lugar."
                            },
                            {
                                icon: Globe,
                                title: "Mapa Interactivo",
                                desc: "Ubica visualmente cada propiedad y analiza su entorno geográfico con precisión."
                            },
                            {
                                icon: LineChart,
                                title: "Pronósticos Inmobiliarios",
                                desc: "Entiende hacia dónde se dirige el mercado con nuestras proyecciones basadas en datos."
                            }
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-zinc-900/80 transition-all cursor-default group"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-all group-hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                    <f.icon className="h-6 w-6 text-emerald-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="container mx-auto px-6">
                    <div className="relative rounded-[40px] bg-gradient-to-br from-emerald-600 to-emerald-900 p-12 md:p-20 overflow-hidden text-center">
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">¿Listo para modernizar tu análisis inmobiliario?</h2>
                            <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
                                Únete a los profesionales que ya están utilizando Æquo para tomar decisiones basadas en datos y precisión.
                            </p>
                            <Button
                                onClick={onLogin}
                                size="lg"
                                className="bg-white text-emerald-900 hover:bg-emerald-50 h-14 px-10 text-lg font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                Comienza Ahora - Es Gratis
                            </Button>
                        </div>
                        {/* Visual Decoration */}
                        <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-[-20deg] translate-x-10" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5 px-6">
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-zinc-500 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold">ÆQUO</span>
                        <span>© 2026. Todos los derechos reservados.</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <a href="#" className="hover:text-white">Privacidad</a>
                        <a href="#" className="hover:text-white">Términos</a>
                        <a href="#" className="hover:text-white">Contacto</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
