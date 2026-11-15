export const RUSSIAN_DOG_BREEDS: string[] = [
  'Немецкая овчарка',
  'Вельш-корги пемброк',
  'Вельш-корги кардиган',
  'Лабрадор ретривер',
  'Золотистый ретривер',
  'Французский бульдог',
  'Джек-рассел-терьер',
  'Австралийская овчарка (Аусси)',
  'Бельгийская овчарка малинуа',
  'Восточноевропейская овчарка',
  'Бордер-колли',
  'Сибирский хаски',
  'Померанский шпиц',
  'Немецкий шпиц',
  'Йоркширский терьер',
  'Чихуахуа',
  'Той-пудель',
  'Карликовый пудель',
  'Королевский пудель',
  'Мопс',
  'Бигль',
  'Такса',
  'Доберман',
  'Ротвейлер',
  'Кане-корсо',
  'Американский стаффордширский терьер (Амстафф)',
  'Американский питбультерьер',
  'Бультерьер',
  'Английский бульдог',
  'Среднеазиатская овчарка (Алабай)',
  'Кавказская овчарка',
  'Немецкий боксёр',
  'Аляскинский маламут',
  'Самоедская собака',
  'Акита-ину',
  'Сиба-ину',
  'Далматин',
  'Бостон-терьер',
  'Кокер-спаниель',
  'Кавалер кинг чарльз спаниель',
  'Русский охотничий спаниель',
  'Американский кокер-спаниель',
  'Веймаранер',
  'Курцхаар',
  'Дратхаар',
  'Ирландский сеттер',
  'Английский сеттер',
  'Шотландский сеттер (Гордон)',
  'Цвергшнауцер',
  'Миттельшнауцер',
  'Ризеншнауцер',
  'Бернский зенненхунд',
  'Ньюфаундленд',
  'Сенбернар',
  'Басенджи',
  'Уиппет',
  'Русская псовая борзая',
  'Итальянский левретка',
  'Грейхаунд',
  'Чау-чау',
  'Папильон',
  'Бишон фризе',
  'Мальтийская болонка',
  'Русский той',
  'Китайская хохлатая',
  'Пекинес',
  'Ши-тцу',
  'Фокстерьер',
  'Эрдельтерьер',
  'Шотландский терьер',
  'Вест-хайленд-уайт-терьер',
  'Ягдтерьер',
  'Стаффордширский бультерьер',
  'Шелти',
  'Колли длинношёрстный',
  'Бородатый колли',
  'Бобтейл',
  'Аргентинский дог',
  'Немецкий дог',
  'Бордоский дог',
  'Родезийский риджбек',
  'Венгерская выжла',
  'Бассет-хаунд',
  'Бладхаунд',
  'Русский чёрный терьер',
  'Московская сторожевая',
  'Белая швейцарская овчарка',
  'Бельгийская овчарка тервюрен',
  'Бельгийская овчарка грюнендаль',
  'Голландская овчарка',
  'Западносибирская лайка',
  'Восточносибирская лайка',
  'Русско-европейская лайка',
  'Карело-финская лайка',
  'Американский булли',
  'Брюссельский гриффон',
  'Цвергпинчер',
  'Аляскинский кли-кай',
  'Метис (беспородная)',
];

