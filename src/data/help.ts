/**
 * HELP CONTENT (es / en / pt). Values in [BRACKETS] are pending business decisions —
 * HYPSOS must fill them in; nothing here invents shipping prices, carriers or policies.
 */
import type { Locale } from '../i18n/config';

type L<T> = Record<Locale, T>;

export const HELP_INTRO: L<{ title: string; lead: string }> = {
  es: { title: 'Ayuda', lead: 'Pedidos, envíos, tallas y devoluciones. Si no encuentras tu respuesta, escríbenos.' },
  en: { title: 'Help', lead: 'Orders, shipping, sizes and returns. If you can’t find your answer, write to us.' },
  pt: { title: 'Ajuda', lead: 'Encomendas, envios, tamanhos e devoluções. Se não encontrares a resposta, escreve-nos.' },
};

export const FAQ: L<{ group: string; items: { q: string; a: string }[] }[]> = {
  es: [
    { group: 'Pedidos y pago', items: [
      { q: '¿Cómo hago un pedido?', a: 'Elige talla y color en la ficha del producto, añádelo a la bolsa y pulsa “Finalizar compra”. El pago se completa en el checkout seguro de Shopify.' },
      { q: '¿Qué métodos de pago aceptáis?', a: 'Los disponibles en el checkout de Shopify: [MÉTODOS DE PAGO ACTIVADOS EN SHOPIFY].' },
      { q: '¿Puedo modificar o cancelar un pedido?', a: 'Escríbenos lo antes posible a hypsos.co@gmail.com indicando tu número de pedido. [POLÍTICA DE MODIFICACIÓN/CANCELACIÓN].' },
    ] },
    { group: 'Envíos', items: [
      { q: '¿A qué países enviáis?', a: '[PAÍSES / ZONAS DE ENVÍO]. Los gastos y plazos exactos se muestran en el checkout antes de pagar.' },
      { q: '¿Cuánto tarda mi pedido?', a: '[PLAZOS DE PREPARACIÓN Y ENTREGA POR ZONA].' },
      { q: '¿Cómo sigo mi pedido?', a: 'Recibirás un email de confirmación de envío con el enlace de seguimiento. Consulta también la página de seguimiento de pedidos.' },
    ] },
    { group: 'Cambios y devoluciones', items: [
      { q: '¿Puedo devolver un producto?', a: 'Sí. Como consumidor en la UE dispones de un derecho de desistimiento de 14 días naturales desde la recepción. Consulta las condiciones en Cambios y devoluciones.' },
      { q: '¿Quién paga el envío de la devolución?', a: '[QUIÉN ASUME EL COSTE DE DEVOLUCIÓN].' },
    ] },
    { group: 'Producto y tallas', items: [
      { q: '¿Cómo elijo mi talla?', a: 'Consulta la guía de tallas de cada prenda. Las siluetas HYPSOS son amplias: si dudas, escríbenos.' },
      { q: '¿De qué están hechas las prendas?', a: 'La composición y los cuidados se indican en cada ficha de producto cuando están confirmados.' },
    ] },
  ],
  en: [
    { group: 'Orders & payment', items: [
      { q: 'How do I place an order?', a: 'Choose size and colour on the product page, add it to your bag and press “Checkout”. Payment is completed on Shopify’s secure checkout.' },
      { q: 'Which payment methods do you accept?', a: 'Those available at Shopify checkout: [PAYMENT METHODS ENABLED IN SHOPIFY].' },
      { q: 'Can I change or cancel an order?', a: 'Email hypsos.co@gmail.com as soon as possible with your order number. [CHANGE/CANCELLATION POLICY].' },
    ] },
    { group: 'Shipping', items: [
      { q: 'Where do you ship?', a: '[SHIPPING COUNTRIES / ZONES]. Exact costs and times are shown at checkout before you pay.' },
      { q: 'How long does delivery take?', a: '[PROCESSING AND DELIVERY TIMES PER ZONE].' },
      { q: 'How do I track my order?', a: 'You’ll receive a shipping confirmation email with a tracking link. See also the order tracking page.' },
    ] },
    { group: 'Exchanges & returns', items: [
      { q: 'Can I return a product?', a: 'Yes. As an EU consumer you have a 14-calendar-day right of withdrawal from delivery. See Exchanges & returns.' },
      { q: 'Who pays return shipping?', a: '[WHO BEARS RETURN COSTS].' },
    ] },
    { group: 'Product & sizing', items: [
      { q: 'How do I choose my size?', a: 'Check each garment’s size guide. HYPSOS silhouettes are wide: if in doubt, write to us.' },
      { q: 'What are the garments made of?', a: 'Composition and care are shown on each product page once confirmed.' },
    ] },
  ],
  pt: [
    { group: 'Encomendas e pagamento', items: [
      { q: 'Como faço uma encomenda?', a: 'Escolhe o tamanho e a cor na página do produto, adiciona ao saco e carrega em “Finalizar compra”. O pagamento é concluído no checkout seguro da Shopify.' },
      { q: 'Que métodos de pagamento aceitam?', a: 'Os disponíveis no checkout da Shopify: [MÉTODOS DE PAGAMENTO ATIVOS NA SHOPIFY].' },
      { q: 'Posso alterar ou cancelar uma encomenda?', a: 'Escreve-nos o quanto antes para hypsos.co@gmail.com com o número da encomenda. [POLÍTICA DE ALTERAÇÃO/CANCELAMENTO].' },
    ] },
    { group: 'Envios', items: [
      { q: 'Para que países enviam?', a: '[PAÍSES / ZONAS DE ENVIO]. Os custos e prazos exatos aparecem no checkout antes de pagares.' },
      { q: 'Quanto tempo demora a minha encomenda?', a: '[PRAZOS DE PREPARAÇÃO E ENTREGA POR ZONA].' },
      { q: 'Como acompanho a minha encomenda?', a: 'Vais receber um email de confirmação de envio com o link de seguimento. Consulta também a página de seguimento.' },
    ] },
    { group: 'Trocas e devoluções', items: [
      { q: 'Posso devolver um produto?', a: 'Sim. Como consumidor na UE tens direito de livre resolução de 14 dias de calendário desde a receção. Consulta Trocas e devoluções.' },
      { q: 'Quem paga o envio da devolução?', a: '[QUEM SUPORTA O CUSTO DA DEVOLUÇÃO].' },
    ] },
    { group: 'Produto e tamanhos', items: [
      { q: 'Como escolho o meu tamanho?', a: 'Consulta o guia de tamanhos de cada peça. As silhuetas HYPSOS são amplas: se tiveres dúvidas, escreve-nos.' },
      { q: 'De que são feitas as peças?', a: 'A composição e os cuidados aparecem em cada página de produto quando confirmados.' },
    ] },
  ],
};

