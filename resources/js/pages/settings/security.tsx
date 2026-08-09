import { Form, Head } from '@inertiajs/react';
import { KeyRound, Lock, ShieldCheck, ShieldOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import { edit } from '@/routes/security';
import { disable, enable } from '@/routes/two-factor';

type Props = {
    canManageTwoFactor?: boolean;
    requiresConfirmation?: boolean;
    twoFactorEnabled?: boolean;
};

export default function Security({
    canManageTwoFactor = false,
    requiresConfirmation = false,
    twoFactorEnabled = false,
}: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    } = useTwoFactorAuth();
    const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
    const prevTwoFactorEnabled = useRef(twoFactorEnabled);

    useEffect(() => {
        if (prevTwoFactorEnabled.current && !twoFactorEnabled) {
            clearTwoFactorAuthData();
        }

        prevTwoFactorEnabled.current = twoFactorEnabled;
    }, [twoFactorEnabled, clearTwoFactorAuthData]);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="flex flex-col gap-6">
                {/* Card: atualizar senha */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative mb-7 flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                            <KeyRound className="size-7" />
                        </div>
                        <div>
                            <p className="mb-0.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                Segurança
                            </p>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Update password
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Ensure your account is using a long, random
                                password to stay secure
                            </p>
                        </div>
                    </div>

                    <Form
                        {...SecurityController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="relative space-y-6"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                                    >
                                        Current password
                                    </Label>

                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <PasswordInput
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            className="h-12 rounded-xl border-border/70 bg-background pl-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />
                                    </div>

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password"
                                        className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                                    >
                                        New password
                                    </Label>

                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <PasswordInput
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            className="h-12 rounded-xl border-border/70 bg-background pl-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                            autoComplete="new-password"
                                            placeholder="New password"
                                        />
                                    </div>

                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="password_confirmation"
                                        className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                                    >
                                        Confirm password
                                    </Label>

                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <PasswordInput
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            className="h-12 rounded-xl border-border/70 bg-background pl-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                        />
                                    </div>

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-1">
                                    <Button
                                        disabled={processing}
                                        data-test="update-password-button"
                                        className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                    >
                                        <Lock className="mr-2 size-4" />
                                        Save password
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Card: autenticação de dois fatores */}
                {canManageTwoFactor && (
                    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                        <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                        <div className="relative mb-6 flex flex-wrap items-center gap-4">
                            <div
                                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                                    twoFactorEnabled
                                        ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/25'
                                        : 'bg-gradient-to-br from-neutral-400 to-neutral-600 shadow-neutral-500/20'
                                }`}
                            >
                                {twoFactorEnabled ? (
                                    <ShieldCheck className="size-7" />
                                ) : (
                                    <ShieldOff className="size-7" />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="mb-0.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                    Autenticação
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                                        Two-factor authentication
                                    </h2>
                                    <span
                                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${
                                            twoFactorEnabled
                                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                                                : 'border-border/70 bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {twoFactorEnabled
                                            ? 'Ativado'
                                            : 'Desativado'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Manage your two-factor authentication
                                    settings
                                </p>
                            </div>
                        </div>

                        {twoFactorEnabled ? (
                            <div className="relative flex flex-col items-start gap-4">
                                <p className="max-w-xl text-sm text-muted-foreground">
                                    You will be prompted for a secure, random
                                    pin during login, which you can retrieve
                                    from the TOTP-supported application on
                                    your phone.
                                </p>

                                <div className="relative inline">
                                    <Form {...disable.form()}>
                                        {({ processing }) => (
                                            <Button
                                                variant="destructive"
                                                type="submit"
                                                disabled={processing}
                                                className="h-11 rounded-xl px-6 font-bold shadow-lg shadow-red-500/10 active:scale-[0.98]"
                                            >
                                                <ShieldOff className="mr-2 size-4" />
                                                Disable 2FA
                                            </Button>
                                        )}
                                    </Form>
                                </div>

                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={recoveryCodesList}
                                    fetchRecoveryCodes={fetchRecoveryCodes}
                                    errors={errors}
                                />
                            </div>
                        ) : (
                            <div className="relative flex flex-col items-start gap-4">
                                <p className="max-w-xl text-sm text-muted-foreground">
                                    When you enable two-factor authentication,
                                    you will be prompted for a secure pin
                                    during login. This pin can be retrieved
                                    from a TOTP-supported application on your
                                    phone.
                                </p>

                                <div>
                                    {hasSetupData ? (
                                        <Button
                                            onClick={() =>
                                                setShowSetupModal(true)
                                            }
                                            className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                        >
                                            <ShieldCheck className="mr-2 size-4" />
                                            Continue setup
                                        </Button>
                                    ) : (
                                        <Form
                                            {...enable.form()}
                                            onSuccess={() =>
                                                setShowSetupModal(true)
                                            }
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                                >
                                                    <ShieldCheck className="mr-2 size-4" />
                                                    Enable 2FA
                                                </Button>
                                            )}
                                        </Form>
                                    )}
                                </div>
                            </div>
                        )}

                        <TwoFactorSetupModal
                            isOpen={showSetupModal}
                            onClose={() => setShowSetupModal(false)}
                            requiresConfirmation={requiresConfirmation}
                            twoFactorEnabled={twoFactorEnabled}
                            qrCodeSvg={qrCodeSvg}
                            manualSetupKey={manualSetupKey}
                            clearSetupData={clearSetupData}
                            fetchSetupData={fetchSetupData}
                            errors={errors}
                        />
                    </div>
                )}
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
