export default function AppLogo() {
    return (
        <div className="flex items-center">
            <div className="flex aspect-square size-11 shrink-0 items-center justify-center overflow-hidden text-sidebar-primary-foreground">
                <img
                    src="/logo.png"
                    alt="Logo PayFlow"
                    className="size-full object-contain p-1"
                />
            </div>
            <div className="ml-1.5 grid flex-1 text-left">
                <span className="truncate text-base leading-tight font-bold tracking-tight">
                    PayFlow-Sistemas
                </span>
            </div>
        </div>
    );
}