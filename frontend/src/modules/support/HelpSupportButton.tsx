/**
 * "Help and Support" trigger button.
 *
 * Lives at the top level of any page that wants to expose support.
 * Opens the chat modal by flipping the Zustand UI store.
 */

import { Button } from '../../components/Button';
import { useSupportStore } from '../../store/support.store';

export function HelpSupportButton() {
  const open = useSupportStore((s) => s.open);

  return (
    <Button variant="primary" onClick={open}>
      Help and Support
    </Button>
  );
}
