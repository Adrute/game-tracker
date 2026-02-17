"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800"/> 
});

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  }), []);

  return (
    <div className="rich-editor-wrapper">
      <style jsx global>{`
        /* --- ESTILOS BASE (LIGHT) --- */
        .rich-editor-wrapper .ql-toolbar {
          border: 1px solid #e2e8f0 !important;
          border-bottom: none !important;
          border-radius: 12px 12px 0 0;
          background: #f8fafc;
          padding: 12px;
        }
        .rich-editor-wrapper .ql-container {
          border: 1px solid #e2e8f0 !important;
          border-radius: 0 0 12px 12px;
          background: white;
          font-family: inherit;
          font-size: 16px;
          min-height: 300px;
        }
        .rich-editor-wrapper .ql-editor {
          min-height: 300px;
          color: #334155;
        }

        /* --- MODO OSCURO (DARK) --- */
        .dark .rich-editor-wrapper .ql-toolbar {
          background: #0f172a !important; /* slate-900 */
          border-color: #1e293b !important; /* slate-800 */
        }
        .dark .rich-editor-wrapper .ql-container {
          background: #020617 !important; /* slate-950 */
          border-color: #1e293b !important; /* slate-800 */
        }
        .dark .rich-editor-wrapper .ql-editor {
          color: #e2e8f0 !important; /* slate-200 */
        }
        .dark .rich-editor-wrapper .ql-editor.ql-blank::before {
          color: #64748b !important; /* Placeholder color */
        }

        /* --- ARREGLAR ICONOS EN DARK MODE --- */
        /* Los iconos de Quill usan stroke o fill negro por defecto. Lo invertimos. */
        .dark .rich-editor-wrapper .ql-stroke {
          stroke: #cbd5e1 !important; /* slate-300 */
        }
        .dark .rich-editor-wrapper .ql-fill {
          fill: #cbd5e1 !important;
        }
        .dark .rich-editor-wrapper .ql-picker {
          color: #cbd5e1 !important;
        }
        /* Hover state para iconos */
        .dark .rich-editor-wrapper .ql-picker-label:hover,
        .dark .rich-editor-wrapper button:hover .ql-stroke {
          stroke: #10b981 !important; /* emerald-500 */
        }
        .dark .rich-editor-wrapper button:hover .ql-fill {
            fill: #10b981 !important;
        }

        /* Estilos Imágenes */
        .rich-editor-wrapper .ql-editor img {
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            margin: 10px 0;
        }
      `}</style>
      
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}