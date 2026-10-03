import { useEffect, useRef, useState } from 'react';

const SelectionTutorAction = ({ children, onAskTutor }) => {
    const containerRef = useRef(null);
    const [selection, setSelection] = useState(null);

    useEffect(() => {
        const updateSelection = () => {
            const nativeSelection = window.getSelection();
            const text = nativeSelection?.toString() ?? '';
            const anchorNode = nativeSelection?.anchorNode;
            const focusNode = nativeSelection?.focusNode;

            if (!text.trim() || !anchorNode || !focusNode || !containerRef.current?.contains(anchorNode) || !containerRef.current.contains(focusNode)) {
                setSelection(null);
                return;
            }

            const range = nativeSelection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (!rect.width && !rect.height) {
                setSelection(null);
                return;
            }

            setSelection({
                text,
                top: rect.bottom + 10,
                left: rect.left + (rect.width / 2),
            });
        };

        const dismiss = (event) => {
            if (!event.target.closest?.('[data-selection-tutor-action]')) {
                setSelection(null);
            }
        };

        document.addEventListener('selectionchange', updateSelection);
        document.addEventListener('mousedown', dismiss);
        window.addEventListener('scroll', updateSelection, { passive: true });

        return () => {
            document.removeEventListener('selectionchange', updateSelection);
            document.removeEventListener('mousedown', dismiss);
            window.removeEventListener('scroll', updateSelection);
        };
    }, []);

    const handleAskTutor = () => {
        if (!selection) return;
        const selectedText = selection.text;
        setSelection(null);
        onAskTutor(selectedText);
    };

    return (
        <div ref={containerRef} className="relative">
            {children}
            {selection && (
                <div
                    data-selection-tutor-action
                    className="fixed z-40 -translate-x-1/2"
                    style={{
                        top: Math.min(selection.top, window.innerHeight - 56),
                        left: Math.min(Math.max(selection.left, 76), window.innerWidth - 76),
                    }}
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <button
                        type="button"
                        onClick={handleAskTutor}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    >
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-400 text-[9px] font-bold text-slate-950" aria-hidden="true">AI</span>
                        Ask Tutor
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelectionTutorAction;