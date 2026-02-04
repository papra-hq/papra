import type { PopoverTriggerProps } from '@kobalte/core/popover';
import type { Component, ComponentProps } from 'solid-js';
import type { Tag } from '../tags.types';
import { useQuery } from '@tanstack/solid-query';
import { createEffect, createSignal, For, splitProps, Suspense } from 'solid-js';
import { queryClient } from '@/modules/shared/query/query-client';
import { cn } from '@/modules/shared/style/cn';
import { Button } from '@/modules/ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/ui/components/popover';
import { TextField, TextFieldRoot } from '@/modules/ui/components/textfield';
import { CreateTagModal } from '../pages/tags.page';
import { addTagToDocument, fetchTags, removeTagFromDocument } from '../tags.services';
import { TagPickerList } from './tag-picker-list.component';
import { Tag as TagComponent, TagLink } from './tag.component';
import { useTagPicker } from './use-tag-picker.hook';

export const TagPickerFilter: Component<{
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  isOpen?: boolean;
}> = (props) => {
  let ref: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.isOpen && ref) {
      // Small delay to ensure the popover is fully open
      setTimeout(() => ref?.focus(), 10);
    }
  });

  return (
    <TextFieldRoot>
      <TextField
        class="focus-visible:ring-0 rounded-none border-t-none border-x-none"
        placeholder={props.placeholder ?? 'Filter tags...'}
        value={props.value}
        onInput={e => props.onInput(e.currentTarget.value)}
        ref={ref}
        autofocus
      />
    </TextFieldRoot>
  );
};

const TagPicker: Component<{
  selectedTags?: Tag[];
  onChange?: (tags: Tag[]) => void;
  organizationId: string;
  isOpen?: boolean;
}> = (props) => {
  const [getIsTagCreationModalOpen, setIsTagCreationModalOpen] = createSignal(false);
  const tagsQuery = useQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'tags'],
    queryFn: () => fetchTags({ organizationId: props.organizationId }),
  }));

  const {
    setFilterQuery,
    filterQuery,
    resetHighlight,
    getTagsListItems,
    highlighted,
    highlightNext,
    highlightPrevious,
    getListItems,
    getNormalizedFilterQuery,
  } = useTagPicker({
    getAvailableTags: () => tagsQuery.data?.tags ?? [],
    getSelectedTagIds: () => props.selectedTags?.map(tag => tag.id) ?? [],
  });

  // Reset filter and highlight when popover opens
  createEffect(() => {
    if (props.isOpen) {
      setFilterQuery('');
      resetHighlight();
    }
  });

  const setTagSelection = ({ tagId, setSelection }: { tagId: string; setSelection: (previous: boolean) => boolean }) => {
    const updatedTagItems = getTagsListItems()
      .map(tagItem => ({
        ...tagItem,
        isSelected: tagItem.tag.id === tagId ? setSelection(tagItem.isSelected) : tagItem.isSelected,
      }));

    return updatedTagItems.filter(tag => tag.isSelected).map(({ tag }) => tag);
  };

  const handleToggle = (tagId: string, selected: boolean | ((old: boolean) => boolean)) => {
    const updatedTags = setTagSelection({ tagId, setSelection: typeof selected === 'function' ? selected : () => selected });

    props.onChange?.(updatedTags);
  };

  const handleTagCreated = (args: { tag: Tag }) => {
    const updatedTags = setTagSelection({ tagId: args.tag.id, setSelection: () => true });
    props.onChange?.(updatedTags);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const currentHighlight = highlighted();
    const { key } = e;
    const isEnterOrSpace = key === 'Enter' || key === ' ';

    if (key === 'ArrowDown') {
      e.preventDefault();
      highlightNext();
      return;
    }

    if (key === 'ArrowUp') {
      e.preventDefault();
      highlightPrevious();
      return;
    }

    if (isEnterOrSpace && currentHighlight.action === 'create-new-tag') {
      e.preventDefault();
      setIsTagCreationModalOpen(true);
      return;
    }

    if (isEnterOrSpace && currentHighlight.tagId) {
      e.preventDefault();
      handleToggle(currentHighlight.tagId, selected => !selected);
      return;
    }

    if (key === 'Escape') {
      // No preventDefault to allow closing the popover
      resetHighlight();
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      <TagPickerFilter
        value={filterQuery()}
        onInput={(value) => {
          setFilterQuery(value);
          resetHighlight();
        }}
        isOpen={props.isOpen}
      />

      <TagPickerList
        listItems={getListItems()}
        highlighted={highlighted()}
        onToggle={handleToggle}
        onCreateNewTag={() => setIsTagCreationModalOpen(true)}
      />

      <CreateTagModal
        open={getIsTagCreationModalOpen()}
        onOpenChange={setIsTagCreationModalOpen}
        initialName={getNormalizedFilterQuery()}
        onTagCreated={handleTagCreated}
        organizationId={props.organizationId}
      />
    </div>
  );
};

