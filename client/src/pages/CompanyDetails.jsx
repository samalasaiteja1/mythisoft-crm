import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, Mail, Phone, Users } from 'lucide-react';
import { companiesAPI, formatCurrency } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CompanyDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companiesAPI.getOne(id).then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data?.company) return <div className="text-center text-gray-400 py-12">Company not found</div>;

  const { company, contacts, deals } = data;

  return (
    <div className="space-y-6">
      <Link to="/companies" className="inline-flex items-center gap-2 text-gray-400 hover:text-myth-accent text-sm"><ArrowLeft size={16} /> Back to Companies</Link>
      <div className="card">
        <h1 className="text-2xl font-bold text-white">{company.name}</h1>
        <p className="text-gray-400 mt-1">{company.industry}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {company.website && <span className="flex items-center gap-2 text-sm text-gray-300"><Globe size={14} className="text-myth-accent" />{company.website}</span>}
          {company.email && <span className="flex items-center gap-2 text-sm text-gray-300"><Mail size={14} className="text-myth-accent" />{company.email}</span>}
          {company.phone && <span className="flex items-center gap-2 text-sm text-gray-300"><Phone size={14} className="text-myth-accent" />{company.phone}</span>}
        </div>
        {company.description && <p className="text-gray-300 text-sm mt-4 leading-relaxed">{company.description}</p>}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users size={18} className="text-myth-accent" /> Contacts ({contacts?.length || 0})</h3>
          {contacts?.map((c) => (
            <div key={c._id} className="p-3 rounded-lg bg-myth-surface/50 mb-2">
              <p className="text-white text-sm font-medium">{c.firstName} {c.lastName}</p>
              <p className="text-xs text-gray-400">{c.title} · {c.email}</p>
            </div>
          )) || <p className="text-gray-500 text-sm">No contacts</p>}
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Deals ({deals?.length || 0})</h3>
          {deals?.map((d) => (
            <div key={d._id} className="flex justify-between p-3 rounded-lg bg-myth-surface/50 mb-2">
              <p className="text-white text-sm">{d.title}</p>
              <p className="text-myth-accent text-sm font-semibold">{formatCurrency(d.value)}</p>
            </div>
          )) || <p className="text-gray-500 text-sm">No deals</p>}
        </div>
      </div>
    </div>
  );
}
