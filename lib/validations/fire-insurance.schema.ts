import { z } from 'zod';

export const fireInsuranceSchema = z.object({
  policyNumber:         z.string().min(1, 'Policy number is required').max(100),
  insuranceCompanyName: z.string().min(2, 'Insurance company is required').max(150),
  insuredName:          z.string().min(2, 'Insured name is required').max(150),
  mobileNumber:         z.string().regex(/^[+\d\s\-()\s]{7,20}$/, 'Invalid mobile number'),
  email:                z.string().email('Invalid email').optional().or(z.literal('')),
  address:              z.string().optional(),
  gstNumber:            z.string().max(20).optional().or(z.literal('')),
  businessType:         z.string().max(100).optional().or(z.literal('')),

  policyStartDate: z.string().min(1, 'Policy start date is required'),
  policyEndDate:   z.string().min(1, 'Policy end date is required'),
  renewalDate:     z.string().min(1, 'Renewal date is required'),
  policyStatus:    z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED']).optional(),

  sumInsured:    z.number({ error: 'Sum insured must be a number' }).min(0),
  netPremium:    z.number().min(0).optional(),
  cgst:          z.number().min(0).optional(),
  sgst:          z.number().min(0).optional(),
  stampDuty:     z.number().min(0).optional(),
  totalPremium:  z.number({ error: 'Total premium must be a number' }).min(0),

  receiptNumber: z.string().max(100).optional().or(z.literal('')),
  receiptDate:   z.string().optional().or(z.literal('')),
  agentName:     z.string().max(100).optional().or(z.literal('')),
  agentCode:     z.string().max(50).optional().or(z.literal('')),
  financierName: z.string().max(150).optional().or(z.literal('')),

  customerType: z.enum(['NEW', 'RENEWAL']).optional(),
  leadSource:   z.string().max(100).optional().or(z.literal('')),
  remarks:      z.string().optional(),

  policyDocument: z.string().optional().or(z.literal('')),
});

export type FireInsuranceFormValues = z.infer<typeof fireInsuranceSchema>;
