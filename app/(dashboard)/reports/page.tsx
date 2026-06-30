import { Box, Typography, Paper } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function ReportsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Reports</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
        <BarChartIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography color="text.secondary">Reports and analytics coming soon.</Typography>
      </Paper>
    </Box>
  );
}

