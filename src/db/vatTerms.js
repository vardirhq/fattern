/**
 * Norwegian VAT (MVA) terms for the standard two-monthly return.
 *
 * Six terms a year: jan–feb, mar–apr, mai–jun, jul–aug, sep–okt, nov–des.
 * Deadlines: 10 April, 10 June, 31 August, 10 October, 10 December and
 * 10 February the following year.
 *
 * Dates are handled as 'YYYY-MM-DD' strings so they compare directly with
 * the DATE columns in SQLite.
 */

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const lastDayOfMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

const DEADLINES = {
  1: [0, 4, 10],
  2: [0, 6, 10],
  3: [0, 8, 31],
  4: [0, 10, 10],
  5: [0, 12, 10],
  6: [1, 2, 10], // following year
};

const MONTHS_NB = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];

function vatTerm(year, term) {
  const firstMonth = term * 2 - 1;
  const secondMonth = term * 2;
  const [yearOffset, dm, dd] = DEADLINES[term];
  return {
    year,
    term,
    start: ymd(year, firstMonth, 1),
    end: ymd(year, secondMonth, lastDayOfMonth(year, secondMonth)),
    deadline: ymd(year + yearOffset, dm, dd),
    label: `${term}. termin ${year}`,
    months: `${MONTHS_NB[firstMonth - 1]}–${MONTHS_NB[secondMonth - 1]}`,
  };
}

function toYmd(date) {
  if (typeof date === 'string') return date.slice(0, 10);
  return ymd(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * The term that matters on `today`:
 * - a finished term whose return is not yet due ("due"), otherwise
 * - the term currently running ("running").
 */
function relevantVatTerm(today = new Date()) {
  const t = toYmd(today);
  const year = Number(t.slice(0, 4));
  const candidates = [vatTerm(year - 1, 6)];
  for (let term = 1; term <= 6; term += 1) candidates.push(vatTerm(year, term));

  const due = candidates.find((c) => c.end < t && c.deadline >= t);
  if (due) return { ...due, state: 'due' };

  const running = candidates.find((c) => c.start <= t && t <= c.end);
  return { ...running, state: 'running' };
}

module.exports = { vatTerm, relevantVatTerm };
