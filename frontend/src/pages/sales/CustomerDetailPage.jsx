import React, { useState, useEffect } from 'react';
import PageShell from './PageShell';
import { Button, Card, Tabs, Badge, Modal, Input, Select } from './ui';
import { customersApi, surveysApi, quotationsApi } from '../../api/sales';
import { ensureOk } from './salesHelpers';
import { mockUsers } from '../../mocks/sales/users';

export const CustomerDetailPage = ({ customerId: propCustomerId }) => {
  const getCustomerIdFromUrl = () => {
    if (propCustomerId) return propCustomerId;
    if (typeof window !== 'undefined') {
      const parts = window.location.pathname.split('/');
      const idIdx = parts.indexOf('customers') + 1;
      if (idIdx > 0 && parts[idIdx]) {
        return parts[idIdx];
      }
    }
    return 'cust_001';
  };

  const customerId = getCustomerIdFromUrl();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Schedule Survey Modal
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [surveyFormData, setSurveyFormData] = useState({
    scheduledDate: '',
    surveyorId: 'user_survey_1',
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

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const res = await customersApi.getCustomerById(customerId);
      if (res.success && res.data) {
        setCustomer(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const handleScheduleSurvey = async (e) => {
    e.preventDefault();
    try {
      ensureOk(await surveysApi.scheduleSurvey({
        customerId: customer.id,
        scheduledDate: surveyFormData.scheduledDate || new Date(Date.now() + 86400000).toISOString(),
        surveyorId: surveyFormData.surveyorId,
        notes: surveyFormData.notes,
      }));
      setIsSurveyModalOpen(false);
      await loadCustomerData();
      setActiveTab('surveys');
    } catch (err) {
      alert(`Failed to schedule survey: ${err.message}`);
    }
  };

  const handleOpenCompleteSurvey = (survey) => {
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

  const handleCompleteSurveySubmit = async (e) => {
    e.preventDefault();
    if (!completingSurvey) return;

    try {
      ensureOk(await surveysApi.completeSurvey(completingSurvey.id, completionData));
      setCompletingSurvey(null);
      await loadCustomerData();
    } catch (err) {
      alert(`Failed to complete survey: ${err.message}`);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    if (!window.confirm('Accept this quotation? This creates a confirmed Order in the system.')) {
      return;
    }
    try {
      const res = ensureOk(await quotationsApi.acceptQuotation(quoteId));
      if (res.success) {
        alert(res.message);
        await loadCustomerData();
        setActiveTab('orders');
      }
    } catch (err) {
      alert(`Error accepting quotation: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <PageShell title="Customer Profile" breadcrumbs={[{ label: 'Customers', path: '/sales/customers' }, { label: 'Loading...' }]}>
        <div className="py-20 text-center text-slate-400">Loading customer profile...</div>
      </PageShell>
    );
  }

  if (!customer) {
    return (
      <PageShell title="Customer Profile" breadcrumbs={[{ label: 'Customers', path: '/sales/customers' }, { label: 'Not Found' }]}>
        <div className="py-20 text-center">
          <h3 className="text-lg font-semibold text-slate-800">Customer record not found</h3>
          <p className="text-sm text-slate-500 mt-1">The requested customer ID does not exist.</p>
          <a href="/sales/customers" className="mt-4 inline-block text-amber-600 font-semibold text-sm">
            ← Back to Customer Directory
          </a>
        </div>
      </PageShell>
    );
  }

  const surveys = customer.surveys || [];
  const quotations = customer.quotations || [];
  const orders = customer.orders || [];

  const tabList = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'surveys', label: 'Site Surveys', badge: surveys.length, icon: '📐' },
    { id: 'quotations', label: 'Quotations', badge: quotations.length, icon: '📋' },
    { id: 'orders', label: 'Orders & Payments', badge: orders.length, icon: '📦' },
  ];

  const surveyors = mockUsers.filter(u => u.role === 'surveyor');

  return (
    <PageShell
      title={customer.name}
      subtitle={`Customer Account · ${customer.city} · ID: ${customer.id}`}
      breadcrumbs={[
        { label: 'Customers', path: '/sales/customers' },
        { label: customer.name },
      ]}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSurveyFormData({
                scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                surveyorId: 'user_survey_1',
                notes: '',
              });
              setIsSurveyModalOpen(true);
            }}
          >
            + Schedule Site Survey
          </Button>
          <a
            href={`/sales/quotations/new?customerId=${customer.id}`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          >
            + Build Quotation
          </a>
        </div>
      }
    >
      <Card className="mb-6" bodyClassName="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-2xl shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{customer.name}</h2>
                {customer.leadId && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Converted Lead #{customer.leadId}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-6 text-xs text-slate-600 mt-2">
                <div>
                  <span className="text-slate-400">Phone: </span>
                  <strong className="text-slate-800">{customer.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Email: </span>
                  <strong className="text-slate-800">{customer.email || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">City: </span>
                  <strong className="text-slate-800">{customer.city}</strong>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <span className="text-slate-400">Address: </span>
                {customer.address || 'Address pending'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 shrink-0">
            <div>
              <div className="text-xs text-slate-400 font-medium">Monthly Electricity Bill</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                ₹{Number(customer.monthlyBill || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-amber-600 font-medium">
                ~ {Math.max(1, Math.round(Number(customer.monthlyBill || 3000) / 1000))} kW solar requirement
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs tabs={tabList} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Solar Feasibility & ROI" bodyClassName="p-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Estimated Annual Power Cost</span>
                  <strong className="text-slate-900 font-semibold">
                    ₹{(Number(customer.monthlyBill || 0) * 12).toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Solar Offset Potential</span>
                  <strong className="text-emerald-600 font-semibold">Up to 85% reduction</strong>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Estimated Payback Period</span>
                  <strong className="text-slate-900 font-semibold">3.2 - 3.8 Years</strong>
                </div>
                <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                  PM Surya Ghar subsidy available for 1kW - 3kW installations.
                </div>
              </div>
            </Card>

            <Card title="Workflow Status" bodyClassName="p-5">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Site Survey</span>
                  <span className="font-semibold text-slate-800">
                    {surveys.length > 0 ? (
                      surveys.some(s => s.status === 'completed') ? (
                        <span className="text-emerald-600">✓ Completed</span>
                      ) : (
                        <span className="text-amber-600">⏳ Scheduled</span>
                      )
                    ) : (
                      <span className="text-slate-400">Not scheduled</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Quotation / BOM</span>
                  <span className="font-semibold text-slate-800">
                    {quotations.length > 0 ? (
                      <span className="text-blue-600">{quotations.length} Quote(s) created</span>
                    ) : (
                      <span className="text-slate-400">Pending survey approval</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">Order Confirmed</span>
                  <span className="font-semibold text-slate-800">
                    {orders.length > 0 ? (
                      <span className="text-emerald-600">✓ Order #{orders[0].orderNumber}</span>
                    ) : (
                      <span className="text-slate-400">Awaiting quotation acceptance</span>
                    )}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="Customer Account Notes" bodyClassName="p-5">
              <p className="text-xs text-slate-600 leading-relaxed">
                {customer.notes || 'No specific notes recorded for this customer yet.'}
              </p>
              {customer.lead && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  Originally registered via {customer.lead.source} on {new Date(customer.createdAt).toLocaleDateString()}.
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: SITE SURVEYS */}
      {activeTab === 'surveys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Technical Roof Surveys</h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setSurveyFormData({
                  scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                  surveyorId: 'user_survey_1',
                  notes: '',
                });
                setIsSurveyModalOpen(true);
              }}
            >
              + Schedule New Survey
            </Button>
          </div>

          {surveys.length === 0 ? (
            <Card bodyClassName="p-8 text-center text-slate-400">
              <p className="text-sm">No site surveys scheduled for this customer yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setIsSurveyModalOpen(true)}
              >
                Schedule First Survey Visit
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {surveys.map((survey) => {
                const isCompleted = survey.status === 'completed';
                return (
                  <Card key={survey.id} className="border border-slate-200">
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">
                          Survey #{survey.id}
                        </div>
                        <Badge statusKey={survey.status}>{survey.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block">Date & Time</span>
                          <span className="font-semibold text-slate-700">
                            {new Date(survey.scheduledDate).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Surveyor</span>
                          <span className="font-semibold text-slate-700">
                            {survey.surveyorName}
                          </span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Roof Structure:</span>
                            <strong className="text-slate-800 capitalize">
                              {survey.roofType?.replace('_', ' ')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Usable Roof Area:</span>
                            <strong className="text-slate-800">{survey.roofArea} sq.ft.</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Shading Obstacles:</span>
                            <strong className="text-slate-800 capitalize">{survey.shading}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Recommended Capacity:</span>
                            <strong className="text-amber-700 font-bold">{survey.recommendedKw} kW</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cable Run Distance:</span>
                            <strong className="text-slate-800">{survey.cableDistance || 15} meters</strong>
                          </div>
                          {survey.notes && (
                            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                              Remarks: {survey.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/70 text-xs text-amber-800">
                          Technician visit pending. Complete the audit once the technician reports rooftop measurements.
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        {!isCompleted ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenCompleteSurvey(survey)}
                          >
                            Mark Completed & Enter Specs
                          </Button>
                        ) : (
                          <a
                            href={`/sales/quotations/new?customerId=${customer.id}&surveyId=${survey.id}&recommendedKw=${survey.recommendedKw}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Build Quotation for {survey.recommendedKw} kW →
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUOTATIONS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Quotations & System Packages</h3>
            <a
              href={`/sales/quotations/new?customerId=${customer.id}`}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
            >
              + Create New Quotation
            </a>
          </div>

          {quotations.length === 0 ? (
            <Card bodyClassName="p-8 text-center text-slate-400">
              <p className="text-sm">No quotations generated for this customer yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <Card key={q.id} bodyClassName="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{q.quotationNumber}</span>
                        <Badge statusKey={q.status}>{q.status}</Badge>
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                          {q.systemCapacityKw || 3} kW System
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Subtotal: ₹{Number(q.subtotal || 0).toLocaleString('en-IN')} + GST ({q.gstRate || 13.8}%) - Discount: ₹{Number(q.discount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Grand Total</div>
                        <div className="text-base font-bold text-slate-900">
                          ₹{Number(q.grandTotal || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {q.status !== 'accepted' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleAcceptQuote(q.id)}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDERS & PAYMENTS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Confirmed Orders & Payments</h3>
          {orders.length === 0 ? (
            <Card bodyClassName="p-8 text-center text-slate-400">
              <p className="text-sm">No orders confirmed yet. Accept a quotation to create an order.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <Card key={ord.id} bodyClassName="p-5">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900">{ord.orderNumber}</h4>
                        <Badge statusKey={ord.status}>{ord.status}</Badge>
                        <Badge statusKey={ord.paymentStatus}>Payment: {ord.paymentStatus}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ord.systemCapacityKw} kW Package</p>
                    </div>
                    <div className="text-right font-bold text-slate-900 text-lg">
                      ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-3 text-xs">
                    <div>Paid Advance: <strong className="text-emerald-700">₹{Number(ord.paidAmount || 0).toLocaleString('en-IN')}</strong></div>
                    <div className="text-right">Pending Balance: <strong className="text-amber-700">₹{Number(ord.balanceAmount || 0).toLocaleString('en-IN')}</strong></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schedule Survey Modal */}
      <Modal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
        title={`Schedule Site Survey for ${customer.name}`}
        subtitle="Technician will inspect roof pitch, shading obstacles, and cable routing."
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsSurveyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleScheduleSurvey}>
              Schedule Visit
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Visit Date & Time</label>
            <input
              type="datetime-local"
              value={surveyFormData.scheduledDate}
              onChange={(e) => setSurveyFormData({ ...surveyFormData, scheduledDate: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Technician</label>
            <select
              value={surveyFormData.surveyorId}
              onChange={(e) => setSurveyFormData({ ...surveyFormData, surveyorId: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            >
              {surveyors.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.phone})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Access Notes</label>
            <textarea
              rows="2"
              placeholder="e.g. Roof access via terrace door. Key with security."
              value={surveyFormData.notes}
              onChange={(e) => setSurveyFormData({ ...surveyFormData, notes: e.target.value })}
              className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>

      {/* Mark Survey Complete Modal */}
      {completingSurvey && (
        <Modal
          isOpen={Boolean(completingSurvey)}
          onClose={() => setCompletingSurvey(null)}
          title={`Complete Site Survey #${completingSurvey.id}`}
          subtitle="Record technician measurements: roof type, usable area, shading, recommended kW capacity."
          maxWidth="max-w-lg"
          footer={
            <>
              <Button variant="outline" onClick={() => setCompletingSurvey(null)}>
                Cancel
              </Button>
              <Button variant="success" onClick={handleCompleteSurveySubmit}>
                Save & Complete Survey
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Roof Type"
                required
                value={completionData.roofType}
                onChange={(e) => setCompletionData({ ...completionData, roofType: e.target.value })}
                options={[
                  { value: 'rcc', label: 'RCC / Concrete Flat Roof' },
                  { value: 'concrete_flat', label: 'Concrete Flat' },
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
                onChange={(e) => setCompletionData({ ...completionData, roofArea: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Shading Obstacles"
                required
                value={completionData.shading}
                onChange={(e) => setCompletionData({ ...completionData, shading: e.target.value })}
                options={[
                  { value: 'none', label: 'None (Full 100% Sunlight)' },
                  { value: 'partial', label: 'Partial (Morning or Evening shade)' },
                  { value: 'heavy', label: 'Heavy Shading' },
                ]}
              />

              <Select
                label="Recommended System Capacity (kW)"
                required
                value={completionData.recommendedKw}
                onChange={(e) => setCompletionData({ ...completionData, recommendedKw: e.target.value })}
                options={[
                  { value: '1', label: '1 kW (Small Home / 2-3 panels)' },
                  { value: '2', label: '2 kW (4 panels)' },
                  { value: '3', label: '3 kW (Standard Home - 6 panels)' },
                  { value: '4', label: '4 kW (8 panels)' },
                  { value: '5', label: '5 kW (Commercial / Villa)' },
                ]}
              />
            </div>

            <Input
              label="Cable Run Distance (Meters)"
              type="number"
              placeholder="e.g. 15"
              value={completionData.cableDistance}
              helperText="Distance from panels to inverter and main AC distribution box"
              onChange={(e) => setCompletionData({ ...completionData, cableDistance: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Technician Inspection Findings</label>
              <textarea
                rows="3"
                placeholder="Rooftop condition, parapet wall height, inverter location recommendations..."
                value={completionData.notes}
                onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
};

export default CustomerDetailPage;
