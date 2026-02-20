import { createSignal } from 'solid-js';

export const [launchedFiles, setLaunchedFiles] = createSignal<File[]>([]);
