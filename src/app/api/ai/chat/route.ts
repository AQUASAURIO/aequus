import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import OpenAI from "openai";

// ── Types ───────────────────────────────────────────────────────────────────

type AiProvider = "openai" | "claude";

interface ChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

interface SessionData {
  id: string;
  messages: ChatMessage[];
  provider: AiProvider;
  lastActivity: number;
  createdAt: number;
}

interface ChatRequestBody {
  sessionId?: string;
  message: string;
  context?: {
    view?: string;
    propertyId?: string;
    propertyData?: Record<string, unknown>;
  };
  provider?: AiProvider;
}

interface DeleteRequestBody {
  sessionId: string;
}

// ── Provider Config ─────────────────────────────────────────────────────────

function getDefaultProvider(): AiProvider {
  const envProvider = process.env.AI_PROVIDER as AiProvider;
  if (envProvider === "openai" || envProvider === "claude") return envProvider;
  // Default to OpenAI if key is available
  return process.env.OPENAI_API_KEY ? "openai" : "claude";
}

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(`[AI Chat API] OPENAI_API_KEY is missing/empty!`);
    return null;
  }
  console.log(`[AI Chat API] OpenAI client initialized (Key length: ${apiKey.length})`);
  return new OpenAI({ apiKey });
}

// ── Session Store ───────────────────────────────────────────────────────────

const MAX_MESSAGES = 20;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

const sessions = new Map<string, SessionData>();

// Garbage collector — runs every 10 minutes
let gcInterval: ReturnType<typeof setInterval> | null = null;

function startGarbageCollector() {
  if (gcInterval) return;
  gcInterval = setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.lastActivity > SESSION_TTL_MS) {
        sessions.delete(id);
      }
    }
  }, 10 * 60 * 1000);
}

// Start GC on module load
startGarbageCollector();

// ── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(context?: ChatRequestBody["context"]): string {
  const contextBlock = buildContextBlock(context);

  return `Eres un asistente virtual experto en valuación de propiedades comerciales de la plataforma Æquo. Tienes más de 20 años de experiencia en el mercado inmobiliario comercial de la República Dominicana.

## Tu Especialidad
- Valuación de propiedades comerciales en la República Dominicana (Santo Domingo, Santiago, Punta Cana/Bávaro, La Romana, San Pedro de Macorís, etc.)
- Metodologías de valuación: comparables de mercado, método de ingresos (capitalización), método de costo, método híbrido
- Análisis de mercado inmobiliario comercial dominicano
- Tipos de propiedad: oficinas, retail/comercial, industrial, bodegas, terrenos, mixtos, hoteles, restaurantes
- Factores que afectan el valor: ubicación, estado de conservación, antigüedad, amenities, mercado local, regulaciones

## Funcionalidades de Æquo
- Dashboard con estadísticas del portafolio
- Nueva Valuación: formulario guiado de 4 pasos con análisis IA
- Directorio de propiedades con búsqueda y filtros
- Detalle de propiedad con análisis IA y comparables
- Análisis de mercado: tendencias, volúmenes, tasas de ocupación
- Exportación de reportes PDF profesionales
- Importación/Exportación CSV de propiedades
- Herramientas de mapa con vista satélite, calles y terreno

## Directrices de Respuesta
- Responde SIEMPRE en español por defecto
- Sé profesional, conciso y útil
- Usa terminología inmobiliaria apropiada
- Cuando sea relevante, menciona datos del mercado dominicano
- Si el usuario pregunta en inglés, responde en español de todas formas
- Ofrece recomendaciones accionables cuando sea posible
- Si no tienes suficiente información, pregunta para aclarar
- Formatea tus respuestas con markdown cuando sea apropiado (listas, negritas, etc.)
- No inventes datos específicos de propiedades que no te han proporcionado
${contextBlock}`;
}