const BREED_ALIAS_MAP: Array<{ stems: string[]; target: string }> = [
  { stems: ['французк', 'френч'], target: 'Французский бульдог' },
  { stems: ['дворн', 'двортер', 'дворняг', 'беспород', 'дворов'], target: 'Метис (беспородная)' },
  { stems: ['вео'], target: 'Восточноевропейская овчарка' },
  { stems: ['алабай', 'сао'], target: 'Среднеазиатская овчарка (Алабай)' },
  { stems: ['амстаф', 'амстафф', 'стафф', 'стаффорд'], target: 'Американский стаффордширский терьер (Амстафф)' },
  { stems: ['аусси', 'австралийка'], target: 'Австралийская овчарка (Аусси)' },
  { stems: ['голден'], target: 'Золотистый ретривер' },
  { stems: ['тойтерьер', 'той терьер', 'тойчик'], target: 'Русский той' },
  { stems: ['мальтезе'], target: 'Мальтийская болонка' },
  { stems: ['вестхайленд', 'вестик'], target: 'Вест-хайленд-уайт-терьер' },
  { stems: ['кавалер'], target: 'Кавалер кинг чарльз спаниель' },
  { stems: ['рчт', 'черныш'], target: 'Русский чёрный терьер' },
  { stems: ['бшо'], target: 'Белая швейцарская овчарка' },
  { stems: ['пит', 'питбул'], target: 'Американский питбультерьер' },
];

function normalizeBase(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeFuzzy(value: string): string {
  return normalizeBase(value)
    .replace(/э/g, 'е')
    .replace(/ь/g, '')
    .replace(/ъ/g, '')
    .replace(/зк/g, 'зск')
    .replace(/([а-яa-z])\1+/g, '$1');
}

function splitWords(value: string): string[] {
  return value.split(/[\s\-()/.]+/).filter(Boolean);
}

/**
 * Returns Russian breed suggestions for autocomplete, prioritizing:
 * 1. Exact/alias and full prefix matches
 * 2. Word-prefix matches (e.g. "корги", "аусси", "овчарка")
 * 3. Substring matches
 * 4. Forgiving spelling / typo matches (e.g. "французк", "амстаф", "дворн")
 */
export function suggestBreeds(query: string, limit = 8): string[] {
  const safeLimit = Math.max(1, limit);
  const rawNormalized = normalizeBase(query);
  if (!rawNormalized) {
    return RUSSIAN_DOG_BREEDS.slice(0, safeLimit);
  }

  const fuzzyQuery = normalizeFuzzy(query);
  const queryWords = splitWords(rawNormalized);

  const aliasTargets = new Set<string>();
  for (const entry of BREED_ALIAS_MAP) {
    if (entry.stems.some((stem) => rawNormalized.startsWith(stem) || stem.startsWith(rawNormalized) || rawNormalized.includes(stem))) {
      aliasTargets.add(entry.target);
    }
  }

  const scored: Array<{ breed: string; tier: number; index: number }> = [];

  RUSSIAN_DOG_BREEDS.forEach((breed, index) => {
    const normBreed = normalizeBase(breed);
    const words = splitWords(normBreed);

    // Tier 0: direct prefix match
    if (normBreed.startsWith(rawNormalized)) {
      scored.push({ breed, tier: 0, index });
      return;
    }

    // Tier 1: word-prefix match (all query words match word prefixes or single query word matches any breed word prefix)
    const isWordPrefix =
      queryWords.length > 1
        ? queryWords.every((qw) => words.some((w) => w.startsWith(qw)))
        : words.some((w) => w.startsWith(rawNormalized));
    if (isWordPrefix) {
      scored.push({ breed, tier: 1, index });
      return;
    }

    // Tier 2: substring match
    if (normBreed.includes(rawNormalized)) {
      scored.push({ breed, tier: 2, index });
      return;
    }

    // Tier 3: forgiving spelling / alias match
    const fuzzyBreed = normalizeFuzzy(breed);
    const fuzzyWords = splitWords(fuzzyBreed);
    if (
      aliasTargets.has(breed) ||
      fuzzyBreed.startsWith(fuzzyQuery) ||
      fuzzyWords.some((fw) => fw.startsWith(fuzzyQuery)) ||
      fuzzyBreed.includes(fuzzyQuery)
    ) {
      scored.push({ breed, tier: 3, index });
    }
  });

  scored.sort((a, b) => a.tier - b.tier || a.index - b.index);
  return scored.slice(0, safeLimit).map((item) => item.breed);
}
