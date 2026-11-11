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
    return <div className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>Laster...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--f-text-body)' }}>Kredittbokføring</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--f-text-soft)' }}>
          Viser alle kredittransaksjoner. Systemet bruker kryptografisk signering for å forhindre manipulasjon.
        </p>
      </div>

      <div className="rounded-2xl p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--f-text-subtle)' }}>Nåværende saldo</p>
            <p className="text-2xl font-semibold" style={{ color: 'var(--f-text-body)' }}>{balance} kreditter</p>
          </div>
          <button
            onClick={handleExport}
            className="f-btn-ghost rounded-lg px-4 py-2 text-sm font-medium"
          >
            Eksporter bokføring
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--f-text-body)' }}>Transaksjoner ({ledger.length})</h4>
        {ledger.length === 0 ? (
          <div className="rounded-lg p-8 text-center text-sm" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)', color: 'var(--f-text-subtle)' }}>
            Ingen transaksjoner
          </div>
        ) : (
          <div className="space-y-2">
            {ledger.map((tx, index) => {
              const isPositive = tx.type === 'purchase' || tx.type === 'bonus' || tx.type === 'refund';
              return (
                <div
                  key={tx.id || index}
                  className="flex items-center justify-between rounded-lg p-4"
                  style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: isPositive ? 'var(--f-green-text)' : 'var(--f-text-body)' }}>
                        {tx.type === 'purchase' && 'Kjøp'}
                        {tx.type === 'use' && 'Brukt'}
                        {tx.type === 'bonus' && 'Bonus'}
                        {tx.type === 'refund' && 'Refusjon'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--f-text-subtle)' }}>
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString('nb-NO') : '—'}
                      </span>
                    </div>
                    {tx.metadata?.purchase_proof && (
                      <p className="text-xs mt-1" style={{ color: 'var(--f-text-subtle)' }}>
                        Kjøpsbevis: {JSON.stringify(tx.metadata.purchase_proof)}
                      </p>
                    )}
                  </div>
                  <div className="text-sm font-semibold" style={{ color: isPositive ? 'var(--f-green-text)' : 'var(--f-text-body)' }}>
                    {isPositive ? '+' : '-'}{tx.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
        <p className="text-xs" style={{ color: 'var(--f-text-soft)' }}>
          <strong style={{ color: 'var(--f-text-body)' }}>Sikkerhet:</strong> Hver transaksjon er kryptografisk signert. Manipulasjon av bokføringen vil bli oppdaget og transaksjonen vil bli avvist.
        </p>
      </div>
    </div>
  );
}
