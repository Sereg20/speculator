/**
 * Skill tree definitions — public names/unlock levels only.
 * Numeric effects (modifiers, detection bonuses, cost reductions)
 * live in apps/server/src/services/ and are never sent to the client.
 */

export const INSPECTION_SKILLS = [
  // Tier 0 — innate / free
  { id: 'walkaround_glance',    name: 'Беглый осмотр',           tier: 0, levelRequired: 1,  xpCost: 0 },
  { id: 'ask_seller',           name: 'Спросить у продавца',      tier: 0, levelRequired: 1,  xpCost: 0 },
  { id: 'listen_engine',        name: 'Послушать двигатель',      tier: 0, levelRequired: 2,  xpCost: 1500 },
  { id: 'panel_feel',           name: 'Проверка панелей на ощупь',tier: 0, levelRequired: 2,  xpCost: 1200 },
  { id: 'interior_smell',       name: 'Осмотр и запах салона',    tier: 0, levelRequired: 2,  xpCost: 1500 },
  { id: 'cold_start_test',      name: 'Холодный запуск',          tier: 0, levelRequired: 3,  xpCost: 2000 },

  // Tier 1 — basic tools / folk methods
  { id: 'torch_mirror',         name: 'Фонарик и зеркало',        tier: 1, levelRequired: 3,  xpCost: 0,    equipmentCost: 20 },
  { id: 'tap_test',             name: 'Простукивание кузова',      tier: 1, levelRequired: 3,  xpCost: 2500 },
  { id: 'tyre_brake_visual',    name: 'Осмотр шин и тормозов',    tier: 1, levelRequired: 3,  xpCost: 2000 },
  { id: 'fluid_level_check',    name: 'Проверка уровня жидкостей', tier: 1, levelRequired: 4,  xpCost: 2000 },
  { id: 'magnet_test',          name: 'Проверка магнитом',         tier: 1, levelRequired: 4,  xpCost: 0,    equipmentCost: 8 },
  { id: 'undercar_crawl',       name: 'Осмотр снизу',             tier: 1, levelRequired: 4,  xpCost: 3000 },
  { id: 'test_drive',           name: 'Тест-драйв',               tier: 1, levelRequired: 5,  xpCost: 3500 },

  // Tier 2 — consumer tech
  { id: 'generic_obdii',        name: 'Китайский OBD2 сканер',    tier: 2, levelRequired: 5,  xpCost: 0,    equipmentCost: 50 },
  { id: 'compression_tester',   name: 'Компрессометр',            tier: 2, levelRequired: 6,  xpCost: 0,    equipmentCost: 60 },
  { id: 'stethoscope',          name: 'Автомобильный стетоскоп',  tier: 2, levelRequired: 6,  xpCost: 0,    equipmentCost: 40 },
  { id: 'brake_fluid_tester',   name: 'Тестер тормозной жидкости',tier: 2, levelRequired: 6,  xpCost: 0,    equipmentCost: 15 },
  { id: 'battery_tester',       name: 'Тестер АКБ/генератора',    tier: 2, levelRequired: 7,  xpCost: 0,    equipmentCost: 70 },
  { id: 'paint_gauge',          name: 'Толщиномер краски',        tier: 2, levelRequired: 7,  xpCost: 0,    equipmentCost: 120 },
  { id: 'obdii_live_data',      name: 'OBD2 с живыми данными',    tier: 2, levelRequired: 8,  xpCost: 0,    equipmentCost: 350 },

  // Tier 3 — professional
  { id: 'full_obdii_can',       name: 'Профи-сканер (полный CAN)',tier: 3, levelRequired: 10, xpCost: 0,    equipmentCost: 1200 },
  { id: 'leakdown_tester',      name: 'Пневмотестер утечек',      tier: 3, levelRequired: 10, xpCost: 0,    equipmentCost: 90 },
  { id: 'smoke_machine',        name: 'Дымогенератор',            tier: 3, levelRequired: 11, xpCost: 0,    equipmentCost: 350 },
  { id: 'oscilloscope',         name: 'Осциллограф',              tier: 3, levelRequired: 12, xpCost: 0,    equipmentCost: 700 },
  { id: 'lift_ramp',            name: 'Подъёмник/эстакада',       tier: 3, levelRequired: 13, xpCost: 0,    equipmentCost: 5500 },
  { id: 'diagnostic_stand',     name: 'Диагностический стенд',    tier: 3, levelRequired: 15, xpCost: 0,    equipmentCost: 9000 },
];

