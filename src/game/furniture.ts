import type { FurniturePieceResource, Resource, SaveGame } from "./types";

export const FURNITURE_RESOURCE_PREFIX = "housePiece";

export const isFurnitureResource = (resource: Resource): resource is FurniturePieceResource => {
  return (
    typeof resource === "string" && resource.startsWith(`${FURNITURE_RESOURCE_PREFIX}:`)
  );
};

export const isRandomFurnitureResource = (resource: FurniturePieceResource): boolean => {
  return resource === "housePiece:any";
};

export const getFurnitureResourceTargetId = (
  resource: FurniturePieceResource
): number | null => {
  if (isRandomFurnitureResource(resource)) {
    return null;
  }
  const [, rawId] = resource.split(":");
  const parsed = Number(rawId);
  return Number.isFinite(parsed) ? parsed : null;
};

export const findFurnitureObjectName = (
  objects: SaveGame["house"]["objects"],
  targetId: number | null
): string | null => {
  if (targetId === null) {
    return null;
  }
  const entry = objects.find((object) => object.id === targetId);
  return entry ? entry.name : null;
};
