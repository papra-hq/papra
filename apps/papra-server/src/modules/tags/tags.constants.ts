export const TagColorRegex = /^#[0-9a-f]{6}$/;

export const tagIdPrefix = 'tag';
export const tagIdRegex = new RegExp(`^${tagIdPrefix}_[a-z0-9]{24}$`);
