import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react"; // Uses lucide-react icons (already bundled with shadcn/ui)

export default function AccordionSection({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-md mb-4 overflow-hidden">
      <button
        className="w-full flex items-center justify-between text-left px-4 py-3 font-semibold bg-gray-100 hover:bg-gray-200"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.9 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.9 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="origin-top px-4 py-2 text-sm text-gray-700"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}