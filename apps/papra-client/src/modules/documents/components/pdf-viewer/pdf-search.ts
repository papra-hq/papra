import type { PDFSlick } from '@pdfslick/solid';
import { createSignal } from 'solid-js';

type SearchOptions = {
  caseSensitive: boolean;
  entireWord: boolean;
  highlightAll: boolean;
};

type MatchesCount = { current: number; total: number };
type FindControlStateEvent = {
  state: number;
  rawQuery: string | null;
  matchesCount: MatchesCount;
};

// PDF.js FindState values. Keep this adapter independent of PDF.js runtime imports.
const FIND_NOT_FOUND = 1;
const FIND_PENDING = 3;

export function createPdfSearch({
  eventBus,
}: {
  eventBus: Pick<PDFSlick['eventBus'], 'on' | 'off' | 'dispatch'>;
}) {
  const [query, setQuery] = createSignal('');
  const [options, setOptions] = createSignal<SearchOptions>({
    caseSensitive: false,
    entireWord: false,
    highlightAll: true,
  });
  const [status, setStatus] = createSignal<'idle' | 'pending' | 'found' | 'not-found'>('idle');
  const [matchesCount, setMatchesCount] = createSignal<MatchesCount>({ current: 0, total: 0 });

  const find = (type = '', findPrevious = false) => {
    // An empty type lets PDFFindController debounce typing; "again" navigates immediately.
    eventBus.dispatch('find', {
      source: eventBus,
      type,
      query: query(),
      ...options(),
      findPrevious,
      matchDiacritics: false,
    });
  };

  const updateControlState = (event: FindControlStateEvent) => {
    if (event.rawQuery !== query()) {
      return;
    }

    if (!query()) {
      setStatus('idle');
    } else if (event.state === FIND_PENDING) {
      setStatus('pending');
    } else if (event.state === FIND_NOT_FOUND) {
      setStatus('not-found');
    } else {
      setStatus('found');
    }

    setMatchesCount(event.state === FIND_PENDING ? { current: 0, total: 0 } : event.matchesCount);
  };

  const updateMatchesCount = ({ matchesCount }: { matchesCount: MatchesCount }) => {
    if (status() === 'found') {
      setMatchesCount(matchesCount);
    }
  };

  eventBus.on('updatefindcontrolstate', updateControlState);
  eventBus.on('updatefindmatchescount', updateMatchesCount);

  return {
    query,
    options,
    status,
    matchesCount,
    setQuery: (value: string) => {
      setQuery(value);
      find();
    },
    setOption: (option: keyof SearchOptions, value: boolean) => {
      setOptions((previous) => ({ ...previous, [option]: value }));
      const eventTypes = {
        caseSensitive: 'casesensitivitychange',
        entireWord: 'entirewordchange',
        highlightAll: 'highlightallchange',
      };
      find(eventTypes[option]);
    },
    open: () => {
      if (query()) {
        find('again');
      }
    },
    next: () => {
      find('again');
    },
    previous: () => {
      find('again', true);
    },
    close: () => {
      eventBus.dispatch('findbarclose', { source: eventBus });
    },
    dispose: () => {
      eventBus.off('updatefindcontrolstate', updateControlState);
      eventBus.off('updatefindmatchescount', updateMatchesCount);
      eventBus.dispatch('findbarclose', { source: eventBus });
    },
  };
}
