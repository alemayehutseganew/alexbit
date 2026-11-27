"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
} from "@/lib/schemas/auth.schema";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from "@/lib/schemas/auth.schema";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { getSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type View = "login" | "register" | "forgot";
type Realm = "client" | "shareholder";

type LoginActionsProps = {
  clientCallbackUrl: string;
  shareholderCallbackUrl: string;
  adminCallbackUrl: string;
  shareholderConfigured: boolean;
  credentialsEnabled: boolean;
  preferredRealm: Realm | null;
};

function FieldError({ children }: { children?: string }) {
  return children ? (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {children}
    </p>
  ) : null;
}

function fieldClassName(hasError: boolean) {
  return `mt-1 min-h-11 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-600 ${
    hasError
      ? "border-red-400 focus-visible:border-red-500"
      : "border-slate-300 focus-visible:border-brand-600"
  } bg-white dark:border-white/15 dark:bg-slate-950 dark:text-white`;
}

async function getBackendError(response: Response): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (typeof payload === "object" && payload !== null && "message" in payload) {
    const message = payload.message;
    if (typeof message === "string") {
      return message;
    }
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message.join(", ");
    }
  }

  return `HTTP ${response.status}`;
}

export function LoginActions({
  clientCallbackUrl,
  shareholderCallbackUrl,
  adminCallbackUrl,
  shareholderConfigured,
  credentialsEnabled,
  preferredRealm,
}: LoginActionsProps) {
  const t = useTranslations("Login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("login");
  const queryRealm = searchParams.get("realm");
  const [realm, setRealm] = useState<Realm>(
    preferredRealm ??
      (queryRealm === "client" || queryRealm === "shareholder"
        ? queryRealm
        : "client"),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [shareholderLoading, setShareholderLoading] = useState(false);

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      organization: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const forgotForm = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function changeView(nextView: View) {
    setFormError(null);
    setResetSent(false);
    setView(nextView);
  }

  function changeRealm(nextRealm: Realm) {
    setRealm(nextRealm);
    changeView("login");
    loginForm.reset();
    registerForm.reset();
    forgotForm.reset();
  }

  async function completeCredentialSignIn(email: string, password: string) {
    const result = await signIn("credentials", {
      email,
      password,
      realm,
      redirect: false,
    });

    if (result?.error) {
      setFormError(result.error);
      return false;
    }

    const session = await getSession();
    const role = session?.user?.role ?? session?.role;
    const isPrivilegedRole =
      role === "ADMIN" || role === "SUPER_ADMIN" || role === "PROJECT_MANAGER";
    const destination =
      isPrivilegedRole && realm === "shareholder"
        ? shareholderCallbackUrl
        : isPrivilegedRole && realm === "client"
          ? clientCallbackUrl
          : isPrivilegedRole
            ? adminCallbackUrl
            : role === "CLIENT" || role === "CLIENT_ADMIN"
              ? clientCallbackUrl
              : role === "SHAREHOLDER"
                ? shareholderCallbackUrl
                : null;

    if (!destination) {
      setFormError(t("loginError"));
      return false;
    }

    router.push(destination);
    router.refresh();
    return true;
  }

  async function submitLogin(data: LoginInput) {
    setFormError(null);
    try {
      await completeCredentialSignIn(data.email, data.password);
    } catch (error) {
      console.error(
        "Fetch error cause:",
        error instanceof Error ? (error.cause ?? error) : error,
      );
      setFormError(t("serverConnectionError"));
    }
  }

  async function submitRegister(data: RegisterInput) {
    setFormError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setFormError(t("serverConnectionError"));
      return;
    }

    let response: Response;
    try {
      response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error(
        "Fetch error cause:",
        error instanceof Error ? (error.cause ?? error) : error,
      );
      setFormError(t("serverConnectionError"));
      return;
    }

    if (!response.ok) {
      const backendMessage = await getBackendError(response);
      console.error("Registration failed", {
        status: response.status,
        message: backendMessage,
      });
      setFormError(
        response.status === 409
          ? t("emailAlreadyRegistered")
          : t("registerError"),
      );
      return;
    }

    try {
      const signedIn = await completeCredentialSignIn(
        data.email,
        data.password,
      );
      if (signedIn) {
        return;
      }

      changeView("login");
      setFormError(t("accountCreatedSignInError"));
    } catch (error) {
      console.error(
        "Fetch error cause:",
        error instanceof Error ? (error.cause ?? error) : error,
      );
      setFormError(t("accountCreatedSignInError"));
    }
  }

  async function submitForgotPassword(data: ForgotPasswordInput) {
    setFormError(null);
    setResetSent(false);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiUrl) {
      setFormError(t("resetError"));
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        setFormError(t("resetError"));
        return;
      }

      setResetSent(true);
    } catch {
      setFormError(t("resetError"));
    }
  }

  async function submitShareholderSignIn() {
    if (!shareholderConfigured) {
      setFormError(t("notConfigured"));
      return;
    }

    setFormError(null);
    setShareholderLoading(true);
    try {
      await signIn("keycloak-shareholder", {
        redirectTo: shareholderCallbackUrl,
      });
    } catch {
      setShareholderLoading(false);
      setFormError(t("loginError"));
    }
  }

  const title =
    view === "login"
      ? t("signInTitle", {
          portal:
            realm === "client" ? t("clientPortal") : t("shareholderPortal"),
        })
      : view === "register"
        ? t("registerTitle")
        : t("forgotTitle");

  return (
    <div className="w-full">
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(["client", "shareholder"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={realm === option}
            onClick={() => changeRealm(option)}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
              realm === option
                ? "bg-white text-brand-700 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            }`}
          >
            {option === "client" ? t("clientPortal") : t("shareholderPortal")}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${realm}-${view}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-none rounded-none border border-white/40 bg-white/80 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:p-8 md:max-w-md md:rounded-2xl dark:border-white/10 dark:bg-slate-900/90"
        >
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>

          {realm === "shareholder" && !credentialsEnabled ? (
            <div className="mt-6">
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t("shareholderDescription")}
              </p>
              <motion.div
                className="mt-6 w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  onClick={() => void submitShareholderSignIn()}
                  disabled={shareholderLoading || !shareholderConfigured}
                  className="min-h-11 w-full gap-2 bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 motion-safe:hover:scale-100 active:scale-100"
                >
                  {shareholderLoading ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={17}
                    />
                  ) : (
                    <ArrowRight aria-hidden="true" size={17} />
                  )}
                  {t("shareholderButton")}
                </Button>
              </motion.div>
              {!shareholderConfigured && (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                  {t("notConfigured")}
                </p>
              )}
            </div>
          ) : (
            <>
              {view === "login" && (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={loginForm.handleSubmit(submitLogin)}
                  noValidate
                >
                  <div>
                    <Label htmlFor="login-email" className="mb-2 block">
                      {t("emailLabel")}
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      aria-invalid={Boolean(loginForm.formState.errors.email)}
                      aria-describedby={
                        loginForm.formState.errors.email
                          ? "login-email-error"
                          : undefined
                      }
                      className={fieldClassName(
                        Boolean(loginForm.formState.errors.email),
                      )}
                      {...loginForm.register("email")}
                    />
                    <div id="login-email-error">
                      <FieldError>
                        {loginForm.formState.errors.email?.message}
                      </FieldError>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="mb-2 block">
                      {t("passwordLabel")}
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      aria-invalid={Boolean(
                        loginForm.formState.errors.password,
                      )}
                      aria-describedby={
                        loginForm.formState.errors.password
                          ? "login-password-error"
                          : undefined
                      }
                      className={fieldClassName(
                        Boolean(loginForm.formState.errors.password),
                      )}
                      {...loginForm.register("password")}
                    />
                    <div id="login-password-error">
                      <FieldError>
                        {loginForm.formState.errors.password?.message}
                      </FieldError>
                    </div>
                    <button
                      type="button"
                      onClick={() => changeView("forgot")}
                      className="mt-2 text-sm font-semibold text-brand-700 hover:text-blue-900"
                    >
                      {t("forgotLink")}
                    </button>
                  </div>
                  {formError && (
                    <p role="alert" className="text-sm text-red-600">
                      {formError}
                    </p>
                  )}
                  <motion.div
                    className="w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={loginForm.formState.isSubmitting}
                      className="min-h-11 w-full gap-2 bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 motion-safe:hover:scale-100 active:scale-100"
                    >
                      {loginForm.formState.isSubmitting && (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={17}
                        />
                      )}
                      {realm === "client"
                        ? t("signInButton")
                        : t("shareholderButton")}
                    </Button>
                  </motion.div>
                  {realm === "client" && (
                    <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-300">
                      {t("noAccount")}{" "}
                      <button
                        type="button"
                        onClick={() => changeView("register")}
                        className="font-semibold text-brand-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        {t("signUpLink")}
                      </button>
                    </p>
                  )}
                </form>
              )}

              {realm === "client" && view === "register" && (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={registerForm.handleSubmit(submitRegister)}
                  noValidate
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label
                        htmlFor="register-first-name"
                        className="mb-2 block"
                      >
                        {t("firstNameLabel")}
                      </Label>
                      <Input
                        id="register-first-name"
                        autoComplete="given-name"
                        aria-invalid={Boolean(
                          registerForm.formState.errors.firstName,
                        )}
                        className={fieldClassName(
                          Boolean(registerForm.formState.errors.firstName),
                        )}
                        {...registerForm.register("firstName")}
                      />
                      <FieldError>
                        {registerForm.formState.errors.firstName?.message}
                      </FieldError>
                    </div>
                    <div>
                      <Label
                        htmlFor="register-last-name"
                        className="mb-2 block"
                      >
                        {t("lastNameLabel")}
                      </Label>
                      <Input
                        id="register-last-name"
                        autoComplete="family-name"
                        aria-invalid={Boolean(
                          registerForm.formState.errors.lastName,
                        )}
                        className={fieldClassName(
                          Boolean(registerForm.formState.errors.lastName),
                        )}
                        {...registerForm.register("lastName")}
                      />
                      <FieldError>
                        {registerForm.formState.errors.lastName?.message}
                      </FieldError>
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="register-organization"
                      className="mb-2 block"
                    >
                      {t("organizationLabel")}
                    </Label>
                    <Input
                      id="register-organization"
                      autoComplete="organization"
                      aria-invalid={Boolean(
                        registerForm.formState.errors.organization,
                      )}
                      className={fieldClassName(
                        Boolean(registerForm.formState.errors.organization),
                      )}
                      {...registerForm.register("organization")}
                    />
                    <FieldError>
                      {registerForm.formState.errors.organization?.message}
                    </FieldError>
                  </div>
                  <div>
                    <Label htmlFor="register-email" className="mb-2 block">
                      {t("emailLabel")}
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(
                        registerForm.formState.errors.email,
                      )}
                      className={fieldClassName(
                        Boolean(registerForm.formState.errors.email),
                      )}
                      {...registerForm.register("email")}
                    />
                    <FieldError>
                      {registerForm.formState.errors.email?.message}
                    </FieldError>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="register-password" className="mb-2 block">
                        {t("passwordLabel")}
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(
                          registerForm.formState.errors.password,
                        )}
                        className={fieldClassName(
                          Boolean(registerForm.formState.errors.password),
                        )}
                        {...registerForm.register("password")}
                      />
                      <FieldError>
                        {registerForm.formState.errors.password?.message}
                      </FieldError>
                    </div>
                    <div>
                      <Label
                        htmlFor="register-confirm-password"
                        className="mb-2 block"
                      >
                        {t("confirmPasswordLabel")}
                      </Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(
                          registerForm.formState.errors.confirmPassword,
                        )}
                        className={fieldClassName(
                          Boolean(
                            registerForm.formState.errors.confirmPassword,
                          ),
                        )}
                        {...registerForm.register("confirmPassword")}
                      />
                      <FieldError>
                        {registerForm.formState.errors.confirmPassword?.message}
                      </FieldError>
                    </div>
                  </div>
                  <div>
                    <Label className="flex items-start gap-2 text-sm leading-5">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 accent-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600"
                        aria-invalid={Boolean(
                          registerForm.formState.errors.acceptTerms,
                        )}
                        {...registerForm.register("acceptTerms")}
                      />
                      <span>{t("acceptTermsLabel")}</span>
                    </Label>
                    <FieldError>
                      {registerForm.formState.errors.acceptTerms?.message}
                    </FieldError>
                  </div>
                  {formError && (
                    <p role="alert" className="text-sm text-red-600">
                      {formError}
                    </p>
                  )}
                  <motion.div
                    className="w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={registerForm.formState.isSubmitting}
                      className="min-h-11 w-full gap-2 bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 motion-safe:hover:scale-100 active:scale-100"
                    >
                      {registerForm.formState.isSubmitting && (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={17}
                        />
                      )}
                      {t("registerButton")}
                    </Button>
                  </motion.div>
                  <p className="pt-1 text-center text-sm text-slate-600 dark:text-slate-300">
                    {t("haveAccount")}{" "}
                    <button
                      type="button"
                      onClick={() => changeView("login")}
                      className="font-semibold text-brand-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      {t("signInLink")}
                    </button>
                  </p>
                </form>
              )}

              {view === "forgot" && (
                <form
                  className="mt-6 space-y-4"
                  onSubmit={forgotForm.handleSubmit(submitForgotPassword)}
                  noValidate
                >
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t("forgotDescription")}
                  </p>
                  <div>
                    <Label htmlFor="forgot-email" className="mb-2 block">
                      {t("emailLabel")}
                    </Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(forgotForm.formState.errors.email)}
                      className={fieldClassName(
                        Boolean(forgotForm.formState.errors.email),
                      )}
                      {...forgotForm.register("email")}
                    />
                    <FieldError>
                      {forgotForm.formState.errors.email?.message}
                    </FieldError>
                  </div>
                  {resetSent && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg dark:border-green-800 dark:bg-green-950 dark:text-green-200"
                    >
                      {t("resetSuccess")}
                    </p>
                  )}
                  {formError && (
                    <p role="alert" className="text-sm text-red-600">
                      {formError}
                    </p>
                  )}
                  <motion.div
                    className="w-full"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      disabled={forgotForm.formState.isSubmitting}
                      className="min-h-11 w-full gap-2 bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 motion-safe:hover:scale-100 active:scale-100"
                    >
                      {forgotForm.formState.isSubmitting && (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={17}
                        />
                      )}
                      {t("sendResetButton")}
                    </Button>
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => changeView("login")}
                    className="flex min-h-10 items-center gap-2 text-sm font-semibold text-brand-700 hover:text-blue-900"
                  >
                    <ArrowLeft aria-hidden="true" size={16} />
                    {t("backToLogin")}
                  </button>
                </form>
              )}
            </>
          )}

          {formError && realm === "shareholder" && !credentialsEnabled && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {formError}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
