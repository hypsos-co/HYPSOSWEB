/**
 * Site-wide configuration and business data.
 * Anything in [BRACKETS] is a PENDING field that HYPSOS must fill in (never invented).
 */
import type { Locale } from '../i18n/config';

export const BRAND = {
  name: 'HYPSOS',
  philosophy: 'BUILT FOR THE TOP. THE ELEVATION.',
  instagram: 'https://www.instagram.com/hypsos.co',
  instagramHandle: '@hypsos.co',
  email: 'hypsos.co@gmail.com',
};

/** Legal identity — REQUIRED before publishing (LSSI-CE art. 10). */
export const BUSINESS = {
  legalName: '[RAZÓN SOCIAL O NOMBRE Y APELLIDOS DEL TITULAR]',
  taxId: '[NIF / CIF]',
  address: '[DOMICILIO SOCIAL COMPLETO]',
  registry: '[DATOS DE INSCRIPCIÓN EN EL REGISTRO MERCANTIL, SI APLICA]',
  email: 'hypsos.co@gmail.com',
  phone: '[TELÉFONO DE CONTACTO, SI APLICA]',
  dpo: '[DELEGADO DE PROTECCIÓN DE DATOS, SI APLICA]',
};

export const LEGAL_PAGES = [
  { slug: 'aviso-legal', path: '/legal/aviso-legal', title: 'Aviso legal' },
  { slug: 'privacidad', path: '/legal/privacidad', title: 'Política de privacidad' },
  { slug: 'cookies', path: '/legal/cookies', title: 'Política de cookies' },
  { slug: 'condiciones-de-compra', path: '/legal/condiciones-de-compra', title: 'Condiciones de compra' },
  { slug: 'desistimiento', path: '/legal/desistimiento', title: 'Derecho de desistimiento' },
  { slug: 'devoluciones', path: '/legal/devoluciones', title: 'Devoluciones y reembolsos' },
  { slug: 'garantias', path: '/legal/garantias', title: 'Garantías legales' },
] as const;

export const HELP_PAGES: { slug: string; path: string; title: Record<Locale, string> }[] = [
  { slug: 'faq', path: '/help', title: { es: 'Preguntas frecuentes', en: 'FAQ', pt: 'Perguntas frequentes' } },
  { slug: 'contact', path: '/help/contact', title: { es: 'Contacto', en: 'Contact', pt: 'Contacto' } },
  { slug: 'size-guide', path: '/help/size-guide', title: { es: 'Guía de tallas', en: 'Size guide', pt: 'Guia de tamanhos' } },
  { slug: 'shipping', path: '/help/shipping', title: { es: 'Envíos', en: 'Shipping', pt: 'Envios' } },
  { slug: 'returns', path: '/help/returns', title: { es: 'Cambios y devoluciones', en: 'Exchanges & returns', pt: 'Trocas e devoluções' } },
  { slug: 'order-tracking', path: '/help/order-tracking', title: { es: 'Seguimiento de pedidos', en: 'Order tracking', pt: 'Seguimento de encomendas' } },
];

/** Campaign media slots (filled via env or by editing this file). Empty = editorial fallback. */
export const CAMPAIGN = {
  heroImage: (import.meta.env.PUBLIC_CAMPAIGN_HERO_IMAGE as string) || '',
  filmSrc: (import.meta.env.PUBLIC_CAMPAIGN_FILM_SRC as string) || '',
  filmPoster: (import.meta.env.PUBLIC_CAMPAIGN_FILM_POSTER as string) || '',
};

export const FORMS = {
  newsletter: (import.meta.env.PUBLIC_NEWSLETTER_ENDPOINT as string) || '',
  contact: (import.meta.env.PUBLIC_CONTACT_ENDPOINT as string) || '',
};
