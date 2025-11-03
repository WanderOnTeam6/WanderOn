import { getToken } from '@/lib/api';
import { Redirect, Stack } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ProtectedLayout() {
    const [loading, setLoading] = useState(true);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        (async () => {
            const t = await getToken();
            setOk(!!t);
            setLoading(false);
        })();
    }, []);

    if (loading) return null;
    if (!ok) return <Redirect href="/onboarding" />;

    return <Stack screenOptions={{ headerShown: false }} />;
}
