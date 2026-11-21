import React, { useState, useEffect, useMemo } from 'react';
import PageShell from './PageShell';
import { Button, Table, Badge, Modal, Input, Select, Card } from './ui';
import { leadsApi } from '../../api/sales';
import { ensureOk } from './salesHelpers';
import { mockUsers } from '../../mocks/sales/users';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'survey_scheduled', label: 'Survey Scheduled' },
  { value: 'survey_completed', label: 'Survey Completed' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: 'Website Form' },
  { value: 'whatsapp', label: 'WhatsApp Inquiry' },
  { value: 'referral', label: 'Customer Referral' },
  { value: 'call', label: 'Direct Phone Call' },
];

export const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [salesRepFilter, setSalesRepFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    source: 'website',
    monthlyBill: '',
    systemCapacityNeeded: '3',
    systemType: 'on_grid',
    assignedToId: 'user_sales_1',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Conversion Success Dialog
  const [conversionModal, setConversionModal] = useState({
    isOpen: false,
    customer: null,
  });

  const salesUsers = useMemo(() => {
    return mockUsers.filter(u => u.role === 'sales');
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await leadsApi.getLeads({
        search,
        status: statusFilter,
        source: sourceFilter,
        assignedTo: salesRepFilter,
      });
      if (res.success) {
        setLeads(res.data);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [search, statusFilter, sourceFilter, salesRepFilter]);

  const handleOpenAddModal = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: '',
      address: '',
      source: 'website',
      monthlyBill: '',
      systemCapacityNeeded: '3',
      systemType: 'on_grid',
      assignedToId: 'user_sales_1',
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      city: lead.city || '',
      address: lead.address || '',
      source: lead.source || 'website',
      monthlyBill: lead.monthlyBill || '',
      systemCapacityNeeded: lead.systemCapacityNeeded || '3',
      systemType: lead.systemType || 'on_grid',
      assignedToId: lead.assignedTo?.id || 'user_sales_1',
      notes: lead.notes || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Full name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.city?.trim()) errors.city = 'City is required';
    if (!formData.monthlyBill || Number(formData.monthlyBill) <= 0) {
      errors.monthlyBill = 'Valid monthly electricity bill is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const assignedUser = salesUsers.find(u => u.id === formData.assignedToId) || {
        id: 'user_sales_1',
        name: 'Rahul Sharma',
      };

      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        address: formData.address,
        source: formData.source,
        monthlyBill: Number(formData.monthlyBill),
        systemCapacityNeeded: Number(formData.systemCapacityNeeded),
        systemType: formData.systemType,
        assignedTo: {
          id: assignedUser.id,
          name: assignedUser.name,
        },
        notes: formData.notes,
      };

      if (editingLead) {
        ensureOk(await leadsApi.updateLead(editingLead.id, payload));
      } else {
        ensureOk(await leadsApi.createLead(payload));
      }

      setIsModalOpen(false);
      await loadLeads();
    } catch (err) {
      console.error('Failed to save lead:', err);
      setFormErrors({ submit: err.message || 'Failed to save lead' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      ensureOk(await leadsApi.updateLeadStatus(leadId, newStatus));
      await loadLeads();
    } catch (err) {
      console.error('Failed to change status:', err);
      alert(`Could not change status: ${err.message}`);
      await loadLeads();
    }
  };

  const handleConvertToCustomer = async (lead) => {
    if (lead.status === 'converted' && lead.customerId) {
      window.location.href = `/sales/customers/${lead.customerId}`;
      return;
    }

    if (!window.confirm(`Convert lead "${lead.name}" to an official Customer record?`)) {
      return;
    }

    try {
      const res = ensureOk(await leadsApi.convertLead(lead.id, { email: lead.email, address: lead.address }));
      if (res.success && res.data) {
        await loadLeads();
        setConversionModal({
          isOpen: true,
          customer: res.data,
        });
      }
    } catch (err) {
      alert(`Conversion failed: ${err.message}`);
    }
  };

  const kpis = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter(l => l.status === 'new').length;
    const surveyCount = leads.filter(l => l.status === 'survey_scheduled' || l.status === 'survey_completed').length;
    const convertedCount = leads.filter(l => l.status === 'converted').length;
    return { total, newCount, surveyCount, convertedCount };
  }, [leads]);

  const columns = [
    {
      title: 'Lead Name & Contact',
      key: 'name',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-slate-900 hover:text-amber-600 transition-colors">
            {row.name}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
            <span>{row.phone}</span>
            {row.email && <span>• {row.email}</span>}
          </div>
        </div>
      ),
    },
    {
      title: 'City & Location',
      key: 'city',
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.city || 'N/A'}</div>
          <div className="text-[11px] text-slate-400 truncate max-w-[180px]" title={row.address}>
            {row.address || 'Address pending'}
          </div>
        </div>
      ),
    },
    {
      title: 'Source',
      key: 'source',
      render: (val) => {
        const sourceLabels = {
          website: { text: 'Website Form', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          whatsapp: { text: 'WhatsApp', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
          referral: { text: 'Referral', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
          call: { text: 'Inbound Call', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
        };
        const s = sourceLabels[val] || { text: val, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border ${s.bg}`}>
            {s.text}
          </span>
        );
      },
    },
    {
      title: 'Monthly Bill',
      key: 'monthlyBill',
      render: (val, row) => (
        <div>
          <div className="font-semibold text-slate-900">
            ₹{Number(val || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-600 font-medium">
            Est: {row.systemCapacityNeeded || 3} kW ({row.systemType === 'off_grid' ? 'Off-Grid' : 'On-Grid'})
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (val, row) => (
        <div className="flex items-center gap-1.5">
          <Badge statusKey={val}>{val}</Badge>
          <select
            value={val}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
            className="text-[10px] bg-transparent text-slate-400 hover:text-slate-700 border-none focus:ring-0 cursor-pointer p-0.5"
            title="Quick update status"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="survey_scheduled">Survey Scheduled</option>
            <option value="survey_completed">Survey Completed</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      ),
    },
    {
      title: 'Assigned To',
      key: 'assignedTo',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
            {val?.name ? val.name.slice(0, 2).toUpperCase() : 'SP'}
          </div>
          <span className="text-xs text-slate-700 font-medium">{val?.name || 'Unassigned'}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => {
        const isConverted = row.status === 'converted';
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md text-xs"
              title="Edit lead details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {isConverted ? (
              <a
                href={`/sales/customers/${row.customerId || ''}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <span>Customer</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleConvertToCustomer(row)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                Convert to Customer
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageShell
      title="Sales Leads"
      subtitle="Track inquiries, qualify electricity usage, schedule site visits, and convert to customers."
      breadcrumbs={[{ label: 'Leads' }]}
      actions={
        <Button variant="primary" onClick={handleOpenAddModal} size="md">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Lead
        </Button>
      }
    >
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-slate-400">Total Leads</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all inquiry channels</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-blue-500">New Inquiries</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{kpis.newCount}</div>
          <div className="text-[11px] text-blue-600/80 mt-1">Pending first sales call</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-amber-500">In Site Survey</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{kpis.surveyCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-1">Technical inspection stage</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-medium text-emerald-500">Converted Customers</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{kpis.convertedCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Ready for Quotation & Order</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-6" bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Input
              placeholder="Search by name, phone, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              options={SOURCE_OPTIONS}
            />
          </div>
          <div>
            <Select
              value={salesRepFilter}
              onChange={(e) => setSalesRepFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Sales Reps' },
                ...salesUsers.map(u => ({ value: u.id, label: u.name })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Main Leads Table */}
      <Table
        columns={columns}
        data={leads}
        isLoading={loading}
        emptyMessage="No leads found matching your criteria. Click 'Add New Lead' to create one."
      />

      {/* Add / Edit Lead Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLead ? `Edit Lead: ${editingLead.name}` : 'New Solar Inquiry Lead'}
        subtitle="Capture customer contact details, rooftop bill requirements, and assign sales agent."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={submitting}
              onClick={handleFormSubmit}
            >
              {editingLead ? 'Update Lead' : 'Create Lead'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Ramesh Chandra"
              value={formData.name}
              error={formErrors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Phone Number"
              required
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              error={formErrors.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. ramesh@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="City / District"
              required
              placeholder="e.g. Jaipur"
              value={formData.city}
              error={formErrors.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <Input
            label="Full Site Address"
            placeholder="Plot / House number, Colony / Landmark"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monthly Electricity Bill (₹)"
              type="number"
              required
              placeholder="e.g. 4500"
              value={formData.monthlyBill}
              error={formErrors.monthlyBill}
              helperText="Determines solar capacity needed (₹1,000 bill ~ 1 kW)"
              onChange={(e) => setFormData({ ...formData, monthlyBill: e.target.value })}
            />
            <Select
              label="Inquiry Source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              options={[
                { value: 'website', label: 'Website Form' },
                { value: 'whatsapp', label: 'WhatsApp Inquiry' },
                { value: 'referral', label: 'Customer Referral' },
                { value: 'call', label: 'Direct Phone Call' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Desired System Type"
              value={formData.systemType}
              onChange={(e) => setFormData({ ...formData, systemType: e.target.value })}
              options={[
                { value: 'on_grid', label: 'On-Grid (Connected to Electricity Grid)' },
                { value: 'off_grid', label: 'Off-Grid (With Battery Backup)' },
              ]}
            />
            <Select
              label="Estimated System Capacity (kW)"
              value={formData.systemCapacityNeeded}
              onChange={(e) => setFormData({ ...formData, systemCapacityNeeded: e.target.value })}
              options={[
                { value: '1', label: '1 kW (Approx 2-3 panels)' },
                { value: '2', label: '2 kW (Approx 4 panels)' },
                { value: '3', label: '3 kW (Standard Home - 6 panels)' },
                { value: '4', label: '4 kW (8 panels)' },
                { value: '5', label: '5 kW (10 panels / Villa)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Sales Representative"
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              options={salesUsers.map(u => ({ value: u.id, label: `${u.name} (Sales)` }))}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Notes</label>
              <textarea
                rows="2"
                placeholder="Rooftop type, customer preferences, best time to call..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Successful Conversion Popup Modal */}
      {conversionModal.isOpen && (
        <Modal
          isOpen={conversionModal.isOpen}
          onClose={() => setConversionModal({ isOpen: false, customer: null })}
          title="Lead Converted to Customer!"
          subtitle="The customer account is now verified and active in SunPower Solutions."
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="outline"
                onClick={() => setConversionModal({ isOpen: false, customer: null })}
              >
                Close
              </Button>
              <a
                href={`/sales/customers/${conversionModal.customer?.id}`}
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
              >
                View Customer Profile →
              </a>
            </div>
          }
        >
          <div className="py-2 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">{conversionModal.customer?.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{conversionModal.customer?.city} · {conversionModal.customer?.phone}</p>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Customer record created successfully. You can now schedule a technician site survey or prepare quotation packages.
            </p>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default LeadsPage;
