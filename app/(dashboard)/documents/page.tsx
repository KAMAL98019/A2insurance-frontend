import { Box, Typography, Paper } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';

export default function DocumentsPage() {
  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Documents</Typography>
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
        <ArticleIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography color="text.secondary">Document management coming soon.</Typography>
      </Paper>
    </Box>
  );
}

