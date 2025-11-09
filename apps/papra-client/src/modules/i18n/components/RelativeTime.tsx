import type { Component, JSX } from 'solid-js';
import type { CoercibleDate } from '@/modules/shared/date/date.types';
import { splitProps } from 'solid-js';
import { coerceDate } from '@/modules/shared/date/coerce-date';
import { useI18n } from '../i18n.provider';

export const RelativeTime: Component<{ date: CoercibleDate } & JSX.IntrinsicElements['time']> = (props) => {
  const [local, rest] = splitProps(props, ['date', 'title', 'dateTime']);
  const { formatRelativeTime, formatDate } = useI18n();

  return (
    <time
      title={local.title ?? formatDate(local.date, { dateStyle: 'short', timeStyle: 'short' })}
      dateTime={local.dateTime ?? coerceDate(local.date).toISOString()}
      {...rest}
    >
      {formatRelativeTime(local.date)}
    </time>
  );
};
