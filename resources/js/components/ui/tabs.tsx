import React, { createContext, useContext, useState } from 'react';

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({ defaultValue, children, className = '' }: { defaultValue: string; children: React.ReactNode; className?: string }) {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={`w-full ${className}`}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`inline-flex items-center justify-center rounded-2xl bg-muted/60 p-1.5 text-muted-foreground ${className}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within a Tabs component');

    const { activeTab, setActiveTab } = context;
    const isActive = activeTab === value;

    return (
        <button
            type="button"
            onClick={() => setActiveTab(value)}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none ${
                isActive 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            } ${className}`}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className = '' }: { value: string; children: React.ReactNode; className?: string }) {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within a Tabs component');

    if (context.activeTab !== value) return null;

    return (
        <div className={`mt-4 focus-visible:outline-none ${className}`}>
            {children}
        </div>
    );
}