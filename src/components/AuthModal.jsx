import React, { useState } from "react";
import {
  ArrowRight,
  Check,
  Compass,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase, supabaseReady } from "../supabase.js";

export default function AuthModal({
  mode,
  setMode,
  onClose,
  onAuth,
  onSignOut,
  user,
  token,
  required = false,
}) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!supabase) {
      setError("Accounts are not configured yet.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: { data: { name: values.name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          onAuth(values.name.trim());
        } else {
          setNotice(
            "Check your email and click the confirmation link, then sign in.",
          );
        }
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({
            email: values.email.trim(),
            password: values.password,
          });
        if (signInError) throw signInError;
        onAuth(data.user?.user_metadata?.name);
      }
    } catch (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Wrong email or password."
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="auth-modal">
        {!required && (
          <button className="modal-x" onClick={onClose}>
            <X size={19} />
          </button>
        )}
        {token ? (
          <>
            <div className="auth-brand">
              <Compass size={21} />
            </div>
            <div className="section-kicker">YOUR ACCOUNT</div>
            <h2>Good to see you, {user.name}.</h2>
            <p>Your speaking journey is saved to your account.</p>
            <button className="auth-submit" onClick={onClose}>
              Back to your journey <ArrowRight size={16} />
            </button>
            <button className="signout-btn" onClick={onSignOut}>
              <LogOut size={15} /> Sign out
            </button>
          </>
        ) : (
          <>
            <div className="auth-brand">
              <Compass size={21} />
            </div>
            <div className="section-kicker">YOUR JOURNEY STARTS HERE</div>
            <h2>
              {mode === "register"
                ? "Make this journey yours."
                : "Welcome back."}
            </h2>
            <p>
              {mode === "register"
                ? "Create your profile and keep every new word and little victory."
                : "Pick up right where you left off."}
            </p>
            <div className="auth-tabs">
              <button
                className={mode === "register" ? "selected" : ""}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Create account
              </button>
              <button
                className={mode === "login" ? "selected" : ""}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in
              </button>
            </div>
            <form onSubmit={submit}>
              {mode === "register" && (
                <label>
                  Your name
                  <input
                    autoComplete="name"
                    required
                    value={values.name}
                    onChange={(e) =>
                      setValues({ ...values, name: e.target.value })
                    }
                    placeholder="e.g. Aigerim"
                  />
                </label>
              )}
              <label>
                Email
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={values.email}
                  onChange={(e) =>
                    setValues({ ...values, email: e.target.value })
                  }
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  type="password"
                  required
                  minLength={6}
                  value={values.password}
                  onChange={(e) =>
                    setValues({ ...values, password: e.target.value })
                  }
                  placeholder="At least 6 characters"
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              {notice && <div className="auth-error">{notice}</div>}
              <button className="auth-submit" disabled={busy}>
                {busy
                  ? "One moment…"
                  : mode === "register"
                    ? "Create my account"
                    : "Sign in"}
                <ArrowRight size={16} />
              </button>
              <small className="privacy-note">
                <ShieldCheck size={13} /> Your practice belongs to you.
              </small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
