/**
 * EHF / Peppol BIS Billing 3.0 invoice (UBL 2.1) built offline.
 *
 * buildEhfInvoice() returns the XML plus a list of problems. Problems with
 * level 'error' mean the file would be rejected by the Peppol network, so
 * callers should not offer it for sending until they are fixed.
 *
 * Scope: ordinary invoices in NOK from a Norwegian seller to a Norwegian
 * business identified by organisation number (Peppol scheme 0192).
 * Credit notes are not produced yet.
 */

const CUSTOMIZATION_ID = 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0';
const PROFILE_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';
const ORG_SCHEME = '0192';

/** Peppol document type that a receiver must support to get this invoice. */
const INVOICE_DOCTYPE =
  'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##' +
  'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1';

const UNIT_CODES = {
  time: 'HUR', timer: 'HUR', t: 'HUR', h: 'HUR', hour: 'HUR', hours: 'HUR',
  dag: 'DAY', dager: 'DAY', day: 'DAY', days: 'DAY',
  uke: 'WEE', uker: 'WEE', week: 'WEE',
  mnd: 'MON', måned: 'MON', måneder: 'MON', month: 'MON',
  år: 'ANN', year: 'ANN',
  km: 'KMT', kg: 'KGM', g: 'GRM', l: 'LTR', liter: 'LTR', m: 'MTR', m2: 'MTK', 'm²': 'MTK',
  stk: 'EA', stykk: 'EA', pcs: 'EA', ea: 'EA',
};

function unitCode(unit) {
  if (!unit) return 'EA';
  return UNIT_CODES[String(unit).trim().toLowerCase()] || 'EA';
}

function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Norwegian organisation number: 9 digits, MOD11 with weights 3,2,7,6,5,4,3,2. */
function isValidOrgNumber(value) {
  const n = digitsOnly(value);
  if (!/^\d{9}$/.test(n)) return false;
  const weights = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(n[i]), 0);
  const rest = sum % 11;
  const check = rest === 0 ? 0 : 11 - rest;
  return check !== 10 && check === Number(n[8]);
}