export const TagList: Component<{
  tags: Tag[];
  onChange?: (tags: Tag[]) => void;
  asLink?: boolean;
  tagClass?: string;
  triggerClass?: string;
  organizationId: string;
}> = (props) => {
  const TagItem = (props.asLink ?? true) ? TagLink : TagComponent;
  let containerRef: HTMLDivElement | undefined;
  const [isOpen, setIsOpen] = createSignal(false);

  const handleTagsChange = (tags: Tag[]) => {
    props.onChange?.(tags);
  };

  return (
    <div ref={containerRef} class="flex flex-wrap items-center gap-1">
      <For each={props.tags}>
        {tag => (
          <TagItem {...tag} class={props.tagClass} />
        )}
      </For>

      <Popover anchorRef={() => containerRef} open={isOpen()} onOpenChange={setIsOpen}>
        <PopoverTrigger
          as={(triggerProps: PopoverTriggerProps) => (
            <Button variant="outline" size="icon" {...triggerProps} class={cn('size-7 text-muted-foreground/30 hover:text-muted-foreground rounded-lg', props.triggerClass)}>
              <div class="i-tabler-plus size-4" />
            </Button>
          )}
        />
        <PopoverContent class="p-0">
          <Suspense>
            <TagPicker
              selectedTags={props.tags}
              onChange={handleTagsChange}
              organizationId={props.organizationId}
              isOpen={isOpen()}
            />
          </Suspense>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const DocumentTagsList: Component<{
  tags: Tag[];
  documentId: string;
  organizationId: string;
} & Pick<ComponentProps<typeof TagList>, 'tagClass' | 'asLink' | 'triggerClass'>> = (props) => {
  const [getDocumentsTags, setDocumentsTags] = createSignal<Tag[]>(props.tags);
  const [rest] = splitProps(props, ['tagClass', 'asLink', 'triggerClass']);

  const onTagsChange = async (tags: Tag[]) => {
    const currentTags = getDocumentsTags();
    const addedTags = tags.filter(tag => !currentTags.find(t => t.id === tag.id));
    const removedTags = currentTags.filter(tag => !tags.find(t => t.id === tag.id));

    // Optimistic update
    setDocumentsTags(tags);

    await Promise.all(
      addedTags.map(tag => addTagToDocument({
        documentId: props.documentId,
        organizationId: props.organizationId,
        tagId: tag.id,
      })),
    );

    await Promise.all(
      removedTags.map(tag => removeTagFromDocument({
        documentId: props.documentId,
        organizationId: props.organizationId,
        tagId: tag.id,
      })),
    );

    await queryClient.invalidateQueries({
      queryKey: ['organizations', props.organizationId, 'documents', props.documentId, 'tags'],
    });
  };

  return (
    <TagList
      tags={getDocumentsTags()}
      organizationId={props.organizationId}
      onChange={onTagsChange}
      {...rest}
    />
  );
};
