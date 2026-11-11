import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { IconUpload, IconLoader } from '@tabler/icons-react';

export function TesseractTest() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vennligst velg et bilde');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!image) {
      setError('Vennligst velg et bilde først');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const worker = await createWorker('nor+eng'); // Norwegian and English
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();
      
      setResult(text);
    } catch (err) {
      console.error('Tesseract error:', err);
      setError(err?.message || 'Kunne ikke prosessere bildet');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setImage(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--f-text-body)' }}>Tesseract.js OCR-test</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--f-text-soft)' }}>
          Prøv Tesseract.js OCR ved å laste opp et bilde og se den ekstraherte teksten.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>Velg bilde</label>
          <div className="mt-2">
            {!image ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 transition"
                style={{ borderColor: 'var(--f-border)', background: 'var(--f-surface-hover)', color: 'var(--f-text-subtle)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--f-border-green)'; e.currentTarget.style.color = 'var(--f-green-text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--f-border)'; e.currentTarget.style.color = 'var(--f-text-subtle)'; }}
              >
                <IconUpload className="h-5 w-5" />
                <span>Klikk for å laste opp bilde</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
                  <img
                    src={image}
                    alt="Forhåndsvisning"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={loading}
                    className="f-btn-primary flex-1 rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <IconLoader className="h-4 w-4 animate-spin" />
                        Prosesserer...
                      </>
                    ) : (
                      'Prosesser bilde'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="f-btn-ghost rounded-2xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    Fjern bilde
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg p-3" style={{ background: 'var(--f-danger-bg)', border: '1px solid var(--f-danger-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--f-danger-text)' }}>{error}</p>
          </div>
        )}

        {result && (
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--f-text-body)' }}>Ekstrahert tekst</label>
            <div className="mt-2 rounded-2xl p-4" style={{ border: '1px solid var(--f-border-subtle)', background: 'var(--f-surface-hover)' }}>
              <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto" style={{ color: 'var(--f-text-body)' }}>
                {result || '(Ingen tekst funnet)'}
              </pre>
            </div>
            <p className="mt-2 text-xs" style={{ color: 'var(--f-text-subtle)' }}>
              {result.length} tegn ekstrahert
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
