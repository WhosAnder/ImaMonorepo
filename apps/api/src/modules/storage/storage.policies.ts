export function storagePolicies() {
  const baseImageTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/gif",
  ];

  return {
    userFace: {
      maxSize: 50 * 1024 * 1024,
      allowedTypes: [
        ...baseImageTypes,
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo",
      ],
    },
    permissionDocument: {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: [
        "application/pdf",
        ...baseImageTypes,
        "image/bmp",
        "image/svg+xml",
      ],
    },
    evidence: {
      maxSize: 15 * 1024 * 1024,
      allowedTypes: [
        ...baseImageTypes,
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
      ],
    },
    imagesLimit: (images: string[]): boolean => {
      const MAX_IMAGES = 5;
      return !(images.length < MAX_IMAGES);
    },
  };
}