/** Norwegian bank account (BBAN): 11 digits, MOD11 with weights 5,4,3,2,7,6,5,4,3,2. */
function isValidAccountNumber(value) {
  const n = digitsOnly(value);
  if (!/^\d{11}$/.test(n)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = weights.reduce((acc, w, i) => acc + w * Number(n[i]), 0);
  const rest = sum % 11;
  const check = rest === 0 ? 0 : 11 - rest;
  return check !== 10 && check === Number(n[10]);
}

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const amt = (n) => round2(n).toFixed(2);
const pct = (rate) => String(round2(Number(rate || 0) * 100));
const dateOnly = (d) => String(d ?? '').slice(0, 10);

function addressXml(party, indent) {
  const i = indent;
  return [
    `${i}<cac:PostalAddress>`,
    party.address ? `${i}  <cbc:StreetName>${esc(party.address)}</cbc:StreetName>` : null,
    party.post_location ? `${i}  <cbc:CityName>${esc(party.post_location)}</cbc:CityName>` : null,
    party.post_number ? `${i}  <cbc:PostalZone>${esc(party.post_number)}</cbc:PostalZone>` : null,
    `${i}  <cac:Country>`,
    `${i}    <cbc:IdentificationCode>NO</cbc:IdentificationCode>`,
    `${i}  </cac:Country>`,
    `${i}</cac:PostalAddress>`,
  ].filter(Boolean).join('\n');
}

/**
 * @param {object} args
 * @param {object} args.invoice   getInvoice() row: invoice_number, invoice_date, due_date,
 *                                your_reference, reference, notes, kid, credited, items[]
 *                                (items: description, quantity, unitPrice, vatRate, unit)
 * @param {object} args.company   companies row
 * @param {object} args.customer  customers row
 * @param {boolean} [args.vatRegistered=true] whether the seller is VAT registered
 * @param {boolean} [args.foretaksregisteret] whether the seller is in Foretaksregisteret
 *        (required wording for AS/ASA and some others). Defaults to true when the
 *        company name ends in AS or ASA.
 */
function buildEhfInvoice({ invoice, company, customer, vatRegistered = true, foretaksregisteret }) {
  const inForetaksregisteret = foretaksregisteret ?? /\bA\.?S\.?A?\.?$/i.test(String(company?.name || '').trim());
  const problems = [];
  const error = (field, message) => problems.push({ level: 'error', field, message });
  const warn = (field, message) => problems.push({ level: 'warning', field, message });

  const sellerOrg = digitsOnly(company?.org_number);
  const buyerOrg = digitsOnly(customer?.org_number);
  const account = digitsOnly(company?.account_number);
  const items = (invoice?.items || []).filter((item) => String(item.description || '').trim());

  if (invoice?.credited) error('invoice', 'Kreditnotaer kan ikke sendes som EHF ennå.');
  if (!items.length) error('items', 'Fakturaen har ingen linjer.');

  if (!company?.name) error('company.name', 'Firmanavn mangler (Innstillinger → Selskap).');
  if (!isValidOrgNumber(sellerOrg)) error('company.org_number', 'Ditt organisasjonsnummer mangler eller er ugyldig (Innstillinger → Selskap).');
  if (!company?.address || !company?.post_number || !company?.post_location) {
    warn('company.address', 'Adressen din er ufullstendig (Innstillinger → Selskap).');
  }
  if (!account) error('company.account_number', 'Kontonummer mangler (Innstillinger → Selskap).');
  else if (!isValidAccountNumber(account)) error('company.account_number', 'Kontonummeret er ugyldig. Sjekk de 11 sifrene (Innstillinger → Selskap).');

  if (!customer?.name) error('customer.name', 'Kunden mangler navn.');
  if (!buyerOrg) error('customer.org_number', 'Kunden mangler organisasjonsnummer. EHF kan bare sendes til virksomheter.');
  else if (!isValidOrgNumber(buyerOrg)) error('customer.org_number', 'Kundens organisasjonsnummer er ugyldig.');
  if (!customer?.address || !customer?.post_number || !customer?.post_location) {
    warn('customer.address', 'Kundens adresse er ufullstendig. Mange mottakere krever full adresse.');
  }

  const buyerReference =
    String(invoice?.your_reference || '').trim() ||
    String(invoice?.reference || '').trim() ||
    String(customer?.contact_name || '').trim() ||
    String(invoice?.invoice_number || '');
  if (!String(invoice?.your_reference || '').trim()) {
    warn('invoice.your_reference', 'Ingen «Deres referanse». Offentlige mottakere og mange bedrifter krever det for å behandle fakturaen.');
  }

  // Lines and VAT breakdown
  const lines = items.map((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.unitPrice ?? item.unit_price) || 0;
    const rate = vatRegistered ? Number(item.vatRate ?? item.vat_rate) || 0 : 0;
    const category = !vatRegistered ? 'O' : rate > 0 ? 'S' : 'E';
    return {
      id: index + 1,
      description: String(item.description).trim(),
      quantity,
      unit: unitCode(item.unit),
      price,
      amount: round2(quantity * price),
      rate,
      category,
    };
  });

  const groups = new Map();
  for (const line of lines) {
    const key = `${line.category}:${line.rate}`;
    const g = groups.get(key) || { category: line.category, rate: line.rate, taxable: 0 };
    g.taxable = round2(g.taxable + line.amount);
    groups.set(key, g);
  }
  const subtotals = [...groups.values()].map((g) => ({ ...g, tax: round2(g.taxable * g.rate) }));

  const lineTotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const taxTotal = round2(subtotals.reduce((s, g) => s + g.tax, 0));
  const payable = round2(lineTotal + taxTotal);
  const paymentId = invoice?.kid || invoice?.invoice_number;

  const exemption = {
    E: 'Fritatt for merverdiavgift',
    O: 'Selger er ikke registrert i Merverdiavgiftsregisteret',
  };

  const taxCategoryXml = (category, rate, indent, withReason) => [
    `${indent}<cbc:ID>${category}</cbc:ID>`,
    category !== 'O' ? `${indent}<cbc:Percent>${pct(rate)}</cbc:Percent>` : null,
    withReason && exemption[category] ? `${indent}<cbc:TaxExemptionReason>${esc(exemption[category])}</cbc:TaxExemptionReason>` : null,
    `${indent}<cac:TaxScheme>`,
    `${indent}  <cbc:ID>VAT</cbc:ID>`,
    `${indent}</cac:TaxScheme>`,
  ].filter(Boolean).join('\n');

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"',
    '         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"',
    '         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
    `  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>`,
    `  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>`,
    `  <cbc:ID>${esc(invoice?.invoice_number)}</cbc:ID>`,
    `  <cbc:IssueDate>${dateOnly(invoice?.invoice_date)}</cbc:IssueDate>`,
    `  <cbc:DueDate>${dateOnly(invoice?.due_date)}</cbc:DueDate>`,
    '  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>',
    invoice?.notes ? `  <cbc:Note>${esc(invoice.notes)}</cbc:Note>` : null,
    '  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>',
    `  <cbc:BuyerReference>${esc(buyerReference)}</cbc:BuyerReference>`,
    invoice?.start_date || invoice?.end_date ? [
      '  <cac:InvoicePeriod>',
      invoice.start_date ? `    <cbc:StartDate>${dateOnly(invoice.start_date)}</cbc:StartDate>` : null,
      invoice.end_date ? `    <cbc:EndDate>${dateOnly(invoice.end_date)}</cbc:EndDate>` : null,
      '  </cac:InvoicePeriod>',
    ].filter(Boolean).join('\n') : null,

    '  <cac:AccountingSupplierParty>',
    '    <cac:Party>',
    `      <cbc:EndpointID schemeID="${ORG_SCHEME}">${sellerOrg}</cbc:EndpointID>`,
    '      <cac:PartyName>',
    `        <cbc:Name>${esc(company?.name)}</cbc:Name>`,
    '      </cac:PartyName>',
    addressXml(company || {}, '      '),
    vatRegistered ? [
      '      <cac:PartyTaxScheme>',
      `        <cbc:CompanyID>NO${sellerOrg}MVA</cbc:CompanyID>`,
      '        <cac:TaxScheme>',
      '          <cbc:ID>VAT</cbc:ID>',
      '        </cac:TaxScheme>',
      '      </cac:PartyTaxScheme>',
    ].join('\n') : null,
    inForetaksregisteret ? [
      '      <cac:PartyTaxScheme>',
      '        <cbc:CompanyID>Foretaksregisteret</cbc:CompanyID>',
      '        <cac:TaxScheme>',
      '          <cbc:ID>TAX</cbc:ID>',
      '        </cac:TaxScheme>',
      '      </cac:PartyTaxScheme>',
    ].join('\n') : null,
    '      <cac:PartyLegalEntity>',
    `        <cbc:RegistrationName>${esc(company?.name)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeID="${ORG_SCHEME}">${sellerOrg}</cbc:CompanyID>`,
    '      </cac:PartyLegalEntity>',
    company?.contact_email || company?.contact_number ? [
      '      <cac:Contact>',
      company.contact_number ? `        <cbc:Telephone>${esc(company.contact_number)}</cbc:Telephone>` : null,
      company.contact_email ? `        <cbc:ElectronicMail>${esc(company.contact_email)}</cbc:ElectronicMail>` : null,
      '      </cac:Contact>',
    ].filter(Boolean).join('\n') : null,
    '    </cac:Party>',
    '  </cac:AccountingSupplierParty>',

    '  <cac:AccountingCustomerParty>',
    '    <cac:Party>',
    `      <cbc:EndpointID schemeID="${ORG_SCHEME}">${buyerOrg}</cbc:EndpointID>`,
    '      <cac:PartyName>',
    `        <cbc:Name>${esc(customer?.name)}</cbc:Name>`,
    '      </cac:PartyName>',
    addressXml(customer || {}, '      '),
    '      <cac:PartyLegalEntity>',
    `        <cbc:RegistrationName>${esc(customer?.name)}</cbc:RegistrationName>`,
    `        <cbc:CompanyID schemeID="${ORG_SCHEME}">${buyerOrg}</cbc:CompanyID>`,
    '      </cac:PartyLegalEntity>',
    customer?.contact_name || customer?.email ? [
      '      <cac:Contact>',
      customer.contact_name ? `        <cbc:Name>${esc(customer.contact_name)}</cbc:Name>` : null,
      customer.email ? `        <cbc:ElectronicMail>${esc(customer.email)}</cbc:ElectronicMail>` : null,
      '      </cac:Contact>',
    ].filter(Boolean).join('\n') : null,
    '    </cac:Party>',
    '  </cac:AccountingCustomerParty>',

    '  <cac:PaymentMeans>',
    '    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>',
    `    <cbc:PaymentID>${esc(paymentId)}</cbc:PaymentID>`,
    '    <cac:PayeeFinancialAccount>',
    `      <cbc:ID>${account}</cbc:ID>`,
    '    </cac:PayeeFinancialAccount>',
    '  </cac:PaymentMeans>',

    '  <cac:TaxTotal>',
    `    <cbc:TaxAmount currencyID="NOK">${amt(taxTotal)}</cbc:TaxAmount>`,
    ...subtotals.map((g) => [
      '    <cac:TaxSubtotal>',
      `      <cbc:TaxableAmount currencyID="NOK">${amt(g.taxable)}</cbc:TaxableAmount>`,
      `      <cbc:TaxAmount currencyID="NOK">${amt(g.tax)}</cbc:TaxAmount>`,
      '      <cac:TaxCategory>',
      taxCategoryXml(g.category, g.rate, '        ', true),
      '      </cac:TaxCategory>',
      '    </cac:TaxSubtotal>',
    ].join('\n')),
    '  </cac:TaxTotal>',

    '  <cac:LegalMonetaryTotal>',
    `    <cbc:LineExtensionAmount currencyID="NOK">${amt(lineTotal)}</cbc:LineExtensionAmount>`,
    `    <cbc:TaxExclusiveAmount currencyID="NOK">${amt(lineTotal)}</cbc:TaxExclusiveAmount>`,
    `    <cbc:TaxInclusiveAmount currencyID="NOK">${amt(payable)}</cbc:TaxInclusiveAmount>`,
    `    <cbc:PayableAmount currencyID="NOK">${amt(payable)}</cbc:PayableAmount>`,
    '  </cac:LegalMonetaryTotal>',

    ...lines.map((line) => [
      '  <cac:InvoiceLine>',
      `    <cbc:ID>${line.id}</cbc:ID>`,
      `    <cbc:InvoicedQuantity unitCode="${line.unit}">${line.quantity}</cbc:InvoicedQuantity>`,
      `    <cbc:LineExtensionAmount currencyID="NOK">${amt(line.amount)}</cbc:LineExtensionAmount>`,
      '    <cac:Item>',
      `      <cbc:Name>${esc(line.description.slice(0, 200))}</cbc:Name>`,
      '      <cac:ClassifiedTaxCategory>',
      taxCategoryXml(line.category, line.rate, '        ', false),
      '      </cac:ClassifiedTaxCategory>',
      '    </cac:Item>',
      '    <cac:Price>',
      `      <cbc:PriceAmount currencyID="NOK">${amt(line.price)}</cbc:PriceAmount>`,
      '    </cac:Price>',
      '  </cac:InvoiceLine>',
    ].join('\n')),
    '</Invoice>',
    '',
  ].filter((part) => part !== null).join('\n');

  return {
    xml,
    problems,
    ok: !problems.some((p) => p.level === 'error'),
    totals: { lineTotal, taxTotal, payable },
    receiverId: buyerOrg ? `${ORG_SCHEME}:${buyerOrg}` : null,
  };
}

module.exports = {
  buildEhfInvoice,
  isValidOrgNumber,
  isValidAccountNumber,
  INVOICE_DOCTYPE,
  ORG_SCHEME,
};
