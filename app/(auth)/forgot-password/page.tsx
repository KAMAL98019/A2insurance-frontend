import { Metadata } from 'next';
import ForgotPasswordForm from '../../../components/auth/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Forgot Password | A2 Insurance' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
