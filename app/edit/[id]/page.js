import FuelForm from '@/components/FuelForm';

export const metadata = { title: 'Edit Fuel Entry | Fuel Manager' };

export default function EditPage({ params }) {
  return <FuelForm id={params.id} />;
}
