import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useGameStore } from "@/state/store";
import { useSettingsStore } from "@/state/settings";
import { assetUrl } from "@/utils/assetUrl";

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
  const {
    slots,
    activeSlotId,
    createSlot,
    duplicateSlot,
    loadSlot,
    renameSlot,
    deleteSlot,
    exportSavesSnapshot,
    importSavesFromJson
  } =
    useGameStore((state) => ({
      slots: state.slots,
      activeSlotId: state.activeSlotId,
      createSlot: state.createSlot,
      duplicateSlot: state.duplicateSlot,
      loadSlot: state.loadSlot,
      renameSlot: state.renameSlot,
      deleteSlot: state.deleteSlot,
      exportSavesSnapshot: state.exportSavesSnapshot,
      importSavesFromJson: state.importSavesFromJson
    }));

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleExport = () => {
    try {
      const snapshot = exportSavesSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.href = url;
      link.download = `door-saves-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export saves", error);
      window.alert(t("saves.exportError", "Impossibile esportare i salvataggi."));
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      importSavesFromJson(content);
      window.alert(t("saves.importSuccess", "Salvataggi importati con successo."));
    } catch (error) {
      console.error("Failed to import saves", error);
      window.alert(t("saves.importError", "File di salvataggio non valido."));
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* SFONDO CON IMMAGINE + BLUR + OVERLAY */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center blur"
          style={{ backgroundImage: `url(${assetUrl("/assets/lobby/sfondo_lobby.png")})` }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
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
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("settings.back")}
          </Link>
        </header>

        <div className="flex flex-wrap justify-end gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest text-white transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("saves.export", "Esporta")}
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded-full border border-white/30 px-4 py-2 text-sm uppercase tracking-widest text-white transition hover:border-[#a67c52] hover:text-[#a67c52]"
          >
            {t("saves.import", "Importa")}
          </button>
          <button
            type="button"
            onClick={() => {
              void createSlot();
            }}
            className="rounded-full border border-[#a67c52] bg-transparent px-4 py-2 text-sm uppercase tracking-widest text-[#a67c52] transition hover:bg-[#a67c52]/10"
          >
            {t("saves.new", "Nuovo slot")}
          </button>
        </div>

        <ul className="space-y-3">
          {slots.map((slot) => {
            const isActive = activeSlotId === slot.id;

            return (
              <li
                key={slot.id}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-sm transition ${
                  isActive
                    ? "border-[#a67c52] bg-[#a67c52]/15 shadow-lg shadow-[#a67c52]/30"
                    : "border-white/10 bg-white/10 hover:bg-white/20"
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
                      className="w-56 rounded border border-white/30 bg-black/70 px-3 py-1 text-white focus:border-[#a67c52] focus:outline-none"
                    />
                  ) : (
                    <span className="text-base font-semibold text-white">{slot.name}</span>
                  )}
                  <span className="text-xs uppercase text-white/60">
                    {formatDate(slot.updatedAt, language)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => duplicateSlot(slot.id)}
                    className="rounded-full border border-white/25 px-3 py-1 text-xs uppercase tracking-widest text-white/80 transition hover:border-[#a67c52] hover:text-[#a67c52]"
                  >
                    {t("saves.duplicate", "Duplica")}
                  </button>

                  {isActive ? (
                    <span className="rounded-full border border-[#a67c52] bg-[#a67c52]/20 px-4 py-1 text-xs uppercase tracking-widest text-[#a67c52]">
                      {t("saves.activeBadge", "Attivo")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void loadSlot(slot.id)}
                      className="rounded-full border border-[#a67c52] px-4 py-1 text-xs uppercase tracking-widest text-[#a67c52] transition hover:bg-[#a67c52]/10"
                    >
                      {t("saves.load", "Carica")}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteSlot(slot.id)}
                    className="rounded-full border border-red-500 px-3 py-1 text-xs uppercase tracking-widest text-red-400 transition hover:bg-red-500/10"
                    aria-label={t("saves.delete", "Elimina")}
                  >
                    &#128465;
                  </button>
                </div>
              </li>
            );
          })}
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
