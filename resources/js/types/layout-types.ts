import { ReactNode } from 'react';
import { User } from './index';

export interface AuthenticatedLayoutProps {
    user?: User;
    header?: ReactNode;
    children: ReactNode;
}