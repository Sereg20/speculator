/**
 * AI Proxy — Phase 7
 *
 * Wraps Gemini Flash API calls for NPC dialogue generation.
 *
 * Features:
 *  - SHA-256 cache key lookup/store in ai_dialogue_cache
 *  - Round-robin key selection across GEMINI_API_KEYS
 *  - AI_DIALOGUE_TIMEOUT_MS hard cutoff (Promise.race)
 *  - Silent fallback to FALLBACK_DIALOGUES on error or timeout
 *  - Structured log per call: contextType, cacheHit, fallback, durationMs
 *
 * Prompt templates follow GMS §11.2 (seller) and §11.4 (buyer).
 * Generation config per GMS §11.5.
 */

import { createHash } from 'node:crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '../db/client.js';
import { GEMINI_API_KEYS, AI_DIALOGUE_TIMEOUT_MS } from '../config.js';

// ─── Model name ──────────────────────────────────────────────────────────────
const MODEL_NAME = 'gemini-3.1-flash-lite'; // update here if Gemini slug changes

// ─── Round-robin key selection ───────────────────────────────────────────────
let _keyIndex = 0;
function nextApiKey() {
  if (GEMINI_API_KEYS.length === 0) return null;
  const key = GEMINI_API_KEYS[_keyIndex % GEMINI_API_KEYS.length];
  _keyIndex = (_keyIndex + 1) % GEMINI_API_KEYS.length;
  return key;
}

// ─── Generation configs per context type (GMS §11.5) ────────────────────────
const GEN_CONFIG = {
  seller_intro:           { temperature: 0.85, maxOutputTokens: 200, topP: 0.92 },
  seller_negotiation:     { temperature: 0.85, maxOutputTokens: 150, topP: 0.92 },
  seller_chat_hint:       { temperature: 0.85, maxOutputTokens: 120, topP: 0.92 },
  seller_negotiate_reject:{ temperature: 0.85, maxOutputTokens: 120, topP: 0.92 },
  buyer_inquiry:          { temperature: 0.80, maxOutputTokens: 180, topP: 0.90 },
  buyer_counter:          { temperature: 0.80, maxOutputTokens: 120, topP: 0.90 },
  buyer_accept:           { temperature: 0.80, maxOutputTokens: 100, topP: 0.90 },
  buyer_reject_walk:      { temperature: 0.80, maxOutputTokens: 100, topP: 0.90 },
  player_reject_buyer:    { temperature: 0.80, maxOutputTokens: 100, topP: 0.90 },
};

// ─── Prompt templates (GMS §11.2, §11.4) ────────────────────────────────────
/**
 * Build the Gemini prompt for a given context type and variable set.
 * All prompts are in Russian to match the Belarusian market setting.
 */
