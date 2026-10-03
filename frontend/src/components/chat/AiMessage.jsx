import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './AiMessage.css';

export const AiMessage = ({ content = '' }) => {
  const [showSolution, setShowSolution] = useState(false);

  // Extract <solution> tag content from the AI response
  const solutionRegex = /<solution>([\s\S]*?)<\/solution>/;
  const match = content.match(solutionRegex);

  const conceptualText = content.replace(solutionRegex, '').trim();
  const solutionText = match ? match[1].trim() : null;

  return (
    <div className="ai-message-card">
      {/* 1. Visible Conceptual Guidance */}
      <div className="conceptual-guidance">
        <ReactMarkdown className="prose prose-slate max-w-none text-sm">{conceptualText}</ReactMarkdown>
      </div>

      {/* 2. Reveal Answer Accordion / Solution Box */}
      {solutionText && (
        <div className="solution-container">
          <button
            type="button"
            className="reveal-solution-btn"
            onClick={() => setShowSolution((prev) => !prev)}
          >
            {showSolution ? '▲ Hide Code Solution' : '▼ Reveal Code Solution'}
          </button>

          {showSolution && (
            <div className="solution-content">
              <div className="solution-badge">Code Solution</div>
              <ReactMarkdown className="prose prose-invert max-w-none text-sm">{solutionText}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
};