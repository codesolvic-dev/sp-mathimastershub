import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/buttons/Button";
import Input from "@/pages/admin/components/form/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import { registerUser } from "@/api/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { metaPixel } from "@/utils/metaPixel";

export default function Access() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await registerUser({ name, email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      login({ ...data.user, token: data.token });
      metaPixel.signUp("email");

      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {location.state?.message && (
        <p className="text-green-600 mb-2">{location.state.message}</p>
      )}

      <form
        className="flex flex-col gap-4 text-gray-800"
        onSubmit={(e) => {
          e.preventDefault();
          handleRegister();
        }}
      >
        <div>
          <h2 className="text-2xl font-semibold text-[var(--theme-primary,#A8734B)] mb-2">
            Create Account
          </h2>
          <p className="text-sm text-gray-600">
            Join us to discover handcrafted essentials.
          </p>
        </div>

        <Input
          label="Full Name"
          placeholder="Enter name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          className="text-gray-800"
        />
        <Input
          label="Email"
          placeholder="Enter email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          className="text-gray-800"
        />

        <PasswordInput
          label="Password"
          placeholder="Create password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

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
          {loading ? "Creating account..." : "Sign Up"}
        </Button>

        <p className="text-sm text-white mt-1">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-medium underline underline-offset-2 hover:opacity-90">
            Login
          </Link>
        </p>
      </form>
    </>
  );
}
