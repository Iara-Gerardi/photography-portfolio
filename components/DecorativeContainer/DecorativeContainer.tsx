"use client";

import { Jacquard_12 } from "next/font/google";
import React, { ReactNode } from "react";

interface DecorativeContainerProps {
  /** Content to display inside the container */
  children: ReactNode;
  /** Container mode: 'modal' or 'selected' */
  mode?: "modal" | "selected";
  /** Title for modal mode */
  title?: string;
  /** Show action buttons in modal mode */
  showActions?: boolean;
  /** Cancel button text */
  cancelText?: string;
  /** OK button text */
  okText?: string;
  /** Cancel button callback */
  onCancel?: () => void;
  /** OK button callback */
  onOk?: () => void;
  /** Close button callback (modal mode) */
  onClose?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Width of the container */
  width?: number | string;
  /** Height of the container */
  height?: number | string;
}

// CSS to hide scrollbars
const scrollbarStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const jacquard24 = Jacquard_12({
  weight: "400",
  subsets: ["latin"],
});


export const DecorativeContainer: React.FC<DecorativeContainerProps> = ({
  children,
  mode = "modal",
  title = "dialog",
  showActions = true,
  cancelText = "cancel",
  okText = "ok",
  onCancel,
  onOk,
  onClose,
  className = "",
  width = 300,
  height = 200,
}) => {
  if (mode === "modal") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
        <div
          className={`relative flex flex-col border-2 border-slate-400/30 border-dashed overflow-hidden bg-black ${jacquard24.className} ${className}`}
          style={{
            width: typeof width === "number" ? `${width}px` : width,
            height: typeof height === "number" ? `${height}px` : height,
          }}
        >
          {/* Header */}
          <div className="draggable-header flex items-center justify-between border-b-2 border-dashed border-slate-400/30 px-3 py-2 shrink-0 cursor-move select-none">
          <span className={`text-slate-400/70 text-2xl md:text-4xl ${jacquard24.className}`}>{title}</span>
          {onClose && (
            <button
              onClick={onClose}
              className={`text-slate-400/70 hover:text-slate-400/90 text-4xl leading-none w-5 h-5 flex items-center justify-center ${jacquard24.className}`}
            >
              ×
            </button>
          )}
        </div>

          {/* Content - scrollable with hidden scrollbars */}
          <div className="relative flex-1 overflow-auto min-h-0 hide-scrollbar">
            {children}
          </div>

        {/* Actions */}
        {showActions && (
          <div className="flex w-full bottom-0 items-center justify-end gap-2 p-5 shrink-0 absolute">
            {onCancel && (
              <button
                disabled
                onClick={onCancel}
                className={`text-slate-400/70 hover:text-slate-400 text-2xl px-2 cursor-not-allowed ${jacquard24.className}`}
              >
                [ {cancelText} ]
              </button>
            )}
            {onOk && (
              <button
                disabled
                onClick={onOk}
                className={`text-slate-400/70 hover:text-slate-400 text-2xl px-2 cursor-not-allowed ${jacquard24.className}`}
              >
                [ {okText} ]
              </button>
            )}
          </div>
        )}
        </div>
      </>
    );
  }

  // Selected mode
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      <div
        className={`relative border-2 border-blue-500 border-dashed bg-transparent overflow-hidden ${className}`}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
      {/* Corner handles */}
      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500" />
      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500" />
      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500" />
      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500" />

        {/* Content - scrollable with hidden scrollbars */}
        <div className="w-full h-full overflow-auto hide-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

export default DecorativeContainer;
