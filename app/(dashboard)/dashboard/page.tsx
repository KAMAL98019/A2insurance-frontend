import { Metadata } from 'next';
import DashboardView from './DashboardView';

export const metadata: Metadata = { title: 'Dashboard | A2 Insurance' };

export default function DashboardPage() {
  return <DashboardView />;
}
