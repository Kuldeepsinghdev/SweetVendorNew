import { getCustomerSession } from '@/lib/auth/customerSession';
import { InvoiceDisplay } from '@/components/invoice/InvoiceDisplay';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCustomerSession();
  if (!session) {
    redirect(`/login?next=/invoices/${params.id}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/mitra/portal"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal
        </Link>

        {/* Invoice Display */}
        <InvoiceDisplay invoiceId={params.id} />
      </div>
    </div>
  );
}
