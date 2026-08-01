import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import Input from "@/pages/admin/components/form/Input";
import { forgotPassword } from "@/api/auth.api";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setDevResetUrl("");
      const data = await forgotPassword(email.trim());
      setMessage(
        data?.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
      if (data?.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset link");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
        className="flex flex-col gap-4 text-gray-800"
        onSubmit={(e) => {
          e.preventDefault();
          handleReset();
        }}
      >
        <div>
          <h2 className="text-2xl font-semibold text-[var(--theme-primary,#A8734B)] mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-gray-600">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="text-gray-800"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {devResetUrl && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium mb-1">Development: email is not configured</p>
            <p className="mb-2">Use this link to reset your password (expires in 1 hour):</p>
            <a
              href={devResetUrl}
              className="break-all underline text-[var(--theme-primary)]"
            >
              {devResetUrl}
            </a>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 w-full text-white rounded-lg py-3 border border-transparent transition-colors disabled:opacity-50"
          style={{ backgroundColor: "var(--theme-primary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-dark)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--theme-primary)";
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>

        <p className="text-sm text-white mt-1">
          Back to login?{" "}
          <Link to="/login" className="text-white font-medium underline underline-offset-2 hover:opacity-90">
            Login
          </Link>
        </p>
      </form>
  );
}