function buildPrompt(contextType, vars = {}) {
  switch (contextType) {
    case 'seller_intro': {
      const {
        seller_archetype = 'обычный_продавец',
        car_make_model_year = 'автомобиль',
        car_mileage = 0,
        asking_price = 0,
        days_listed = 0,
        region = 'Минск',
      } = vars;
      const urgency = days_listed >= 5
        ? 'Машина висит давно, продавец немного нервничает.'
        : days_listed >= 3
          ? 'Машина выставлена несколько дней назад.'
          : 'Объявление свежее.';
      return (
        `Ты — продавец подержанного автомобиля на авторынке в ${region}, Беларусь.\n` +
        `Тип продавца: ${seller_archetype}.\n` +
        `Автомобиль: ${car_make_model_year}, пробег ${car_mileage} км, цена ${asking_price} BYN.\n` +
        `${urgency}\n\n` +
        `Напиши одну реплику (1-2 предложения), с которой начинается разговор с покупателем.\n` +
        `Стиль — разговорный, с совсем небольшим юмором, если уместно. Только текст реплики, без кавычек. По возможности используй ненавязчивые стериотипные утверждения об продаваемом автомобиле. Без нецензурных выражений.`
      );
    }

    case 'seller_negotiation': {
      const {
        seller_archetype = 'обычный_продавец',
        car_make_model_year = 'автомобиль',
        asking_price = 0,
        offered_price = 0,
        negotiation_attempt = true,
      } = vars;
      const delta = asking_price - offered_price;
      const mood = delta > asking_price * 0.15
        ? 'явно заниженное'
        : delta > asking_price * 0.07
          ? 'ниже цены'
          : 'близкое к цене';
      const attempt = negotiation_attempt ? 'Покупатель пробует торговаться.' : 'Покупатель давит на цену повторно.';
      return (
        `Ты — продавец (${seller_archetype}) автомобиля ${car_make_model_year}.\n` +
        `Твоя цена: ${asking_price} BYN. Покупатель предложил ${offered_price} BYN (${mood} предложение).\n` +
        `${attempt}\n\n` +
        `Напиши одну реплику продавца (1-2 предложения). Разговорный стиль авторынка. Без кавычек. С совсем небольшим юмором, если уместно. Без нецензурных выражений.`
      );
    }

    case 'buyer_inquiry': {
      const {
        buyer_archetype = 'careful_buyer',
        car_make_model_year = 'автомобиль',
        car_mileage = 0,
        asking_price = 0,
        days_since_listing = 0,
        is_direct_buy = false,
      } = vars;
      const archetypeHint = {
        careful_buyer: 'дотошный покупатель, много вопросов',
        bargain_hunter: 'ищет скидку, торгуется',
        reseller: 'перекупщик, краткий и деловой',
        first_timer: 'первая машина, немного растерянный',
        enthusiast: 'любитель, интересуется деталями',
        fleet_buyer: 'покупает для организации, нужна документация',
      }[buyer_archetype] || 'обычный покупатель';
      const freshness = days_since_listing < 2 ? 'Объявление свежее.' : `Машина продаётся ${days_since_listing} дней.`;
      const intentLine = is_direct_buy
        ? `Ты готов купить за ${asking_price} BYN без торга — машина тебе понравилась и цена устраивает. Дай понять продавцу, что готов брать прямо сейчас по его цене, без лишних вопросов. С совсем небольшим юмором, если уместно. По возможности используй ненавязчивые стериотипные утверждения об продаваемом автомобиле. Без нецензурных выражений.`
        : `Напиши предложение покупателя продавцу (1–2 предложения). Разговорный стиль. Без кавычек. С совсем небольшим юмором, если уместно. По возможности используй ненавязчивые стериотипные утверждения об продаваемом автомобиле. Без нецензурных выражений.`;
      return (
        `Ты — покупатель на авторынке Беларуси (${archetypeHint}).\n` +
        `Тебя интересует: ${car_make_model_year}, пробег ${car_mileage} км, цена ${asking_price} BYN.\n` +
        `${freshness}\n\n` +
        `${intentLine}`
      );
    }

    case 'buyer_counter': {
      const {
        buyer_archetype = 'careful_buyer',
        asking_price = 0,
        buyer_offered_price = 0,
        player_counter_offer = 0,
        buyer_new_offer = 0,
        negotiation_round = 1,
        defect_discovered = false,
      } = vars;
      const archetypeHint = {
        careful_buyer:   'дотошный, взвешенный',
        bargain_hunter:  'охотник за скидками, настойчивый',
        impulsive_buyer: 'импульсивный, но торгуется',
        skeptic:         'скептик, недоверчивый',
        enthusiast:      'энтузиаст, влюблён в марку',
      }[buyer_archetype] || 'обычный покупатель';
      const defectNote = defect_discovered ? ' Покупатель нашёл скрытый дефект и недоволен.' : '';
      const roundNote = negotiation_round <= 1
        ? 'Это первый раунд торга.'
        : negotiation_round <= 3
          ? `Идёт ${negotiation_round}-й раунд торга — оба всё ещё заинтересованы.`
          : `Торг затянулся (${negotiation_round} раунда) — покупатель устал, но ещё не ушёл.`;
      const offerLine = buyer_new_offer > 0
        ? `Покупатель готов предложить встречную цену: ${buyer_new_offer} BYN.`
        : `Покупатель пока не называет новую цену.`;
      return (
        `Ты — покупатель (${archetypeHint}) на авторынке Беларуси.${defectNote}\n` +
        `Цена объявления: ${asking_price} BYN. Ты предложил: ${buyer_offered_price} BYN. ` +
        `Продавец ответил: ${player_counter_offer} BYN.\n` +
        `${roundNote} ${offerLine}\n\n` +
        `Напиши ОДНУ реплику покупателя — живую, торговую, как на реальном авторынке. ` +
        `Покупатель продолжает торговаться, не соглашается сразу, но и не уходит. ` +
        `Можно упомянуть цену или сослаться на рынок. Разговорный стиль, без кавычек, без мата.`
      );
    }

    case 'buyer_accept': {
      const {
        buyer_archetype = 'careful_buyer',
        final_price = 0,
        negotiation_round = 1,
      } = vars;
      const archetypeHint = {
        careful_buyer:   'дотошный, взвешенный',
        bargain_hunter:  'охотник за скидками, настойчивый',
        impulsive_buyer: 'импульсивный',
        skeptic:         'скептик, недоверчивый',
        enthusiast:      'энтузиаст, влюблён в марку',
      }[buyer_archetype] || 'обычный покупатель';
      const roundNote = negotiation_round <= 1
        ? 'После первого предложения'
        : `После ${negotiation_round} раундов торга`;
      return (
        `Ты — покупатель (${archetypeHint}) на авторынке Беларуси.\n` +
        `${roundNote} вы договорились на цену ${final_price} BYN.\n\n` +
        `Напиши ОДНУ короткую реплику покупателя — он соглашается на сделку. ` +
        `Разговорный стиль, живо и по-человечески. Без кавычек, без мата.`
      );
    }

    case 'buyer_reject_walk': {
      const {
        buyer_archetype = 'careful_buyer',
        player_counter_offer = 0,
        negotiation_round = 1,
      } = vars;
      const archetypeHint = {
        careful_buyer:   'дотошный, взвешенный',
        bargain_hunter:  'охотник за скидками, настойчивый',
        impulsive_buyer: 'импульсивный',
        skeptic:         'скептик, недоверчивый',
        enthusiast:      'энтузиаст, влюблён в марку',
      }[buyer_archetype] || 'обычный покупатель';
      const roundNote = negotiation_round > 2
        ? `Торговались ${negotiation_round} раунда — покупатель устал.`
        : 'Покупатель не нашёл компромисс.';
      return (
        `Ты — покупатель (${archetypeHint}) на авторынке Беларуси.\n` +
        `${roundNote} Продавец стоит на цене ${player_counter_offer} BYN — это не устраивает покупателя.\n\n` +
        `Напиши ОДНУ реплику покупателя — он уходит, вежливо, но твёрдо. ` +
        `Может намекнуть что найдёт лучше или что цена завышена. Разговорный стиль. Без кавычек, без мата.`
      );
    }

    case 'player_reject_buyer': {
      const {
        buyer_archetype = 'careful_buyer',
        buyer_offered_price = 0,
      } = vars;
      const archetypeHint = {
        careful_buyer:   'дотошный',
        bargain_hunter:  'охотник за скидками',
        impulsive_buyer: 'импульсивный',
        skeptic:         'скептик',
        enthusiast:      'энтузиаст',
      }[buyer_archetype] || 'покупатель';
      return (
        `Ты — покупатель (${archetypeHint}) на авторынке Беларуси.\n` +
        `Ты предложил ${buyer_offered_price} BYN, но продавец отказал и не стал продолжать разговор.\n\n` +
        `Напиши ОДНУ реплику покупателя — он принимает отказ, возможно разочарован или удивлён. ` +
        `Разговорный стиль. Без кавычек, без мата.`
      );
    }

    case 'seller_chat_hint': {
      const {
        seller_archetype = 'private_owner',
        car_make_model_year = 'автомобиль',
        hint_category = null,
        hint_severity = null,
      } = vars;
      const archetypeHint = {
        old_man:        'пожилой хозяин',
        private_owner:  'частный продавец',
        shady_dealer:   'перекупщик',
        enthusiast:     'энтузиаст-автолюбитель',
        urgent_sale:    'срочно продаёт',
      }[seller_archetype] || 'продавец';
      if (!hint_category) {
        return (
          `Ты — продавец (${archetypeHint}) автомобиля ${car_make_model_year} на авторынке Беларуси.\n` +
          `Покупатель разговаривает с тобой перед осмотром. Скажи нейтральную фразу — про машину или ситуацию. ` +
          `Ничего про дефекты не упоминай. Разговорный стиль, 1 предложение. Без кавычек, без мата.`
        );
      }
      const categoryHint = {
        engine:       'двигатель или масло',
        body:         'кузов или ЛКП',
        transmission: 'коробку или сцепление',
        suspension:   'ходовую или подвеску',
        interior:     'салон или электрику',
        electrical:   'электрику',
      }[hint_category] || hint_category;
      const severityNote = hint_severity === 'minor' ? 'мелкий' : hint_severity === 'major' ? 'серьёзный' : 'небольшой';
      return (
        `Ты — продавец (${archetypeHint}) автомобиля ${car_make_model_year} на авторынке Беларуси.\n` +
        `В разговоре ты невзначай упоминаешь ${severityNote} нюанс по части "${categoryHint}" — вскользь, будто это мелочь. ` +
        `Не называй конкретный дефект — только намекни. Разговорный стиль, 1–2 предложения. Без кавычек, без мата.`
      );
    }

    case 'seller_negotiate_reject': {
      const {
        seller_archetype = 'private_owner',
        asking_price = 0,
        retry_allowed = false,
      } = vars;
      const archetypeHint = {
        old_man:        'пожилой хозяин',
        private_owner:  'частный продавец',
        shady_dealer:   'перекупщик',
        enthusiast:     'энтузиаст-автолюбитель',
        urgent_sale:    'срочно продаёт',
      }[seller_archetype] || 'продавец';
      const retryNote = retry_allowed
        ? 'Ты немного раздражён, но готов выслушать ещё одно предложение.'
        : 'Разговор закончен с твоей стороны.';
      return (
        `Ты — продавец (${archetypeHint}) на авторынке Беларуси. Цена: ${asking_price} BYN.\n` +
        `Покупатель пытался торговаться, но ты отказываешь снижать цену. ${retryNote}\n\n` +
        `Напиши ОДНУ реплику продавца — он твёрдо отказывает. ` +
        `Разговорный стиль авторынка. Без кавычек, без мата.`
      );
    }

    default:
      return `Сгенерируй короткую реплику (1 предложение) участника авторынка Беларуси.`;
  }
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

function computeCacheKey(contextType, vars) {
  const payload = contextType + '|' + JSON.stringify(
    Object.fromEntries(Object.entries(vars).sort(([a], [b]) => a.localeCompare(b)))
  );
  return createHash('sha256').update(payload).digest('hex');
}

async function getCached(cacheKey) {
  const [row] = await sql`
    SELECT response_text FROM ai_dialogue_cache
    WHERE context_key = ${cacheKey}
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `;
  return row?.response_text ?? null;
}

async function storeCached(contextType, cacheKey, responseText) {
  await sql`
    INSERT INTO ai_dialogue_cache (context_type, context_key, response_text, model_version)
    VALUES (${contextType}, ${cacheKey}, ${responseText}, ${MODEL_NAME})
    ON CONFLICT (context_key) DO NOTHING
  `;
}

// ─── Timeout helper ───────────────────────────────────────────────────────────

function timeoutReject(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms)
  );
}

