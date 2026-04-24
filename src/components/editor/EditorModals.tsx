'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef } from 'react';
import { CloseIcon } from '@/components/icons';
import { useGrimMotion } from '@/lib/useMotion';
import type { CareersRef, Template } from '@/lib/types';

type CareerPick = { className: string; careerName: string; level: number };

type EditorModalsProps = {
  templateOpen: boolean;
  careerOpen: boolean;
  templates: Template[];
  careers: CareersRef;
  onCloseTemplate: () => void;
  onCloseCareer: () => void;
  onPickTemplate: (t: Template) => void;
  onPickCareer: (pick: CareerPick) => void;
  templateDialogRef: React.Ref<HTMLDivElement>;
  careerDialogRef: React.Ref<HTMLDivElement>;
};

const EditorModals = forwardRef<HTMLDivElement, EditorModalsProps>(
  function EditorModals(props) {
    const { ease } = useGrimMotion();
    const {
      templateOpen,
      careerOpen,
      templates,
      careers,
      onCloseTemplate,
      onCloseCareer,
      onPickTemplate,
      onPickCareer,
      templateDialogRef,
      careerDialogRef,
    } = props;
    return (
      <AnimatePresence>
        {templateOpen && (
          <motion.div
            key="tpl-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onCloseTemplate}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose template"
              ref={templateDialogRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.2, ease }}
              className="grim-card max-w-md w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fx-card-header px-4 py-3 border-b border-gold-700/50 flex justify-between items-center">
                <h2 className="font-display text-gold-400 tracking-wide">Choose template</h2>
                <button
                  type="button"
                  className="text-parchment/80 hover:text-gold-400 transition-colors"
                  onClick={onCloseTemplate}
                  aria-label="Close"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-96 space-y-1">
                {templates.length === 0 ? (
                  <p className="text-parchment/70">No templates available.</p>
                ) : (
                  templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onPickTemplate(t)}
                      className="w-full text-left px-3 py-2 rounded border border-iron-700 bg-ink-800/60 text-parchment transition-all duration-fast ease-grim hover:border-gold-600 hover:bg-ink-700 hover:translate-x-0.5"
                    >
                      {t.name || t.id}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        {careerOpen && (
          <motion.div
            key="career-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onCloseCareer}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose career"
              ref={careerDialogRef}
              tabIndex={-1}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.2, ease }}
              className="grim-card max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="fx-card-header px-4 py-3 border-b border-gold-700/50 flex justify-between items-center">
                <h2 className="font-display text-gold-400 tracking-wide">Choose career</h2>
                <button
                  type="button"
                  className="text-parchment/80 hover:text-gold-400 transition-colors"
                  onClick={onCloseCareer}
                  aria-label="Close"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh] space-y-4">
                {!(Array.isArray(careers.classes) && careers.classes.length) ? (
                  <p className="text-parchment/70 text-sm">No careers available.</p>
                ) : (
                  careers.classes.map((cls) => (
                    <div key={cls.name}>
                      <h3 className="grim-label mb-1.5">{cls.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {(cls.careers || []).map((career) => (
                          <button
                            key={career.name}
                            type="button"
                            onClick={() =>
                              onPickCareer({
                                className: cls.name,
                                careerName: career.name,
                                level: 1,
                              })
                            }
                            className="grim-pill text-xs px-2.5 py-1 cursor-pointer"
                          >
                            {career.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

export default EditorModals;
