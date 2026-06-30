import { Box, Typography, Paper } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';

export default function InsuranceCompaniesPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Insurance Companies</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
        <BusinessIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography color="text.secondary">Insurance company management coming soon.</Typography>
      </Paper>
    </Box>
  );
}

