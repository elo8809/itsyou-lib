import { useEffect, useState } from 'react';
import Button from '../base/Button';
import Input from '../base/Input';
import PageHeader from '../workspace/PageHeader';
import Panel from '../workspace/Panel';
import {
  InlineNotice,
  EmptyState,
} from '../workspace/Feedback';
import { accountLabels } from './labels';

type Account = { email: string; hasPassword: boolean };
export default function AccountSettings({
  apiBaseUrl,
  locale = 'en',
  onAccountChanged,
}: {
  apiBaseUrl: string;
  locale?: 'en' | 'de';
  onAccountChanged?: () => Promise<unknown>;
}) {
  const t = accountLabels[locale];
  const [account, setAccount] = useState<Account | null>(
    null,
  );
  const [loadError, setLoadError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState('');
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [codeMode, setCodeMode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordSuccess, setPasswordSuccess] =
    useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const base = apiBaseUrl.replace(/\/$/, '');

  useEffect(() => {
    const controller = new AbortController();
    setAccount(null);
    setLoadError(false);
    fetch(`${base}/account/settings`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data: Account = await response.json();
        if (!controller.signal.aborted) {
          setAccount(data);
          setCodeMode(!data.hasPassword);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [base, revision]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function request<T>(
    path: string,
    body: object,
  ): Promise<T> {
    const response = await fetch(
      `${base}/account/${path}`,
      {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.code || 'FAILED');
    return data;
  }
  const errorText = (error: unknown) =>
    t.errors[
      (error instanceof Error
        ? error.message
        : 'FAILED') as keyof typeof t.errors
    ] || t.errors.FAILED;
  const updateAccount = async (next: Account) => {
    setAccount(next);
    // The save has succeeded even if a temporary session refresh fails.
    await onAccountChanged?.().catch(() => {});
  };
  async function sendPasswordCode() {
    setBusy('code');
    setPasswordError('');
    setPasswordSuccess(false);
    try {
      const data = await request<{ resendAfter: number }>(
        'password/code',
        { locale },
      );
      setCodeSent(true);
      setCodeMode(true);
      setCode('');
      setCurrent('');
      setCooldown(data.resendAfter);
      setPendingEmail('');
      setEmailCode('');
      setEmailPassword('');
    } catch (error) {
      setPasswordError(errorText(error));
    } finally {
      setBusy('');
    }
  }
  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (password !== confirm) {
      setPasswordError(t.mismatch);
      return;
    }
    if (
      password.length < 12 ||
      new TextEncoder().encode(password).length > 72
    ) {
      setPasswordError(t.errors.PASSWORD_LENGTH);
      return;
    }
    setBusy('password');
    try {
      const next = await request<Account>('password', {
        newPassword: password,
        ...(codeMode
          ? { code }
          : { currentPassword: current }),
      });
      setCurrent('');
      setPassword('');
      setConfirm('');
      setCode('');
      setCodeSent(false);
      setCodeMode(false);
      setShow(false);
      setPendingEmail('');
      setEmailPassword('');
      setEmailCode('');
      await updateAccount(next);
      setPasswordSuccess(true);
    } catch (error) {
      setPasswordError(errorText(error));
    } finally {
      setBusy('');
    }
  }
  async function startEmailChange(event?: React.FormEvent) {
    event?.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setBusy('email');
    try {
      const nextEmail = email.trim().toLowerCase();
      const data = await request<{ resendAfter: number }>(
        'email/request',
        {
          email: nextEmail,
          currentPassword: emailPassword,
          locale,
        },
      );
      setPendingEmail(nextEmail);
      setEmailCode('');
      setCooldown(data.resendAfter);
      setCodeSent(false);
      setCode('');
    } catch (error) {
      setEmailError(errorText(error));
    } finally {
      setBusy('');
    }
  }
  async function saveEmail(event: React.FormEvent) {
    event.preventDefault();
    setEmailError('');
    setBusy('confirm-email');
    try {
      const next = await request<Account>('email/confirm', {
        code: emailCode,
      });
      setPendingEmail('');
      setEmail('');
      setEmailCode('');
      setEmailPassword('');
      await updateAccount(next);
      setEmailSuccess(true);
    } catch (error) {
      setEmailError(errorText(error));
    } finally {
      setBusy('');
    }
  }
  const passwordType = show ? 'text' : 'password';
  const resendLabel =
    cooldown > 0 ? `${t.resend} (${cooldown}s)` : t.resend;
  return (
    <div className="ui-settings">
      <PageHeader
        eyebrow={t.account}
        title={t.title}
        subtitle={t.subtitle}
      />
      {!account ? (
        loadError ? (
          <InlineNotice
            tone="error"
            action={
              <Button
                variant="ghost"
                onClick={() =>
                  setRevision((value) => value + 1)
                }
              >
                {t.retry}
              </Button>
            }
          >
            {t.errors.FAILED}
          </InlineNotice>
        ) : (
          <EmptyState loading loadingLabel={t.loading} />
        )
      ) : (
        <>
          <div className="ui-settings-identity">
            <span>{t.email}</span>
            <strong>{account.email}</strong>
          </div>
          <Panel
            title={
              account.hasPassword
                ? t.changePassword
                : t.setPassword
            }
            description={
              account.hasPassword
                ? t.passwordHint
                : t.setHint
            }
          >
            <form
              onSubmit={savePassword}
              className="ui-settings-form"
            >
              {codeMode ? (
                <div className="ui-settings-verification">
                  <p>
                    {codeSent
                      ? `${t.sentTo} ${account.email}.`
                      : t.verifyHint}
                  </p>
                  {codeSent && (
                    <Input
                      label={t.code}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(
                          e.target.value.replace(/\D/g, ''),
                        )
                      }
                      aria-describedby="password-code-hint"
                    />
                  )}
                  {codeSent && (
                    <p
                      id="password-code-hint"
                      className="ui-settings-hint"
                    >
                      {t.codeHint}
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!!busy || cooldown > 0}
                    isLoading={busy === 'code'}
                    onClick={sendPasswordCode}
                  >
                    {codeSent ? resendLabel : t.sendCode}
                  </Button>
                  {account.hasPassword && (
                    <button
                      type="button"
                      className="ui-settings-text-button"
                      disabled={!!busy}
                      onClick={() => {
                        setCodeMode(false);
                        setPasswordError('');
                      }}
                    >
                      {t.usePassword}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <Input
                    label={t.currentPassword}
                    type={passwordType}
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) =>
                      setCurrent(e.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    className="ui-settings-text-button"
                    disabled={!!busy}
                    onClick={() => {
                      setCodeMode(true);
                      setPasswordError('');
                      setCurrent('');
                    }}
                  >
                    {t.useCode}
                  </button>
                </>
              )}
              <Input
                label={t.newPassword}
                type={passwordType}
                autoComplete="new-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                minLength={12}
                maxLength={72}
                aria-describedby="password-rule"
              />
              <p
                id="password-rule"
                className="ui-settings-hint"
              >
                {t.passwordRule}
              </p>
              <Input
                label={t.confirmPassword}
                type={passwordType}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={12}
                maxLength={72}
              />
              <label className="ui-settings-check">
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) =>
                    setShow(e.target.checked)
                  }
                />
                {t.show}
              </label>
              {passwordError && (
                <InlineNotice tone="error">
                  {passwordError}
                </InlineNotice>
              )}
              {passwordSuccess && (
                <p
                  role="status"
                  className="ui-settings-success"
                >
                  {t.passwordSaved}
                </p>
              )}
              <div className="ui-settings-actions">
                <Button
                  type="submit"
                  disabled={
                    !!busy || (codeMode && !codeSent)
                  }
                  isLoading={busy === 'password'}
                >
                  {account.hasPassword
                    ? t.changePassword
                    : t.setPassword}
                </Button>
              </div>
            </form>
          </Panel>
          <Panel title={t.email} description={t.emailHint}>
            {!account.hasPassword ? (
              <p className="ui-settings-hint">
                {t.passwordFirst}
              </p>
            ) : pendingEmail ? (
              <form
                onSubmit={saveEmail}
                className="ui-settings-form"
              >
                <p>
                  {t.sentTo}{' '}
                  <strong className="ui-settings-email">
                    {pendingEmail}
                  </strong>
                  .
                </p>
                <p className="ui-settings-hint">
                  {t.emailPending}
                </p>
                <Input
                  label={t.code}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={emailCode}
                  onChange={(e) =>
                    setEmailCode(
                      e.target.value.replace(/\D/g, ''),
                    )
                  }
                  aria-describedby="email-code-hint"
                />
                <p
                  id="email-code-hint"
                  className="ui-settings-hint"
                >
                  {t.codeHint}
                </p>
                {emailError && (
                  <InlineNotice tone="error">
                    {emailError}
                  </InlineNotice>
                )}
                <div className="ui-settings-actions">
                  <Button
                    type="submit"
                    disabled={!!busy}
                    isLoading={busy === 'confirm-email'}
                  >
                    {t.confirmEmail}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={!!busy}
                    onClick={() => {
                      setPendingEmail('');
                      setEmailCode('');
                      setEmailPassword('');
                      setEmailError('');
                    }}
                  >
                    {t.cancel}
                  </Button>
                </div>
                <button
                  type="button"
                  className="ui-settings-text-button"
                  disabled={!!busy || cooldown > 0}
                  onClick={() => void startEmailChange()}
                >
                  {resendLabel}
                </button>
              </form>
            ) : (
              <form
                onSubmit={startEmailChange}
                className="ui-settings-form"
              >
                <Input
                  label={t.newEmail}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={254}
                />
                <Input
                  label={t.currentPassword}
                  type="password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(e) =>
                    setEmailPassword(e.target.value)
                  }
                  required
                />
                {emailError && (
                  <InlineNotice tone="error">
                    {emailError}
                  </InlineNotice>
                )}
                {emailSuccess && (
                  <p
                    role="status"
                    className="ui-settings-success"
                  >
                    {t.emailSaved}
                  </p>
                )}
                <div className="ui-settings-actions">
                  <Button
                    type="submit"
                    disabled={
                      !!busy ||
                      email.trim().toLowerCase() ===
                        account.email.toLowerCase()
                    }
                    isLoading={busy === 'email'}
                  >
                    {t.verifyEmail}
                  </Button>
                </div>
              </form>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
