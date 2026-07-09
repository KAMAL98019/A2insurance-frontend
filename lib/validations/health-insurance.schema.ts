import { z } from 'zod';

const familyMemberSchema = z.object({
  memberName:         z.string().min(2, 'Member name is required').max(100),
  relationship:       z.string().min(1, 'Relationship is required').max(50),
  dateOfBirth:        z.string().optional(),
  gender:             z.string().optional(),
  medicalHistory:     z.string().optional(),
  preExistingDisease: z.string().max(255).optional(),
});

export const healthInsuranceSchema = z.object({
  // Basic Policy Details
  policyNumber:         z.string().min(1, 'Policy number is required').max(100),
  insuranceCompanyName: z.string().min(2, 'Insurance company is required').max(150),
  policyHolderName:    z.string().min(2, 'Policy holder name is required').max(100),
  mobileNumber:        z.string().regex(/^[+\d\s\-()\s]{7,20}$/, 'Invalid mobile number'),
  email:               z.string().email('Invalid email').optional().or(z.literal('')),
  dateOfBirth:         z.string().optional(),
  gender:              z.string().optional(),
  address:             z.string().optional(),
  policyType:          z.enum(['INDIVIDUAL', 'FAMILY_FLOATER', 'SENIOR_CITIZEN', 'GROUP_INSURANCE', 'CRITICAL_ILLNESS'], {
    error: 'Policy type is required',
  }),
  policyStartDate:     z.string().min(1, 'Policy start date is required'),
  policyEndDate:       z.string().min(1, 'Policy end date is required'),
  renewalDate:         z.string().min(1, 'Renewal date is required'),
  policyStatus:        z.enum(['ACTIVE', 'EXPIRED', 'PENDING_RENEWAL', 'CANCELLED']).optional(),

  // Coverage & Payment
  sumInsured:          z.number({ error: 'Sum insured must be a number' }).min(0),
  premiumAmount:       z.number({ error: 'Premium amount must be a number' }).min(0),
  paymentMode:         z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER']).optional(),
  customerType:        z.enum(['NEW', 'RENEWAL']).optional(),
  leadSource:          z.string().max(100).optional(),
  renewalReminderStatus: z.string().max(50).optional(),
  remarks:             z.string().optional(),

  // Nominee
  nomineeName:         z.string().max(100).optional(),
  nomineeRelationship: z.string().max(50).optional(),
  nomineeMobileNumber: z.string().refine(
    (v) => !v || /^[+\d\s\-()\s]{7,20}$/.test(v),
    'Invalid nominee mobile number',
  ).optional(),

  // Documents
  policyDocument:  z.string().optional(),
  idProof:         z.string().optional(),
  medicalDocument: z.string().optional(),

  // Family Members
  familyMembers: z.array(familyMemberSchema).optional(),
});

export type HealthInsuranceFormValues = z.infer<typeof healthInsuranceSchema>;
export type FamilyMemberFormValues    = z.infer<typeof familyMemberSchema>;
