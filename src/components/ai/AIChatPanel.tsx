"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Sparkles, X, Send, Trash2, Bot, Zap } from "lucide-react";
import { useAppStore, type AiChatMessage } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 5) return "ahora";
  if (diffSec < 60) return `hace ${diffSec}s`;
  if (diffMin === 1) return "hace 1 min";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHr === 1) return "hace 1 hr";
  if (diffHr < 24) return `hace ${diffHr} hr`;
  if (diffDay === 1) return "ayer";
  return `hace ${diffDay} días`;
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Quick Action Chips ───────────────────────────────────────────────────────

interface QuickAction {
  icon: string;
  label: string;
  message: string;
}

const quickActionsByView: Record<string, QuickAction[]> = {
  dashboard: [
    { icon: "📊", label: "Resumen del portafolio", message: "Dame un resumen y análisis del estado actual de mi portafolio de propiedades" },
    { icon: "📈", label: "Tendencias del mercado", message: "¿Cuáles son las tendencias actuales del mercado inmobiliario en República Dominicana?" },
    { icon: "💡", label: "Consejos de inversión", message: "Dame consejos para invertir en propiedades comerciales en República Dominicana" },
    { icon: "🔍", label: "Oportunidades", message: "¿Qué oportunidades de inversión existen actualmente en el mercado dominicano?" },
  ],
  "new-valuation": [
    { icon: "📝", label: "Guía de valuación", message: "Guíame paso a paso sobre cómo completar una valuación precisa" },
    { icon: "🏛️", label: "Metodologías", message: "Explícame las metodologías de valuación: comparables, ingresos, costo e híbrido" },
    { icon: "📐", label: "Datos importantes", message: "¿Qué datos son más importantes para una valuación comercial precisa?" },
    { icon: "📉", label: "Factores de riesgo", message: "¿Qué factores de riesgo debo considerar al valuar una propiedad comercial?" },
  ],
  properties: [
    { icon: "🔍", label: "Criterios de búsqueda", message: "¿Qué criterios debo considerar al buscar propiedades comerciales?" },
    { icon: "📊", label: "Comparar propiedades", message: "¿Cómo puedo comparar propiedades comerciales de manera efectiva?" },
    { icon: "📈", label: "Zonas recomendadas", message: "¿Cuáles son las mejores zonas para propiedades comerciales en República Dominicana?" },
    { icon: "💡", label: "Consejos de inversión", message: "Dame consejos para invertir en propiedades comerciales en República Dominicana" },
  ],
  "property-detail": [
    { icon: "📊", label: "Analizar propiedad", message: "Analiza la propiedad que estoy viendo actualmente en detalle" },
    { icon: "💰", label: "Estimar valor", message: "¿Cuál sería un rango de valor razonable para esta propiedad?" },
    { icon: "⚖️", label: "Pros y contras", message: "Dame los pros y contras de esta propiedad como inversión" },
    { icon: "🔧", label: "Mejoras sugeridas", message: "¿Qué mejoras podría hacer para incrementar el valor de esta propiedad?" },
  ],
  "market-analysis": [
    { icon: "📈", label: "Tendencias DR", message: "¿Cuáles son las tendencias actuales del mercado inmobiliario en República Dominicana?" },
    { icon: "🏢", label: "Oficinas en SDQ", message: "¿Cómo está el mercado de oficinas en Santo Domingo actualmente?" },
    { icon: "🏭", label: "Industrial", message: "¿Cuál es el panorama del mercado industrial y bodegas en República Dominicana?" },
    { icon: "🏖️", label: "Bávaro/Punta Cana", message: "¿Qué oportunidades existen en el mercado comercial de Bávaro y Punta Cana?" },
  ],
  settings: [
    { icon: "❓", label: "Ayuda general", message: "¿Cómo puedo aprovechar al máximo la plataforma Æquo?" },
    { icon: "📊", label: "Reportes PDF", message: "Explícame cómo generar y personalizar reportes de valuación en PDF" },
    { icon: "📥", label: "Importar datos", message: "¿Cómo puedo importar propiedades masivamente usando CSV?" },
    { icon: "🗺️", label: "Herramientas de mapa", message: "¿Cómo funcionan las herramientas de mapa y geolocalización en Æquo?" },
  ],
};

const defaultQuickActions: QuickAction[] = [
  { icon: "📊", label: "Analizar propiedad", message: "Analiza la propiedad que estoy viendo actualmente" },
  { icon: "📈", label: "Tendencias del mercado", message: "¿Cuáles son las tendencias actuales del mercado inmobiliario en República Dominicana?" },
  { icon: "🏛️", label: "Metodologías de valuación", message: "Explícame las metodologías de valuación de propiedades comerciales" },
  { icon: "💡", label: "Consejos de inversión", message: "Dame consejos para invertir en propiedades comerciales en República Dominicana" },
];

// ── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3">
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          Æ
        </AvatarFallback>
      </Avatar>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">
            Æquo está pensando
          </span>
          <span className="flex gap-0.5">
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
            />
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex items-start gap-2.5 px-4 py-1.5", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI Avatar */}
      {!isUser && (
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            Æ
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatRelativeTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

// ── Welcome Screen ───────────────────────────────────────────────────────────

function WelcomeScreen({ onQuickAction, currentView }: { onQuickAction: (msg: string) => void; currentView: string }) {
  const actions = quickActionsByView[currentView] || defaultQuickActions;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-4"
      >
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <motion.div
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-aequo-gold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-1">
          Asistente Æquo AI
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-[260px]">
          ¡Hola! Soy tu asistente de valuación. ¿En qué puedo ayudarte?
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex flex-col gap-2 w-full max-w-[280px]"
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => onQuickAction(action.message)}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-left text-sm hover:bg-accent hover:border-primary/30 transition-colors cursor-pointer"
          >
            <span className="text-base shrink-0">{action.icon}</span>
            <span className="text-foreground/80">{action.label}</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ── Panel Variants ───────────────────────────────────────────────────────────

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const buttonVariants = {
  open: { rotate: 0 },
  closed: { rotate: 0 },
};

// ── Main Component ───────────────────────────────────────────────────────────

export function AIChatPanel() {
  const {
    aiChatOpen,
    aiChatMessages,
    aiChatSessionId,
    aiChatLoading,
    toggleAiChat,
    setAiChatOpen,
    addAiChatMessage,
    setAiChatLoading,
    clearAiChat,
    setAiChatSessionId,
    currentView,
    selectedPropertyId,
  } = useAppStore();

  const [inputValue, setInputValue] = useState("");
  const [activeProvider, setActiveProvider] = useState<string>("openai");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiChatMessages, aiChatLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`; // max 4 rows ~96px
    }
  }, [inputValue]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (aiChatOpen && !aiChatMessages.length) {
      setTimeout(() => textareaRef.current?.focus(), 350);
    }
  }, [aiChatOpen, aiChatMessages.length]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || aiChatLoading) return;

      // Add user message
      const userMsg: AiChatMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      addAiChatMessage(userMsg);
      setInputValue("");
      setAiChatLoading(true);

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: aiChatSessionId,
            message: trimmed,
            provider: activeProvider,
            context: {
              view: currentView,
              propertyId: selectedPropertyId ?? undefined,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al enviar mensaje");
        }

        // Update session ID and provider
        if (data.sessionId) {
          setAiChatSessionId(data.sessionId);
        }
        if (data.provider) {
          setActiveProvider(data.provider);
        }

        // Add AI response
        const assistantMsg: AiChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        };
        addAiChatMessage(assistantMsg);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Lo siento, hubo un error inesperado. Por favor, intenta de nuevo.";
        const errorMsg: AiChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `⚠️ ${errorMessage}`,
          timestamp: new Date(),
        };
        addAiChatMessage(errorMsg);
      } finally {
        setAiChatLoading(false);
        textareaRef.current?.focus();
      }
    },
    [
      aiChatLoading,
      aiChatSessionId,
      addAiChatMessage,
      setAiChatLoading,
      setAiChatSessionId,
      currentView,
      selectedPropertyId,
    ]
  );

  const handleClearChat = useCallback(async () => {
    if (aiChatSessionId) {
      try {
        await fetch("/api/ai/chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: aiChatSessionId }),
        });
      } catch {
        // Silently fail — clear local state anyway
      }
    }
    clearAiChat();
  }, [aiChatSessionId, clearAiChat]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleQuickAction = (msg: string) => {
    sendMessage(msg);
  };

  const messageCount = aiChatMessages.filter((m) => m.role === "assistant").length;

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <motion.button
        onClick={toggleAiChat}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "flex items-center justify-center cursor-pointer",
          "bg-primary text-primary-foreground",
          "hover:shadow-xl hover:scale-105",
          "transition-shadow duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={aiChatOpen ? "Cerrar chat" : "Abrir chat"}
      >
        {/* Pulse ring when closed */}
        {!aiChatOpen && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/40"
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Message count badge */}
        {!aiChatOpen && messageCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-aequo-gold text-aequo-gold-foreground p-0 text-[10px] font-bold border-2 border-background">
            {messageCount}
          </Badge>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={aiChatOpen ? "close" : "open"}
            variants={buttonVariants}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {aiChatOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Sparkles className="h-6 w-6" />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* ── Chat Panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {aiChatOpen && (
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
            style={{
              width: "min(420px, calc(100vw - 2rem))",
              height: "600px",
              maxHeight: "calc(100vh - 140px)",
            }}
          >
            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Asistente IA</h3>
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] text-muted-foreground">
                        En línea
                      </span>
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {activeProvider === "openai" ? "OpenAI GPT-4o" : "Claude AI"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Provider Toggle */}
                <div className="flex items-center rounded-lg border bg-background p-0.5 mr-1">
                  <button
                    onClick={() => { setActiveProvider("openai"); clearAiChat(); }}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                      activeProvider === "openai"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">GPT</span>
                  </button>
                  <button
                    onClick={() => { setActiveProvider("claude"); clearAiChat(); }}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
                      activeProvider === "claude"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span className="hidden sm:inline">Claude</span>
                  </button>
                </div>

                {/* Clear Chat */}
                {aiChatMessages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Limpiar chat"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpiar conversación</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro de que deseas limpiar todo el historial de la
                          conversación? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearChat}
                          className="bg-destructive text-white hover:bg-destructive/90"
                        >
                          Limpiar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => setAiChatOpen(false)}
                  aria-label="Cerrar chat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ── Messages Area ────────────────────────────────────────── */}
            {aiChatMessages.length === 0 ? (
              <div className="flex-1 overflow-hidden">
                <WelcomeScreen onQuickAction={handleQuickAction} currentView={currentView} />
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="custom-scrollbar flex-1 overflow-y-auto py-3"
              >
                {aiChatMessages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {aiChatLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* ── Input Area ───────────────────────────────────────────── */}
            <div className="border-t p-3 shrink-0">
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  disabled={aiChatLoading}
                  rows={1}
                  className={cn(
                    "w-full resize-none rounded-xl border border-input bg-background",
                    "px-4 py-2.5 pr-12 text-sm",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "min-h-[40px] max-h-[96px]"
                  )}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || aiChatLoading}
                  className={cn(
                    "absolute right-1.5 bottom-1.5 h-8 w-8 rounded-lg",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                  aria-label="Enviar mensaje"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Æquo AI puede cometer errores. Verifica la información importante.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
