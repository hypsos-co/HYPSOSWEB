/**
 * Newsletter + contact forms.
 * With PUBLIC_NEWSLETTER_ENDPOINT / PUBLIC_CONTACT_ENDPOINT → POST JSON.
 * Without an endpoint → opens the visitor's email client addressed to HYPSOS (nothing is stored by this site).
 */
import { RT, S } from './runtime';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setMsg(form: HTMLFormElement, text: string) {
  const m = form.querySelector<HTMLElement>('[data-form-msg]');
  if (m) m.textContent = text;
}

async function post(url: string, data: Record<string, unknown>) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(String(res.status));
}

function mailto(subject: string, body: string) {
  window.location.href = `mailto:${RT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function initForms() {
  document.querySelectorAll<HTMLFormElement>('form[data-newsletter]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.elements.namedItem('email') as HTMLInputElement;
      const consent = form.elements.namedItem('consent') as HTMLInputElement;
      const email = input.value.trim();
      input.setAttribute('aria-invalid', String(!EMAIL.test(email)));
      if (!EMAIL.test(email)) { setMsg(form, S.newsletter.invalid); input.focus(); return; }
      if (!consent.checked) { setMsg(form, S.newsletter.consentRequired); consent.focus(); return; }
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      btn?.classList.add('is-loading');
      try {
        if (RT.forms?.newsletter) {
          await post(RT.forms.newsletter, { email, consent: true, consentText: S.newsletter.consent, lang: RT.lang, source: 'newsletter', ts: new Date().toISOString() });
          setMsg(form, S.newsletter.success);
          form.reset();
        } else {
          setMsg(form, S.newsletter.fallback);
          mailto('Newsletter HYPSOS — alta / subscribe', `Email: ${email}\nIdioma / Language: ${RT.lang}\nConsentimiento newsletter: sí (${new Date().toISOString()})`);
        }
      } catch {
        setMsg(form, S.common.error);
      } finally {
        btn?.classList.remove('is-loading');
      }
    });
  });

  document.querySelectorAll<HTMLFormElement>('form[data-contact]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const get = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null);
      let ok = true;
      for (const n of ['name', 'email', 'message']) {
        const el = get(n);
        if (!el) continue;
        const bad = !el.value.trim() || (n === 'email' && !EMAIL.test(el.value.trim()));
        el.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { el.focus(); ok = false; }
      }
      const consent = get('consent');
      if (consent && !consent.checked) { ok = false; consent.focus(); }
      if (!ok) { setMsg(form, form.dataset.msgInvalid || S.common.error); return; }
      const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      btn?.classList.add('is-loading');
      try {
        if (RT.forms?.contact) {
          await post(RT.forms.contact, { ...data, lang: RT.lang, ts: new Date().toISOString() });
          setMsg(form, form.dataset.msgSuccess || 'OK');
          form.reset();
        } else {
          setMsg(form, form.dataset.msgFallback || '');
          mailto(`HYPSOS — ${data.topic || 'Contacto'}${data.order ? ` — ${data.order}` : ''}`, `${data.message}\n\n— ${data.name} <${data.email}>${data.order ? `\nPedido: ${data.order}` : ''}`);
        }
      } catch {
        setMsg(form, S.common.error);
      } finally {
        btn?.classList.remove('is-loading');
      }
    });
  });
}
