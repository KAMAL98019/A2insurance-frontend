import { Metadata } from 'next';
import LoginForm from '../../../components/auth/LoginForm';

export const metadata: Metadata = { title: 'Sign In | A2 Insurance' };

export default function LoginPage() {
  return <LoginForm />;
}
