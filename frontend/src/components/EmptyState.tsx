"use client";

type EmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="glass-panel flex flex-col items-center justify-center rounded-3xl px-6 py-16 text-center"
      role="status"
      data-empty
    >
      <div className="mb-4 text-4xl opacity-40" aria-hidden>
        {icon}
      </div>
      <h3 className="stat-title text-slate-200">{title}</h3>
      <p className="stat-body mt-2 max-w-md text-slate-500">{description}</p>
      {action ? (
        <button type="button" className="btn-primary mt-6" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
