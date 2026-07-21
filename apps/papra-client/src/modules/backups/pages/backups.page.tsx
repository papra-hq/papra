import type { Component } from 'solid-js';
import type { BackupDestination, BackupDriverName, BackupRun } from '../backups.types';
import { safely } from '@corentinth/chisels';
import { useParams, useSearchParams } from '@solidjs/router';
import { useQuery, useQueryClient } from '@tanstack/solid-query';
import { createMemo, createSignal, For, Show, onCleanup } from 'solid-js';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { useConfirmModal } from '@/modules/shared/confirm';
import { downloadFile } from '@/modules/shared/files/download';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { Badge } from '@/modules/ui/components/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/modules/ui/components/dialog';
import { EmptyState } from '@/modules/ui/components/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/ui/components/select';
import { createToast } from '@/modules/ui/components/sonner';
import { Switch, SwitchControl, SwitchThumb } from '@/modules/ui/components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/ui/components/table';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import {
  createBackupDestination,
  deleteBackupDestination,
  deleteBackupRun,
  fetchBackupCopy,
  fetchBackupDrivers,
  listBackupDestinations,
  listBackupRuns,
  listRemoteBackupFiles,
  renameBackupDestination,
  restoreBackupRun,
  restoreFromRemoteFile,
  restoreFromUploadedFile,
  runBackupNow,
  startGoogleDriveConnect,
  testBackupDestinationConnection,
  updateBackupSchedule,
  verifyBackupRun,
} from '../backups.services';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DRIVER_LABELS: Record<BackupDriverName, string> = {
  google_drive: 'Google Drive',
  webdav: 'WebDAV',
  ftp: 'FTP',
  local: 'Local folder',
};

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

const STATUS_VARIANT: Record<BackupRun['status'], 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  uploading: 'secondary',
  succeeded: 'default',
  failed: 'destructive',
};

export const BackupsSettingsPage: Component = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { getErrorMessage } = useI18nApiErrors();
  const { confirm } = useConfirmModal();

  const organizationId = () => params.organizationId!;

  const driversQuery = useQuery(() => ({
    queryKey: ['backups', 'drivers'],
    queryFn: () => fetchBackupDrivers(),
  }));

  const destinationsQuery = useQuery(() => ({
    queryKey: ['organizations', organizationId(), 'backups', 'destinations'],
    queryFn: () => listBackupDestinations({ organizationId: organizationId() }),
  }));

  const invalidateDestinations = () =>
    queryClient.invalidateQueries({
      queryKey: ['organizations', organizationId(), 'backups', 'destinations'],
    });

  const [isAddDialogOpen, setIsAddDialogOpen] = createSignal(Boolean(searchParams.connected));

  return (
    <div class="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">Backups</h2>
          <p class="text-sm text-muted-foreground">
            Automatically back up your documents to Google Drive, WebDAV, or FTP.
          </p>
        </div>

        <Show when={driversQuery.data?.isConfigured === false}>
          <Badge variant="destructive">Not configured on the server (BACKUPS_KEK unset)</Badge>
        </Show>

        <Show when={driversQuery.data?.isConfigured}>
          <div class="flex gap-2">
            <DownloadBackupCopyButton organizationId={organizationId()} />
            <RecoverFromFileDialog organizationId={organizationId()} />
            <AddDestinationDialog
              organizationId={organizationId()}
              isOpen={isAddDialogOpen()}
              setIsOpen={setIsAddDialogOpen}
              drivers={driversQuery.data?.drivers ?? []}
              onCreated={invalidateDestinations}
            />
          </div>
        </Show>
      </div>

      <Show
        when={destinationsQuery.data?.destinations.length}
        fallback={
          <EmptyState
            icon="i-tabler-cloud-upload"
            title="No backup destinations yet"
            description="Add a destination to start backing up your documents."
          />
        }
      >
        <For each={destinationsQuery.data?.destinations}>
          {(destination) => (
            <DestinationCard
              organizationId={organizationId()}
              destination={destination}
              onChanged={invalidateDestinations}
              confirm={confirm}
              getErrorMessage={getErrorMessage}
            />
          )}
        </For>
      </Show>
    </div>
  );
};

