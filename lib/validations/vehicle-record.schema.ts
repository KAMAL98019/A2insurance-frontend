import { z } from 'zod';

export const vehicleRecordSchema = z.object({
  vehicleNumber:     z.string().min(1, 'Vehicle number is required').max(50),
  ownerName:         z.string().min(2, 'Owner name is required').max(100),
  cellNumber:        z.string().regex(/^[+\d\s\-()\s]{7,20}$/, 'Invalid cell number'),
  cellNumberAlt:     z.string().refine(
    (v) => !v || /^[+\d\s\-()\s]{7,20}$/.test(v),
    'Invalid secondary number',
  ).optional(),
  category:          z.string().min(1, 'Select a category'),
  policyExpiryDate:  z.string().min(1, 'Policy expiry date is required'),
  insuranceCompany:  z.string().min(2, 'Insurance company is required').max(150),
  rcDocument:        z.string().optional(),
  insuranceDocument: z.string().optional(),
  aadhaarDocument:   z.string().optional(),
  panDocument:       z.string().optional(),
  photo:             z.string().optional(),
  odDocument:        z.string().optional(),
  tpDocument:        z.string().optional(),
  remarks:           z.string().optional(),
});

export type VehicleRecordFormValues = z.infer<typeof vehicleRecordSchema>;
