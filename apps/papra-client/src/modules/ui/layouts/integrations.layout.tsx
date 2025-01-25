import type { ParentComponent } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { Button } from '../components/button';

export const IntegrationsLayout: ParentComponent = (props) => {
  const params = useParams();

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-5xl">
      <div class="border-b mb-6">
        <h1 class="text-xl font-bold ">
          Integrations
        </h1>

        <p class="text-muted-foreground mt-1">
          Manage your organization's integrations
        </p>

        <div class="flex gap-2 mt-4">
          <Button as={A} href={`/organizations/${params.organizationId}/intake-emails`} variant="ghost" activeClass="border-b border-primary text-foreground!" class="text-muted-foreground rounded-b-none">
            Intake Emails
          </Button>

          <Button as={A} href={`/organizations/${params.organizationId}/api-keys`} variant="ghost" activeClass="border-b border-primary text-foreground!" class="text-muted-foreground rounded-b-none">
            API Keys
          </Button>
        </div>
      </div>

      {props.children}
    </div>
  );
};
