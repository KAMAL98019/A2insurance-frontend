import { z } from 'zod';

export const labourInsuranceSchema = z.object({
  policyNumber:         z.string().min(1, 'Policy number is required').max(100),
  insuranceCompanyName: z.string().min(2, 'Insurance company is required').max(150),
  insuredName:          z.string().min(2, 'Company/insured name is required').max(150),
  mobileNumber:         z.string().regex(/^[+\d\s\-()\s]{7,20}$/, 'Invalid mobile number'),
  email:                z.string().email('Invalid email').optional().or(z.literal('')),
  address:              z.string().optional(),
  businessDescription:  z.string().max(255).optional().or(z.literal('')),
  gstNumber:            z.string().max(20).optional().or(z.literal('')),

  intermediaryCode: z.string().max(50).optional().or(z.literal('')),
  intermediaryName: z.string().max(150).optional().or(z.literal('')),

  policyStartDate:  z.string().min(1, 'Policy start date is required'),
  policyEndDate:    z.string().min(1, 'Policy end date is required'),
  renewalDate:      z.string().min(1, 'Renewal date is required'),
  policyStatus:     z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED']).optional(),
  labourPolicyType: z.enum(['UNNAMED', 'NAMED']).optional(),

  numberOfEmployees:  z.number().int().min(0).optional(),
  wagesPerEmployee:   z.number().min(0).optional(),
  totalDeclaredWages: z.number().min(0).optional(),

  premium:       z.number().min(0).optional(),
  cgst:          z.number().min(0).optional(),
  sgst:          z.number().min(0).optional(),
  totalPremium:  z.number({ error: 'Total premium must be a number' }).min(0),

  receiptNumber: z.string().max(100).optional().or(z.literal('')),
  receiptDate:   z.string().optional().or(z.literal('')),

  customerType: z.enum(['NEW', 'RENEWAL']).optional(),
  leadSource:   z.string().max(100).optional().or(z.literal('')),
  remarks:      z.string().optional(),

  policyDocument: z.string().optional().or(z.literal('')),
});

export type LabourInsuranceFormValues = z.infer<typeof labourInsuranceSchema>;
