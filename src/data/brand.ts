/** Brand universe copy (About / Campaigns / Lookbook). Only facts provided by HYPSOS — no invented history. */
import type { Locale } from '../i18n/config';
type L<T> = Record<Locale, T>;

export const ABOUT: L<{ title: string; lead: string; chapters: { k: string; h: string; p: string }[]; values: string[]; valuesTitle: string; cta: string }> = {
  es: {
    title: 'The Elevation',
    lead: 'HYPSOS es una marca independiente de streetwear contemporáneo. Built for the top.',
    chapters: [
      { k: '01 — ORIGEN', h: 'Del griego, altura.', p: 'HYPSOS mira hacia arriba. El nombre evoca la altura y la elevación: la idea de que siempre existe un nivel más alto al que llegar.' },
      { k: '02 — FILOSOFÍA', h: 'Built for the top.', p: 'Diseñamos para quienes construyen su propio camino. Prendas con siluetas amplias, presencia y carácter, pensadas para durar en la calle y en el tiempo.' },
      { k: '03 — SÍMBOLO', h: 'La cruz.', p: 'Un eje vertical que apunta hacia arriba y dos trazos que lo sostienen. La cruz de HYPSOS es nuestro símbolo de elevación y aparece en cada colección.' },
      { k: '04 — COLOR', h: 'Obsidiana, hielo y carmesí.', p: 'Tres colores, una identidad. La profundidad del negro, la claridad del hielo y la energía del rojo.' },
    ],
    valuesTitle: 'Lo que nos mueve',
    values: ['Ambición', 'Elevación', 'Individualidad', 'Exclusividad', 'Creatividad', 'Cultura urbana', 'Identidad propia', 'Calidad', 'Evolución constante'],
    cta: 'Descubrir la Colección 001',
  },
  en: {
    title: 'The Elevation',
    lead: 'HYPSOS is an independent contemporary streetwear brand. Built for the top.',
    chapters: [
      { k: '01 — ORIGIN', h: 'From the Greek for height.', p: 'HYPSOS looks up. The name evokes height and elevation: the idea that there is always a higher level to reach.' },
      { k: '02 — PHILOSOPHY', h: 'Built for the top.', p: 'We design for those who build their own path. Garments with wide silhouettes, presence and character, made to last on the street and over time.' },
      { k: '03 — SYMBOL', h: 'The cross.', p: 'A vertical axis pointing up and two strokes holding it. The HYPSOS cross is our symbol of elevation and appears in every collection.' },
      { k: '04 — COLOUR', h: 'Obsidian, ice and crimson.', p: 'Three colours, one identity. The depth of black, the clarity of ice and the energy of red.' },
    ],
    valuesTitle: 'What drives us',
    values: ['Ambition', 'Elevation', 'Individuality', 'Exclusivity', 'Creativity', 'Street culture', 'Own identity', 'Quality', 'Constant evolution'],
    cta: 'Discover Collection 001',
  },
  pt: {
    title: 'The Elevation',
    lead: 'A HYPSOS é uma marca independente de streetwear contemporâneo. Built for the top.',
    chapters: [
      { k: '01 — ORIGEM', h: 'Do grego, altura.', p: 'A HYPSOS olha para cima. O nome evoca a altura e a elevação: a ideia de que existe sempre um nível mais alto a alcançar.' },
      { k: '02 — FILOSOFIA', h: 'Built for the top.', p: 'Desenhamos para quem constrói o seu próprio caminho. Peças com silhuetas amplas, presença e carácter, feitas para durar na rua e no tempo.' },
      { k: '03 — SÍMBOLO', h: 'A cruz.', p: 'Um eixo vertical que aponta para cima e dois traços que o sustentam. A cruz da HYPSOS é o nosso símbolo de elevação e aparece em cada coleção.' },
      { k: '04 — COR', h: 'Obsidiana, gelo e carmesim.', p: 'Três cores, uma identidade. A profundidade do preto, a clareza do gelo e a energia do vermelho.' },
    ],
    valuesTitle: 'O que nos move',
    values: ['Ambição', 'Elevação', 'Individualidade', 'Exclusividade', 'Criatividade', 'Cultura urbana', 'Identidade própria', 'Qualidade', 'Evolução constante'],
    cta: 'Descobrir a Coleção 001',
  },
};

export const CAMPAIGNS: L<{ title: string; lead: string; items: { n: string; title: string; status: string; text: string }[]; lookbook: string; runway: string }> = {
  es: { title: 'Campañas', lead: 'Cada colección de HYPSOS llega con su propia historia visual.', items: [
    { n: '001', title: 'The Elevation', status: 'En producción', text: 'La campaña de la Colección 001 —fotografía editorial y película— se publicará aquí. Mientras tanto, explora los looks de la colección.' },
  ], lookbook: 'Ver lookbook', runway: 'Prueba el look' },
  en: { title: 'Campaigns', lead: 'Every HYPSOS collection arrives with its own visual story.', items: [
    { n: '001', title: 'The Elevation', status: 'In production', text: 'The Collection 001 campaign —editorial photography and film— will be published here. Meanwhile, explore the collection looks.' },
  ], lookbook: 'View lookbook', runway: 'Try the look' },
  pt: { title: 'Campanhas', lead: 'Cada coleção da HYPSOS chega com a sua própria história visual.', items: [
    { n: '001', title: 'The Elevation', status: 'Em produção', text: 'A campanha da Coleção 001 —fotografia editorial e filme— será publicada aqui. Entretanto, explora os looks da coleção.' },
  ], lookbook: 'Ver lookbook', runway: 'Experimenta o look' },
};

export const LOOKBOOK: L<{ title: string; lead: string; note: string; shop: string }> = {
  es: { title: 'Lookbook', lead: 'Colección 001 — seis looks, de la cabeza a los pies.', note: 'Looks compuestos con las prendas de la colección. Las fotografías con modelos se añadirán con la campaña.', shop: 'Comprar el look' },
  en: { title: 'Lookbook', lead: 'Collection 001 — six looks, head to toe.', note: 'Looks composed with the collection garments. Model photography will be added with the campaign.', shop: 'Shop the look' },
  pt: { title: 'Lookbook', lead: 'Coleção 001 — seis looks, da cabeça aos pés.', note: 'Looks compostos com as peças da coleção. As fotografias com modelos serão adicionadas com a campanha.', shop: 'Comprar o look' },
};
