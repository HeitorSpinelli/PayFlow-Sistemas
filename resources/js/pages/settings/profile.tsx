import { Form, Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, Save, TriangleAlert, User } from 'lucide-react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage().props;

    const iniciais = auth.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0]?.toUpperCase())
        .join('');

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="flex flex-col gap-6">
                {/* Card principal: informações do perfil */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                    {/* glow decorativo de fundo, sutil, mesma linguagem das outras telas */}
                    <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative mb-7 flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/25">
                            {iniciais || <User className="size-6" />}
                        </div>
                        <div>
                            <p className="mb-0.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                Perfil
                            </p>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Profile information
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Update your name and email address
                            </p>
                        </div>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="relative space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="name"
                                        className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                                    >
                                        Name
                                    </Label>

                                    <div className="relative">
                                        <User className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            className="h-12 rounded-xl border-border/70 bg-background pl-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                            defaultValue={auth.user.name}
                                            name="name"
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                        />
                                    </div>

                                    <InputError
                                        className="mt-1"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase"
                                    >
                                        Email address
                                    </Label>

                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="h-12 rounded-xl border-border/70 bg-background pl-10 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
                                            defaultValue={auth.user.email}
                                            name="email"
                                            required
                                            autoComplete="username"
                                            placeholder="Email address"
                                        />
                                    </div>

                                    <InputError
                                        className="mt-1"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                                            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                            <div className="text-sm text-amber-700 dark:text-amber-400">
                                                <p>
                                                    Your email address is
                                                    unverified.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="font-semibold underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
                                                    >
                                                        Click here to resend
                                                        the verification
                                                        email.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <p className="mt-2 flex items-center gap-1.5 font-semibold text-emerald-600">
                                                        <CheckCircle2 className="size-4" />
                                                        A new verification
                                                        link has been sent to
                                                        your email address.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                <div className="flex items-center gap-4 pt-1">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                        className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                    >
                                        <Save className="mr-2 size-4" />
                                        Save
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-1">
                        <span className="h-px flex-1 bg-gradient-to-r from-red-500/30 to-transparent" />
                        <p className="text-[10px] font-bold tracking-[0.16em] text-red-500/70 uppercase">
                            Zona de perigo
                        </p>
                        <span className="h-px flex-1 bg-gradient-to-l from-red-500/30 to-transparent" />
                    </div>

                    <DeleteUser />
                </div>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
