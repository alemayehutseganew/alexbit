"use client";

import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { useState } from "react";

export default async function ClientSupportPage({
  params,
}: ({ params: Promise<{ locale: string }> }) => void) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [session] = await Promise.all([auth()]);
  const actualRole = session?.user?.role ?? session?.role;
  if (
    !["CLIENT", "CLIENT_ADMIN", "ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(
      actualRole ?? "",
    ) ||
    !session?.tenantId
  ) {
    redirect(`/${locale}/login?realm=client`);
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const accessToken = session.accessToken;
  if (!accessToken) {
    throw new Error("An API access token is not available in this session");
  }

  const [openTicket, setOpenTicket] = useState({
    subject: "",
    message: "",
    priority: "normal" as "low" | "normal" | "high",
  });
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`${apiUrl}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data as any[]);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${apiUrl}/api/support/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(openTicket),
      });
      setOpenTicket({ subject: "", message: "", priority: "normal" });
      loadTickets();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">
          Support Tickets
        </h2>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <input
                type="text"
                value={openTicket.subject}
                onChange={(e) =>
                  setOpenTicket((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Subject"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <textarea
                value={openTicket.message}
                onChange={(e) =>
                  setOpenTicket((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Message"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none min-h-20 resize-y"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <select
              value={openTicket.priority}
              onChange={(e) =>
                setOpenTicket((prev) => ({ ...prev, priority: e.target.value as any }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="normal" selected>Normal</option>
              <option value="high">High</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded border border-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-100 transition-colors"
          >
            Submit Ticket
          </button>
        </form>

        {loadingTickets ? (
          <p className="mt-4 text-sm text-slate-500">Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No tickets yet
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {tickets.map((ticket: any, index: number) => (
              <div
                key={ticket.id}
                className="px-4 py-3 rounded-lg border border-slate-200 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {ticket.subject}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {ticket.createdAt}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded">
                    {ticket.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 truncate">
                  {ticket.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};