export const HELP_PAGES_CONTENT: Record<'shipping' | 'returns' | 'order-tracking' | 'size-guide', L<{ title: string; lead: string; blocks: { h: string; p: string[] }[] }>> = {
  shipping: {
    es: { title: 'Envíos', lead: 'Cómo y cuándo llega tu pedido.', blocks: [
      { h: 'Zonas de envío', p: ['[PAÍSES Y ZONAS A LOS QUE ENVÍA HYPSOS].'] },
      { h: 'Plazos', p: ['Preparación: [X DÍAS HÁBILES].', 'Entrega: [PLAZOS POR ZONA]. Los plazos pueden variar en campañas y lanzamientos.'] },
      { h: 'Costes', p: ['[TARIFAS DE ENVÍO / UMBRAL DE ENVÍO GRATUITO SI EXISTE]. El importe definitivo se muestra siempre en el checkout antes del pago.'] },
      { h: 'Transportista y seguimiento', p: ['[TRANSPORTISTA(S)]. Recibirás un email con el enlace de seguimiento cuando tu pedido salga.'] },
    ] },
    en: { title: 'Shipping', lead: 'How and when your order arrives.', blocks: [
      { h: 'Shipping zones', p: ['[COUNTRIES AND ZONES HYPSOS SHIPS TO].'] },
      { h: 'Times', p: ['Processing: [X BUSINESS DAYS].', 'Delivery: [TIMES PER ZONE]. Times may vary during launches.'] },
      { h: 'Costs', p: ['[SHIPPING RATES / FREE-SHIPPING THRESHOLD IF ANY]. The final amount is always shown at checkout before payment.'] },
      { h: 'Carrier & tracking', p: ['[CARRIER(S)]. You’ll receive a tracking link by email when your order ships.'] },
    ] },
    pt: { title: 'Envios', lead: 'Como e quando chega a tua encomenda.', blocks: [
      { h: 'Zonas de envio', p: ['[PAÍSES E ZONAS PARA ONDE A HYPSOS ENVIA].'] },
      { h: 'Prazos', p: ['Preparação: [X DIAS ÚTEIS].', 'Entrega: [PRAZOS POR ZONA]. Os prazos podem variar em lançamentos.'] },
      { h: 'Custos', p: ['[TARIFAS DE ENVIO / LIMIAR DE ENVIO GRATUITO SE EXISTIR]. O valor final aparece sempre no checkout antes do pagamento.'] },
      { h: 'Transportadora e seguimento', p: ['[TRANSPORTADORA(S)]. Vais receber um link de seguimento por email quando a encomenda sair.'] },
    ] },
  },
  returns: {
    es: { title: 'Cambios y devoluciones', lead: 'Tu derecho de desistimiento y cómo devolver una prenda.', blocks: [
      { h: 'Derecho de desistimiento', p: ['Dispones de 14 días naturales desde que recibes el pedido para desistir de la compra sin indicar el motivo (art. 102 y ss. del Real Decreto Legislativo 1/2007). Consulta el texto completo en Derecho de desistimiento.'] },
      { h: 'Cómo devolver', p: ['1. Escríbenos a hypsos.co@gmail.com con tu número de pedido.', '2. [INSTRUCCIONES DE ENVÍO DE LA DEVOLUCIÓN / DIRECCIÓN].', '3. Reembolso por el mismo medio de pago en un máximo de 14 días naturales desde que se nos comunique el desistimiento (podemos retenerlo hasta recibir la prenda o la prueba de su envío).'] },
      { h: 'Estado de las prendas', p: ['[CONDICIONES: sin usar, con etiquetas, etc.]. El consumidor responde de la disminución de valor resultante de una manipulación distinta a la necesaria para comprobar el producto.'] },
      { h: 'Cambios', p: ['[POLÍTICA DE CAMBIOS DE TALLA/COLOR SI SE OFRECE].'] },
    ] },
    en: { title: 'Exchanges & returns', lead: 'Your right of withdrawal and how to return a garment.', blocks: [
      { h: 'Right of withdrawal', p: ['You have 14 calendar days from delivery to withdraw from the purchase without giving a reason (EU Consumer Rights Directive; Spanish RDL 1/2007). Full text available in Spanish.'] },
      { h: 'How to return', p: ['1. Email hypsos.co@gmail.com with your order number.', '2. [RETURN SHIPPING INSTRUCTIONS / ADDRESS].', '3. Refund via the original payment method within 14 calendar days of your withdrawal notice (we may wait until we receive the goods or proof of return).'] },
      { h: 'Condition of items', p: ['[CONDITIONS: unworn, tags attached, etc.]. You are liable for any diminished value resulting from handling beyond what is necessary to establish the nature of the goods.'] },
      { h: 'Exchanges', p: ['[SIZE/COLOUR EXCHANGE POLICY IF OFFERED].'] },
    ] },
    pt: { title: 'Trocas e devoluções', lead: 'O teu direito de livre resolução e como devolver uma peça.', blocks: [
      { h: 'Direito de livre resolução', p: ['Tens 14 dias de calendário desde a receção para desistir da compra sem indicar o motivo (Diretiva europeia dos direitos dos consumidores). Texto completo disponível em espanhol.'] },
      { h: 'Como devolver', p: ['1. Escreve para hypsos.co@gmail.com com o número da encomenda.', '2. [INSTRUÇÕES DE ENVIO DA DEVOLUÇÃO / MORADA].', '3. Reembolso pelo mesmo meio de pagamento no prazo máximo de 14 dias de calendário após a comunicação (podemos aguardar a receção da peça ou prova do envio).'] },
      { h: 'Estado das peças', p: ['[CONDIÇÕES: por usar, com etiquetas, etc.]. O consumidor responde pela desvalorização resultante de manipulação além do necessário para verificar o produto.'] },
      { h: 'Trocas', p: ['[POLÍTICA DE TROCAS DE TAMANHO/COR SE EXISTIR].'] },
    ] },
  },
  'order-tracking': {
    es: { title: 'Seguimiento de pedidos', lead: 'Dónde está tu pedido.', blocks: [
      { h: 'Email de envío', p: ['Cuando tu pedido salga recibirás un email con el número y el enlace de seguimiento del transportista.'] },
      { h: 'Tu cuenta', p: ['Si tienes cuenta en la tienda, puedes ver el estado de tus pedidos desde la cuenta de cliente.'] },
      { h: '¿Algún problema?', p: ['Escríbenos a hypsos.co@gmail.com indicando tu número de pedido.'] },
    ] },
    en: { title: 'Order tracking', lead: 'Where your order is.', blocks: [
      { h: 'Shipping email', p: ['When your order ships you’ll receive an email with the carrier’s tracking number and link.'] },
      { h: 'Your account', p: ['If you have a store account, you can see your orders’ status from the customer account.'] },
      { h: 'Any issue?', p: ['Email hypsos.co@gmail.com with your order number.'] },
    ] },
    pt: { title: 'Seguimento de encomendas', lead: 'Onde está a tua encomenda.', blocks: [
      { h: 'Email de envio', p: ['Quando a encomenda sair vais receber um email com o número e o link de seguimento da transportadora.'] },
      { h: 'A tua conta', p: ['Se tens conta na loja, podes ver o estado das encomendas na conta de cliente.'] },
      { h: 'Algum problema?', p: ['Escreve para hypsos.co@gmail.com com o número da encomenda.'] },
    ] },
  },
  'size-guide': {
    es: { title: 'Guía de tallas', lead: 'Siluetas amplias, pensadas para caer. Mide una prenda que te guste y compárala.', blocks: [
      { h: 'Cómo medir', p: ['Pecho: de axila a axila con la prenda plana, multiplicado por dos.', 'Largo: desde el punto más alto del hombro hasta el bajo.', 'Manga: desde la costura del hombro hasta el puño.', 'Cintura (pantalón): de lado a lado en la cinturilla, multiplicado por dos. Largo de pierna: desde la entrepierna hasta el bajo.'] },
      { h: 'Medidas por prenda', p: ['Las medidas exactas de cada prenda HYPSOS se publicarán cuando estén confirmadas por producción.'] },
    ] },
    en: { title: 'Size guide', lead: 'Wide silhouettes, built to fall. Measure a garment you love and compare.', blocks: [
      { h: 'How to measure', p: ['Chest: armpit to armpit with the garment flat, times two.', 'Length: from the highest point of the shoulder to the hem.', 'Sleeve: from the shoulder seam to the cuff.', 'Waist (pants): side to side across the waistband, times two. Inseam: crotch to hem.'] },
      { h: 'Measurements per garment', p: ['Exact measurements for each HYPSOS garment will be published once confirmed by production.'] },
    ] },
    pt: { title: 'Guia de tamanhos', lead: 'Silhuetas amplas, pensadas para cair. Mede uma peça de que gostes e compara.', blocks: [
      { h: 'Como medir', p: ['Peito: de axila a axila com a peça estendida, vezes dois.', 'Comprimento: do ponto mais alto do ombro até à bainha.', 'Manga: da costura do ombro até ao punho.', 'Cintura (calças): de lado a lado no cós, vezes dois. Entrepernas: da costura até à bainha.'] },
      { h: 'Medidas por peça', p: ['As medidas exatas de cada peça HYPSOS serão publicadas quando confirmadas pela produção.'] },
    ] },
  },
};

