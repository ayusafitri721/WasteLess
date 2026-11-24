const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const MAX_INPUT_LENGTH = 800_000;
const MAX_IMAGE_BYTES = 512 * 1024;
const MAX_DIMENSION = 1024;

function assertDimensions(width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width > MAX_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    throw new Error('Dimensi foto profil tidak didukung');
  }
}

function readJpegDimensions(buffer) {
  let offset = 2;

  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    while (buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > buffer.length) break;

    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;

    if (marker === 0xe1) {
      throw new Error('Metadata foto profil tidak diizinkan');
    }

    const isStartOfFrame =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isStartOfFrame) {
      if (offset + 9 > buffer.length) break;
      const height = buffer.readUInt16BE(offset + 3);
      const width = buffer.readUInt16BE(offset + 5);
      return { width, height };
    }

    offset += length;
  }

  throw new Error('Dimensi foto profil tidak terbaca');
}

export function normalizeAvatarDataUrl(input) {
  if (typeof input !== 'string' || input.length > MAX_INPUT_LENGTH) {
    throw new Error('Foto profil tidak valid');
  }

  const matched = /^data:(image\/(png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    input,
  );
  if (!matched) {
    throw new Error('Format foto profil harus PNG atau JPEG');
  }

  const mime = matched[1];
  const base64 = matched[3];
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.toString('base64') !== base64) {
    throw new Error('Data foto profil tidak valid');
  }
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran foto profil maksimal 512 KB');
  }

  if (mime === 'image/png') {
    if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
      throw new Error('File PNG tidak valid');
    }
    assertDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
  } else {
    if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      throw new Error('File JPEG tidak valid');
    }
    const { width, height } = readJpegDimensions(buffer);
    assertDimensions(width, height);
  }

  return `data:${mime};base64,${buffer.toString('base64')}`;
}
