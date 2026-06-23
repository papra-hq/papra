import * as v from 'valibot';

function buildTagLine({ name, description }: { name: string; description?: string | null }) {
  return description ? `- ${name}: ${description}` : `- ${name}`;
}

export function buildAutoTaggingSystemPrompt({
  existingTags,
  canCreateNewTags,
  maxTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  canCreateNewTags: boolean;
  maxTags: number;
}) {
  if (existingTags.length > 0) {
    return [
      'You are an assistant that categorizes documents by selecting the most relevant tags based on their content.',
      '',

      'Available tags:',
      ...existingTags.map(buildTagLine),
      '',
      'Instructions:',
      `- Select at most ${maxTags} tag${maxTags === 1 ? '' : 's'}, only those genuinely relevant to the document. Returning fewer is better than forcing irrelevant tags.`,
      '- Prefer the existing tags listed above whenever one fits.',
      canCreateNewTags
        ? '- If none of the existing tags fit well, you may propose new, concise tag names. You may provide an optional description for each new tag.'
        : '- Only choose from the existing tags listed above. Do not invent new tags.',
    ].join('\n');
  }

  // No existing tags, and we are sure that new tags can be created, so we make the prompt all about creating new tags.
  return [
    'You are an assistant that categorizes documents by creating the most relevant tags based on their content.',
    '',
    'Instructions:',
    `- Create at most ${maxTags} tag${maxTags === 1 ? '' : 's'}, only those genuinely relevant to the document. Returning fewer is better than forcing irrelevant tags.`,
    '- If you cannot think of any relevant tags, return an empty list.',
    '- The tags should be concise and useful for categorizing documents.',
    '- You may provide an optional description for each tag.',
  ].join('\n');
}

export function buildAutoTaggingUserPrompt({
  document,
}: {
  document: { content: string; name: string };
}) {
  return [`Document name: ${document.name}`, 'Document content:', document.content].join('\n');
}

type AutoTaggingResponse = v.InferOutput<ReturnType<typeof buildAutoTaggingSchema>>;

export function buildAutoTaggingSchema({
  existingTags,
  maxTags,
  canCreateNewTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  maxTags: number;
  canCreateNewTags: boolean;
}) {
  if (existingTags.length === 0) {
    return v.pipe(
      v.array(
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
        }),
      ),
      v.maxLength(maxTags),
    );
  }

  if (!canCreateNewTags) {
    return v.pipe(v.array(v.picklist(existingTags.map((tag) => tag.name))), v.maxLength(maxTags));
  }

  return v.pipe(
    v.array(
      v.union([
        v.object({
          type: v.literal('existing'),
          name: v.picklist(existingTags.map((tag) => tag.name)),
        }),
        v.object({
          type: v.literal('new'),
          name: v.string(),
          description: v.optional(v.string()),
        }),
      ]),
    ),
    v.maxLength(maxTags),
  );
}

export function getTagsActions({
  requestedTags,
  existingTags,
}: {
  requestedTags: AutoTaggingResponse;
  existingTags: { name: string; id: string }[];
}) {
  const tagIdsToAdd: string[] = [];
  const tagsToCreate: { name: string; description?: string }[] = [];

  const existingTagNamesMap = new Map(existingTags.map((tag) => [tag.name, tag.id]));

  const addExistingTagByName = (tagName: string) => {
    const existingTag = existingTagNamesMap.get(tagName);
    if (existingTag) {
      tagIdsToAdd.push(existingTag);
    }
  };

  for (const tag of requestedTags) {
    // Prediction returns a string array when they are only existing tags, none to create
    if (typeof tag === 'string') {
      addExistingTagByName(tag);
      continue;
    }

    if ('type' in tag) {
      if (tag.type === 'existing') {
        addExistingTagByName(tag.name);
        continue;
      }

      if (tag.type === 'new') {
        tagsToCreate.push({ name: tag.name, description: tag.description });
        continue;
      }
    }

    tagsToCreate.push({ name: tag.name, description: tag.description });
    continue;
  }

  return { tagIdsToAdd, tagsToCreate };
}
