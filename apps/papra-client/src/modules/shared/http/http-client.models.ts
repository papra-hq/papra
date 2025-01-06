export function getFormData(pojo: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(pojo).forEach(([key, value]) => formData.append(key, value));
  return formData;
}
