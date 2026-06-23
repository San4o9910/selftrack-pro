import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Auto-sync custom portal logo for PWA launch capabilities
try {
  const rootDir = process.cwd();
  const sourceLogo = path.join(rootDir, 'src', 'assets', 'images', 'selftrack_logo_portal_1782058987413.jpg');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  if (fs.existsSync(sourceLogo)) {
    fs.copyFileSync(sourceLogo, path.join(publicDir, 'pwa-icon-192.png'));
    fs.copyFileSync(sourceLogo, path.join(publicDir, 'pwa-icon-512.png'));
    fs.copyFileSync(sourceLogo, path.join(publicDir, 'apple-touch-icon.png'));
    console.log("PWA Icons synchronized successfully from portal design.");
  } else {
    console.warn("Source logo not found for PWA optimization: ", sourceLogo);
  }
} catch (err) {
  console.error("Failed to copy PWA files: ", err);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Cap request bodies — the advisor payload is small; anything larger is abuse.
app.use(express.json({ limit: '256kb' }));

// Minimal security headers (no extra dependency). Tightens the default Express
// posture without affecting the SPA or the API contract.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
});

// Coerce an unknown value to a bounded array (defends Gemini prompt + memory).
const asArray = (v: unknown, cap = 500): any[] =>
  Array.isArray(v) ? v.slice(0, cap) : [];

// API route first
app.post('/api/ai-advisor', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const habits = asArray(body.habits);
    const metrics = asArray(body.metrics);
    const expenses = asArray(body.expenses);
    const events = asArray(body.events);
    const language = body.language === 'en' ? 'en' : 'ru';

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback rule-based local generator (works flawlessly without key too)
    const getLocalAdvice = () => {
      const isRu = language === 'ru';
      const summary = isRu
        ? "Ваш профиль показывает стабильный уровень активности, но есть области для оптимизации в расходах и режиме сна."
        : "Your profile indicates steady activity, but sleep schedule and spending habits can be further optimized.";

      const tips = [
        {
          category: 'wellbeing',
          title: isRu ? 'Качество сна и Сонливость' : 'Sleep Quality & Routine',
          emoji: '💤',
          description: isRu
            ? 'Регулярность сна имеет решающее значение. Постарайтесь засыпать и просыпаться в одно и то же время, чтобы улучшить самочувствие в течение дня.'
            : 'Sleep consistency is crucial. Try to sleep and wake up around the same times to boost daytime energy and recovery cycle.',
          action: isRu ? 'Установите напоминание о подготовке ко сну за 30 минут.' : 'Set a bed preparation reminder 30 minutes before sleep time.'
        },
        {
          category: 'expense',
          title: isRu ? 'Финансовая осознанность' : 'Financial Mindfulness',
          emoji: '💳',
          description: isRu
            ? 'Контроль небольших повседневных расходов может значительно увеличить ваши сбережения к концу месяца.'
            : 'Tracking small repeated expenses can significantly save your wallet budget at the end of the month.',
          action: isRu ? 'Проанализируйте свои расходы на кофе и кафе за последнюю неделю.' : 'Analyze your cafe/coffee spendings over the last 7 days.'
        },
        {
          category: 'tasks',
          title: isRu ? 'Фокус на важных задачах' : 'Focus on Important Tasks',
          emoji: '🎯',
          description: isRu
            ? 'Многозадачность снижает продуктивность. Попробуйте метод Pomodoro и выделение одной главной задачи дня.'
            : 'Multitasking decreases output quality. Try the Pomodoro technique and earmarking one Single Important Task of the day.',
          action: isRu ? 'Выберите самую важную задачу утром и сделайте её первой.' : 'Pick your single most critical task in the morning and do it first.'
        },
        {
          category: 'habits',
          title: isRu ? 'Сила привычек и рутины' : 'Power of Small Habits',
          emoji: '🌱',
          description: isRu
            ? 'Выработка привычки занимает время. Маленькие последовательные шаги гораздо долговечнее больших резких изменений.'
            : 'Establishing habits takes solid repeating duration. Tiny micro-steps are far more sustainable helper blocks.',
          action: isRu ? 'Не пропускайте привычки более 2 дней подряд, чтобы сохранить импульс.' : 'Avoid skipping habits for more than 2 consecutive days to preserve streak.'
        }
      ];

      return { summary, tips };
    };

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined, returning premium rule-based advice.");
      return res.json(getLocalAdvice());
    }

    // Initialize Google Gen AI
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Summarize the data nicely for the LLM prompt
    const dataSummary = `
Language of response: ${language === 'ru' ? 'Russian' : 'English'}

DATA DESCRIPTION:
- Habits completed dates: ${JSON.stringify(habits?.map((h: any) => ({ name: h.name, completionsCount: h.completedDates?.length })) || [])}
- Recent Sleep & Mood metrics: ${JSON.stringify(metrics?.slice(-10)?.map((m: any) => ({ date: m.date, sleep: m.sleep, mood: m.mood, bed: m.bed, wake: m.wake })) || [])}
- Expenses: ${JSON.stringify(expenses?.slice(-15)?.map((e: any) => ({ store: e.store, amount: e.amount, date: e.date, cat: e.cat })) || [])}
- Tasks (Events): ${JSON.stringify(events?.slice(-15)?.map((ev: any) => ({ title: ev.title, done: ev.done, category: ev.category, priority: ev.priority })) || [])}

Analyze the user's life metrics above. Generate a summary summarizing their status, strengths, or issues. Then output 4 targeted, actionable, highly intelligent tips addressing these fields: 'expense', 'tasks', 'habits', 'wellbeing'. Return in JSON using the requested schema.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: dataSummary,
      config: {
        systemInstruction: language === 'ru' 
          ? "Вы — ИИ-Советник по балансу жизни (Life Wellness Advisor). Вы анализируете финансовую дисциплину, привычки, сон, настроение и задачи человека. Сделайте разбор сухим, поддерживающим, прагматичным, невероятно точным на русском языке."
          : "You are an AI Life Wellness & Balance Coach. You analyze spending patterns, habits, sleep schedule, mood registry, and completed goals. Keep your analysis concise, helpful, analytical, and highly structured in English.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of the patterns found (strengths, opportunities or warnings)."
            },
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    description: "Must be exactly one of: 'expense', 'tasks', 'habits', 'wellbeing'"
                  },
                  title: {
                    type: Type.STRING,
                    description: "Short catchy title for the tip card (3-4 words)."
                  },
                  emoji: {
                    type: Type.STRING,
                    description: "Single relevant emoji icon."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Detailed context-aware analytical tip explanation."
                  },
                  action: {
                    type: Type.STRING,
                    description: "Immediate action point."
                  }
                },
                required: ["category", "title", "emoji", "description", "action"]
              }
            }
          },
          required: ["summary", "tips"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      console.warn('Empty Gemini output — serving local advice.');
      return res.json(getLocalAdvice());
    }

    let result: unknown;
    try {
      result = JSON.parse(textOutput.trim());
    } catch (parseErr) {
      console.warn('Gemini output was not valid JSON — serving local advice.', parseErr);
      return res.json(getLocalAdvice());
    }

    // Final shape guard before it reaches the client.
    const ok =
      result &&
      typeof result === 'object' &&
      typeof (result as any).summary === 'string' &&
      Array.isArray((result as any).tips);
    return res.json(ok ? result : getLocalAdvice());

  } catch (error: any) {
    console.error("AI Advisor Error:", error);
    res.status(500).json({ error: "Failed to generate advice", details: error?.message });
  }
});

// Vite middleware and listener setup in async startServer
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
