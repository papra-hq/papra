import type { Component } from 'solid-js';
import type { LocaleKeys } from '@/modules/i18n/locales.types';
import { createSignal, For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import { WEBHOOK_EVENTS } from '../webhooks.constants';

type WebhookEvent = typeof WEBHOOK_EVENTS[number]['events'][number];
type WebhookSection = typeof WEBHOOK_EVENTS[number];

export const WebhookEventsPicker: Component<{ events: WebhookEvent[]; onChange: (events: WebhookEvent[]) => void }> = (props) => {
  const [events, setEvents] = createSignal<WebhookEvent[]>(props.events);
  const { t } = useI18n();

  const getEventsSections = () => {
    return WEBHOOK_EVENTS.map((section: WebhookSection) => ({
      ...section,
      title: t(`webhooks.events.${section.section}.title` as LocaleKeys),
      events: section.events.map((event: WebhookEvent) => {
        const [prefix, suffix] = event.split(':');

        return {
          name: event,
          prefix,
          suffix,
          description: t(`webhooks.events.${section.section}.${event}.description`),
        };
      }),
    }));
  };

  const isEventSelected = (event: WebhookEvent) => {
    return events().includes(event);
  };

  const toggleEvent = (event: WebhookEvent) => {
    setEvents((prev) => {
      if (prev.includes(event)) {
        return prev.filter(e => e !== event);
      }

      return [...prev, event];
    });

    props.onChange(events());
  };

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <For each={getEventsSections()}>
        {section => (
          <div>
            <p class="text-muted-foreground text-xs">{section.title}</p>

            <div class="pl-4 flex flex-col gap-4 mt-4">
              <For each={section.events}>
                {event => (
                  <Checkbox
                    class="flex items-start gap-2"
                    checked={isEventSelected(event.name)}
                    onChange={() => toggleEvent(event.name)}
                  >
                    <CheckboxControl />
                    <div class="flex flex-col gap-1">
                      <CheckboxLabel class="text-sm leading-none">
                        <div class="font-semibold">{event.description}</div>
                        <div class="text-muted-foreground text-xs mt-1">{event.name}</div>
                      </CheckboxLabel>
                    </div>
                  </Checkbox>
                )}
              </For>
            </div>
          </div>
        )}
      </For>
    </div>
  );
};