export const NEGOTIATION_SKILLS = [
  { id: 'casual_chat',          name: 'Светская беседа',          levelRequired: 1,  xpCost: 0 },
  { id: 'anchor_low',           name: 'Заниженный первый оффер',  levelRequired: 3,  xpCost: 3500 },
  { id: 'comfortable_silence',  name: 'Уверенное молчание',       levelRequired: 4,  xpCost: 4500 },
  { id: 'build_rapport',        name: 'Установить контакт',       levelRequired: 4,  xpCost: 4000 },
  { id: 'show_cash',            name: 'Показать наличные',         levelRequired: 5,  xpCost: 5500 },
  { id: 'deadline_pressure',    name: 'Давление дедлайном',       levelRequired: 6,  xpCost: 6000 },
  { id: 'read_the_room',        name: 'Читать ситуацию',          levelRequired: 7,  xpCost: 7000 },
  { id: 'bundle_offer',         name: 'Пакетное предложение',     levelRequired: 8,  xpCost: 8000 },
  { id: 'loss_aversion_frame',  name: 'Фрейм потери',             levelRequired: 9,  xpCost: 9500 },
  { id: 'walk_away',            name: 'Встать и уйти',            levelRequired: 10, xpCost: 11000 },
  { id: 'smooth_talker',        name: 'Красивые слова',           levelRequired: 11, xpCost: 13000 },
  { id: 'professional_closer',  name: 'Профессиональный клоузер', levelRequired: 12, xpCost: 16000 },
  { id: 'deal_closer',          name: 'Закрыватель сделок',       levelRequired: 14, xpCost: 22000 },
  { id: 'market_authority',     name: 'Авторитет рынка',          levelRequired: 16, xpCost: 28000 },
];

export const REPAIR_SKILLS = [
  // Tier 0
  { id: 'watch_tutorial',       name: 'Посмотреть туториал',      tier: 0, levelRequired: 1,  xpCost: 0 },
  { id: 'polish_touchup',       name: 'Полировка и подкраска',    tier: 0, levelRequired: 2,  xpCost: 2000 },
  { id: 'interior_tidy',        name: 'Уборка и чистка салона',   tier: 0, levelRequired: 2,  xpCost: 1500 },
  { id: 'battery_swap',         name: 'Замена аккумулятора',      tier: 0, levelRequired: 2,  xpCost: 1500 },

  // Tier 1
  { id: 'basic_spanner',        name: 'Базовые слесарные работы', tier: 1, levelRequired: 3,  xpCost: 4000 },
  { id: 'wheel_brake_service',  name: 'Тормоза и колёса',         tier: 1, levelRequired: 4,  xpCost: 3500 },
  { id: 'electrical_basics',    name: 'Основы электрики',         tier: 1, levelRequired: 4,  xpCost: 4000 },
  { id: 'fluid_services',       name: 'Замена жидкостей',         tier: 1, levelRequired: 4,  xpCost: 3500 },
  { id: 'glass_repair',         name: 'Стёкла и лобовое',         tier: 1, levelRequired: 5,  xpCost: 5000 },
  { id: 'pdr_dent_removal',     name: 'PDR — рихтовка без покраски', tier: 1, levelRequired: 6, xpCost: 6500, equipmentCost: 120 },

  // Tier 2
  { id: 'engine_seals_belts',   name: 'Сальники и ремни двигателя',tier: 2, levelRequired: 7, xpCost: 9000 },
  { id: 'gearbox_service',      name: 'Обслуживание КПП',         tier: 2, levelRequired: 8,  xpCost: 10000 },
  { id: 'suspension_rebuild',   name: 'Переборка подвески',        tier: 2, levelRequired: 8,  xpCost: 9500, equipmentCost: 120 },
  { id: 'body_filler_respray',  name: 'Шпатлёвка и перекраска',   tier: 2, levelRequired: 9,  xpCost: 11000 },
  { id: 'clutch_replacement',   name: 'Замена сцепления',         tier: 2, levelRequired: 9,  xpCost: 12000 },
  { id: 'hvac_service',         name: 'Обслуживание климата',      tier: 2, levelRequired: 10, xpCost: 10000, equipmentCost: 650 },
  { id: 'electrical_diag',      name: 'Диагностика электрики',    tier: 2, levelRequired: 10, xpCost: 11000 },
  { id: 'structural_rust',      name: 'Лечение структурной ржавчины', tier: 2, levelRequired: 11, xpCost: 14000 },

  // Tier 3
  { id: 'engine_overhaul',      name: 'Базовый капремонт двигателя', tier: 3, levelRequired: 13, xpCost: 18000 },
  { id: 'auto_gearbox',         name: 'Обслуживание АКПП',        tier: 3, levelRequired: 12, xpCost: 16000 },
  { id: 'full_respray',         name: 'Полная перекраска',        tier: 3, levelRequired: 13, xpCost: 17000, equipmentCost: 2000 },
  { id: 'wiring_harness',       name: 'Ремонт жгута проводки',    tier: 3, levelRequired: 14, xpCost: 18000 },
  { id: 'subframe_chassis',     name: 'Ремонт подрамника/кузова', tier: 3, levelRequired: 15, xpCost: 22000 },
  { id: 'turbo_induction',      name: 'Турбо и наддув',           tier: 3, levelRequired: 16, xpCost: 25000 },
];
