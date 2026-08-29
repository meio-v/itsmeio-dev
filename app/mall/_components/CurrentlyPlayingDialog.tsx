"use client";

import { useEffect, useRef } from "react";

import type { CurrentlyPlayingContent as CurrentlyPlayingContentType } from "@/lib/currently-playing";

import styles from "../mall.module.css";
import { CurrentlyPlayingContent } from "./CurrentlyPlayingContent";

export function CurrentlyPlayingDialog({
  content,
  open,
  onRequestClose,
}: {
  content: CurrentlyPlayingContentType;
  open: boolean;
  onRequestClose(): void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="currently-playing-dialog-title"
      onClose={onRequestClose}
    >
      <div className={styles.dialogHeader}>
        <h2 id="currently-playing-dialog-title"><span>Currently</span><span>Playing</span></h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => dialogRef.current?.close()}
        >
          Close
        </button>
      </div>
      <CurrentlyPlayingContent content={content} />
    </dialog>
  );
}