function buildContextBlock(context?: ChatRequestBody["context"]): string {
  if (!context) return "";

  const blocks: string[] = [];

  if (context.view === "property-detail" && context.propertyData) {
    const data = context.propertyData;
    blocks.push(
      `\n## Contexto Actual — Detalle de Propiedad\nEl usuario está viendo los detalles de una propiedad específica. Datos disponibles:\n` +
      `- **Nombre:** ${data.name || "N/A"}\n` +
      `- **Dirección:** ${data.address || "N/A"}${data.city ? ", " + data.city : ""}${data.state ? ", " + data.state : ""}\n` +
      `- **Tipo:** ${data.propertyType || "N/A"}\n` +
      `- **Área Total:** ${data.totalArea ? data.totalArea + " m²" : "N/A"}\n` +
      `- **Estado de Conservación:** ${data.buildingCondition || "N/A"}\n` +
      (data.yearBuilt ? `- **Año de Construcción:** ${data.yearBuilt}\n` : "") +
      (data.features && Array.isArray(data.features) && data.features.length > 0
        ? `- **Características:** ${(data.features as string[]).join(", ")}\n`
        : "") +
      `- **ID de Propiedad:** ${context.propertyId || "N/A"}\n\n` +
      `Referencia esta propiedad en tus respuestas cuando sea relevante. Puedes hacer análisis, sugerencias de valor, o comparaciones con el mercado.`
    );
  }

  if (context.view === "new-valuation") {
    blocks.push(
      `\n## Contexto Actual — Nueva Valuación\nEl usuario está en el proceso de crear una nueva valuación. ` +
      `Ofrécele guía sobre:\n` +
      `- Cómo completar el formulario de valuación paso a paso\n` +
      `- Qué datos son importantes para una valuación precisa\n` +
      `- Metodologías de valuación disponibles (comparables, ingresos, costo, híbrido)\n` +
      `- Factores que influyen en el valor comercial\n` +
      `- Consideraciones del mercado dominicano actual`
    );
  }

  if (context.view === "market-analysis") {
    blocks.push(
      `\n## Contexto Actual — Análisis de Mercado\nEl usuario está explorando el análisis de mercado. ` +
      `Proporciona información sobre:\n` +
      `- Tendencias del mercado inmobiliario comercial dominicano\n` +
      `- Zonas con mayor actividad y precios promedio\n` +
      `- Volúmenes de transacción por tipo de propiedad\n` +
      `- Tasas de ocupación y rendimientos (cap rates)\n` +
      `- Perspectivas y oportunidades de inversión\n` +
      `- Comparaciones entre zonas (Piantini, Naco, Gazcue, Bávaro, etc.)`
    );
  }

  if (context.view === "properties") {
    blocks.push(
      `\n## Contexto Actual — Directorio de Propiedades\nEl usuario está navegando el directorio de propiedades. ` +
      `Puedes ayudar con:\n` +
      `- Búsqueda y filtrado de propiedades\n` +
      `- Comparaciones entre propiedades\n` +
      `- Criterios de selección para inversión\n` +
      `- Recomendaciones basadas en tipo de propiedad o zona`
    );
  }

  return blocks.length > 0 ? "\n" + blocks.join("\n\n") : "";
}

// ── Message Management ──────────────────────────────────────────────────────

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_MESSAGES) return messages;
  const systemMsg = messages[0];
  const recentMessages = messages.slice(-(MAX_MESSAGES - 1));
  return [systemMsg, ...recentMessages];
}

// For z-ai-web-dev-sdk: convert system role to assistant (SDK requirement)
function toZaiMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "system" ? "assistant" : m.role,
    content: m.content,
  }));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── OpenAI Provider ─────────────────────────────────────────────────────────

async function createOpenAICompletion(
  messages: ChatMessage[],
  retries = MAX_RETRIES
): Promise<string> {
  const client = getOpenAIClient();
  if (!client) throw new Error("OpenAI API key no configurada");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 2048,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from OpenAI");
      return content;
    } catch (error) {
      const isLast = attempt === retries;
      if (isLast) {
        console.error(`OpenAI failed after ${retries + 1} attempts:`, error);
        throw error;
      }
      console.warn(`OpenAI attempt ${attempt + 1} failed, retrying...`, error);
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error("Unexpected error in OpenAI completion");
}

