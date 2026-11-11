/**
 * Minimal client for Recommand's hosted Peppol API (https://docs.recommand.eu).
 *
 * Fattern runs no servers: each user connects their own Recommand team
 * (free for 25 documents a month at the time of writing) and Fattern sends
 * the EHF file it builds locally, unchanged, as raw XML.
 *
 * No Electron imports here, so the response handling can be tested in Node.
 */

const BASE_URL = 'https://app.recommand.eu';

/**
 * Basic auth with an API key id + secret (keys that do not expire), or a
 * Bearer JWT when only a token is given.
 */
function authHeader({ keyId, secret }) {
  const id = String(keyId || '').trim();
  const value = String(secret || '').trim();
  if (!value) return null;
  if (!id) return `Bearer ${value}`;
  return `Basic ${Buffer.from(`${id}:${value}`).toString('base64')}`;
}

async function request(path, { auth, method = 'GET', body, timeoutMs = 30000, fetchImpl = fetch } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, data: null, networkError: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

function firstErrors(data) {
  const errors = data?.errors;
  if (!errors) return [];
  return Object.values(errors).flat().map(String);
}

/**
 * Turns a failed Recommand response into a plain Norwegian message plus a
 * category the UI can act on. Pure; covered by check-invoice-save.mjs.
 */
function describeRecommandError({ status, data, networkError }) {
  const details = firstErrors(data);
  const joined = details.join(' ');

  if (status === 0) {
    return {
      category: 'offline',
      message: networkError === 'timeout'
        ? 'Recommand svarte ikke i tide. Prøv igjen.'
        : 'Fikk ikke kontakt med Recommand. Sjekk internettforbindelsen.',
      details,
    };
  }
  if (status === 401) {
    return { category: 'auth', message: 'API-nøkkelen ble avvist. Sjekk eller lag en ny nøkkel i Recommand.', details };
  }
  if (/must be verified/i.test(joined)) {
    return { category: 'not_verified', message: 'Firmaet ditt er ikke verifisert hos Recommand ennå. Fullfør verifiseringen i Recommand-dashbordet.', details };
  }
  if (status === 422 || data?.deliveryFailure) {
    const category = data?.deliveryFailure?.category || 'other';
    const messages = {
      recipient_not_found: 'Mottakeren finnes ikke i Peppol-nettverket. Send PDF i stedet, eller sjekk organisasjonsnummeret.',
      document_not_supported: 'Mottakeren tar ikke imot denne typen dokument via Peppol.',
      recipient_rejected: 'Mottakeren avviste dokumentet.',
      duplicate: 'Denne fakturaen er allerede sendt.',
      validation: 'Mottakeren avviste fakturaen som ugyldig.',
      transport: 'Overføringen til mottakeren feilet. Prøv igjen senere.',
    };
    return { category, message: messages[category] || 'Fakturaen kom ikke frem til mottakeren.', details };
  }
  if (status === 400 && /validation/i.test(joined)) {
    return { category: 'validation', message: 'Recommand avviste EHF-filen som ugyldig.', details: details.slice(1) };
  }
  if (status === 404) {
    return { category: 'not_found', message: 'Fant ikke firmaet hos Recommand. Velg firma på nytt under Innstillinger → Faktura.', details };
  }
  return { category: 'other', message: `Recommand svarte med en feil (HTTP ${status}).`, details };
}

async function verifyCredentials(credentials, options) {
  const auth = authHeader(credentials);
  if (!auth) return { ok: false, category: 'auth', message: 'Mangler API-nøkkel.' };
  const result = await request('/api/core/auth/verify', { auth, ...options });
  if (result.status === 200 && result.data?.success) return { ok: true };
  return { ok: false, ...describeRecommandError(result) };
}

async function listCompanies(credentials, options) {
  const auth = authHeader(credentials);
  const result = await request('/api/v1/companies', { auth, ...options });
  if (result.status === 200 && result.data?.success) {
    return {
      ok: true,
      companies: (result.data.companies || []).map((c) => ({
        id: c.id,
        name: c.name,
        enterpriseNumberScheme: c.enterpriseNumberScheme,
        enterpriseNumber: c.enterpriseNumber,
        isVerified: Boolean(c.isVerified),
      })),
    };
  }
  return { ok: false, ...describeRecommandError(result) };
}

/** Sends a complete UBL document. Returns { ok, documentId, deliveryStatus } or an error. */
async function sendXml(credentials, { companyId, xml, recipient, doctypeId }, options) {
  const auth = authHeader(credentials);
  const result = await request(`/api/v1/${encodeURIComponent(companyId)}/send`, {
    auth,
    method: 'POST',
    body: { documentType: 'xml', document: xml, recipient, doctypeId },
    timeoutMs: 60000,
    ...options,
  });
  if (result.status === 200 && result.data?.success) {
    return {
      ok: true,
      documentId: result.data.id,
      deliveryStatus: result.data.deliveryStatus || null,
      sentOverPeppol: Boolean(result.data.sentOverPeppol),
    };
  }
  return { ok: false, ...describeRecommandError(result) };
}

module.exports = { BASE_URL, authHeader, describeRecommandError, verifyCredentials, listCompanies, sendXml };
