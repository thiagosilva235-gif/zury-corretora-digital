/** Available public photos are enumerated by Vite at startup/build, never with Node APIs in the browser. */
const availablePhotos = new Set<string>(__ZURY_PHOTOS__);

export function publicPhoto(folder: string, slot: string): string | undefined {
  return ["webp", "jpg", "png"]
    .map((extension) => `/${folder}/${slot}.${extension}`)
    .find((path) => availablePhotos.has(path));
}
