"use client";
import { useState } from "react";
import { motion } from "@/lib/motion";
import {
  X,
  SpinnerGap,
  CheckCircle,
  XCircle,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { CampaignModalProps, CampaignType } from "./types";

const campaignInfo: Record<CampaignType, { title: string; description: string; defaultSubject: string }> = {
  "win-back": {
    title: "Win-Back Campaign",
    description: "Send a special offer to bring dormant customers back",
    defaultSubject: "We miss you! Here's 20% off your next order",
  },
  "vip-exclusive": {
    title: "VIP Exclusive Access",
    description: "Give VIP customers early access to new collections",
    defaultSubject: "VIP Early Access: New Collection Drops Tomorrow",
  },
  "cart-abandonment": {
    title: "Cart Abandonment Recovery",
    description: "Remind customers about their abandoned carts",
    defaultSubject: "Did you forget something? Your cart is waiting",
  },
  "re-engagement": {
    title: "Re-Engagement Campaign",
    description: "Reconnect with customers who haven't purchased recently",
    defaultSubject: "A lot has changed since you've been away",
  },
  "custom": {
    title: "Custom Campaign",
    description: "Send a custom message to selected customers",
    defaultSubject: "",
  },
};

export function CampaignModal({ isOpen, onClose, type, recipients, onSend }: CampaignModalProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      await onSend(type, recipients.map(r => r.email));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-950/50 z-50 flex items-center justify-center p-4"
      role="presentation"
    ><button type="button" aria-label="Close" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight">{campaignInfo[type].title}</h2>
              <p className="text-sm text-gray-500 mt-1">{campaignInfo[type].description}</p>
            </div>
            <button aria-label="x" type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {sent ? (
            <div className="text-center py-8">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="size-8 text-green-600" weight="fill" />
              </div>
              <h3 className="text-lg font-medium mb-2">Campaign Sent!</h3>
              <p className="text-gray-500">
                Successfully sent to {recipients.length} recipient{recipients.length > 1 ? "s" : ""}
              </p>
              <button type="button" onClick={onClose}
                className="mt-6 bg-gray-950 text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-800">
                CLOSE
              </button>
            </div>
          ) : (
            <>
              {/* Recipients Preview */}
              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">
                  RECIPIENTS ({recipients.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-1">
                  {recipients.slice(0, 5).map((r, i) => (
                    <p key={r.email} className="text-sm text-gray-600">{r.email}</p>
                  ))}
                  {recipients.length > 5 && (
                    <p className="text-sm text-gray-400">+{recipients.length - 5} more</p>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label htmlFor="CampaignModal-subject-line-15" className="block text-xs tracking-wider text-gray-500 mb-2">SUBJECT LINE</label>
                <input aria-label="SUBJECT LINE" id="CampaignModal-subject-line-15"
                  type="text"
                  value={customSubject || campaignInfo[type].defaultSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none"
                  placeholder="Email subject..."
                />
              </div>

              {type === "custom" && (
                <div>
                  <label htmlFor="CampaignModal-message-16" className="block text-xs tracking-wider text-gray-500 mb-2">MESSAGE</label>
                  <textarea aria-label="MESSAGE" id="CampaignModal-message-16"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none resize-none"
                    placeholder="Your message..."
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <XCircle className="size-4" />
                  {error}
                </div>
              )}

              <button type="button" onClick={handleSend}
                disabled={sending}
                className="w-full bg-gray-950 text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <SpinnerGap className="size-4 animate-spin" />
                    SENDING…
                  </>
                ) : (
                  <>
                    <PaperPlaneTilt className="size-4" />
                    SEND CAMPAIGN
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
