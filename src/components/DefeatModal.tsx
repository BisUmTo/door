interface DefeatModalProps {
  open: boolean;
  doorsOpened: number;
  onReturn: () => void;
}

export const DefeatModal = ({ open, doorsOpened, onReturn }: DefeatModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-red-950/80 p-6 text-center text-white shadow-glow">
        <h2 className="text-4xl font-display uppercase tracking-[0.4em] text-red-300">
          Sconfitta
        </h2>
        <p className="mt-4 text-sm text-white/80">
          Porte aperte in totale:{" "}
          <span className="text-lg font-semibold text-red-200">{doorsOpened}</span>
        </p>
        <button
          type="button"
          onClick={onReturn}
          className="mt-6 w-full rounded-full bg-red-400 py-3 text-sm font-semibold uppercase tracking-widest text-red-950 hover:bg-red-300"
        >
          Torna al menu
        </button>
      </div>
    </div>
  );
};

export default DefeatModal;
