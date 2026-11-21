import { mockLeads } from './leads';
import { mockCustomers } from './customers';
import { mockSurveys } from './surveys';
import { mockQuotations } from './quotations';
import { mockOrders } from './orders';
import { mockPayments } from './payments';
import { mockProducts } from './products';
import { mockUsers } from './users';
import { mockKitTemplates } from './kitTemplates';

const STORAGE_KEY = 'SUNPOWER_SALES_MOCK_DB_V1';

const getInitialState = () => ({
  leads: [...mockLeads],
  customers: [...mockCustomers],
  surveys: [...mockSurveys],
  quotations: [...mockQuotations],
  orders: [...mockOrders],
  payments: [...mockPayments],
  products: [...mockProducts],
  users: [...mockUsers],
  kitTemplates: [...mockKitTemplates],
});

export class SalesMockDatabase {
  constructor() {
    this.data = this.load();
  }

  load() {
    if (typeof window === 'undefined') {
      return getInitialState();
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using initial mock data', e);
    }
    const initial = getInitialState();
    this.save(initial);
    return initial;
  }

  save(dataToSave = this.data) {
    this.data = dataToSave;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.warn('Could not save to localStorage', e);
      }
    }
  }

  reset() {
    const initial = getInitialState();
    this.save(initial);
    return { success: true, data: initial, message: 'Mock database reset to initial seed data' };
  }

  // --- LEADS ---
  getLeads(filters = {}) {
    let result = [...this.data.leads];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(l => l.status === filters.status);
    }
    if (filters.source && filters.source !== 'all') {
      result = result.filter(l => l.source === filters.source);
    }
    if (filters.assignedTo && filters.assignedTo !== 'all') {
      result = result.filter(l => l.assignedTo?.id === filters.assignedTo);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.toLowerCase().includes(q) ||
        l.city?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q)
      );
    }

    return { success: true, data: result, message: 'Leads fetched successfully' };
  }

  getLeadById(id) {
    const lead = this.data.leads.find(l => l.id === id || l._id === id);
    if (!lead) {
      return { success: false, data: null, message: `Lead with id ${id} not found` };
    }
    return { success: true, data: lead, message: 'Lead fetched successfully' };
  }

  createLead(leadData) {
    const newId = `lead_${Date.now()}`;
    const newLead = {
      id: newId,
      _id: newId,
      name: leadData.name || '',
      phone: leadData.phone || '',
      email: leadData.email || '',
      city: leadData.city || '',
      address: leadData.address || '',
      source: leadData.source || 'website',
      monthlyBill: Number(leadData.monthlyBill) || 0,
      systemCapacityNeeded: Number(leadData.systemCapacityNeeded) || 3,
      systemType: leadData.systemType || 'on_grid',
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo || { id: 'user_sales_1', name: 'Rahul Sharma' },
      notes: leadData.notes || '',
      customerId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.leads.unshift(newLead);
    this.save();
    return { success: true, data: newLead, message: 'Lead created successfully' };
  }

  updateLead(id, updates) {
    const index = this.data.leads.findIndex(l => l.id === id || l._id === id);
    if (index === -1) {
      return { success: false, data: null, message: `Lead with id ${id} not found` };
    }

    const updatedLead = {
      ...this.data.leads[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.data.leads[index] = updatedLead;
    this.save();
    return { success: true, data: updatedLead, message: 'Lead updated successfully' };
  }

  updateLeadStatus(id, newStatus) {
    return this.updateLead(id, { status: newStatus });
  }

  convertLead(id) {
    const leadRes = this.getLeadById(id);
    if (!leadRes.success) return leadRes;

    const lead = leadRes.data;
    if (lead.status === 'converted' && lead.customerId) {
      const existingCustomer = this.data.customers.find(c => c.id === lead.customerId);
      return {
        success: true,
        data: existingCustomer,
        message: 'Lead was already converted to customer',
      };
    }

    // Create a new Customer record from lead data
    const customerId = `cust_${Date.now()}`;
    const newCustomer = {
      id: customerId,
      _id: customerId,
      leadId: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      address: lead.address,
      monthlyBill: lead.monthlyBill,
      notes: `Converted from Lead #${lead.id} on ${new Date().toLocaleDateString()}. Initial notes: ${lead.notes || 'None'}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.customers.unshift(newCustomer);

    // Update lead status to 'converted' and link customerId
    this.updateLead(id, {
      status: 'converted',
      customerId: customerId,
    });

    this.save();
    return {
      success: true,
      data: newCustomer,
      message: `Lead successfully converted to Customer: ${newCustomer.name}`,
    };
  }

  // --- CUSTOMERS ---
  getCustomers(filters = {}) {
    let result = [...this.data.customers];

    if (filters.city && filters.city !== 'all') {
      result = result.filter(c => c.city?.toLowerCase() === filters.city.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }

    // Enrich with count of surveys, quotations, and orders for UI badges
    const enriched = result.map(cust => {
      const custId = cust.id || cust._id;
      const surveysCount = this.data.surveys.filter(s => s.customerId === custId).length;
      const quotesCount = this.data.quotations.filter(q => q.customerId === custId).length;
      const ordersCount = this.data.orders.filter(o => o.customerId === custId).length;
      return {
        ...cust,
        surveysCount,
        quotesCount,
        ordersCount,
      };
    });

    return { success: true, data: enriched, message: 'Customers fetched successfully' };
  }

  getCustomerById(id) {
    const cust = this.data.customers.find(c => c.id === id || c._id === id);
    if (!cust) {
      return { success: false, data: null, message: `Customer with id ${id} not found` };
    }

    const custId = cust.id || cust._id;
    const surveys = this.data.surveys.filter(s => s.customerId === custId);
    const quotations = this.data.quotations.filter(q => q.customerId === custId);
    const orders = this.data.orders.filter(o => o.customerId === custId);
    const lead = cust.leadId ? this.data.leads.find(l => l.id === cust.leadId) : null;

    return {
      success: true,
      data: {
        ...cust,
        surveys,
        quotations,
        orders,
        lead,
      },
      message: 'Customer details retrieved',
    };
  }

  createCustomer(data) {
    const newId = `cust_${Date.now()}`;
    const newCustomer = {
      id: newId,
      _id: newId,
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      city: data.city || '',
      address: data.address || '',
      monthlyBill: Number(data.monthlyBill) || 0,
      leadId: data.leadId || null,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.customers.unshift(newCustomer);
    this.save();
    return { success: true, data: newCustomer, message: 'Customer created successfully' };
  }

  updateCustomer(id, data) {
    const idx = this.data.customers.findIndex(c => c.id === id || c._id === id);
    if (idx === -1) {
      return { success: false, data: null, message: `Customer with id ${id} not found` };
    }
    this.data.customers[idx] = {
      ...this.data.customers[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return { success: true, data: this.data.customers[idx], message: 'Customer updated successfully' };
  }

  // --- SITE SURVEYS ---
  getSurveys(filters = {}) {
    let result = [...this.data.surveys];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters.customerId) {
      result = result.filter(s => s.customerId === filters.customerId);
    }
    if (filters.surveyorId && filters.surveyorId !== 'all') {
      result = result.filter(s => s.surveyorId === filters.surveyorId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(s =>
        s.customerName?.toLowerCase().includes(q) ||
        s.customerPhone?.toLowerCase().includes(q) ||
        s.customerCity?.toLowerCase().includes(q) ||
        s.surveyorName?.toLowerCase().includes(q)
      );
    }

    return { success: true, data: result, message: 'Surveys fetched successfully' };
  }

  getSurveyById(id) {
    const survey = this.data.surveys.find(s => s.id === id || s._id === id);
    if (!survey) {
      return { success: false, data: null, message: `Survey with id ${id} not found` };
    }
    return { success: true, data: survey, message: 'Survey fetched successfully' };
  }

  scheduleSurvey(surveyData) {
    const customer = this.data.customers.find(c => c.id === surveyData.customerId);
    const surveyor = this.data.users.find(u => u.id === surveyData.surveyorId);

    const newId = `srv_${Date.now()}`;
    const newSurvey = {
      id: newId,
      _id: newId,
      customerId: surveyData.customerId,
      customerName: customer ? customer.name : (surveyData.customerName || 'Customer'),
      customerPhone: customer ? customer.phone : '',
      customerCity: customer ? customer.city : '',
      address: surveyData.address || (customer ? customer.address : ''),
      scheduledDate: surveyData.scheduledDate || new Date().toISOString(),
      surveyorId: surveyData.surveyorId || 'user_survey_1',
      surveyorName: surveyor ? surveyor.name : 'Vikram Singh (Technician)',
      status: 'scheduled',
      roofType: surveyData.roofType || 'concrete_flat',
      roofArea: surveyData.roofArea ? Number(surveyData.roofArea) : null,
      shading: surveyData.shading || 'none',
      recommendedKw: surveyData.recommendedKw ? Number(surveyData.recommendedKw) : 3,
      cableDistance: surveyData.cableDistance ? Number(surveyData.cableDistance) : null,
      notes: surveyData.notes || '',
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    this.data.surveys.unshift(newSurvey);

    // If customer was linked to a lead, update lead status to survey_scheduled
    if (customer && customer.leadId) {
      this.updateLeadStatus(customer.leadId, 'survey_scheduled');
    }

    this.save();
    return { success: true, data: newSurvey, message: 'Site survey scheduled successfully' };
  }

  completeSurvey(id, completionData) {
    const idx = this.data.surveys.findIndex(s => s.id === id || s._id === id);
    if (idx === -1) {
      return { success: false, data: null, message: `Survey with id ${id} not found` };
    }

    const currentSurvey = this.data.surveys[idx];
    const updatedSurvey = {
      ...currentSurvey,
      roofType: completionData.roofType || currentSurvey.roofType || 'concrete_flat',
      roofArea: Number(completionData.roofArea) || currentSurvey.roofArea || 400,
      shading: completionData.shading || currentSurvey.shading || 'none',
      recommendedKw: Number(completionData.recommendedKw) || currentSurvey.recommendedKw || 3,
      cableDistance: Number(completionData.cableDistance) || currentSurvey.cableDistance || 15,
      notes: completionData.notes ? `${currentSurvey.notes ? currentSurvey.notes + ' | ' : ''}${completionData.notes}` : currentSurvey.notes,
      status: 'completed',
      completedAt: new Date().toISOString(),
    };

    this.data.surveys[idx] = updatedSurvey;

    // Check if customer is linked to lead, update lead status
    const customer = this.data.customers.find(c => c.id === updatedSurvey.customerId);
    if (customer && customer.leadId) {
      this.updateLeadStatus(customer.leadId, 'survey_completed');
    }

    this.save();
    return { success: true, data: updatedSurvey, message: 'Site survey marked as completed!' };
  }

  // --- QUOTATIONS ---
  getQuotations(filters = {}) {
    let result = [...this.data.quotations];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(q => q.status === filters.status);
    }
    if (filters.customerId) {
      result = result.filter(q => q.customerId === filters.customerId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(item =>
        item.quotationNumber?.toLowerCase().includes(q) ||
        item.customerName?.toLowerCase().includes(q) ||
        item.customerPhone?.toLowerCase().includes(q)
      );
    }
    return { success: true, data: result, message: 'Quotations fetched successfully' };
  }

  getQuotationById(id) {
    const q = this.data.quotations.find(item => item.id === id || item._id === id);
    if (!q) {
      return { success: false, data: null, message: `Quotation with id ${id} not found` };
    }
    return { success: true, data: q, message: 'Quotation details retrieved' };
  }

  createQuotation(quoteData) {
    const customer = this.data.customers.find(c => c.id === quoteData.customerId);
    const newId = `qt_${Date.now()}`;
    const count = this.data.quotations.length + 1;
    const quotationNumber = `QT-2026-${String(count).padStart(3, '0')}`;

    const lines = quoteData.lines || [];
    const subtotal = lines.reduce((sum, item) => sum + (Number(item.total) || (Number(item.qty) * Number(item.unitPrice)) || 0), 0);
    const gstRate = Number(quoteData.gstRate) || 13.8;
    const gstAmount = Math.round((subtotal * (gstRate / 100)) * 100) / 100;
    const discount = Number(quoteData.discount) || 0;
    const grandTotal = Math.round((subtotal + gstAmount - discount) * 100) / 100;

    const newQuotation = {
      id: newId,
      _id: newId,
      quotationNumber,
      customerId: quoteData.customerId,
      customerName: customer ? customer.name : (quoteData.customerName || 'Customer'),
      customerPhone: customer ? customer.phone : '',
      customerCity: customer ? customer.city : '',
      surveyId: quoteData.surveyId || null,
      systemCapacityKw: Number(quoteData.systemCapacityKw) || 3,
      systemType: quoteData.systemType || 'on_grid',
      lines,
      subtotal,
      gstRate,
      gstAmount,
      discount,
      grandTotal,
      status: quoteData.status || 'draft',
      notes: quoteData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.quotations.unshift(newQuotation);
    this.save();
    return { success: true, data: newQuotation, message: 'Quotation created successfully' };
  }

  updateQuotation(id, updates) {
    const idx = this.data.quotations.findIndex(q => q.id === id || q._id === id);
    if (idx === -1) {
      return { success: false, data: null, message: `Quotation ${id} not found` };
    }
    this.data.quotations[idx] = {
      ...this.data.quotations[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return { success: true, data: this.data.quotations[idx], message: 'Quotation updated successfully' };
  }

  sendQuotation(id) {
    return this.updateQuotation(id, { status: 'sent' });
  }

  acceptQuotation(id) {
    const quoteRes = this.getQuotationById(id);
    if (!quoteRes.success) return quoteRes;
    const quote = quoteRes.data;

    // Update quote status to accepted
    this.updateQuotation(id, { status: 'accepted' });

    // Automatically create Order (Workflow: Quotation -> Accept -> Order)
    const orderCount = this.data.orders.length + 1;
    const orderNumber = `ORD-2026-${String(orderCount).padStart(3, '0')}`;
    const newOrderId = `ord_${Date.now()}`;

    const newOrder = {
      id: newOrderId,
      _id: newOrderId,
      orderNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      customerCity: quote.customerCity,
      quotationId: quote.id,
      quotationNumber: quote.quotationNumber,
      systemCapacityKw: quote.systemCapacityKw,
      systemType: quote.systemType,
      totalAmount: quote.grandTotal,
      paidAmount: 0,
      balanceAmount: quote.grandTotal,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.orders.unshift(newOrder);
    this.save();

    return {
      success: true,
      data: { quotation: quote, order: newOrder },
      message: `Quotation accepted! Order ${orderNumber} has been generated.`,
    };
  }

  // --- ORDERS ---
  getOrders(filters = {}) {
    let result = [...this.data.orders];
    if (filters.status && filters.status !== 'all') {
      result = result.filter(o => o.status === filters.status);
    }
    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
      result = result.filter(o => o.paymentStatus === filters.paymentStatus);
    }
    if (filters.customerId) {
      result = result.filter(o => o.customerId === filters.customerId);
    }
    return { success: true, data: result, message: 'Orders fetched successfully' };
  }

  getOrderById(id) {
    const order = this.data.orders.find(o => o.id === id || o._id === id);
    if (!order) {
      return { success: false, data: null, message: `Order with id ${id} not found` };
    }
    const orderId = order.id || order._id;
    const payments = this.data.payments.filter(p => p.orderId === orderId);
    return { success: true, data: { ...order, payments }, message: 'Order retrieved' };
  }

  // --- PAYMENTS ---
  getPayments(filters = {}) {
    let result = [...this.data.payments];
    if (filters.orderId) {
      result = result.filter(p => p.orderId === filters.orderId);
    }
    return { success: true, data: result, message: 'Payments fetched successfully' };
  }

  recordPayment(paymentData) {
    const orderRes = this.getOrderById(paymentData.orderId);
    if (!orderRes.success) return orderRes;
    const order = orderRes.data;

    const amount = Number(paymentData.amount) || 0;
    const newPaidAmount = (order.paidAmount || 0) + amount;
    const newBalance = Math.max(0, order.totalAmount - newPaidAmount);

    let paymentStatus = 'partial';
    if (newBalance <= 0) {
      paymentStatus = 'paid';
    } else if (newPaidAmount === 0) {
      paymentStatus = 'pending';
    }

    // Update order
    const orderIdx = this.data.orders.findIndex(o => o.id === order.id);
    if (orderIdx !== -1) {
      this.data.orders[orderIdx] = {
        ...this.data.orders[orderIdx],
        paidAmount: newPaidAmount,
        balanceAmount: newBalance,
        paymentStatus,
        updatedAt: new Date().toISOString(),
      };
    }

    const newPaymentId = `pay_${Date.now()}`;
    const newPayment = {
      id: newPaymentId,
      _id: newPaymentId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      amount,
      mode: paymentData.mode || 'bank_transfer',
      reference: paymentData.reference || `REF-${Date.now()}`,
      date: paymentData.date || new Date().toISOString(),
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString(),
    };

    this.data.payments.unshift(newPayment);
    this.save();

    return {
      success: true,
      data: { payment: newPayment, order: this.data.orders[orderIdx] },
      message: `Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully!`,
    };
  }

  // --- PRODUCTS ---
  getProducts() {
    return { success: true, data: [...this.data.products], message: 'Products retrieved' };
  }

  // --- OVERVIEW / KPIS ---
  getOverview() {
    const totalLeads = this.data.leads.length;
    const convertedLeads = this.data.leads.filter(l => l.status === 'converted').length;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const totalQuotes = this.data.quotations.length;
    const acceptedQuotes = this.data.quotations.filter(q => q.status === 'accepted').length;

    const revenueBooked = this.data.orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const revenueCollected = this.data.payments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const recentLeads = this.data.leads.slice(0, 5);
    const pendingSurveys = this.data.surveys.filter(s => s.status === 'scheduled').length;

    return {
      success: true,
      data: {
        totalLeads,
        convertedLeads,
        conversionRate,
        totalQuotes,
        acceptedQuotes,
        revenueBooked,
        revenueCollected,
        pendingSurveys,
        recentLeads,
      },
      message: 'Overview KPIs retrieved',
    };
  }
}

export const mockDb = new SalesMockDatabase();
export default mockDb;
