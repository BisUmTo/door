import { useEffect, useRef, useState, MouseEvent } from "react";
import clsx from "clsx";
import type { HitboxDefinition } from "@/data/loaders";
import { loadHitbox } from "@/data/loaders";

interface DoorHitboxProps {
  hitboxPath: string;
  imageSrc?: string;
  selectedImageSrc?: string;
  width: number | string;
  height: number | string;
  referenceWidth?: number;
  referenceHeight?: number;
  referenceOffsetX?: number;
  referenceOffsetY?: number;
  className?: string;
  childrenWrapperClassName?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const isPointInPolygon = (points: [number, number][], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const withinHitbox = (definition: HitboxDefinition | null, x: number, y: number) => {
  if (!definition || !definition.polygons?.length) return true;
  return definition.polygons.some((polygon) => isPointInPolygon(polygon.points, x, y));
};

export const DoorHitbox = ({
  hitboxPath,
  imageSrc,
  selectedImageSrc,
  width,
  height,
  referenceWidth,
  referenceHeight,
  referenceOffsetX = 0,
  referenceOffsetY = 0,
  className,
  childrenWrapperClassName,
  onClick,
  children
}: DoorHitboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hitbox, setHitbox] = useState<HitboxDefinition | null>(null);
  const [isHoveredWithin, setIsHoveredWithin] = useState(false);

  useEffect(() => {
    let active = true;
    loadHitbox(hitboxPath).then((definition) => {
      if (active) {
        setHitbox(definition);
      }
    });
    return () => {
      active = false;
    };
  }, [hitboxPath]);

  const toReferenceCoordinates = (bounds: DOMRect | undefined, x: number, y: number) => {
    if (!bounds) return { x, y };
    const refWidth =
      referenceWidth ??
      (typeof width === "number" ? width : hitbox?.width ?? bounds.width);
    const refHeight =
      referenceHeight ??
      (typeof height === "number" ? height : hitbox?.height ?? bounds.height);
    if (!refWidth || !refHeight) return { x, y };
    return {
      x: referenceOffsetX + (x / bounds.width) * refWidth,
      y: referenceOffsetY + (y / bounds.height) * refHeight
    };
  };

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      onClick();
      return;
    }
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const referencePoint = toReferenceCoordinates(bounds, x, y);
    if (withinHitbox(hitbox, referencePoint.x, referencePoint.y)) {
      onClick();
    }
  };

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds || !bounds.width || !bounds.height) {
      if (isHoveredWithin) setIsHoveredWithin(false);
      return;
    }
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const referencePoint = toReferenceCoordinates(bounds, x, y);
    const inside = withinHitbox(hitbox, referencePoint.x, referencePoint.y);
    if (inside !== isHoveredWithin) {
      setIsHoveredWithin(inside);
    }
  };

  const handleMouseLeave = () => {
    if (isHoveredWithin) {
      setIsHoveredWithin(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      onClick={handleClick}
      onMouseMove={handlePointerMove}
      onMouseLeave={handleMouseLeave}
      className={clsx("relative cursor-pointer select-none", className)}
    >
      {imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt=""
            className="pointer-events-none h-full w-full object-contain"
          />
          {selectedImageSrc ? (
            <img
              src={selectedImageSrc}
              alt=""
              className={clsx(
                "pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-150",
                isHoveredWithin ? "opacity-100" : "opacity-0"
              )}
            />
          ) : null}
        </>
      ) : (
        <div className="absolute inset-0 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
          {selectedImageSrc ? (
            <div
              className={clsx(
                "pointer-events-none absolute inset-0 rounded-lg border border-white/40 transition-opacity duration-150",
                isHoveredWithin ? "opacity-100" : "opacity-0"
              )}
            />
          ) : null}
        </div>
      )}
      {children ? (
        <div
          className={clsx(
            "absolute inset-0 pointer-events-none",
            childrenWrapperClassName ?? "flex items-center justify-center"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default DoorHitbox;
