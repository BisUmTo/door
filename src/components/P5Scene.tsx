import { memo, useEffect, useMemo, useRef, useState } from "react";
import p5 from "p5";

type Point = [number, number];

interface HitboxPolygon {
  points: Point[];
}

interface HitboxDefinition {
  polygons: HitboxPolygon[];
}

export interface SceneElementConfig {
  id: string;
  image: string;
  selectedImage?: string;
  hitboxPath?: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  zIndex?: number;
  onClick?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

export interface SceneConfig {
  baseWidth: number;
  baseHeight: number;
  backgroundImage: string;
  elements: SceneElementConfig[];
}

interface P5SceneProps {
  config: SceneConfig;
  className?: string;
}

const isPointInPolygon = (points: Point[], x: number, y: number) => {
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

const isPointWithinHitbox = (definition: HitboxDefinition | null, x: number, y: number) => {
  if (!definition || !definition.polygons?.length) return false;
  return definition.polygons.some((polygon) => isPointInPolygon(polygon.points, x, y));
};

interface ElementState {
  config: SceneElementConfig;
  baseImage: p5.Image | null;
  hoverImage: p5.Image | null;
  hitbox: HitboxDefinition | null;
  hovered: boolean;
}

const P5SceneComponent = ({ config, className }: P5SceneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sortedElements = useMemo(
    () =>
      [...config.elements].sort(
        (a, b) => (a.zIndex ?? config.elements.length) - (b.zIndex ?? config.elements.length)
      ),
    [config.elements]
  );

  useEffect(() => {
    let isMounted = true;
    const container = containerRef.current;
    if (!container) return undefined;

    let canvasWidth = config.baseWidth;
    let canvasHeight = config.baseHeight;

    setIsLoading(true);

    const sketch = (p: p5) => {
      let backgroundImage: p5.Image | null = null;
      const elementStates: ElementState[] = sortedElements.map((element) => ({
        config: element,
        baseImage: null,
        hoverImage: null,
        hitbox: null,
        hovered: false
      }));

      const updateCanvasSize = () => {
        if (!containerRef.current) return;
        const containerWidth = Math.max(containerRef.current.clientWidth, 1);
        const ratio = config.baseHeight / config.baseWidth;
        canvasWidth = containerWidth;
        canvasHeight = containerWidth * ratio;
        p.resizeCanvas(canvasWidth, canvasHeight);
      };

      const toBaseCoordinates = (viewX: number, viewY: number) => {
        const x = (viewX / canvasWidth) * config.baseWidth;
        const y = (viewY / canvasHeight) * config.baseHeight;
        return { x, y };
      };

      const updateHoverState = (baseX: number, baseY: number) => {
        let changed = false;
        const hoveredIds = new Set<string>();
        elementStates.forEach((element) => {
          const hovered = !!(
            element.hitbox && isPointWithinHitbox(element.hitbox, baseX, baseY)
          );
          if (hovered) {
            hoveredIds.add(element.config.id);
          }
        });

        elementStates.forEach((element) => {
          const shouldHover = hoveredIds.has(element.config.id);
          if (element.hovered !== shouldHover) {
            element.hovered = shouldHover;
            changed = true;
            element.config.onHoverChange?.(shouldHover);
          }
        });

        if (changed) {
          // Ensure the scene redraws immediately after state change
          p.redraw();
        }
      };

      const handleClick = (baseX: number, baseY: number) => {
        const candidates = elementStates
          .filter(
            (element) => element.hitbox && isPointWithinHitbox(element.hitbox, baseX, baseY)
          )
          .sort((a, b) => (b.config.zIndex ?? 0) - (a.config.zIndex ?? 0));

        if (candidates.length) {
          const top = candidates[0];
          top.config.onClick?.();
        }
      };

      p.preload = () => {
        backgroundImage = p.loadImage(config.backgroundImage);
        elementStates.forEach((element) => {
          element.baseImage = p.loadImage(element.config.image);
          if (element.config.selectedImage) {
            element.hoverImage = p.loadImage(element.config.selectedImage);
          }
          if (element.config.hitboxPath) {
            element.hitbox = p.loadJSON(element.config.hitboxPath) as HitboxDefinition;
          }
        });
      };

      p.setup = () => {
        p.createCanvas(config.baseWidth, config.baseHeight);
        p.noStroke();
        p.noLoop();
        updateCanvasSize();
        if (isMounted) {
          setIsLoading(false);
        }
      };

      p.draw = () => {
        p.clear();
        if (backgroundImage) {
          p.image(backgroundImage, 0, 0, canvasWidth, canvasHeight);
        } else {
          p.background(0);
        }

        elementStates.forEach((element) => {
          const { layout } = element.config;
          const destX = (layout.x / config.baseWidth) * canvasWidth;
          const destY = (layout.y / config.baseHeight) * canvasHeight;
          const destWidth = (layout.width / config.baseWidth) * canvasWidth;
          const destHeight = (layout.height / config.baseHeight) * canvasHeight;

          if (element.baseImage) {
            p.image(element.baseImage, destX, destY, destWidth, destHeight);
          }

          if (element.hovered && element.hoverImage) {
            p.image(element.hoverImage, destX, destY, destWidth, destHeight);
          }
        });
      };

      p.mouseMoved = () => {
        const { x, y } = toBaseCoordinates(p.mouseX, p.mouseY);
        updateHoverState(x, y);
      };

      p.mousePressed = () => {
        const { x, y } = toBaseCoordinates(p.mouseX, p.mouseY);
        handleClick(x, y);
      };

      p.windowResized = () => {
        updateCanvasSize();
        p.redraw();
      };
    };

    const instance = new p5(sketch, container);
    p5InstanceRef.current = instance;

    const observer = new ResizeObserver(() => {
      instance.windowResized?.();
    });
    observer.observe(container);

    return () => {
      isMounted = false;
      observer.disconnect();
      instance.remove();
      p5InstanceRef.current = null;
    };
  }, [config.backgroundImage, config.baseHeight, config.baseWidth, sortedElements]);

  return (
    <div className={className}>
      <div ref={containerRef} className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm pointer-events-none">
            <div className="h-10 w-10 border-4 border-white/50 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const P5Scene = memo(P5SceneComponent);

export default P5Scene;
