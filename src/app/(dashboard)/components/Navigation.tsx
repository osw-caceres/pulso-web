'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
    userRole: string | null;
}

export function Navigation({ userRole }: NavigationProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const isAdmin = userRole === 'admin';

    return (
        <nav>


            {isAdmin ? (
                <>
                    <Link
                        href="/admin"
                        className={isActive('/') ? 'active' : ''}
                    >
                        Inicio
                    </Link>
                    <Link
                        href="/admin/campaigns/create"
                        className={isActive('/admin/campaigns/create') ? 'active' : ''}
                    >
                        Crear campaña
                    </Link>
                    <Link
                        href="/admin/campaigns"
                        className={isActive('/admin/campaigns') ? 'active' : ''}
                    >
                        Campañas activas
                    </Link>
                    <Link
                        href="/admin/locations/create"
                        className={isActive('/admin/locations/create') ? 'active' : ''}
                    >
                        Crear locacion
                    </Link>
                    <Link
                        href="/admin/locations"
                        className={isActive('/admin/locations') ? 'active' : ''}
                    >
                        Ver locaciones
                    </Link>
                    <Link
                        href="/admin/history"
                        className={isActive('/admin/history') ? 'active' : ''}
                    >
                        Historial
                    </Link>
                </>
            ) : (
                <>
                    <Link
                        href="/"
                        className={isActive('/') ? 'active' : ''}
                    >
                        Inicio
                    </Link>
                    <Link
                        href="/campaigns"
                        className={isActive('/campaigns') ? 'active' : ''}
                    >
                        Buscar campañas
                    </Link>
                    <Link
                        href="/history"
                        className={isActive('/history') ? 'active' : ''}
                    >
                        Historial
                    </Link>
                    <Link
                        href="/profile"
                        className={isActive('/profile') ? 'active' : ''}
                    >
                        Perfil
                    </Link>
                    <Link
                        href="/help"
                        className={isActive('/help') ? 'active' : ''}
                    >
                        Ayuda
                    </Link>
                </>
            )}





        </nav>
    );
}