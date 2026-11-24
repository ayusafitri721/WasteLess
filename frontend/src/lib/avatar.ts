export const AVATAR_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_DIMENSION = 1024;
export const AVATAR_MAX_STORED_BYTES = 512 * 1024;
export const AVATAR_MAX_DATA_URL_LENGTH = 800_000;

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("File tidak dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Gambar tidak dapat dibuka."));
    image.src = source;
  });
}

export async function processAvatarFile(file: File) {
  if (!["image/png", "image/jpeg"].includes(file.type)) {
    throw new Error("Foto profil harus berformat PNG atau JPEG.");
  }
  if (file.size > AVATAR_MAX_SOURCE_BYTES) {
    throw new Error("Ukuran file foto profil maksimal 5 MB.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(
    1,
    AVATAR_MAX_DIMENSION / image.naturalWidth,
    AVATAR_MAX_DIMENSION / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }
  context.drawImage(image, 0, 0, width, height);

  const output = canvas.toDataURL("image/jpeg", 0.85);
  if (output.length > AVATAR_MAX_DATA_URL_LENGTH) {
    throw new Error("Hasil kompresi masih terlalu besar. Coba gambar lain.");
  }

  const base64Length = output.split(",")[1]?.length ?? 0;
  if ((base64Length * 3) / 4 > AVATAR_MAX_STORED_BYTES) {
    throw new Error("Hasil kompresi masih terlalu besar. Coba gambar lain.");
  }

  return output;
}