export const CONTACT: L<{ title: string; lead: string; name: string; email: string; topic: string; topics: string[]; order: string; message: string; consent: string; send: string; success: string; fallback: string; invalid: string; direct: string }> = {
  es: { title: 'Contacto', lead: 'Pedidos, prensa, colaboraciones o cualquier duda. Respondemos lo antes posible.', name: 'Nombre', email: 'Email', topic: 'Motivo', topics: ['Pedido', 'Devolución', 'Producto', 'Prensa / colaboraciones', 'Otro'], order: 'Nº de pedido (opcional)', message: 'Mensaje', consent: 'He leído la política de privacidad y acepto que HYPSOS use mis datos para responder a mi consulta.', send: 'Enviar', success: 'Mensaje enviado. Te responderemos pronto.', fallback: 'Se abrirá tu aplicación de correo con el mensaje preparado.', invalid: 'Revisa los campos marcados.', direct: 'O escríbenos directamente' },
  en: { title: 'Contact', lead: 'Orders, press, collaborations or any question. We reply as soon as we can.', name: 'Name', email: 'Email', topic: 'Topic', topics: ['Order', 'Return', 'Product', 'Press / collaborations', 'Other'], order: 'Order number (optional)', message: 'Message', consent: 'I have read the privacy policy and agree that HYPSOS may use my data to answer my enquiry.', send: 'Send', success: 'Message sent. We’ll get back to you soon.', fallback: 'Your email app will open with the message ready.', invalid: 'Please check the highlighted fields.', direct: 'Or write to us directly' },
  pt: { title: 'Contacto', lead: 'Encomendas, imprensa, colaborações ou qualquer dúvida. Respondemos o quanto antes.', name: 'Nome', email: 'Email', topic: 'Motivo', topics: ['Encomenda', 'Devolução', 'Produto', 'Imprensa / colaborações', 'Outro'], order: 'N.º de encomenda (opcional)', message: 'Mensagem', consent: 'Li a política de privacidade e aceito que a HYPSOS use os meus dados para responder ao meu pedido.', send: 'Enviar', success: 'Mensagem enviada. Respondemos em breve.', fallback: 'A tua aplicação de email vai abrir com a mensagem preparada.', invalid: 'Verifica os campos assinalados.', direct: 'Ou escreve-nos diretamente' },
};
