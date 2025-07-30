import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-typescript';

import './code-theme.css';
import { useEffect } from 'react';

interface Props {
  code: string;
  lang: string;
}
export const CodeView = ({ code, lang }: Props) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);
  return (
    <pre className="p-2 bg-transparent border-none rotate-none m-0 text-xs">
      <code className={`language-${lang}`}>{code}</code>
    </pre>
  );
};
