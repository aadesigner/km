/** Resolve display (hero/thumbs) vs HD (lightbox) photo lists from report data. */
export function resolveReportPhotoSets(data: {
  photos?: string[] | null;
  photosHd?: string[] | null;
  thumbnailUrl?: string | null;
} | null | undefined): { photos: string[]; photosHd: string[] } {
  if (!data) return { photos: [], photosHd: [] };
  const photos = (
    Array.isArray(data.photos) && data.photos.length > 0
      ? data.photos
      : data.thumbnailUrl
        ? [data.thumbnailUrl]
        : []
  ).filter((p): p is string => typeof p === "string" && p.length > 0);

  const hdRaw = Array.isArray(data.photosHd)
    ? data.photosHd.filter((p): p is string => typeof p === "string" && p.length > 0)
    : [];
  const photosHd = hdRaw.length > 0 ? hdRaw : photos;
  return { photos, photosHd };
}
