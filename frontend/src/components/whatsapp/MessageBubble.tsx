"use client";

type MessageBubbleProps = {
  text: string;
};

export function MessageBubble({ text }: MessageBubbleProps) {
  return (
    <div dir="rtl" className="relative max-w-md">
      <div
        className="relative rounded-lg rounded-br-none px-4 py-3 text-[15px] leading-relaxed text-slate-900 shadow-sm"
        style={{
          background: "#DCF8C6",
          borderRadius: "8px 8px 0 8px",
          fontFamily: "var(--font-heebo), system-ui, sans-serif",
        }}
      >
        <p className="whitespace-pre-wrap">{text}</p>
      </div>
      <span
        className="absolute -bottom-1 end-0 h-3 w-3"
        style={{
          background: "#DCF8C6",
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}
