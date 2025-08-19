import { useId, useState } from 'react';

/**
 * Accessible, lightweight accordion.
 * Props:
 * - items: [{ id?: string, title: string, content: ReactNode }]
 * - singleOpen: boolean (default true) — only one panel open at a time
 * - defaultOpenIds: string[] — which ids open initially
 */
export default function Accordion({ items = [], singleOpen = true, defaultOpenIds = [] }) {
  const [openIds, setOpenIds] = useState(new Set(defaultOpenIds));
  const rootId = useId();

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (singleOpen) next.clear();
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
      {items.map((item, idx) => {
        const id = item.id || `${rootId}-${idx}`;
        const isOpen = openIds.has(id);
        const buttonId = `${id}-button`;
        const panelId = `${id}-panel`;

        return (
          <div key={id} className="p-4">
            <h3 className="text-sm sm:text-base">
              <button
                id={buttonId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                onClick={() => toggle(id)}
                className="flex w-full items-center justify-between gap-4 text-left font-medium text-gray-900"
              >
                <span>{item.title}</span>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full border text-xs transition
                    ${isOpen ? 'rotate-45 border-gray-900 text-gray-900' : 'border-gray-300 text-gray-600'}`}
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`overflow-hidden transition-[max-height,opacity] duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="pt-3 text-sm text-gray-700">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}