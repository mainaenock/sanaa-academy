export const RESOURCE_FILE_LIMIT_MB = 20;
export const RESOURCE_FILE_LIMIT = RESOURCE_FILE_LIMIT_MB * 1024 * 1024;
export const POWERPOINT_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

export function isPowerPoint(name: string) {
  return /\.pptx$/i.test(name);
}

export function resourceFileUrl(id: string) {
  return `/api/student/resource-file?id=${encodeURIComponent(id)}`;
}
