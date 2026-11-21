import { daysAgo } from './dates'

// status: available | on_job | leave
export const technicians = [
  { _id: 'tec_001', name: 'Harpreet Singh', phone: '9814000101', email: 'harpreet@sunpower.in', skills: ['panel_mounting', 'electrical'], status: 'on_job', isActive: true },
  { _id: 'tec_002', name: 'Rakesh Kumar', phone: '9814000102', email: 'rakesh@sunpower.in', skills: ['electrical', 'inverter'], status: 'on_job', isActive: true },
  { _id: 'tec_003', name: 'Manpreet Kaur', phone: '9814000103', email: 'manpreet@sunpower.in', skills: ['inverter', 'battery'], status: 'available', isActive: true },
  { _id: 'tec_004', name: 'Sandeep Sharma', phone: '9814000104', email: 'sandeep@sunpower.in', skills: ['panel_mounting'], status: 'available', isActive: true },
  { _id: 'tec_005', name: 'Amit Verma', phone: '9814000105', email: 'amit@sunpower.in', skills: ['electrical', 'earthing'], status: 'leave', isActive: true },
  { _id: 'tec_006', name: 'Jaspreet Gill', phone: '9814000106', email: 'jaspreet@sunpower.in', skills: ['panel_mounting', 'earthing'], status: 'available', isActive: true },
  { _id: 'tec_007', name: 'Vikas Yadav', phone: '9814000107', email: 'vikas@sunpower.in', skills: ['inverter', 'electrical'], status: 'on_job', isActive: true },
  { _id: 'tec_008', name: 'Neha Arora', phone: '9814000108', email: 'neha@sunpower.in', skills: ['battery', 'electrical'], status: 'available', isActive: true },
].map((t) => ({ ...t, createdAt: daysAgo(300), updatedAt: daysAgo(2) }))
