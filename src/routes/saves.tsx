import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/state/store";
import { useSettingsStore } from "@/state/settings";

const localeMap = {
  it,
  en: enUS
};

const formatDate = (dateIso: string, language: string) => {
  const date = new Date(dateIso);
  const locale = localeMap[language as keyof typeof localeMap] ?? it;
  return format(date, "dd MMM yyyy HH:mm", { locale });
};

const SavesRoute = () => {
  const { t } = useTranslation();
  const language = useSettingsStore((state) => state.language);
  const { slots, activeSlotId, createSlot, duplicateSlot, loadSlot, renameSlot, deleteSlot } =
    useGameStore((state) => ({
      slots: state.slots,
      activeSlotId: state.activeSlotId,
      createSlot: state.createSlot,
      duplicateSlot: state.duplicateSlot,
      loadSlot: state.loadSlot,
      renameSlot: state.renameSlot,
      deleteSlot: state.deleteSlot
    }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const startEditing = (slotId: string, currentName: string) => {
    setEditingId(slotId);
    setEditingValue(currentName);
  };

  const commitRename = (slotId: string) => {
    if (!editingValue.trim()) {
      setEditingId(null);
      return;
    }
    renameSlot(slotId, editingValue.trim());
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-background py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl bg-black/75 p-8 text-white">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display uppercase tracking-[0.4em]">
              {t("saves.title", "Salvataggi")}
            </h2>
            <p className="text-sm text-white/60">
              {t("saves.subtitle", "Gestisci gli slot locali")}
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest hover:border-accent hover:text-accent"
          >
            {t("settings.back")}
          </Link>
        </header>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void createSlot()}
            className="rounded-full border border-accent bg-transparent px-4 py-2 text-sm uppercase tracking-widest text-accent hover:bg-accent/10"
          >
            {t("saves.new", "Nuovo slot")}
          </button>
        </div>

        <ul className="space-y-3">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 ${
                activeSlotId === slot.id ? "border-accent" : ""
              }`}
              onDoubleClick={() => startEditing(slot.id, slot.name)}
            >
              <div className="flex flex-col gap-1 text-sm">
                {editingId === slot.id ? (
                  <input
                    value={editingValue}
                    autoFocus
                    onChange={(event) => setEditingValue(event.target.value)}
                    onBlur={() => commitRename(slot.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        commitRename(slot.id);
                      } else if (event.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    className="w-56 rounded border border-white/30 bg-black/70 px-3 py-1 text-white focus:border-accent focus:outline-none"
                  />
                ) : (
                  <span className="text-base font-semibold text-white">{slot.name}</span>
                )}
                <span className="text-xs uppercase text-white/50">
                  {formatDate(slot.updatedAt, language)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => duplicateSlot(slot.id)}
                  className="rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-widest text-white/70 transition hover:border-emerald-300 hover:text-emerald-200"
                >
                  {t("saves.duplicate", "Duplica")}
                </button>
                <button
                  type="button"
                  onClick={() => void loadSlot(slot.id)}
                  className="rounded-full border border-accent px-4 py-1 text-xs uppercase tracking-widest text-accent hover:bg-accent/10"
                >
                  {t("saves.load", "Carica")}
                </button>
                <button
                  type="button"
                  onClick={() => deleteSlot(slot.id)}
                  className="rounded-full border border-red-500 px-3 py-1 text-xs uppercase tracking-widest text-red-400 hover:bg-red-500/10"
                  aria-label={t("saves.delete", "Elimina")}
                >
                  &#128465;
                </button>
              </div>
            </li>
          ))}
        </ul>

        {slots.length === 0 ? (
          <p className="text-center text-sm text-white/60">
            {t("saves.empty", "Nessun salvataggio disponibile. Creane uno nuovo!")}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SavesRoute;