// No destination, no credentials, no connection to anything — you already have
// the backup file (copied off your phone, an SD card, wherever it ended up)
// and just upload it directly. Only needs BACKUPS_KEK to be set on the server.
// One-off manual export straight to your device — no destination, nothing
// persisted, not tracked in run history. Complements "Recover from a file...":
// this is how you'd actually get a file to feed into that later.
const DownloadBackupCopyButton: Component<{ organizationId: string }> = (props) => {
  const { getErrorMessage } = useI18nApiErrors();
  const [isDownloading, setIsDownloading] = createSignal(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    const [blob, error] = await safely(fetchBackupCopy({ organizationId: props.organizationId }));
    setIsDownloading(false);
    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }
    const fileName = `papra-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.papra-backup`;
    const url = URL.createObjectURL(blob);
    downloadFile({ url, fileName });
    URL.revokeObjectURL(url);
    createToast({ type: 'success', message: 'Backup downloaded' });
  };

  return (
    <Button variant="outline" disabled={isDownloading()} onClick={handleDownload}>
      {isDownloading() ? 'Preparing…' : 'Download a backup copy'}
    </Button>
  );
};

const RecoverFromFileDialog: Component<{ organizationId: string }> = (props) => {
  const { getErrorMessage } = useI18nApiErrors();
  const { confirm } = useConfirmModal();
  const [isOpen, setIsOpen] = createSignal(false);
  const [file, setFile] = createSignal<File | null>(null);
  const [isRestoring, setIsRestoring] = createSignal(false);

  const handleRestore = async () => {
    const selectedFile = file();
    if (!selectedFile) return;

    const isConfirmed = await confirm({
      title: 'Restore this backup file?',
      message:
        'Documents will be re-imported. Documents that already exist (by content hash) are skipped or untrashed.',
    });
    if (!isConfirmed) return;

    setIsRestoring(true);
    const [result, error] = await safely(
      restoreFromUploadedFile({ organizationId: props.organizationId, file: selectedFile }),
    );
    setIsRestoring(false);
    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }
    createToast({
      type: 'success',
      message:
        `Restored ${result.restoredDocumentsCount}/${result.totalDocumentsCount} documents` +
        (result.untrashedDocumentsCount ? ` (${result.untrashedDocumentsCount} untrashed)` : '') +
        (result.skippedDuplicatesCount
          ? ` (${result.skippedDuplicatesCount} already present)`
          : ''),
    });
    setIsOpen(false);
    setFile(null);
  };

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={Button} variant="outline">
        Recover from a file…
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recover from a backup file</DialogTitle>
        </DialogHeader>

        <p class="text-sm text-muted-foreground">
          Already have a backup file (a <code>.papra-backup</code> you copied off your phone, an SD
          card, wherever)? Upload it directly — no destination, no credentials, no connection
          needed.
        </p>

        <input
          type="file"
          accept=".papra-backup"
          class="text-sm file:mr-3 file:rounded file:border file:px-3 file:py-1.5 file:text-sm file:bg-secondary"
          onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
        />

        <DialogFooter>
          <Button disabled={!file() || isRestoring()} onClick={handleRestore}>
            {isRestoring() ? 'Restoring…' : 'Restore'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AddDestinationDialog: Component<{
  organizationId: string;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  drivers: { name: BackupDriverName; isConfigured: boolean }[];
  onCreated: () => void;
}> = (props) => {
  const { getErrorMessage } = useI18nApiErrors();
  const [driver, setDriver] = createSignal<BackupDriverName>('webdav');
  const [displayName, setDisplayName] = createSignal('');
  const [preset, setPreset] = createSignal<'generic' | 'nextcloud'>('generic');
  const [baseUrl, setBaseUrl] = createSignal('');
  const [host, setHost] = createSignal('');
  const [port, setPort] = createSignal('21');
  const [isFtpsEnabled, setIsFtpsEnabled] = createSignal(false);
  const [username, setUsername] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [localPath, setLocalPath] = createSignal('');
  const [isTesting, setIsTesting] = createSignal(false);
  const [isSubmitting, setIsSubmitting] = createSignal(false);

  const isGoogleDrive = createMemo(() => driver() === 'google_drive');
  const isWebdav = createMemo(() => driver() === 'webdav');
  const isFtp = createMemo(() => driver() === 'ftp');
  const isLocal = createMemo(() => driver() === 'local');

  const buildCredentialsAndSettings = (): {
    credentials: Record<string, string>;
    settings: Record<string, unknown>;
  } => {
    if (isWebdav()) {
      return {
        credentials: { username: username(), password: password() },
        settings: { baseUrl: baseUrl(), preset: preset() },
      };
    }
    if (isFtp()) {
      return {
        credentials: { username: username(), password: password() },
        settings: { host: host(), port: Number(port()) || 21, secure: isFtpsEnabled() },
      };
    }
    if (isLocal()) {
      return { credentials: {}, settings: { path: localPath() } };
    }
    return { credentials: {}, settings: {} };
  };

  const handleConnectGoogleDrive = async () => {
    setIsSubmitting(true);
    const [result, error] = await safely(
      startGoogleDriveConnect({
        organizationId: props.organizationId,
        displayName: displayName() || 'Google Drive',
      }),
    );
    setIsSubmitting(false);
    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }
    window.location.href = result.authorizationUrl;
  };

  const handleTestConnection = async () => {
    const { credentials, settings } = buildCredentialsAndSettings();
    setIsTesting(true);
    const [result, error] = await safely(
      testBackupDestinationConnection({
        organizationId: props.organizationId,
        driver: driver(),
        credentials,
        settings,
      }),
    );
    setIsTesting(false);
    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }
    createToast({
      type: 'success',
      message: `Connected${result.accountLabel ? ` as ${result.accountLabel}` : ''}`,
    });
  };

  const handleCreate = async () => {
    const { credentials, settings } = buildCredentialsAndSettings();
    setIsSubmitting(true);
    const [, error] = await safely(
      createBackupDestination({
        organizationId: props.organizationId,
        driver: driver(),
        displayName: displayName() || DRIVER_LABELS[driver()],
        credentials,
        settings,
      }),
    );
    setIsSubmitting(false);
    if (error) {
      createToast({ type: 'error', message: getErrorMessage({ error }) });
      return;
    }
    createToast({ type: 'success', message: 'Backup destination added' });
    props.setIsOpen(false);
    props.onCreated();
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={props.setIsOpen}>
      <DialogTrigger as={Button}>Add destination</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a backup destination</DialogTitle>
        </DialogHeader>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium">Destination type</span>
            <Select
              options={['google_drive', 'webdav', 'ftp', 'local'] as BackupDriverName[]}
              value={driver()}
              onChange={(v) => v && setDriver(v)}
              itemComponent={(itemProps) => (
                <SelectItem item={itemProps.item}>
                  {DRIVER_LABELS[itemProps.item.rawValue]}
                </SelectItem>
              )}
            >
              <SelectTrigger>
                <SelectValue<BackupDriverName>>
                  {(state) => DRIVER_LABELS[state.selectedOption()]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>
          </div>

          <TextFieldRoot value={displayName()} onChange={setDisplayName}>
            <TextFieldLabel>Name</TextFieldLabel>
            <TextField placeholder={DRIVER_LABELS[driver()]} />
          </TextFieldRoot>

          <Show when={isGoogleDrive()}>
            <p class="text-sm text-muted-foreground">
              You'll be redirected to Google to grant Papra access to a dedicated folder in your
              Drive.
            </p>
          </Show>

          <Show when={isWebdav()}>
            <div class="flex flex-col gap-1.5">
              <span class="text-sm font-medium">Preset</span>
              <Select
                options={['generic', 'nextcloud'] as const}
                value={preset()}
                onChange={(v) => v && setPreset(v)}
                itemComponent={(itemProps) => (
                  <SelectItem item={itemProps.item}>
                    {itemProps.item.rawValue === 'nextcloud' ? 'Nextcloud' : 'Generic WebDAV'}
                  </SelectItem>
                )}
              >
                <SelectTrigger>
                  <SelectValue<'generic' | 'nextcloud'>>
                    {(state) =>
                      state.selectedOption() === 'nextcloud' ? 'Nextcloud' : 'Generic WebDAV'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
            <TextFieldRoot value={baseUrl()} onChange={setBaseUrl}>
              <TextFieldLabel>Server URL</TextFieldLabel>
              <TextField
                placeholder={
                  preset() === 'nextcloud'
                    ? 'https://cloud.example.com'
                    : 'https://dav.example.com/remote.php/dav'
                }
              />
            </TextFieldRoot>
            <TextFieldRoot value={username()} onChange={setUsername}>
              <TextFieldLabel>Username</TextFieldLabel>
              <TextField />
            </TextFieldRoot>
            <TextFieldRoot value={password()} onChange={setPassword}>
              <TextFieldLabel>Password / app password</TextFieldLabel>
              <TextField type="password" />
            </TextFieldRoot>
          </Show>

          <Show when={isFtp()}>
            <div class="flex gap-3">
              <TextFieldRoot class="flex-1" value={host()} onChange={setHost}>
                <TextFieldLabel>Host</TextFieldLabel>
                <TextField placeholder="192.168.1.33 or ftp.example.com" />
              </TextFieldRoot>
              <TextFieldRoot class="w-24" value={port()} onChange={setPort}>
                <TextFieldLabel>Port</TextFieldLabel>
                <TextField type="number" placeholder="21" />
              </TextFieldRoot>
            </div>
            <TextFieldRoot value={username()} onChange={setUsername}>
              <TextFieldLabel>Username</TextFieldLabel>
              <TextField />
            </TextFieldRoot>
            <TextFieldRoot value={password()} onChange={setPassword}>
              <TextFieldLabel>Password</TextFieldLabel>
              <TextField type="password" />
            </TextFieldRoot>
            <Switch
              class="flex items-center gap-3"
              checked={isFtpsEnabled()}
              onChange={setIsFtpsEnabled}
            >
              <SwitchControl>
                <SwitchThumb />
              </SwitchControl>
              <span class="text-sm">Use FTPS (TLS)</span>
            </Switch>
            <p class="text-xs text-muted-foreground -mt-2">
              Leave off for a plain local-network FTP server (e.g. on your own LAN). Turn on only if
              your FTP server actually supports explicit TLS — most home/self-hosted FTP servers
              don't.
            </p>
          </Show>

          <Show when={isLocal()}>
            <TextFieldRoot value={localPath()} onChange={setLocalPath}>
              <TextFieldLabel>Folder path</TextFieldLabel>
              <TextField placeholder="/storage/emulated/0/papra-backups" />
            </TextFieldRoot>
            <p class="text-xs text-muted-foreground -mt-2">
              A path on the server's own filesystem — created automatically if it doesn't exist.
              Useful for backing up to a second mount (e.g. an SD card) or a folder something else
              already syncs (Syncthing, rclone, etc). No credentials needed.
            </p>
          </Show>
        </div>

        <DialogFooter>
          <Show when={!isGoogleDrive()}>
            <Button variant="outline" disabled={isTesting()} onClick={handleTestConnection}>
              {isTesting() ? 'Testing…' : 'Test connection'}
            </Button>
          </Show>
          <Button
            disabled={isSubmitting()}
            onClick={isGoogleDrive() ? handleConnectGoogleDrive : handleCreate}
          >
            {isGoogleDrive() ? 'Continue with Google' : 'Add destination'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DestinationCard: Component<{
  organizationId: string;
  destination: BackupDestination;
  onChanged: () => void;
  confirm: ReturnType<typeof useConfirmModal>['confirm'];
  getErrorMessage: ReturnType<typeof useI18nApiErrors>['getErrorMessage'];
}> = (props) => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = createSignal(false);
  const [pollingInterval, setPollingInterval] = createSignal<ReturnType<typeof setInterval> | null>(
    null,
  );

  const runsQuery = useQuery(() => ({
    queryKey: [
      'organizations',
      props.organizationId,
      'backups',
      'destinations',
      props.destination.id,
      'runs',
    ],
    queryFn: () =>
      listBackupRuns({ organizationId: props.organizationId, destinationId: props.destination.id }),
  }));

  const invalidateRuns = () =>
    queryClient.invalidateQueries({
      queryKey: [
        'organizations',
        props.organizationId,
        'backups',
        'destinations',
        props.destination.id,
        'runs',
      ],
    });

  const refetchRuns = () =>
    queryClient.refetchQueries({
      queryKey: [
        'organizations',
        props.organizationId,
        'backups',
        'destinations',
        props.destination.id,
        'runs',
      ],
    });

  // Clean up polling interval when component unmounts
  onCleanup(() => {
    const interval = pollingInterval();
    if (interval) {
      clearInterval(interval);
    }
  });

  const [days, setDays] = createSignal(new Set(props.destination.schedule.days));
  const [hour, setHour] = createSignal(props.destination.schedule.hour ?? 3);
  const [minute, setMinute] = createSignal(props.destination.schedule.minute ?? 0);
  const [isScheduleEnabled, setIsScheduleEnabled] = createSignal(
    props.destination.schedule.isEnabled,
  );

  const toggleDay = (day: number) => {
    const next = new Set(days());
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setDays(next);
  };

  const saveSchedule = async (overrides: Partial<{ isEnabled: boolean }> = {}) => {
    const [, error] = await safely(
      updateBackupSchedule({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
        schedule: {
          isEnabled: overrides.isEnabled ?? isScheduleEnabled(),
          days: [...days()],
          hour: hour(),
          minute: minute(),
        },
      }),
    );
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    createToast({ type: 'success', message: 'Schedule saved' });
    props.onChanged();
  };

  const hasPendingOrUploadingRuns = () => {
    const runs = runsQuery.data?.runs ?? [];
    return runs.some((run) => run.status === 'pending' || run.status === 'uploading');
  };

  const handleRunNow = async () => {
    // Clear any existing polling interval
    const existingInterval = pollingInterval();
    if (existingInterval) {
      clearInterval(existingInterval);
      setPollingInterval(null);
    }

    setIsRunning(true);
    const [, error] = await safely(
      runBackupNow({ organizationId: props.organizationId, destinationId: props.destination.id }),
    );
    setIsRunning(false);
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    createToast({ type: 'success', message: 'Backup started' });

    // Immediately refetch to show the pending run
    await refetchRuns();

    // Start polling to update status until backup completes
    const interval = setInterval(() => {
      refetchRuns().then(() => {
        // Stop polling when there are no more pending or uploading runs
        if (!hasPendingOrUploadingRuns()) {
          clearInterval(interval);
          setPollingInterval(null);
        }
      });
    }, 2000);
    setPollingInterval(interval);

    // Clear polling after a reasonable time (e.g., 5 minutes) as a fallback
    setTimeout(
      () => {
        if (pollingInterval() === interval) {
          clearInterval(interval);
          setPollingInterval(null);
        }
      },
      5 * 60 * 1000,
    );
  };

  const handleDeleteDestination = async () => {
    const isConfirmed = await props.confirm({
      title: 'Remove this destination?',
      message: 'Existing backups on the remote destination will need to be deleted manually.',
    });
    if (!isConfirmed) return;
    const [, error] = await safely(
      deleteBackupDestination({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
      }),
    );
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    props.onChanged();
  };

  const handleDeleteRun = async (run: BackupRun) => {
    const isConfirmed = await props.confirm({
      title: 'Delete this backup?',
      message: 'This also removes the file from the remote destination.',
    });
    if (!isConfirmed) return;
    const [, error] = await safely(
      deleteBackupRun({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
        runId: run.id,
      }),
    );
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    invalidateRuns();
  };

  const [verifyingRunId, setVerifyingRunId] = createSignal<string | null>(null);

  const handleVerifyRun = async (run: BackupRun) => {
    setVerifyingRunId(run.id);
    const [result, error] = await safely(
      verifyBackupRun({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
        runId: run.id,
      }),
    );
    setVerifyingRunId(null);
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }

    if (result.valid) {
      createToast({
        type: 'success',
        message: `Backup verified: ${result.validDocuments}/${result.totalDocuments} documents intact`,
      });
    } else {
      createToast({
        type: 'error',
        message: `Backup verification failed: ${result.invalidDocuments} of ${result.totalDocuments} documents have integrity issues`,
      });
    }
  };

  const handleRestoreRun = async (run: BackupRun) => {
    const isConfirmed = await props.confirm({
      title: 'Restore this backup?',
      message:
        'Documents from this backup will be re-imported. Documents that already exist (by content hash) are skipped.',
    });
    if (!isConfirmed) return;
    const [result, error] = await safely(
      restoreBackupRun({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
        runId: run.id,
      }),
    );
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    createToast({
      type: 'success',
      message:
        `Restored ${result.restoredDocumentsCount}/${result.totalDocumentsCount} documents` +
        (result.untrashedDocumentsCount ? ` (${result.untrashedDocumentsCount} untrashed)` : '') +
        (result.skippedDuplicatesCount
          ? ` (${result.skippedDuplicatesCount} already present)`
          : ''),
    });
  };

  return (
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{props.destination.displayName}</CardTitle>
          <p class="text-sm text-muted-foreground">
            {DRIVER_LABELS[props.destination.driver]}
            {props.destination.accountLabel ? ` · ${props.destination.accountLabel}` : ''}
          </p>
        </div>
        <div class="flex gap-2">
          <RecoverFromDestinationDialog
            organizationId={props.organizationId}
            destination={props.destination}
            getErrorMessage={props.getErrorMessage}
            confirm={props.confirm}
            onRestored={invalidateRuns}
          />
          <Button
            size="sm"
            onClick={handleRunNow}
            disabled={isRunning() || hasPendingOrUploadingRuns()}
          >
            {isRunning() ? 'Running...' : 'Run now'}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDeleteDestination}>
            Remove
          </Button>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Switch
            class="flex items-center gap-3"
            checked={isScheduleEnabled()}
            onChange={(checked) => {
              setIsScheduleEnabled(checked);
              saveSchedule({ isEnabled: checked });
            }}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
            <span class="text-sm font-medium">Automatic backups</span>
          </Switch>

          <Show when={isScheduleEnabled()}>
            <div class="flex flex-wrap items-center gap-2 pl-2">
              <For each={DAY_LABELS}>
                {(label, index) => (
                  <button
                    type="button"
                    class={`text-xs px-2 py-1 rounded border ${days().has(index()) ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}
                    onClick={() => {
                      toggleDay(index());
                      saveSchedule();
                    }}
                  >
                    {label}
                  </button>
                )}
              </For>
              <TextFieldRoot
                class="w-16"
                value={String(hour())}
                onChange={(v) => {
                  setHour(Math.min(23, Math.max(0, Number(v) || 0)));
                  saveSchedule();
                }}
              >
                <TextField type="number" min={0} max={23} />
              </TextFieldRoot>
              <span>:</span>
              <TextFieldRoot
                class="w-16"
                value={String(minute()).padStart(2, '0')}
                onChange={(v) => {
                  setMinute(Math.min(59, Math.max(0, Number(v) || 0)));
                  saveSchedule();
                }}
              >
                <TextField type="number" min={0} max={59} />
              </TextFieldRoot>
              <span class="text-xs text-muted-foreground">
                server time, no days selected = every day
              </span>
            </div>
          </Show>

          <Show when={props.destination.nextScheduledAt}>
            <p class="text-xs text-muted-foreground pl-2">
              Next run: {props.destination.nextScheduledAt?.toLocaleString()}
            </p>
          </Show>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Size</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={runsQuery.data?.runs}>
              {(run) => (
                <TableRow>
                  <TableCell>{run.createdAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[run.status]}>{run.status}</Badge>
                    <Show when={run.status === 'failed' && run.errorMessage}>
                      <p class="text-xs text-destructive mt-1">{run.errorMessage}</p>
                    </Show>
                  </TableCell>
                  <TableCell>{run.documentsCount ?? '—'}</TableCell>
                  <TableCell>{formatBytes(run.totalSizeBytes)}</TableCell>
                  <TableCell class="flex gap-2 justify-end">
                    <Show when={run.status === 'succeeded'}>
                      <Button size="sm" variant="outline" onClick={() => handleRestoreRun(run)}>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyRun(run)}
                        disabled={verifyingRunId() === run.id}
                      >
                        {verifyingRunId() === run.id ? 'Verifying...' : 'Verify'}
                      </Button>
                    </Show>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRun(run)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>

        <Show when={runsQuery.data?.runs.length === 0}>
          <p class="text-sm text-muted-foreground">No backups yet.</p>
        </Show>
      </CardContent>
    </Card>
  );
};

// Lists whatever backup files actually exist on the destination right now —
// straight from the driver, not from local run history. This is what makes
// restore possible on a fresh install: local history is empty, but the
// destination (once reconnected with the same credentials) still has the files.
const RecoverFromDestinationDialog: Component<{
  organizationId: string;
  destination: BackupDestination;
  getErrorMessage: ReturnType<typeof useI18nApiErrors>['getErrorMessage'];
  confirm: ReturnType<typeof useConfirmModal>['confirm'];
  onRestored: () => void;
}> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [isRestoring, setIsRestoring] = createSignal<string | null>(null);

  const remoteFilesQuery = useQuery(() => ({
    queryKey: [
      'organizations',
      props.organizationId,
      'backups',
      'destinations',
      props.destination.id,
      'remote-files',
    ],
    queryFn: () =>
      listRemoteBackupFiles({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
      }),
    enabled: isOpen(),
  }));

  const handleRestore = async (remoteFileId: string) => {
    const isConfirmed = await props.confirm({
      title: 'Restore this backup?',
      message:
        'Documents will be re-imported. Documents that already exist (by content hash) are skipped or untrashed.',
    });
    if (!isConfirmed) return;

    setIsRestoring(remoteFileId);
    const [result, error] = await safely(
      restoreFromRemoteFile({
        organizationId: props.organizationId,
        destinationId: props.destination.id,
        remoteFileId,
      }),
    );
    setIsRestoring(null);
    if (error) {
      createToast({ type: 'error', message: props.getErrorMessage({ error }) });
      return;
    }
    createToast({
      type: 'success',
      message:
        `Restored ${result.restoredDocumentsCount}/${result.totalDocumentsCount} documents` +
        (result.untrashedDocumentsCount ? ` (${result.untrashedDocumentsCount} untrashed)` : '') +
        (result.skippedDuplicatesCount
          ? ` (${result.skippedDuplicatesCount} already present)`
          : ''),
    });
    props.onRestored();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen()} onOpenChange={setIsOpen}>
      <DialogTrigger as={Button} size="sm" variant="outline">
        Recover…
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Backups found on this destination</DialogTitle>
        </DialogHeader>

        <p class="text-sm text-muted-foreground">
          This lists files actually sitting on {props.destination.displayName} right now, regardless
          of what this install remembers locally — use this after a fresh install to pull an
          existing backup back in.
        </p>

        <Show
          when={!remoteFilesQuery.isLoading}
          fallback={<p class="text-sm text-muted-foreground">Loading…</p>}
        >
          <Show
            when={remoteFilesQuery.data?.files.length}
            fallback={
              <p class="text-sm text-muted-foreground">
                No backup files found on this destination.
              </p>
            }
          >
            <div class="flex flex-col gap-2 max-h-80 overflow-auto">
              <For each={remoteFilesQuery.data?.files}>
                {(file) => (
                  <div class="flex items-center justify-between gap-3 border rounded p-2">
                    <div class="min-w-0">
                      <p class="text-sm truncate">{file.name}</p>
                      <p class="text-xs text-muted-foreground">
                        {formatBytes(file.size ?? null)}
                        {file.modifiedAt ? ` · ${new Date(file.modifiedAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={isRestoring() !== null}
                      onClick={() => handleRestore(file.remoteFileId)}
                    >
                      {isRestoring() === file.remoteFileId ? 'Restoring…' : 'Restore'}
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </DialogContent>
    </Dialog>
  );
};
