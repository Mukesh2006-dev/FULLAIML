import { useEffect, useRef } from "react";
import { defineElement } from "@lordicon/element";

// Register custom element once in browser environment
if (typeof window !== "undefined" && !customElements.get("lord-icon")) {
  try {
    defineElement();
  } catch (err) {
    console.warn("LordIcon defineElement warning:", err);
  }
}

/**
 * LordIcon React Wrapper
 *
 * @param {Object} props
 * @param {string} props.src - URL or path to LordIcon JSON (e.g., "https://cdn.lordicon.com/smwmetfi.json")
 * @param {string} [props.trigger="hover"] - "hover" | "click" | "loop" | "loop-on-hover" | "morph" | "boomerang" | "in"
 * @param {number|string} [props.size=32] - Icon width and height in px
 * @param {string} [props.colors] - E.g. "primary:#00ffe6,secondary:#8b5cf6"
 * @param {number} [props.stroke] - Stroke width
 * @param {number} [props.delay] - Delay between animations in ms
 * @param {string} [props.className]
 * @param {Object} [props.style]
 * @param {Function} [props.onClick]
 */
export default function LordIcon({
  src,
  trigger = "hover",
  size = 32,
  colors = "primary:#00ffe6,secondary:#8b5cf6",
  stroke,
  delay,
  className = "",
  style = {},
  onClick,
  ...rest
}) {
  const iconRef = useRef(null);

  useEffect(() => {
    if (iconRef.current && delay !== undefined) {
      iconRef.current.delay = delay;
    }
  }, [delay]);

  return (
    <lord-icon
      ref={iconRef}
      src={src}
      trigger={trigger}
      colors={colors}
      stroke={stroke}
      class={className}
      onClick={onClick}
      style={{
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
      {...rest}
    />
  );
}
