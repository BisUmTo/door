import { useEffect, useRef, useState, MouseEvent } from "react";
import clsx from "clsx";
import type { HitboxDefinition } from "@/data/loaders";
import { loadHitbox } from "@/data/loaders";

interface DoorHitboxProps {
  hitboxPath: string;
  imageSrc?: string;
  width: number;
  height: number;
  className?: string;
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
  width,
  height,
  className,
  onClick,
  children
}: DoorHitboxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hitbox, setHitbox] = useState<HitboxDefinition | null>(null);

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

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      onClick();
      return;
    }
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (withinHitbox(hitbox, x, y)) {
      onClick();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      onClick={handleClick}
      className={clsx("relative cursor-pointer select-none", className)}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          width={width}
          height={height}
          className="pointer-events-none object-contain"
        />
      ) : (
        <div className="absolute inset-0 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm" />
      )}
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default DoorHitbox;
