import { Calendar } from 'lucide-react';

export default function Schedule() {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="sticky top-0 bg-[#09090B]/80 backdrop-blur-md z-40 flex items-center px-8 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-cabinet text-xl font-bold text-zinc-50 tracking-tight">Schedule</h2>
        </div>
      </header>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="py-20 text-center border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.01)]">
          <Calendar className="w-10 h-10 text-muted-steel mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-zinc-50 mb-1">Schedule Coming Soon</h3>
          <p className="text-muted-steel text-sm">Plan and schedule your content across platforms.</p>
        </div>
      </div>
    </div>
  );
}
