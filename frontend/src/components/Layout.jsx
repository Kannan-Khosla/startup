import TicketList from './TicketList';
import TicketThread from './TicketThread';
import NewTicketForm from './NewTicketForm';

export default function Layout() {
  return (
    <div className="grid grid-cols-[340px_1fr] min-h-screen bg-white">
      <aside className="border-r border-border bg-white p-8 shadow-lg min-w-[340px] animate-slide-up">
        <TicketList />
      </aside>
      <main className="flex flex-col p-8 gap-6 overflow-hidden bg-white">
        <div className="flex justify-between items-start animate-fade-in">
          <div className="space-y-1">
            <div className="font-bold text-3xl text-text tracking-tight mb-2 bg-gradient-to-r from-[#0f149a] to-[#ff6b35] bg-clip-text text-transparent">
              New ticket
            </div>
            <div className="text-muted text-sm font-light">Create or continue by context + subject</div>
          </div>
        </div>
        <div className="border border-border bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:shadow-[#ff6b35]/10 transition-all duration-300 animate-scale-in hover-lift">
          <NewTicketForm />
        </div>
        <section className="border border-border bg-white rounded-2xl overflow-hidden flex flex-col flex-1 min-h-0 shadow-lg animate-fade-in">
          <TicketThread />
        </section>
      </main>
    </div>
  );
}

