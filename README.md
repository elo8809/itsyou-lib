# IT’S YOU UI

The shared design system for admin and model. Import components from `@itsyouagency/ui`; keep data fetching, permissions, translations and business rules in the apps.

## Use in a workspace app

Set `"@itsyouagency/ui": "workspace:*"` in the app package. Build with `pnpm build-lib` from the workspace root, or run `pnpm --filter @itsyouagency/ui dev` alongside the app server to rebuild shared changes automatically.

Import these styles in the app entry, after app Tailwind styles:

```tsx
import '@itsyouagency/ui/dist/assets/css/fonts.css';
import '@itsyouagency/ui/dist/assets/css/design-system.css';
```

Use `@itsyouagency/ui/dist/tailwind.workspace.config` as a Tailwind preset and scan `./node_modules/@itsyouagency/ui/dist/**/*.{js,ts,jsx,tsx}`. Color, radius, spacing and typography tokens live in `src/assets/css/design-system.css`. The `ui-` namespace avoids app-specific CSS coupling. Components are monochrome; statuses use text, outlines and dots as well as shade.

## Components and responsibility

- `WorkspaceLayout`: responsive navigation, account menu, breadcrumbs, skip link and keyboard page search. Pass navigation, current path, account actions and localized labels. It does not fetch sessions or enforce authorization.
- `WorkspaceAuthLayout`: shared split-screen authentication frame with branding and form slots.
- `PageHeader`, `Panel`, `MetricCard`: page and content structure. `Panel` supports accessible collapsible sections.
- `Button`, `IconButton`, `Input`, `TextArea`, `TextInput`, `Select`, `FormField`, `FormCard`: form primitives. React Hook Form adapters belong in the consuming app.
- `SearchSelect`: searchable single selection with a controlled string identifier, ref forwarding, keyboard navigation, empty/loading/error states and a virtualized list. Supply `label`, `value`, `options` and `onChange`; `name` adds a hidden field with the selected ID. Display labels and secondary metadata separately. Extra `keywords` can include contact details and numbers. Search ignores accents, punctuation and phone formatting, and matches all entered terms. Use it for clients and long option lists; use `Select` for short, fixed choices.
- `SettingToggle`: accessible immediate-save settings with labels, descriptions and disabled/pending states.
- `ContactDetails`, `ContactPopover`, `CopyButton`: full contact details and clipboard feedback, with localized labels.
- `ActionDialog`, `FormActions`, `ChoiceChips`: modal actions, persistent form actions and accessible multiple-choice controls.
- `FilterTabs`, `Pagination`, `Badge`, `Progress`, `EmptyState`, `Skeleton`, `InlineNotice`, `WorkspaceLoading`: shared filtering and feedback. Filter buttons use `aria-pressed`, not tab semantics without associated panels.

```tsx
<SearchSelect
  label="Client"
  name="clientId"
  value={clientId}
  onChange={setClientId}
  options={[
    {
      value: 'client-id',
      label: 'Müller Studio',
      meta: '#1042',
      description: 'Anna · Wien',
      keywords: ['anna@example.test', '+43 660 1234567'],
    },
  ]}
/>
```

Admin's `ClientSelect` maps API data to these options. Both client-request and order creation use it. Admin and model also use `SearchSelect` for long country and profile option lists through their form adapters. UI never imports application hooks or domain models.

## Development

- `pnpm --filter @itsyouagency/ui build`: bundle and declarations, styles and Tailwind presets.
- `pnpm --filter @itsyouagency/ui test`: build, then run search, navigation, accessible output and pagination checks, including a 10,000-item directory.
- `pnpm --filter @itsyouagency/ui storybook`: inspect `Design system/Workspace`, including form and feedback examples.

React, Next and other runtime dependencies are external to the bundle so applications share their own router and context instances. Existing exports and the legacy `DashboardLayout` and Tailwind preset remain available for other consumers.

### Group chat

`ChatWorkspace` is the shared messaging screen used by all three portals. Pass
`apiBaseUrl`, `locale` (`en`/`de`), and `allowManagement` in the admin app.
Admin uses `grouping="client"`; client and model use `grouping="none"` (the default).
Admin client headers contain chat rows directly, with no request subgroups.
Client/model lists and embedded request chats are flat, ordered by activity.
Unlinked admin chats remain in General. Search includes project and client names. The API's
`viewer.canManage` must also be true before management controls appear. Optional
`selectedChatId`/`onSelectChat` props connect selection to the app router for
shareable URLs. Applications import the existing `design-system.css`; no extra
styles or runtime packages are needed.

The screen includes conversation search, unread filtering/counts, a responsive
message thread, participant details, paginated history, retained per-chat drafts,
retryable sends and staff-only group editing. New messages update automatically;
read markers advance only when the visible, focused thread is at the bottom.

`ChatCreatePage` opens the shared participant form on a separate page, using
`clientRequestId` to load models with signed request contracts, the client's portal users, and the
creating staff member. It keeps the request association and allows participant
review. Models without accounts and clients without portal access are called out.
`RequestChat` embeds the same conversation list, message history, and composer in
request details, scoped by `clientRequestId` and membership. With no accessible
chat it shows an empty state. Read markers require the latest messages to be in
view, including when the embedded chat starts below the request brief.

Browser checks use mocked sessions and chat endpoints against running local
admin/client/model apps, without changing real accounts or chats:

```sh
node tests/chat.browser.cjs
```

Set `CHAT_ADMIN_URL`, `CHAT_CLIENT_URL`, `CHAT_MODEL_URL`, or `CHAT_SCREENSHOTS` to override the local
app addresses and screenshot directory. The browser check uses installed Chrome.
