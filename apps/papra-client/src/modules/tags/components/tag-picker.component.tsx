import type { Component } from 'solid-js';
import type { Tag } from '../tags.types';
import { useQuery } from '@tanstack/solid-query';
import { createSignal, For } from 'solid-js';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxTrigger } from '@/modules/ui/components/combobox';
import { fetchTags } from '../tags.services';
import { Tag as TagComponent } from './tag.component';

export const DocumentTagPicker: Component<{
  organizationId: string;
  tagIds: string[];
  onTagsChange?: (args: { tags: Tag[] }) => void;
  onTagAdded?: (args: { tag: Tag }) => void;
  onTagRemoved?: (args: { tag: Tag }) => void;
}> = (props) => {
  const [getSelectedTagIds, setSelectedTagIds] = createSignal<string[]>(props.tagIds);

  const query = useQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'tags'],
    queryFn: () => fetchTags({ organizationId: props.organizationId }),
  }));

  const options = () => query.data?.tags || [];

  const getSelectedTags = () => query.data?.tags.filter(tag => getSelectedTagIds().includes(tag.id)) ?? [];
  const setSelectedTags = (tags: Tag[]) => setSelectedTagIds(tags.map(tag => tag.id));

  return (
    <Combobox<Tag>
      options={options()}
      placeholder="Search tags..."
      multiple
      value={getSelectedTags()}
      onChange={(tags: Tag[]) => {
        props.onTagsChange?.({ tags });
        const addedTags = tags.filter(tag => !getSelectedTags().find(t => t.id === tag.id));
        const removedTags = getSelectedTags().filter(tag => !tags.find(t => t.id === tag.id));

        addedTags.forEach(tag => props.onTagAdded?.({ tag }));
        removedTags.forEach(tag => props.onTagRemoved?.({ tag }));

        setSelectedTags(tags);
      }}
      optionValue="id"
      optionTextValue="name"
      optionLabel="name"
      itemComponent={props => (
        <ComboboxItem item={props.item}>{props.item.rawValue.name}</ComboboxItem>
      )}
    >
      <ComboboxTrigger displayMultipleState={state => (

        <span class="flex flex-wrap items-center gap-1 flex-1">
          <For each={state.selectedOptions() as Tag[]}>
            {tag => (
              <TagComponent name={tag.name} color={tag.color} class="text-xs my-1" closable onClose={() => state.remove(tag)} />
            )}
          </For>
          <ComboboxInput class="py-2" />

        </span>

      )}
      >

      </ComboboxTrigger>
      <ComboboxContent />
    </Combobox>
  );
};
