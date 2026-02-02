import type { Component, ComponentProps, ParentComponent } from 'solid-js';
import type { Tag } from '../tags.types';
import { splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';
import { Checkbox, CheckboxControl } from '@/modules/ui/components/checkbox';

export type TagPickerItemProps = {
  selected: boolean;
  highlighted: boolean;
} & ComponentProps<'li'>;

export const TagPickerItem: ParentComponent<TagPickerItemProps> = (props) => {
  const [local, rest] = splitProps(props, ['children', 'selected', 'highlighted']);

  return (
    <li
      class="px-1 cursor-pointer group"
      role="option"
      aria-selected={local.selected}
      {...rest}
    >
      <div class={cn(
        'flex items-center gap-2 rounded-md cursor-pointer transition-colors',
        local.highlighted ? 'bg-accent' : 'group-hover:bg-accent/50',
      )}
      >
        {local.children}
      </div>
    </li>
  );
};

export type TagPickerItemTagProps = {
  tag: Tag;
  selected: boolean;
  highlighted: boolean;
  onToggle: (selected: boolean) => void;
};

export const TagPickerItemTag: Component<TagPickerItemTagProps> = (props) => {
  const handleRowClick = () => props.onToggle(!props.selected);
  const handleCheckboxChange = (checked: boolean) => props.onToggle(checked);

  const handleCheckboxAreaClick = (e: MouseEvent) => {
    e.stopPropagation();
    props.onToggle(!props.selected);
  };

  return (
    <TagPickerItem
      selected={props.selected}
      highlighted={props.highlighted}
      onClick={handleRowClick}
    >
      <div
        class="flex items-center justify-center h-full pl-2 py-2"
        onClick={handleCheckboxAreaClick}
      >
        <Checkbox
          checked={props.selected}
          onChange={handleCheckboxChange}
          onClick={e => e.stopPropagation()}
        >
          <CheckboxControl class="border-transparent group-hover:border-border data-[checked]:(border-primary group-hover:border-primary)" />
        </Checkbox>
      </div>

      <div class="flex items-center gap-2 min-w-0">
        <span
          class="size-2 rounded-full flex-shrink-0"
          style={{ 'background-color': props.tag.color }}
        />
        <span class="text-sm truncate">{props.tag.name}</span>
      </div>
    </TagPickerItem>
  );
};

export const TagPickerItemCreateNewTag: Component<{
  highlighted: boolean;
  onClick: () => void;
  name?: string;
}> = (props) => {
  return (
    <TagPickerItem
      selected={false}
      highlighted={props.highlighted}
      onClick={props.onClick}
    >
      <div class="flex items-center gap-2 pl-2 py-2 text-muted-foreground">
        <div class="i-tabler-plus size-4" />
        <span class="text-sm">
          {props.name ? `Create new tag "${props.name}"` : 'Create new tag'}
        </span>
      </div>
    </TagPickerItem>
  );
};
