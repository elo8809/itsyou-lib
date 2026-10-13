import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ActionDialog,
  Button,
  ButtonSubmit,
  ConfirmButton,
  ConfirmDialog,
} from '../../dist';

window.calls = [];
window.completeAction = () => {};
window.failAction = () => {};
const run = (action) => {
  window.calls.push(action);
  return new Promise((resolve, reject) => {
    window.completeAction = resolve;
    window.failAction = reject;
  });
};
function Harness() {
  const [outer, setOuter] = useState(false);
  const [controlled, setControlled] = useState(null);
  return (
    <main>
      <ConfirmButton
        title="Email the invoice?"
        description="Sends invoice RE000123 to client@example.test."
        confirmLabel="Send email"
        run={() => run('email')}
      >
        Email invoice
      </ConfirmButton>
      <ConfirmButton
        title="Vertrag erstellen?"
        description="Wir erstellen deinen Vertrag als PDF."
        confirmLabel="Vertrag erstellen"
        locale="de"
        run={() => run('contract')}
      >
        Vertrag anfordern
      </ConfirmButton>
      <ConfirmButton
        title="Disabled action"
        confirmLabel="Confirm"
        disabled
        run={() => run('disabled')}
      >
        Disabled
      </ConfirmButton>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          window.calls.push('form-submit');
        }}
      >
        <ButtonSubmit
          action="Delete photo"
          type="submit"
          onClick={() => run('legacy')}
        >
          Delete
        </ButtonSubmit>
      </form>
      <Button onClick={() => setOuter(true)}>
        Edit document
      </Button>
      <ActionDialog
        open={outer}
        title="Document details"
        onClose={() => setOuter(false)}
        size="lg"
      >
        <input
          aria-label="Project"
          defaultValue="Autumn campaign"
        />
        <ConfirmButton
          title="Generate document?"
          confirmLabel="Generate PDF"
          run={() => run('nested')}
        >
          Create PDF
        </ConfirmButton>
      </ActionDialog>
      <Button
        onClick={() =>
          setControlled({
            title: 'Controlled action?',
            confirmLabel: 'Run action',
            run: () => run('controlled'),
          })
        }
      >
        Open controlled
      </Button>
      <ConfirmDialog
        config={controlled}
        onClose={() => setControlled(null)}
      />
    </main>
  );
}
createRoot(document.getElementById('root')).render(
  <Harness />,
);
