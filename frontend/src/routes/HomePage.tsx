/**
 * Home page.
 *
 * Demo surface for the support feature. In a real app this would be
 * any page that needs help — the components are designed to be
 * dropped in anywhere.
 */

import { HelpSupportButton } from '../modules/support/HelpSupportButton';
import { SupportChatModal } from '../modules/support/SupportChatModal';
import './HomePage.css';

export function HomePage() {
  return (
    <main className="home">
      <header className="home__header">
        <h1>Support App</h1>
        <p>Production-grade full-stack scaffold demo</p>
      </header>

      <section className="home__cta">
        <HelpSupportButton />
      </section>

      <SupportChatModal />
    </main>
  );
}
