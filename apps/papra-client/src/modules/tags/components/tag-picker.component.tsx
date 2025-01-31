import type { Tag } from '../tags.types';
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxTrigger } from '@/modules/ui/components/combobox';
import { createQuery } from '@tanstack/solid-query';
import { type Component, createSignal, For } from 'solid-js';
import { fetchTags } from '../tags.services';
import { Tag as TagComponent } from './tag.component';

export const DocumentTagPicker: Component<{
  organizationId: string;
  tags: Tag[];
  documentId: string;
  onTagsChange?: (args: { tags: Tag[] }) => void;
  onTagAdded?: (args: { tag: Tag }) => void;
  onTagRemoved?: (args: { tag: Tag }) => void;
}> = (props) => {
  const [getSelectedTags, setSelectedTags] = createSignal<Tag[]>(props.tags);

  const query = createQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'tags'],
    queryFn: () => fetchTags({ organizationId: props.organizationId }),
  }));

  const options = () => query.data?.tags || [];

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

        <span class="flex flex-wrap items-center gap-1">
          <For each={state.selectedOptions() as Tag[]}>
            {tag => (
              <TagComponent name={tag.name} color={tag.color} class="text-xs my-1" closable onClose={() => state.remove(tag)} />
            )}
          </For>
          <ComboboxInput />

        </span>

      )}
      >

      </ComboboxTrigger>
      <ComboboxContent />
    </Combobox>
  );
};
