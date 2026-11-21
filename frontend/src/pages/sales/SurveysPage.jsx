import React, { useState, useEffect } from 'react';
import PageShell from './PageShell';
import { Button, Table, Badge, Modal, Input, Select, Card } from './ui';
import { surveysApi, customersApi } from '../../api/sales';
import { mockUsers } from '../../mocks/sales/users';

export const SurveysPage = () => {
  const [surveys, setSurveys] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [surveyorFilter, setSurveyorFilter] = useState('all');

  // Schedule Survey Modal
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    customerId: '',
    scheduledDate: '',
    surveyorId: 'user_survey_1',
    address: '',
    notes: '',
  });

  // Complete Survey Modal
  const [completingSurvey, setCompletingSurvey] = useState(null);
  const [completionData, setCompletionData] = useState({
    roofType: 'rcc',
    roofArea: '400',
    shading: 'none',
    recommendedKw: '3',
    cableDistance: '15',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const surveyors = mockUsers.filter(u => u.role === 'surveyor');

  const loadData = async () => {
    setLoading(true);
    try {
      const [surveysRes, customersRes] = await Promise.all([
        surveysApi.getSurveys({ search, status: statusFilter, surveyorId: surveyorFilter }),
        customersApi.getCustomers(),
      ]);
      if (surveysRes.success) setSurveys(surveysRes.data);
      if (customersRes.success) setCustomers(customersRes.data);
    } catch (err) {
      console.error('Failed to load surveys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, surveyorFilter]);

  const handleOpenScheduleModal = () => {
    setScheduleData({
      customerId: customers[0]?.id || '',
      scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      surveyorId: 'user_survey_1',
      address: '',
      notes: '',
    });
    setIsScheduleOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleData.customerId) {
      alert('Please select a customer for the site survey');
      return;
    }

    setSubmitting(true);
    try {
      await surveysApi.scheduleSurvey(scheduleData);
      setIsScheduleOpen(false);
      await loadData();
    } catch (err) {
      alert(`Error scheduling survey: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCompleteModal = (survey) => {
    setCompletingSurvey(survey);
    setCompletionData({
      roofType: survey.roofType || 'rcc',
      roofArea: survey.roofArea || '450',
      shading: survey.shading || 'none',
      recommendedKw: survey.recommendedKw || '3',
      cableDistance: survey.cableDistance || '15',
      notes: survey.notes || '',
    });
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingSurvey) return;

    setSubmitting(true);
    try {
      await surveysApi.completeSurvey(completingSurvey.id, completionData);
      setCompletingSurvey(null);
      await loadData();
    } catch (err) {
      alert(`Error saving survey: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Customer & Site',
      key: 'customerName',
      render: (_, row) => (
        <div>
          <a
            href={`/sales/customers/${row.customerId}`}
            className="font-semibold text-slate-900 hover:text-amber-600 transition-colors block"
          >
            {row.customerName}
          </a>
          <div className="text-xs text-slate-500 mt-0.5">
            {row.customerPhone} · {row.customerCity || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Visit Schedule',
      key: 'scheduledDate',
      render: (val) => (
        <div>
          <div className="font-medium text-slate-800 text-xs">
            {new Date(val).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <div className="text-[11px] text-slate-400">
            {new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ),
    },
    {
      title: 'Technician / Surveyor',
      key: 'surveyorName',
      render: (val) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{val}</span>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (val) => <Badge statusKey={val}>{val}</Badge>,
    },
    {
      title: 'Roof & Shading Audit',
      key: 'audit',
      render: (_, row) => {
        if (row.status !== 'completed') {
          return <span className="text-xs text-slate-400 italic">Audit pending visit</span>;
        }
        return (
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-slate-800">
              {row.recommendedKw || 3} kW · <span className="capitalize">{row.roofType?.replace('_', ' ')}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {row.roofArea} sq.ft. · Shading: {row.shading} · Cable: {row.cableDistance || 15}m
            </div>
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => {
        const isCompleted = row.status === 'completed';
        return (
          <div className="flex items-center justify-end gap-2">
            {!isCompleted ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenCompleteModal(row)}
              >
                Mark Complete
              </Button>
            ) : (
              <a
                href={`/sales/quotations/new?customerId=${row.customerId}&surveyId=${row.id}&recommendedKw=${row.recommendedKw || 3}`}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Build Quotation →
              </a>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <PageShell
      title="Site Surveys"
      subtitle="Schedule technical visits, measure shadow-free roof space, assess electrical cable run, and recommend kW."
      breadcrumbs={[{ label: 'Site Surveys' }]}
      actions={
        <Button variant="primary" onClick={handleOpenScheduleModal}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Schedule Site Survey
        </Button>
      }
    >
      <Card className="mb-6" bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Search by customer name, city, surveyor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Survey Statuses' },
              { value: 'scheduled', label: 'Scheduled Visits' },
              { value: 'completed', label: 'Completed Audits' },
            ]}
          />
          <Select
            value={surveyorFilter}
            onChange={(e) => setSurveyorFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Technicians' },
              ...surveyors.map(s => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
      </Card>

      <Table
        columns={columns}
        data={surveys}
        isLoading={loading}
        emptyMessage="No surveys found. Click 'Schedule Site Survey' to schedule one."
      />

      {/* Schedule Survey Modal */}
      <Modal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        title="Schedule Technician Site Survey"
        subtitle="Homeowner enquiry confirmed. Dispatching technician to inspect shadow-free roof and wiring."
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleScheduleSubmit}>
              Schedule Visit
            </Button>
          </>
        }
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-4">
          <Select
            label="Select Customer"
            required
            value={scheduleData.customerId}
            onChange={(e) => {
              const cust = customers.find(c => c.id === e.target.value);
              setScheduleData({
                ...scheduleData,
                customerId: e.target.value,
                address: cust ? cust.address : scheduleData.address,
              });
            }}
            options={customers.map(c => ({
              value: c.id,
              label: `${c.name} (${c.city}) - ${c.phone}`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={scheduleData.scheduledDate}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <Select
              label="Assigned Surveyor"
              required
              value={scheduleData.surveyorId}
              onChange={(e) => setScheduleData({ ...scheduleData, surveyorId: e.target.value })}
              options={surveyors.map(s => ({ value: s.id, label: `${s.name} (${s.phone})` }))}
            />
          </div>

          <Input
            label="Site Address"
            placeholder="Terrace / Rooftop location"
            value={scheduleData.address}
            onChange={(e) => setScheduleData({ ...scheduleData, address: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions for Surveyor</label>
            <textarea
              rows="2"
              placeholder="Check shading from nearby water tanks or tall trees..."
              value={scheduleData.notes}
              onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </form>
      </Modal>

      {/* Mark Complete Survey Modal */}
      {completingSurvey && (
        <Modal
          isOpen={Boolean(completingSurvey)}
          onClose={() => setCompletingSurvey(null)}
          title={`Complete Site Survey: ${completingSurvey.customerName}`}
          subtitle="Record rooftop measurements and technical recommendations."
          maxWidth="max-w-lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setCompletingSurvey(null)}>
                Cancel
              </Button>
              <Button variant="success" loading={submitting} onClick={handleCompleteSubmit}>
                Confirm & Mark Complete
              </Button>
            </>
          }
        >
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Roof Type"
                required
                value={completionData.roofType}
                onChange={(e) => setCompletionData({ ...completionData, roofType: e.target.value })}
                options={[
                  { value: 'rcc', label: 'RCC / Concrete Flat Roof' },
                  { value: 'concrete_flat', label: 'Concrete Flat Roof' },
                  { value: 'slanted_tin', label: 'Slanted Tin Sheet' },
                  { value: 'slanted_tile', label: 'Slanted Tile Roof' },
                ]}
              />

              <Input
                label="Usable Roof Area (sq. ft.)"
                type="number"
                required
                placeholder="e.g. 450"
                value={completionData.roofArea}
                helperText="1 kW requires ~100 sq.ft. shadow-free"
                onChange={(e) => setCompletionData({ ...completionData, roofArea: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Shading Analysis"
                required
                value={completionData.shading}
                onChange={(e) => setCompletionData({ ...completionData, shading: e.target.value })}
                options={[
                  { value: 'none', label: 'None (Full Sun all day)' },
                  { value: 'partial', label: 'Partial Shadow' },
                  { value: 'heavy', label: 'Heavy Shading' },
                ]}
              />

              <Select
                label="Recommended kW Capacity"
                required
                value={completionData.recommendedKw}
                onChange={(e) => setCompletionData({ ...completionData, recommendedKw: e.target.value })}
                options={[
                  { value: '1', label: '1 kW (Small Home)' },
                  { value: '2', label: '2 kW' },
                  { value: '3', label: '3 kW (Standard Home - 6 panels)' },
                  { value: '4', label: '4 kW' },
                  { value: '5', label: '5 kW (Commercial / Villa)' },
                ]}
              />
            </div>

            <Input
              label="Cable Run Distance (Meters)"
              type="number"
              placeholder="e.g. 15"
              value={completionData.cableDistance}
              helperText="Cable length from panels to inverter"
              onChange={(e) => setCompletionData({ ...completionData, cableDistance: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Remarks</label>
              <textarea
                rows="3"
                placeholder="Structural stability notes, inverter mounting room..."
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </form>
        </Modal>
      )}
    </PageShell>
  );
};

export default SurveysPage;
