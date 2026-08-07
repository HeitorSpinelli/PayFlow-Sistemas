export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-15 items-center justify-center text-sidebar-primary-foreground overflow-hidden">
                <img 
                    src="/logo.svg" 
                    alt="Logo PayFlow" 
                    className="size-full object-contain p-1" 
                />
            </div>
            <div className="ml-1.5 grid flex-1 text-left">
                <span className="truncate leading-tight font-bold text-base tracking-tight">
                    PayFlow-Sistemas
                </span>
            </div>
        </>
    );
}