// ── Claude Provider (z-ai-web-dev-sdk) ──────────────────────────────────────

async function createClaudeCompletion(
  messages: ChatMessage[],
  retries = MAX_RETRIES
): Promise<string> {
  const zai = await ZAI.create();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: toZaiMessages(messages),
        thinking: { type: "disabled" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response from Claude");
      return content;
    } catch (error) {
      const isLast = attempt === retries;
      if (isLast) {
        console.error(`Claude failed after ${retries + 1} attempts:`, error);
        throw error;
      }
      console.warn(`Claude attempt ${attempt + 1} failed, retrying...`, error);
      await sleep(RETRY_DELAY_MS);
    }
  }
  throw new Error("Unexpected error in Claude completion");
}

// ── Unified Completion ──────────────────────────────────────────────────────

async function createChatCompletion(
  messages: ChatMessage[],
  provider: AiProvider,
  retries = MAX_RETRIES
): Promise<string> {
  if (provider === "openai") {
    return createOpenAICompletion(messages, retries);
  }
  return createClaudeCompletion(messages, retries);
}

// ── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json(
        { error: "El campo 'message' es requerido y debe ser un texto" },
        { status: 400 }
      );
    }

    if (body.message.trim().length === 0) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 }
      );
    }

    if (body.message.length > 4000) {
      return NextResponse.json(
        { error: "El mensaje no puede exceder los 4000 caracteres" },
        { status: 400 }
      );
    }

    // Determine provider
    const provider = body.provider || getDefaultProvider();

    // Validate provider
    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key no configurada. Configúrala en .env o en Configuración." },
        { status: 400 }
      );
    }

    // Get or create session
    let sessionId = body.sessionId;
    let session: SessionData;

    if (sessionId && sessions.has(sessionId)) {
      session = sessions.get(sessionId)!;
      // If provider changed mid-conversation, start fresh
      if (session.provider !== provider) {
        sessionId = crypto.randomUUID();
        session = {
          id: sessionId,
          messages: [],
          provider,
          lastActivity: Date.now(),
          createdAt: Date.now(),
        };
      }
    } else {
      sessionId = crypto.randomUUID();
      session = {
        id: sessionId,
        messages: [],
        provider,
        lastActivity: Date.now(),
        createdAt: Date.now(),
      };
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(body.context);

    // Initialize or update system prompt (always first message)
    if (session.messages.length === 0) {
      session.messages.push({ role: "system", content: systemPrompt });
    } else {
      session.messages[0] = { role: "system", content: systemPrompt };
    }

    // Add user message
    session.messages.push({ role: "user", content: body.message.trim() });

    // Trim messages
    session.messages = trimMessages(session.messages);

    // Update activity
    session.lastActivity = Date.now();

    // Get AI response
    const aiResponse = await createChatCompletion(session.messages, provider);

    // Add AI response to history
    session.messages.push({ role: "assistant", content: aiResponse });
    session.messages = trimMessages(session.messages);

    // Save session
    sessions.set(sessionId, session);

    const messageCount = session.messages.length - 1;

    return NextResponse.json({
      response: aiResponse,
      sessionId,
      messageCount,
      provider,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    const message =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: `Error al procesar el mensaje: ${message}` },
      { status: 500 }
    );
  }
}

// ── DELETE Handler ──────────────────────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body: DeleteRequestBody = await request.json();

    if (!body.sessionId || typeof body.sessionId !== "string") {
      return NextResponse.json(
        { error: "El campo 'sessionId' es requerido" },
        { status: 400 }
      );
    }

    const deleted = sessions.delete(body.sessionId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat delete error:", error);

    const message =
      error instanceof Error ? error.message : "Error desconocido";

    return NextResponse.json(
      { error: `Error al eliminar la sesión: ${message}` },
      { status: 500 }
    );
  }
}
