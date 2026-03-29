import FuelForm from '@/components/FuelForm';

export const metadata = { title: 'Edit Fuel Entry | Fuel Manager' };

export default async function EditPage({ params }) {
  const { id } = await params;
  return <FuelForm id={id} />;
}
