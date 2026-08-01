import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import PasswordInput from "@/components/auth/PasswordInput";
import { resetPasswordWithToken } from "@/api/auth.api";

export default function ResetPasswordConfirm() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      setError("Invalid reset link");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPasswordWithToken(token, password);
      setMessage("Password updated successfully. Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { state: { message: "Password updated. Please log in." } });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
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
          handleSubmit();
        }}
      >
        <div>
          <h2 className="text-2xl font-semibold text-[var(--theme-primary,#A8734B)] mb-2">
            Set New Password
          </h2>
          <p className="text-sm text-gray-600">
            Choose a new password for your account.
          </p>
        </div>

        <PasswordInput
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}

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
          {loading ? "Updating..." : "Update Password"}
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
