import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { platformSchema } from "../schema";

// Some Anthropic API keys are workspace/identity-linked and require the
// target workspace id on every request (400 "anthropic-workspace-id is
// required..." otherwise). Standard console.anthropic.com keys don't need
// this — ANTHROPIC_WORKSPACE_ID is simply unset and the header is omitted.
const anthropic = createAnthropic({
  headers: process.env.ANTHROPIC_WORKSPACE_ID
    ? { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }
    : undefined,
});

/**
 * The upstream LLM step promised in README-remotion.md's pipeline diagram:
 * free text in, a JSON object matching `lessonRequestSchema`'s core fields
 * out. This is the one place in the whole engine that calls a model —
 * everything downstream (promptToProps.ts) is deterministic.
 */
export const llmLessonOutputSchema = z.object({
  topic: z
    .string()
    .min(1)
    .describe("Kısa, çarpıcı konu başlığı — video açılış kartında görünecek."),
  platform: platformSchema.describe(
    "Hedef platform: reels (Instagram), shorts (YouTube) veya tiktok."
  ),
  durationInSeconds: z
    .number()
    .positive()
    .max(180)
    .describe("Kullanıcının istediği toplam video süresi (saniye). Belirtilmemişse 30-45 arası makul bir süre seç."),
  script: z
    .string()
    .min(1)
    .describe(
      "Voiceover/anlatım metni — cümle cümle, TTS'e uygun düz metin. İlk cümle mutlaka güçlü bir 'hook' olmalı."
    ),
});
export type LlmLessonOutput = z.infer<typeof llmLessonOutputSchema>;

/**
 * Gary Vaynerchuk tarzı: ilk 1-2 saniyede izleyiciyi durduran, enerjik,
 * doğrudan hitap eden bir hook + kısa/vurucu cümlelerle ilerleyen anlatım.
 * Kayıp korkusu, "sen de mi bunu bilmiyorsun?" gerginliği, ikinci tekil
 * şahısla doğrudan hitap — ama ders içeriği doğru ve sade kalmalı.
 */
const SYSTEM_PROMPT = `Sen THEYINE için kısa video senaryosu yazan bir içerik stratejistisin. Görevin, bir okul dersi/konusunu tek bir yapılandırılmış JSON'a dönüştürmek.

STİL — Gary Vaynerchuk tarzı hook:
- Anlatım metni (script) MUTLAKA kaydırmayı durduran, enerjik bir cümleyle başlamalı ("Bunu bilmeden sınava girme.", "90 saniyede X'i unutmayacaksın.", "Herkes bunu yanlış öğreniyor." gibi tarzda — konuya özel, klişeleşmiş kalıpları birebir kopyalama).
- Kısa, vurucu cümleler kullan. Uzun akademik cümlelerden kaçın.
- İkinci tekil şahısla doğrudan izleyiciye hitap et ("sen", "senin sınavın" vb.).
- İçerik doğru ve pedagojik olarak sağlam kalmalı — enerji doğruluğun yerine geçmez.
- Script, sesli anlatım (TTS/voiceover) için düz metin olsun; sahne yönergesi, emoji veya parantez içi not YAZMA.

ÇIKTI KURALLARI:
- topic: kısa başlık (ekranda büyük puntoyla görünecek, 6 kelimeyi geçmesin).
- platform: kullanıcı platform belirtmişse onu kullan (Instagram → "reels", YouTube → "shorts", TikTok → "tiktok"); belirtmemişse "reels" varsay.
- durationInSeconds: kullanıcı süre belirtmişse aynen kullan; belirtmemişse 30 varsay.
- script: yalnızca söylenecek metin — başlık veya CTA'yı script içine tekrar yazma, onlar ayrıca eklenecek.`;

/**
 * Turns a free-text request ("PG 'Hristo Botev' lisesindeki matematik
 * dersim için Bayes Teoremini anlatan 45 saniyelik viral bir Instagram
 * Reels yap") into the structured fields `buildLessonReelProps` needs.
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 */
export async function generateLessonRequest(freeTextInput: string): Promise<LlmLessonOutput> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: llmLessonOutputSchema,
    system: SYSTEM_PROMPT,
    prompt: freeTextInput,
  });
  return object;
}
