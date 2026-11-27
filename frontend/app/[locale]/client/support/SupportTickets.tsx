"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type SupportTicket = {
  id?: string;
  subject: string;
  message: string;
  priority: "low" | "normal" | "high";
  createdAt?: string;
};

type SupportTicketsProps = {
  apiUrl: string;
  accessToken: string;
};

export function SupportTickets({ apiUrl, accessToken }: SupportTicketsProps) {
  const [openTicket, setOpenTicket] = useState<Omit<SupportTicket, "id">>({
    subject: "",
    message: "",
    priority: "normal",
  });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/client/support/tickets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (response.ok) {
        const data: unknown = await response.json();
        setTickets(Array.isArray(data) ? (data as SupportTicket[]) : []);
      }
    } catch {
      setError("Unable to load support tickets.");
    } finally {
      setLoadingTickets(false);
    }
  }, [accessToken, apiUrl]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/client/support/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openTicket),
      });
      if (!response.ok) {
        throw new Error("Unable to submit support ticket.");
      }
      setOpenTicket({ subject: "", message: "", priority: "normal" });
      await loadTickets();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit support ticket.",
      );
    }
  };

  return (
    <div className="min-h-screen p-6">
      <section className="premium-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">
          Support Tickets
        </h2>
        <form onSubmit={(event) => void handleSubmit(event)} className="mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              value={openTicket.subject}
              onChange={(event) =>
                setOpenTicket((ticket) => ({
                  ...ticket,
                  subject: event.target.value,
                }))
              }
              placeholder="Subject"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
            <textarea
              value={openTicket.message}
              onChange={(event) =>
                setOpenTicket((ticket) => ({
                  ...ticket,
                  message: event.target.value,
                }))
              }
              placeholder="Message"
              className="min-h-20 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600"
              required
            />
          </div>
          <select
            value={openTicket.priority}
            onChange={(event) =>
              setOpenTicket((ticket) => ({
                ...ticket,
                priority: event.target.value as SupportTicket["priority"],
              }))
            }
            className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600 md:w-48"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            className="mt-4 w-full rounded border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            Submit Ticket
          </button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {loadingTickets ? (
          <div
            role="status"
            aria-label="Loading support tickets"
            className="mt-6 space-y-3"
          >
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-24 rounded-xl" />
            ))}
            <span className="sr-only">Loading support tickets</span>
          </div>
        ) : tickets.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No tickets yet</p>
        ) : (
          <div className="mt-6 space-y-4">
            {tickets.map((ticket, index) => (
              <article
                key={ticket.id ?? `${ticket.subject}-${index}`}
                className="premium-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {ticket.subject}
                    </h3>
                    {ticket.createdAt && (
                      <p className="text-sm text-slate-500">
                        {ticket.createdAt}
                      </p>
                    )}
                  </div>
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium">
                    {ticket.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{ticket.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
