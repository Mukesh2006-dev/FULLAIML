import { useState, useEffect, useCallback } from "react";

/**
 * Hook to support dragging a file anywhere over the screen and dropping it anywhere on the page.
 *
 * @param {Function} onFileDrop - Callback function when a file is dropped on the page.
 * @param {Object} options
 * @param {boolean} [options.enabled=true] - Whether global drag and drop is enabled.
 * @param {string} [options.acceptExtension=".csv"] - Allowed file extension (e.g. ".csv").
 * @returns {boolean} isDraggingOver - True when a file is actively dragged over the screen.
 */
export function useGlobalFileDrop(onFileDrop, options = {}) {
  const { enabled = true, acceptExtension = ".csv" } = options;
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileDrop = useCallback(
    (file) => {
      if (!file) return;
      if (acceptExtension && !file.name.toLowerCase().endsWith(acceptExtension.toLowerCase())) {
        if (onFileDrop) {
          onFileDrop(null, `Invalid file type. Please drop a ${acceptExtension} file.`);
        }
        return;
      }
      if (onFileDrop) {
        onFileDrop(file, null);
      }
    },
    [onFileDrop, acceptExtension]
  );

  useEffect(() => {
    if (!enabled) {
      setIsDraggingOver(false);
      return;
    }

    let dragCounter = 0;

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) {
        dragCounter++;
        if (dragCounter === 1) {
          setIsDraggingOver(true);
        }
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.types && Array.from(e.dataTransfer.types).includes("Files")) {
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          setIsDraggingOver(false);
        }
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileDrop(files[0]);
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [enabled, handleFileDrop]);

  return isDraggingOver;
}

export default useGlobalFileDrop;
