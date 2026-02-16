"use client";

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill-new/dist/quill.snow.css'; // <--- OJO: Cambia el import del CSS

// Importamos la nueva librería dinámicamente
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-slate-50 animate-pulse rounded-xl border border-slate-200"/> 
});

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichEditor({ value, onChange, placeholder }: RichEditorProps) {
  
  // Configuración de la barra de herramientas
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