import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Button,
  EmptyState,
  FilterTabs,
  FormField,
  MetricCard,
  PageHeader,
  Panel,
  Progress,
  SearchSelect,
  TextInput,
  Badge,
  WorkspaceLayout,
} from '../index';

const meta = {
  title: 'Design system/Workspace',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const options = [
  {
    value: '1042',
    label: 'Müller Studio',
    meta: '#1042',
    description: 'Anna Müller · Wien · anna@example.test',
    keywords: ['+43 (660) 123-4567'],
  },
  ...Array.from({ length: 1000 }, (_, i) => ({
    value: String(2000 + i),
    label: `Studio ${String(i + 1).padStart(4, '0')}`,
    meta: `#${2000 + i}`,
    description: 'Berlin · studio@example.test',
  })),
];
function WorkspaceExample() {
  const [client, setClient] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  return (
    <WorkspaceLayout
      currentPath="/"
      nav={{
        Workspace: [
          { name: 'Overview', href: '/', icon: 'Home' },
          {
            name: 'Clients',
            href: '/clients',
            icon: 'Users',
          },
        ],
      }}
      onNavigate={() => {}}
      workspaceName="Agency management"
      workspaceDescription="Team workspace"
      brandSubtitle="Agency workspace"
      account={{
        name: 'Alex Morgan',
        email: 'alex@example.test',
      }}
    >
      <div className="space-y-6">
        <PageHeader
          title="Workspace components"
          subtitle="Shared across admin and model. One monochrome design system."
          actions={<Button icon="Plus">New project</Button>}
        />
        <div className="ui-stats-grid">
          <MetricCard
            label="Clients"
            value="1,001"
            description="In your directory"
            icon="Users"
          />
          <MetricCard
            label="Open projects"
            value="24"
            description="Ready for the next step"
            icon="Rows"
          />
          <MetricCard
            label="Profile completion"
            value="80%"
            description="One step left"
            icon="User"
          />
        </div>
        <FilterTabs
          label="Status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All', count: 24 },
            { value: 'open', label: 'Open', count: 12 },
          ]}
        />
        <Panel
          title="Create a project"
          description="Search supports names, identifiers and contact information."
          contentClassName="ui-form-grid"
        >
          <SearchSelect
            options={options}
            value={client}
            onChange={setClient}
            label="Client"
            placeholder="Search name, number, email…"
            hint="Try Müller, 1042, Anna or +436601234567."
            required
          />
          <FormField label="Project">
            <TextInput placeholder="Project name" />
          </FormField>
        </Panel>
        <Panel
          title="Progress"
          actions={
            <Badge tone="pending">In progress</Badge>
          }
        >
          <Progress value={80} label="Profile completion" />
        </Panel>
      </div>
    </WorkspaceLayout>
  );
}
export const Overview: Story = {
  render: () => <WorkspaceExample />,
};
export const Feedback: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <Panel title="Empty">
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          action={<Button>Create project</Button>}
        />
      </Panel>
      <Panel title="Loading">
        <EmptyState loading />
      </Panel>
      <Panel title="Unavailable">
        <SearchSelect
          options={[]}
          value={null}
          onChange={() => {}}
          label="Client"
          error="Clients could not be loaded. Please try again."
        />
      </Panel>
    </div>
  ),
};
