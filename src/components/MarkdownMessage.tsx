import ReactMarkdown from 'react-markdown'

// Renderiza el contenido markdown de respuestas del asistente IA.
// Aplica estilos acordes al tema (usa CSS custom properties).
export default function MarkdownMessage({ content, color }: { content: string; color: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <p className="text-base font-bold mb-1.5 mt-1" style={{ color }}>{children}</p>
        ),
        h2: ({ children }) => (
          <p className="text-sm font-bold mb-1 mt-1" style={{ color }}>{children}</p>
        ),
        h3: ({ children }) => (
          <p className="text-sm font-semibold mb-0.5 mt-1" style={{ color }}>{children}</p>
        ),
        p: ({ children }) => (
          <p className="text-sm leading-relaxed mb-1.5 last:mb-0" style={{ color }}>{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-1.5 space-y-0.5 text-sm" style={{ color }}>{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 mb-1.5 space-y-0.5 text-sm" style={{ color }}>{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed" style={{ color }}>{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold" style={{ color }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color }}>{children}</em>
        ),
        code: ({ children }) => (
          <code
            className="text-xs rounded px-1 py-0.5 font-mono"
            style={{ background: 'rgba(0,0,0,0.2)', color }}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            className="text-xs rounded-xl p-3 mb-1.5 overflow-x-auto font-mono"
            style={{ background: 'rgba(0,0,0,0.2)', color }}
          >
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className="border-l-2 pl-3 my-1 italic text-sm"
            style={{ borderColor: 'rgba(255,255,255,0.3)', color: `${color}99` }}
          >
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
