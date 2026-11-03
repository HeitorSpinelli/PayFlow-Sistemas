import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    Camera,
    CheckCircle2,
    Loader2,
    Mail,
    Save,
    TriangleAlert,
    User,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

// A foto fica no banco (compartilhado por todos), então ela é reduzida aqui
// antes do envio: quadrado de até 512px em WEBP fica com dezenas de KB em vez
// de até 2 MB. Se o navegador não conseguir (formato estranho), envia o
// original — a validação do back-end continua barrando o que passar de 2 MB.
async function reduzirImagem(arquivo: File, lado = 512): Promise<File> {
    try {
        const bitmap = await createImageBitmap(arquivo);
        // Recorte central quadrado, como o avatar é exibido.
        const corte = Math.min(bitmap.width, bitmap.height);
        const destino = Math.min(lado, corte);
        const canvas = document.createElement('canvas');
        canvas.width = destino;
        canvas.height = destino;
        canvas
            .getContext('2d')
            ?.drawImage(
                bitmap,
                (bitmap.width - corte) / 2,
                (bitmap.height - corte) / 2,
                corte,
                corte,
                0,
                0,
                destino,
                destino,
            );
        bitmap.close();

        const blob = await new Promise<Blob | null>((resolver) =>
            canvas.toBlob(resolver, 'image/webp', 0.85),
        );

        if (!blob || blob.type !== 'image/webp') {
            return arquivo;
        }

        return new File([blob], 'foto-perfil.webp', { type: 'image/webp' });
    } catch {
        return arquivo;
    }
}

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

    const seletorFoto = useRef<HTMLInputElement>(null);
    const [enviandoFoto, setEnviandoFoto] = useState(false);

    // Envia a foto escolhida (POST /settings/profile/avatar → AvatarController).
    // A checagem de tipo/tamanho aqui só poupa um upload inútil; quem decide
    // é a validação do back-end. O toast de sucesso vem do flash do layout.
    const enviarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const arquivo = e.target.files?.[0];
        e.target.value = ''; // permite escolher o mesmo arquivo de novo

        if (!arquivo) {
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(arquivo.type)) {
            toast.error('Use uma imagem JPG, PNG ou WEBP.');

            return;
        }

        if (arquivo.size > 2 * 1024 * 1024) {
            toast.error('A imagem pode ter no máximo 2 MB.');

            return;
        }

        setEnviandoFoto(true);
        const reduzida = await reduzirImagem(arquivo);

        router.post(
            '/settings/profile/avatar',
            { avatar: reduzida },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setEnviandoFoto(false),
                onError: (erros) =>
                    toast.error(
                        erros.avatar ?? 'Não foi possível enviar a foto.',
                    ),
            },
        );
    };

    // "Remover": volta para as iniciais (DELETE /settings/profile/avatar).
    const removerFoto = () => {
        router.delete('/settings/profile/avatar', {
            preserveScroll: true,
            onStart: () => setEnviandoFoto(true),
            onFinish: () => setEnviandoFoto(false),
        });
    };

    return (
        <>
            <Head title="Configurações de perfil" />

            <h1 className="sr-only">Configurações de perfil</h1>

            <div className="flex flex-col gap-6">
                {/* Card principal: informações do perfil */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                    {/* glow decorativo de fundo, sutil, mesma linguagem das outras telas */}
                    <div className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                    <div className="relative mb-7 flex items-center gap-4">
                        <div className="flex shrink-0 flex-col items-center gap-2">
                            {/* Foto de perfil: clique na imagem ou em "Alterar
                                foto" abre o seletor de arquivo. Sem foto, mostra
                                as iniciais. */}
                            <button
                                type="button"
                                onClick={() => seletorFoto.current?.click()}
                                disabled={enviandoFoto}
                                title="Alterar foto de perfil"
                                className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-xl font-bold text-white shadow-lg shadow-emerald-500/25 focus-visible:ring-4 focus-visible:ring-emerald-500/30 focus-visible:outline-none sm:h-20 sm:w-20"
                            >
                                {auth.user.avatar ? (
                                    <img
                                        src={auth.user.avatar as string}
                                        alt={`Foto de ${auth.user.name}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    iniciais || <User className="size-6" />
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                                    {enviandoFoto ? (
                                        <Loader2 className="size-5 animate-spin" />
                                    ) : (
                                        <Camera className="size-5" />
                                    )}
                                </span>
                            </button>
                            <input
                                ref={seletorFoto}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={enviarFoto}
                            />
                            <div className="flex items-center gap-2 text-[11px] font-semibold">
                                <button
                                    type="button"
                                    onClick={() => seletorFoto.current?.click()}
                                    disabled={enviandoFoto}
                                    className="text-emerald-600 hover:underline disabled:opacity-50"
                                >
                                    {auth.user.avatar
                                        ? 'Alterar foto'
                                        : 'Adicionar foto'}
                                </button>
                                {auth.user.avatar && (
                                    <button
                                        type="button"
                                        onClick={removerFoto}
                                        disabled={enviandoFoto}
                                        className="text-muted-foreground hover:text-red-500 disabled:opacity-50"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="mb-0.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                                Perfil
                            </p>
                            <h2 className="text-lg font-bold tracking-tight text-foreground">
                                Informações do perfil
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Atualize seu nome e endereço de e-mail
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
                                        Nome
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
                                            placeholder="Nome completo"
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
                                        Endereço de e-mail
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
                                            placeholder="Endereço de e-mail"
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
                                                    Seu endereço de e-mail não
                                                    foi verificado.{' '}
                                                    <Link
                                                        href={send()}
                                                        as="button"
                                                        className="font-semibold underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
                                                    >
                                                        Clique aqui para
                                                        reenviar o e-mail de
                                                        verificação.
                                                    </Link>
                                                </p>

                                                {status ===
                                                    'verification-link-sent' && (
                                                    <p className="mt-2 flex items-center gap-1.5 font-semibold text-emerald-600">
                                                        <CheckCircle2 className="size-4" />
                                                        Um novo link de
                                                        verificação foi enviado
                                                        para seu e-mail.
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
                                        Salvar
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
            title: 'Configurações de perfil',
            href: edit(),
        },
    ],
};
