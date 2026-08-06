import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { invoicesAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Taxes() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesAPI.getAll()
      .then(({ data }) => setInvoices(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalGst = invoices.reduce((sum, inv) => sum + (inv.gst || 0), 0);
  const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
  const paidGst = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + (inv.gst || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Receipt className="text-myth-accent" size={24} /> Taxes & GST
        </h1>
        <p className="text-gray-400 mt-1">GST summary and tax reports from invoices</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-sm text-gray-400">Total GST</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalGst)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-400">Total Tax</p><p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalTax)}</p></div>
        <div className="stat-card"><p className="text-sm text-gray-400">GST Collected (Paid)</p><p className="text-2xl font-bold text-green-400 mt-1">{formatCurrency(paidGst)}</p></div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-header">Invoice #</th>
              <th className="table-header">Subtotal</th>
              <th className="table-header">GST</th>
              <th className="table-header">Tax</th>
              <th className="table-header">Total</th>
              <th className="table-header">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={6} className="table-cell text-center text-gray-500 py-8">No invoice data</td></tr>
            ) : invoices.map((inv) => (
              <tr key={inv._id} className="border-t border-myth-border">
                <td className="table-cell">{inv.invoiceNumber}</td>
                <td className="table-cell">{formatCurrency(inv.subtotal)}</td>
                <td className="table-cell">{formatCurrency(inv.gst)}</td>
                <td className="table-cell">{formatCurrency(inv.tax)}</td>
                <td className="table-cell">{formatCurrency(inv.total)}</td>
                <td className="table-cell capitalize">{inv.status?.replace(/_/g, ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
