import React, { useState, useEffect } from 'react';
import PageShell from './PageShell';
import { Button, Table, Modal, Input, Card } from './ui';
import { customersApi, surveysApi } from '../../api/sales';
import { mockUsers } from '../../mocks/sales/users';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  // Add Customer Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    monthlyBill: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Quick Schedule Survey Modal
  const [surveyModalCustomer, setSurveyModalCustomer] = useState(null);
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyorId, setSurveyorId] = useState('user_survey_1');
  const [surveyNotes, setSurveyNotes] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomers({ search, city: cityFilter });
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, cityFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      city: '',
      address: '',
      monthlyBill: '',
      notes: '',
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name?.trim()) errors.name = 'Customer name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.city?.trim()) errors.city = 'City is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await customersApi.createCustomer(formData);
      setIsAddModalOpen(false);
      await loadCustomers();
    } catch (err) {
      alert(`Error creating customer: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSurvey = async (e) => {
    e.preventDefault();
    if (!surveyModalCustomer) return;
    try {
      await surveysApi.scheduleSurvey({
        customerId: surveyModalCustomer.id,
        scheduledDate: surveyDate || new Date(Date.now() + 86400000).toISOString(),
        surveyorId,
        notes: surveyNotes,
      });
      alert(`Survey scheduled successfully for ${surveyModalCustomer.name}`);
      setSurveyModalCustomer(null);
      await loadCustomers();
    } catch (err) {
      alert(`Failed to schedule survey: ${err.message}`);
    }
  };

  const columns = [
    {
      title: 'Customer Name',
      key: 'name',
      render: (_, row) => (
        <a
          href={`/sales/customers/${row.id}`}
          className="font-semibold text-slate-900 hover:text-amber-600 transition-colors block"
        >
          {row.name}
          <span className="block text-xs font-normal text-slate-500 mt-0.5">{row.phone}</span>
        </a>
      ),
    },
    {
      title: 'City & Address',
      key: 'city',
      render: (_, row) => (
        <div>
          <span className="font-medium text-slate-800">{row.city}</span>
          <span className="block text-xs text-slate-400 truncate max-w-[200px]" title={row.address}>
            {row.address || 'Site address on file'}
          </span>
        </div>
      ),
    },
    {
      title: 'Monthly Bill',
      key: 'monthlyBill',
      render: (val) => (
        <div className="font-semibold text-slate-900">
          ₹{Number(val || 0).toLocaleString('en-IN')}
        </div>
      ),
    },
    {
      title: 'Surveys',
      key: 'surveysCount',
      align: 'center',
      render: (val) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
          val > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {val || 0}
        </span>
      ),
    },
    {
      title: 'Quotations',
      key: 'quotesCount',
      align: 'center',
      render: (val) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
          val > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {val || 0}
        </span>
      ),
    },
    {
      title: 'Orders',
      key: 'ordersCount',
      align: 'center',
      render: (val) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
          val > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
        }`}>
          {val || 0}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setSurveyModalCustomer(row);
              setSurveyDate(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
            }}
          >
            + Survey
          </Button>
          <a
            href={`/sales/customers/${row.id}`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
          >
            View Details →
          </a>
        </div>
      ),
    },
  ];

  const surveyors = mockUsers.filter(u => u.role === 'surveyor');

  return (
    <PageShell
      title="Customers"
      subtitle="Manage registered clients, technical site audits, proposals, and solar installation accounts."
      breadcrumbs={[{ label: 'Customers' }]}
      actions={
        <Button variant="primary" onClick={handleOpenAddModal}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Customer
        </Button>
      }
    >
      <Card className="mb-6" bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            placeholder="Search by customer name, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <div className="flex items-center justify-end text-xs text-slate-500">
            Showing <strong className="mx-1 text-slate-800">{customers.length}</strong> active customer accounts
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={customers}
        isLoading={loading}
        emptyMessage="No customer accounts registered yet. Convert leads to populate."
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
        subtitle="Manually create a customer account without an initial lead."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleAddSubmit}>
              Create Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <Input
            label="Customer Name"
            required
            placeholder="e.g. Ramesh Patel"
            value={formData.name}
            error={formErrors.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              required
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              error={formErrors.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. customer@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              required
              placeholder="e.g. Jaipur"
              value={formData.city}
              error={formErrors.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Monthly Electricity Bill (₹)"
              type="number"
              placeholder="e.g. 5000"
              value={formData.monthlyBill}
              onChange={(e) => setFormData({ ...formData, monthlyBill: e.target.value })}
            />
          </div>
          <Input
            label="Full Address"
            placeholder="Plot number, Street, Landmark"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </form>
      </Modal>

      {/* Quick Schedule Survey Modal */}
      {surveyModalCustomer && (
        <Modal
          isOpen={Boolean(surveyModalCustomer)}
          onClose={() => setSurveyModalCustomer(null)}
          title={`Schedule Site Survey: ${surveyModalCustomer.name}`}
          subtitle="Assign technician to inspect roof orientation, shading, and cable route."
          maxWidth="max-w-md"
          footer={
            <>
              <Button variant="outline" onClick={() => setSurveyModalCustomer(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleScheduleSurvey}>
                Confirm Survey Visit
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Technician / Surveyor</label>
              <select
                value={surveyorId}
                onChange={(e) => setSurveyorId(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                {surveyors.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Instructions</label>
              <textarea
                rows="2"
                placeholder="Specific instructions for rooftop access, ladder requirement, etc."
                value={surveyNotes}
                onChange={(e) => setSurveyNotes(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default CustomersPage;
