import { useState, useEffect } from 'react';
import { loadCreditLedger, getCreditBalance, exportLedger } from '../../utils/creditSecurity';

export function CreditLedgerViewer() {
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ledgerData, currentBalance] = await Promise.all([
        loadCreditLedger(),
        getCreditBalance(),
      ]);
      setLedger(ledgerData);
      setBalance(currentBalance);
    } catch (error) {
      console.error('Failed to load credit ledger', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await exportLedger();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `credit-ledger-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export ledger', error);
    }
  };

  if (loading) {
    return <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>Laster...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Kredittbokføring</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
          Viser alle kredittransaksjoner. Systemet bruker kryptografisk signering for å forhindre manipulasjon.
        </p>
      </div>

      <div className="r-lg p-4" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Nåværende saldo</p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{balance} kreditter</p>
          </div>
          <button
            onClick={handleExport}
            className="ft-btn ft-btn-secondary r-md px-4 py-2 text-sm font-medium"
          >
            Eksporter bokføring
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Transaksjoner ({ledger.length})</h4>
        {ledger.length === 0 ? (
          <div className="r-md p-8 text-center text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}>
            Ingen transaksjoner
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.map((tx, index) => {
              const isPositive = tx.type === 'purchase' || tx.type === 'bonus' || tx.type === 'refund';
              return (
                <div
                  key={tx.id || index}
                  className="flex items-center justify-between r-md p-4"
                  style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: isPositive ? 'var(--brand-ink)' : 'var(--ink)' }}>
                        {tx.type === 'purchase' && 'Kjøp'}
                        {tx.type === 'use' && 'Brukt'}
                        {tx.type === 'bonus' && 'Bonus'}
                        {tx.type === 'refund' && 'Refusjon'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString('nb-NO') : '—'}
                      </span>
                    </div>
                    {tx.metadata?.purchase_proof && (
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                        Kjøpsbevis: {JSON.stringify(tx.metadata.purchase_proof)}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: isPositive ? 'var(--brand-ink)' : 'var(--ink)' }}>
                    {isPositive ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="r-md p-4" style={{ border: '1px solid var(--line)', background: 'var(--surface-sunken)' }}>
        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          <strong style={{ color: 'var(--ink)' }}>Sikkerhet:</strong> Hver transaksjon er kryptografisk signert. Manipulasjon av bokføringen vil bli oppdaget og transaksjonen vil bli avvist.
        </p>
      </div>
    </div>
  );
}
