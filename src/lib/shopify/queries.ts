/** Storefront API GraphQL documents. Metafields must be exposed to the Storefront API in Shopify admin. */

const STORY_KEYS = ['silhouette', 'fabric', 'construction', 'graphics', 'fit', 'details'];

export const productFields = (withInventory: boolean) => `
fragment ProductFields on Product {
  id handle title vendor productType tags description descriptionHtml createdAt availableForSale
  seo { title description }
  options { name optionValues { name } }
  priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  images(first: 24) { nodes { url altText width height } }
  variants(first: 100) {
    nodes {
      id title availableForSale ${withInventory ? 'quantityAvailable' : ''}
      selectedOptions { name value }
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      image { url }
    }
  }
  collections(first: 20) { nodes { handle } }
  composition: metafield(namespace: "custom", key: "composition") { value }
  care: metafield(namespace: "custom", key: "care") { value }
  details: metafield(namespace: "custom", key: "details") { value }
  ${STORY_KEYS.map((k) => `story_${k}: metafield(namespace: "custom", key: "story_${k}") { value }`).join('\n  ')}
}`;

export const PRODUCTS_QUERY = (withInventory: boolean) => `
${productFields(withInventory)}
query Products($cursor: String, $language: LanguageCode, $country: CountryCode)
@inContext(language: $language, country: $country) {
  products(first: 100, after: $cursor, sortKey: CREATED_AT, reverse: true) {
    pageInfo { hasNextPage endCursor }
    nodes { ...ProductFields }
  }
}`;

export const COLLECTIONS_QUERY = `
query Collections($language: LanguageCode, $country: CountryCode)
@inContext(language: $language, country: $country) {
  collections(first: 50) {
    nodes {
      handle title description
      image { url altText width height }
      products(first: 250) { nodes { handle } }
    }
  }
}`;

/* ── Cart (client) ──────────────────────────────────────────────────── */
export const CART_FIELDS = `
fragment CartFields on Cart {
  id checkoutUrl totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id quantity
      merchandise {
        ... on ProductVariant {
          id title availableForSale
          selectedOptions { name value }
          price { amount currencyCode }
          image { url altText width height }
          product { handle title }
        }
      }
    }
  }
}`;

export const CART_QUERY = `${CART_FIELDS}
query Cart($id: ID!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  cart(id: $id) { ...CartFields }
}`;

export const CART_CREATE = `${CART_FIELDS}
mutation CartCreate($input: CartInput!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  cartCreate(input: $input) { cart { ...CartFields } userErrors { field message } }
}`;

export const CART_LINES_ADD = `${CART_FIELDS}
mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { field message } }
}`;

export const CART_LINES_UPDATE = `${CART_FIELDS}
mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } userErrors { field message } }
}`;

export const CART_LINES_REMOVE = `${CART_FIELDS}
mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $language: LanguageCode, $country: CountryCode) @inContext(language: $language, country: $country) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } userErrors { field message } }
}`;

export const VARIANT_AVAILABILITY = `
query Availability($handle: String!, $country: CountryCode) @inContext(country: $country) {
  product(handle: $handle) { variants(first: 100) { nodes { id availableForSale } } }
}`;
