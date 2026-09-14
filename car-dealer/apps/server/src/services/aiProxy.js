/**
 * AI proxy — Phase 7 implementation target.
 * For now returns a hardcoded fallback string so Phase 2 routes can import this safely.
 *
 * Replace this entire file in Phase 7 with:
 *  - SHA-256 cache key lookup in ai_dialogue_cache
 *  - Gemini Flash API call with AI_TIMEOUT_MS hard cutoff
 *  - Fallback dialogue pool on error/timeout
 *  - Structured logging of every call
 */

const FALLBACK_DIALOGUES = {
  seller_intro: [
    'Хорошая тачка, сам бы взял. Берёшь?',
    'Машина не битая, не крашеная. Документы чистые.',
    'Хозяйка была одна, бабушка. По городу ездила.',
    'Продаю потому что новую купил. Всё работает.',
    'Движок масло не ест, не троит. Звони.',
  ],
  seller_negotiation: [
    'Ниже не отдам — сам смотри какая цена на рынке.',
    'Ну ладно, накинь ещё немного и забирай.',
    'За эти деньги лучше не найдёшь.',
    'Скину пятьсот и всё, дальше торговаться не буду.',
  ],
  buyer_inquiry: [
    'Здравствуйте, ещё продаёте? Какой пробег реальный?',
    'Добрый день. Есть ли история ТО? Смотрели на подъёмнике?',
    'Интересует авто. Торг уместен?',
    'Можно приехать посмотреть сегодня?',
  ],
  buyer_counter: [
    'Больше не дам, это моё последнее слово.',
    'Давайте сойдёмся посередине?',
    'Ладно, по рукам.',
    'Подумаю до завтра.',
  ],
};

/**
 * Generate NPC dialogue. Stub — returns a random fallback string.
 *
 * @param {'seller_intro'|'seller_negotiation'|'buyer_inquiry'|'buyer_counter'} contextType
 * @param {Record<string, any>} _variables - injected game state (used in Phase 7)
 * @returns {Promise<string>}
 */
export async function generateDialogue(contextType, _variables = {}) {
  const pool = FALLBACK_DIALOGUES[contextType] || FALLBACK_DIALOGUES.seller_intro;
  return pool[Math.floor(Math.random() * pool.length)];
}
