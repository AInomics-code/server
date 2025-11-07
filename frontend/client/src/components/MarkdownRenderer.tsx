import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for different markdown elements
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-white mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-white mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-white mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-slate-300 mb-2 leading-relaxed">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">{children}</em>
          ),
          code: ({ children }) => (
            <code className="bg-slate-700 text-green-400 px-2 py-1 rounded text-xs font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-800 border border-slate-600 rounded-lg p-4 overflow-x-auto mb-4">{children}</pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ml-6 text-sm text-slate-300 mb-4 space-y-1 marker:text-slate-500">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-6 text-sm text-slate-300 mb-4 space-y-1 marker:text-slate-500">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm text-slate-300 pl-2">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-300 mb-4">{children}</blockquote>
          ),
          table: ({ children }) => (
            <table className="w-full border-collapse border border-slate-600 mb-4">{children}</table>
          ),
          th: ({ children }) => (
            <th className="border border-slate-600 px-3 py-2 text-left text-sm font-semibold text-white bg-slate-700">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-600 px-3 py-2 text-sm text-slate-300">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
