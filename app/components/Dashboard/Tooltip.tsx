"use client";
import { useState, useRef, useCallback } from "react";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  width?: number;
}

export function Tooltip({ content, children, width = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [above, setAbove] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setAbove(rect.top > 200);
      }
      setVisible(true);
    }, 180);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-block", cursor: "help" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <span
          style={{
            position: "absolute",
            [above ? "bottom" : "top"]: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0f172a",
            color: "#e2e8f0",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            fontSize: "0.71rem",
            lineHeight: 1.65,
            width: `${width}px`,
            zIndex: 9999,
            boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
            whiteSpace: "normal",
            pointerEvents: "none",
            display: "block",
          }}
        >
          {content}
          <span
            style={{
              position: "absolute",
              [above ? "top" : "bottom"]: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              border: "6px solid transparent",
              [above ? "borderTopColor" : "borderBottomColor"]: "#0f172a",
              display: "block",
              width: 0,
              height: 0,
            }}
          />
        </span>
      )}
    </span>
  );
}

export function TT({ title, body }: { title: string; body: string }) {
  return (
    <span>
      <strong style={{ color: "#93c5fd" }}>{title}</strong>
      <br />
      {body}
    </span>
  );
}
