import React, { useEffect, useState } from "react";
import {
  getQuerySourceLabel,
  replyToQuery,
  updateQueryStatus,
  type SupportQuery,
} from "@/api/query.api";
import { useToast } from "@/components/ui/toast";
import StatusBadge from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";

type QueryModalProps = {
  query: SupportQuery | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

function getQueryId(query: SupportQuery | null) {
  if (!query) return "";
  return String(query._id || query.id || "");
}

export default function QueryModal({ query, open, onClose, onUpdate }: QueryModalProps) {
  const { success, error } = useToast();
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && query) {
      setReply(query.adminReply || "");
    } else {
      setReply("");
    }
  }, [open, query]);

  if (!open || !query) return null;

  const handleMarkRead = async () => {
    setSaving(true);
    try {
      await updateQueryStatus(getQueryId(query), "Read");
      success("Marked as read.");
      onUpdate();
      onClose();
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleSendReply = async () => {
    const text = reply.trim();
    if (!text) {
      error("Please write a reply for the customer.");
      return;
    }

    setSaving(true);
    try {
      await replyToQuery(getQueryId(query), text);
      success("Reply sent. Customer can see it in their profile.");
      onUpdate();
      onClose();
    } catch (err: any) {
      error(err?.response?.data?.message || "Failed to send reply.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto text-gray-900">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold theme-heading">Customer Query</h2>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(query.createdAt).toLocaleString()} · {getQuerySourceLabel(query.source)}
              </p>
            </div>
            <StatusBadge status={query.status} type="query" />
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <p><strong>Name:</strong> {query.name || "—"}</p>
            <p><strong>Email:</strong> {query.email}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Subject</p>
            <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              {query.subject}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Customer Message</p>
            <p className="text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 whitespace-pre-wrap">
              {query.description}
            </p>
          </div>

          {query.adminReply && query.status === "Replied" && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Previous Reply</p>
              <div className="text-sm text-gray-900 bg-green-50 border border-green-200 rounded-lg px-4 py-3 whitespace-pre-wrap">
                {query.adminReply}
                {query.repliedAt && (
                  <p className="text-xs text-green-700 mt-2">
                    Replied by {query.repliedBy || "Admin"} on {new Date(query.repliedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Admin Reply
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Write your reply to the customer..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]"
            />
            <p className="text-xs text-gray-500 mt-2">
              This reply will appear in the customer&apos;s profile under Support.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
          {query.status === "Pending" && (
            <Button type="button" variant="outline" onClick={handleMarkRead} disabled={saving}>
              Mark as Read
            </Button>
          )}
          <Button type="button" className="theme-button text-white" onClick={handleSendReply} disabled={saving}>
            {saving ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