// ─── Fallback pool (GMS §11.6 — min 15 per pool) ────────────────────────────

const FALLBACK_DIALOGUES = {
  seller_intro: [
    'Хорошая тачка, сам бы взял. Берёшь?',
    'Машина не битая, не крашеная. Документы чистые.',
    'Хозяйка была одна, бабушка. По городу ездила.',
    'Продаю потому что новую купил. Всё работает.',
    'Движок масло не ест, не троит. Звони.',
    'Один хозяин, гараж, ТО официальное. Всё честно.',
    'Смотрел сам — всё живое, кузов чистый, ходовая в порядке.',
    'Срочно продаю, цена окончательная. Смотри, не пожалеешь.',
    'Тихая, спокойная машина. Городской вариант.',
    'Состояние отличное для этого года. Тронь — убедишься.',
    'Не гонял, не убивал. Просто не нужна стала.',
    'Свежее ТО, тормозные колодки новые, масло менял месяц назад.',
    'Продаю чтобы взять кроссовер. Машина нормальная, не хлам.',
    'Вложений не требует, езди и радуйся.',
    'За такую цену лучшего не найдёшь, поверь.',
  ],

  seller_negotiation: [
    'Ниже не отдам — сам смотри какая цена на рынке.',
    'Ну ладно, накинь ещё немного и забирай.',
    'За эти деньги лучше не найдёшь.',
    'Скину пятьсот и всё, дальше торговаться не буду.',
    'Это последнее слово, дальше не опускаю.',
    'Ну, чуть скину, но совсем немного — сам понимаешь.',
    'Слушай, я уже и так ниже рынка. Давай без базара.',
    'Ладно, давай чисто по-человечески — вот цена, забирай.',
    'Хочешь торговаться — езди смотри другие. Там дороже.',
    'Скидку уже дал, больше не могу.',
    'Я подвинусь немного, но не так сильно, как ты хочешь.',
    'Смотри, за эти деньги машина хорошая. Подумай.',
    'Окончательная цена, как я сказал.',
    'Двести скину — и по рукам, это честно.',
    'Слушай, машина живая, цена справедливая. Долго думать не надо.',
  ],

  buyer_inquiry: [
    'Здравствуйте, ещё продаёте? Какой пробег реальный?',
    'Добрый день. Есть ли история ТО? Смотрели на подъёмнике?',
    'Интересует авто. Торг уместен?',
    'Можно приехать посмотреть сегодня?',
    'Здравствуйте. Почему продаёте? Что делали по ходовой?',
    'Привет. Машина в одних руках или перекупили?',
    'Добрый вечер. Были ли аварии, покраска?',
    'Скажите, документы в порядке? Залогов, штрафов нет?',
    'Скидку дадите если сегодня заберу?',
    'А можно приехать с мастером на подъёмник?',
    'Интересует. Сколько реально готовы уступить?',
    'Машина на ходу? Что нужно сделать для нормальной эксплуатации?',
    'Добрый день, давно продаёте? Чего так дёшево?',
    'Привет. Можете прислать ещё фото снизу и мотора?',
    'Здравствуйте. Договор купли-продажи сделаете?',
  ],

  buyer_counter: [
    'Нет, столько не дам — давайте ближе к моей цене.',
    'Ну давайте я добавлю немного, но вы тоже подвиньтесь.',
    'Смотрите, я серьёзный покупатель, но цена должна быть честной.',
    'Хорошо, предлагаю встречный вариант — посередине сойдёмся?',
    'Это всё ещё дороговато для меня. Можем ещё немного скинуть?',
    'Я готов договориться, но не по вашей цене. Давайте ещё раз.',
    'Слушайте, давайте по-человечески — я плачу живыми деньгами, дайте скидку.',
    'Ладно, чуть добавлю, но вы тоже должны подвинуться.',
    'Моя цена обоснована — смотрел рынок. Давайте найдём компромисс.',
    'Я не тороплюсь, могу поискать ещё. Последнее предложение с моей стороны.',
    'Ну, это ближе, но всё равно выше чем хотелось бы. Ещё немного?',
    'Знаете, я брал похожую, так там дешевле было. Подумайте.',
    'Ладно, я ещё добавлю, но это уже мой максимум.',
    'Мы почти договорились — давайте дожмём.',
    'Хорошо, я серьёзно настроен. Ещё маленький шаг навстречу?',
  ],

  buyer_accept: [
    'Ладно, договорились. Давайте оформим.',
    'По рукам! Деньги при мне, готов прямо сейчас.',
    'Хорошо, беру. Когда можно забрать?',
    'Идёт. Спасибо, что пошли навстречу.',
    'Договорились. Давайте быстро всё оформим, пока не передумали.',
    'Окей, согласен. Надеюсь машина не подведёт.',
    'Берём. Вы честный продавец, приятно иметь дело.',
    'Ну что ж, по рукам. Сделка состоялась.',
  ],

  buyer_reject_walk: [
    'Нет, не договоримся. Пойду поищу другой вариант.',
    'Жаль, но ваша цена мне не подходит. Всего доброго.',
    'Слушайте, мы слишком далеко друг от друга. До свидания.',
    'Не выйдет. За такие деньги найду что-то получше.',
    'Спасибо за время, но это дороговато для меня.',
    'Подумаю ещё, но скорее всего нет. Пока.',
    'Цена не моя, извините. Удачи с продажей.',
    'Не договорились. Бывает. Удачи.',
  ],

  player_reject_buyer: [
    'Ясно... Ну и ладно, найду другое.',
    'Жаль, думал договоримся. Всего доброго.',
    'Понял. Спасибо хотя бы за ответ.',
    'Ну что ж, не судьба. Пойду дальше.',
    'Обидно, машина хорошая. Ладно, удачи с продажей.',
    'Ничего, поищу ещё. До свидания.',
    'Эх, не получилось. Ну ладно.',
    'Хорошо, не буду настаивать. Всего хорошего.',
  ],

  seller_chat_hint: [
    'Слушай, хорошая машина, я бы сам на ней ещё ездил.',
    'Вопросы есть? Могу показать что хочешь.',
    'Брал для себя, не для перепродажи. Жалею что продаю.',
    'Ну, мелочи по кузову есть, как без них. Ничего серьёзного.',
    'Масло недавно менял, но покапывало немного — уже в норме.',
    'Был небольшой стук спереди, смотрел — ничего страшного.',
    'Ходовая немного гудит, но это особенность таких машин.',
    'Если честно, климат иногда дурит. Мелочь, но честно скажу.',
    'Машина в целом хорошая, сам доволен. Просто нужны деньги.',
    'Смотри сам, скрывать нечего. Ну почти.',
  ],

  seller_negotiate_reject: [
    'Цена окончательная, не торгуюсь.',
    'Ниже не отдам — сам смотри что сейчас на рынке.',
    'Нет, эта цена справедливая. Думай.',
    'Слушай, я уже скинул сколько мог. Нет.',
    'Ну нет так нет. Следующий покупатель возьмёт.',
    'Не торгуюсь. Объявление свежее, подождём.',
    'Машина нормальная, цена нормальная. Нет — ищи другую.',
    'Извини, не договоримся. Удачи.',
  ],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate NPC dialogue using Gemini API with cache + timeout + fallback.
 *
 * @param {'seller_intro'|'seller_negotiation'|'buyer_inquiry'|'buyer_counter'} contextType
 * @param {Record<string, any>} variables - injected game state for prompt interpolation
 * @param {object} [log] - optional Pino logger instance
 * @returns {Promise<string>}
 */
export async function generateDialogue(contextType, variables = {}, log) {
  const startMs = Date.now();
  const cacheKey = computeCacheKey(contextType, variables);

  // ── 1. Cache lookup ──────────────────────────────────────────────────────
  try {
    const cached = await getCached(cacheKey);
    if (cached) {
      log?.info({ contextType, cacheHit: true, fallback: false, durationMs: Date.now() - startMs }, 'ai_dialogue');
      return cached;
    }
  } catch (cacheErr) {
    log?.warn({ err: cacheErr.message, contextType }, 'ai_dialogue cache lookup failed');
  }

  // ── 2. API key selection ─────────────────────────────────────────────────
  const apiKey = nextApiKey();
  if (!apiKey) {
    log?.warn({ contextType, cacheHit: false, fallback: true, reason: 'no_api_key', durationMs: Date.now() - startMs }, 'ai_dialogue');
    return _fallback(contextType);
  }

  // ── 3. Build prompt ───────────────────────────────────────────────────────
  const prompt = buildPrompt(contextType, variables);
  const genConfig = GEN_CONFIG[contextType] || GEN_CONFIG.seller_intro;

  // ── 4. Gemini call with timeout ──────────────────────────────────────────
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: genConfig,
    });

    const geminiCall = model.generateContent(prompt).then(r => r.response.text().trim());
    const text = await Promise.race([geminiCall, timeoutReject(AI_DIALOGUE_TIMEOUT_MS)]);

    if (!text) throw new Error('Empty response from Gemini');

    // ── 5. Cache store ───────────────────────────────────────────────────
    try {
      await storeCached(contextType, cacheKey, text);
    } catch (storeErr) {
      log?.warn({ err: storeErr.message, contextType }, 'ai_dialogue cache store failed');
    }

    log?.info({ contextType, cacheHit: false, fallback: false, durationMs: Date.now() - startMs }, 'ai_dialogue');
    return text;

  } catch (err) {
    const reason = err.message?.includes('timeout') ? 'timeout' : 'api_error';
    log?.warn({ contextType, cacheHit: false, fallback: true, reason, err: err.message, durationMs: Date.now() - startMs }, 'ai_dialogue');
    return _fallback(contextType);
  }
}

function _fallback(contextType) {
  const pool = FALLBACK_DIALOGUES[contextType] || FALLBACK_DIALOGUES.seller_intro;
  return pool[Math.floor(Math.random() * pool.length)];
}
