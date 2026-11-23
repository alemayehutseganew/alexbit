"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

function isContactMessage(value: unknown): value is ContactMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "phone" in value &&
    typeof value.phone === "string" &&
    "subject" in value &&
    typeof value.subject === "string" &&
    "message" in value &&
    typeof value.message === "string" &&
    "status" in value &&
    typeof value.status === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string"
  );
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}

export function ContactMessagesClient({
  locale,
  accessToken,
}: {
  locale: string;
  accessToken: string;
}) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMessages() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!apiUrl) {
        setError("The API URL is not configured.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/contact/admin/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) {
          throw new Error(
            response.status === 401 || response.status === 403
              ? "You are not authorized to view contact messages."
              : "Unable to load contact messages.",
          );
        }

        const result: unknown = await response.json();
        if (!Array.isArray(result) || !result.every(isContactMessage)) {
          throw new Error("The server returned an invalid contact response.");
        }

        if (active) {
          setMessages(result);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load contact messages.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadMessages();
    return () => {
      active = false;
    };
  }, [accessToken]);

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Contact Messages
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review inquiries submitted through the public contact form.
        </p>
      </header>

      {isLoading ? (
        <div
          aria-label="Loading contact messages"
          className="space-y-4"
          role="status"
        >
          {[0, 1, 2].map((item) => (
            <Skeleton
              key={item}
              className="h-36 rounded-xl border border-slate-200 bg-white"
            />
          ))}
          <span className="sr-only">Loading contact messages</span>
        </div>
      ) : error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No contact messages yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {messages.map((message) => (
            <li
              key={message.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {message.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    <a
                      className="hover:text-brand-600"
                      href={`mailto:${message.email}`}
                    >
                      {message.email}
                    </a>
                    <span className="px-2 text-slate-300" aria-hidden="true">
                      |
                    </span>
                    <a
                      className="hover:text-brand-600"
                      href={`tel:${message.phone}`}
                    >
                      {message.phone}
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{message.status}</Badge>
                  <time
                    className="text-xs text-slate-500"
                    dateTime={message.createdAt}
                  >
                    {formatDate(message.createdAt, locale)}
                  </time>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-800">
                {message.subject}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {message.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
