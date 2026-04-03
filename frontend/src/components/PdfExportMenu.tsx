import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { FileDown } from 'lucide-react';

const PROVIDERS = [
  { id: 'gemini', label: 'Gemini' },
  { id: 'claude', label: 'Claude' },
  { id: 'chatgpt', label: 'ChatGPT' },
];

export default function PdfExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { responses } = useChatStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const exportPdf = async (providers: string[]) => {
    setOpen(false);
    // Dynamic import to keep bundle smaller
    const html2pdf = (await import('html2pdf.js')).default;

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'system-ui, sans-serif';
    container.style.color = '#1a1a1a';
    container.style.background = '#ffffff';

    for (const pid of providers) {
      const r = responses[pid];
      if (!r?.content) continue;
      const section = document.createElement('div');
      section.style.marginBottom = '30px';
      section.innerHTML = `<h2 style="color:#333;border-bottom:2px solid #ddd;padding-bottom:8px">${pid.charAt(0).toUpperCase() + pid.slice(1)}</h2>`;
      const content = document.createElement('div');
      content.style.whiteSpace = 'pre-wrap';
      content.textContent = r.content;
      section.appendChild(content);
      container.appendChild(section);
    }

    document.body.appendChild(container);
    await html2pdf()
      .set({
        margin: 10,
        filename: providers.length === 1 ? `${providers[0]}-response.pdf` : 'all-responses.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
    document.body.removeChild(container);
  };

  const hasContent = Object.values(responses).some((r) => r.content);
  if (!hasContent) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
        title="Export PDF"
      >
        <FileDown className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-48 z-50">
          <button
            onClick={() => exportPdf(['gemini', 'claude', 'chatgpt'])}
            className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
          >
            All responses (1 PDF)
          </button>
          {PROVIDERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => exportPdf([id])}
              className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              {label} only
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
