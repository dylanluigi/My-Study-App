import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { storage } from '../../utils/storage';
import { type UserProfile } from '../../types';

interface UserContextValue extends UserProfile {
    setName: (value: string) => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<UserProfile>(() => storage.getUserProfile());

    useEffect(() => {
        storage.saveUserProfile(profile);
    }, [profile]);

    const setName = (value: string) => {
        setProfile({ name: value.trim() || 'Dylan' });
    };

    return (
        <UserContext.Provider value={{ ...profile, setName }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);

    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }

    return context;
}
