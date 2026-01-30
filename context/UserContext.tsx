import React, { createContext, useContext, useEffect, useState } from 'react';
import { storage } from '../utils/storage';
import { User, Currency } from '../utils/types';
import { toast } from 'react-hot-toast';

interface UserContextType {
    user: User | null;
    currency: Currency;
    loading: boolean;
    setCurrency: (currency: Currency) => Promise<void>;
    refreshUser: () => Promise<void>;
    login: (user: User) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [currency, setCurrencyState] = useState<Currency>('USD');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initUser = async () => {
            const storedUser = storage.getCurrentUser();
            if (storedUser) {
                setUser(storedUser);
                setCurrencyState(storedUser.preferredCurrency || 'USD');
            }
            setLoading(false);
        };
        initUser();
    }, []);

    const setCurrency = async (newCurrency: Currency) => {
        if (!user) return;
        try {
            await storage.updateUser(user.id, { preferredCurrency: newCurrency });
            const updatedUser = { ...user, preferredCurrency: newCurrency };
            storage.setCurrentUser(updatedUser);
            setUser(updatedUser);
            setCurrencyState(newCurrency);
        } catch (err) {
            toast.error("Failed to update currency preference");
            console.error(err);
        }
    };

    const refreshUser = async () => {
        if (!user) return;
        const updated = await storage.getUserById(user.id);
        if (updated) {
            setUser(updated);
            storage.setCurrentUser(updated);
            setCurrencyState(updated.preferredCurrency || 'USD');
        }
    };

    const login = (userData: User) => {
        storage.setCurrentUser(userData);
        setUser(userData);
        setCurrencyState(userData.preferredCurrency || 'USD');
    };

    const logout = () => {
        storage.removeCurrentUser();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <UserContext.Provider value={{ user, currency, loading, setCurrency, refreshUser, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
