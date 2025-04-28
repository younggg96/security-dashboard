import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Drawer,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
  Menu,
  Grid,
  Link,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloseIcon from '@mui/icons-material/Close';
import LaunchIcon from '@mui/icons-material/Launch';
import { useVulnerability } from '../contexts/VulnerabilityContext';
import { FilterOptions, Vulnerability } from '../interfaces/VulnerabilityData';
import * as VulnerabilityService from '../services/VulnerabilityService';

const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    'CRITICAL': '#d32f2f',
    'HIGH': '#f44336',
    'MEDIUM': '#ff9800',
    'LOW': '#ffeb3b',
    'NONE': '#4caf50'
  };
  return colors[severity] || '#999';
};

// Vulnerability Detail Drawer Component
const VulnerabilityDetailDrawer: React.FC<{
  vulnerability: Vulnerability | null;
  open: boolean;
  onClose: () => void;
}> = ({ vulnerability, open, onClose }) => {
  if (!vulnerability) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCveUrl = (cveId: string) => {
    return `https://nvd.nist.gov/vuln/detail/${cveId}`;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 600 }, p: 3 } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {vulnerability.cveId}
          </Typography>
          <IconButton onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Chip 
            label={vulnerability.severity} 
            size="medium" 
            sx={{ 
              bgcolor: getSeverityColor(vulnerability.severity),
              color: vulnerability.severity === 'LOW' || vulnerability.severity === 'NONE' ? 'black' : 'white',
              fontWeight: 'bold',
              mr: 2
            }} 
          />
          <Typography variant="h6">
            CVSS: {vulnerability.cvss.toFixed(1)}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Link 
            href={getCveUrl(vulnerability.cveId)} 
            target="_blank" 
            rel="noopener"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            NVD <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
          </Link>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flexBasis: { xs: '100%', sm: 'calc(50% - 1.5rem)' } }}>
            <Typography variant="subtitle2" color="text.secondary">Vendor</Typography>
            <Typography variant="body1">{vulnerability.vendor}</Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: 'calc(50% - 1.5rem)' } }}>
            <Typography variant="subtitle2" color="text.secondary">Product</Typography>
            <Typography variant="body1">{vulnerability.product}</Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: 'calc(50% - 1.5rem)' } }}>
            <Typography variant="subtitle2" color="text.secondary">Published Date</Typography>
            <Typography variant="body1">{formatDate(vulnerability.publishedDate)}</Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: 'calc(50% - 1.5rem)' } }}>
            <Typography variant="subtitle2" color="text.secondary">KAI Status</Typography>
            <Typography variant="body1">{vulnerability.kaiStatus || 'Not specified'}</Typography>
          </Box>
          
          {vulnerability.cweId && (
            <Box sx={{ flexBasis: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">Common Weakness Enumeration (CWE)</Typography>
              <Typography variant="body1">{vulnerability.cweId}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>Description</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {vulnerability.summary}
          </Typography>
        </Box>

        {vulnerability.references && vulnerability.references.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>References</Typography>
            <ul>
              {vulnerability.references.map((ref, index) => (
                <li key={index}>
                  <Link href={ref} target="_blank" rel="noopener">
                    {ref}
                  </Link>
                </li>
              ))}
            </ul>
          </Box>
        )}

        {vulnerability.patched_version && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>Patched Version</Typography>
            <Typography variant="body1">{vulnerability.patched_version}</Typography>
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" fullWidth onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

const VulnerabilitiesPage: React.FC = () => {
  const { 
    isLoading, 
    error, 
    displayedVulnerabilities,
    allVulnerabilities,
    filteredVulnerabilities,
    filterOptions,
    setFilterOptions,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    resetFilters,
    analysisMode,
    toggleAnalysisMode
  } = useVulnerability();

  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [instanceIds, setInstanceIds] = useState<Map<Vulnerability, string>>(new Map());
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportAnchorEl);
  
  // State for selected vulnerability and detail drawer
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const getUniqueId = (vulnerability: Vulnerability): string => {
    let id = instanceIds.get(vulnerability);
    if (!id) {
      id = VulnerabilityService.getVulnerabilityInstanceId(vulnerability);
      if (id) {
        // Update the map for future reference
        setInstanceIds(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(vulnerability, id as string);
          return newMap;
        });
      } else {
        // Fallback if no ID is generated
        id = `vuln-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }
    return id;
  }; 

  // Calculate unique values for filters
  const severities = allVulnerabilities.length ? VulnerabilityService.getUniqueFieldValues(allVulnerabilities, 'severity') : [];
  const kaiStatuses = allVulnerabilities.length ? VulnerabilityService.getUniqueFieldValues(allVulnerabilities, 'kaiStatus') : [];
  const vendors = allVulnerabilities.length ? VulnerabilityService.getUniqueFieldValues(allVulnerabilities, 'vendor').slice(0, 100) : [];

  // Filter handling
  const handleFilterChange = (field: keyof FilterOptions, value: any) => {
    setFilterOptions({
      ...filterOptions,
      [field]: value
    });
  };

  // Multi-select change handler
  const handleMultiSelectChange = (event: SelectChangeEvent<string[]>, field: keyof FilterOptions) => {
    const value = event.target.value;
    handleFilterChange(field, typeof value === 'string' ? value.split(',') : value);
  };

  // CVSS range slider change handler
  const handleCvssRangeChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      handleFilterChange('cvssRange', { min: newValue[0], max: newValue[1] });
    }
  };

  // Page change handler
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  // Rows per page change handler
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };

  // Toggle drawer
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
  };

  // Search functionality
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter vulnerabilities by search term (local filtering)
  const searchFilteredVulnerabilities = searchTerm
    ? displayedVulnerabilities.filter(vuln => 
        vuln.cveId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vuln.kaiStatus && vuln.kaiStatus.toLowerCase().includes(searchTerm.toLowerCase())))
    : displayedVulnerabilities;

  // Handle analysis mode change
  const handleAnalysisModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'none' | 'analysis' | 'aiAnalysis' | null
  ) => {
    if (newMode !== null) {
      toggleAnalysisMode(newMode);
    }
  };

  // Handle export menu
  const handleExportMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  // Handle row click to open vulnerability details
  const handleRowClick = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    setDetailDrawerOpen(true);
  };

  // Close detail drawer
  const handleDetailDrawerClose = () => {
    setDetailDrawerOpen(false);
  };

  // Export functionality
  const exportToCSV = (exportAll: boolean = false) => {
    // Determine which data to export - Current view or all filtered data
    let dataToExport;
    if (exportAll) {
      // Get all filtered data, not just the data displayed on the current page
      dataToExport = filteredVulnerabilities || [];
    } else {
      // Data in the current view (including search filtering)
      dataToExport = searchFilteredVulnerabilities || [];
    }
    
    // Convert data to CSV
    const headers = [
      'CVE ID', 
      'Severity', 
      'CVSS', 
      'Vendor', 
      'Product', 
      'KAI Status', 
      'Published Date', 
      'Summary'
    ];
    
    const csvContent = [
      // Add headers
      headers.join(','),
      // Add data rows
      ...dataToExport.map(vuln => [
        `"${vuln.cveId}"`,
        `"${vuln.severity}"`,
        vuln.cvss.toFixed(1),
        `"${vuln.vendor.replace(/"/g, '""')}"`,
        `"${vuln.product.replace(/"/g, '""')}"`,
        `"${vuln.kaiStatus || ''}"`,
        `"${new Date(vuln.publishedDate).toLocaleDateString()}"`,
        `"${vuln.summary.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vulnerabilities-export-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleExportMenuClose();
  };

  const exportToJSON = (exportAll: boolean = false) => {
    // Determine which data to export - Current view or all filtered data
    let dataToExport;
    if (exportAll) {
      // Get all filtered data, not just the data displayed on the current page
      dataToExport = filteredVulnerabilities || [];
    } else {
      // Data in the current view (including search filtering)
      dataToExport = searchFilteredVulnerabilities || [];
    }
    
    // Create and download the file
    const jsonContent = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vulnerabilities-export-${new Date().toISOString().slice(0, 10)}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleExportMenuClose();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Error loading vulnerability data: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vulnerabilities
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and filter security vulnerabilities
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search vulnerabilities..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={toggleDrawer(true)}
        >
          Filters
        </Button>
        
        <Tooltip title="Export data">
          <IconButton 
            color="primary"
            onClick={handleExportMenuClick}
            aria-controls={exportMenuOpen ? 'export-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={exportMenuOpen ? 'true' : undefined}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="export-menu"
          anchorEl={exportAnchorEl}
          open={exportMenuOpen}
          onClose={handleExportMenuClose}
          MenuListProps={{
            'aria-labelledby': 'export-button',
          }}
        >
          <MenuItem onClick={() => exportToCSV(false)}>Export Current Search Results (CSV)</MenuItem>
          <MenuItem onClick={() => exportToCSV(true)}>Export All Filtered Data (CSV)</MenuItem>
          <MenuItem onClick={() => exportToJSON(false)}>Export Current Search Results (JSON)</MenuItem>
          <MenuItem onClick={() => exportToJSON(true)}>Export All Filtered Data (JSON)</MenuItem>
        </Menu>
      </Box>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body1" sx={{ mr: 1 }}>
          Filter Mode:
        </Typography>
        <ToggleButtonGroup
          value={analysisMode}
          exclusive
          onChange={handleAnalysisModeChange}
          aria-label="analysis mode"
          size="small"
        >
          <ToggleButton value="analysis" aria-label="manual analysis">
            Analysis (Filter "invalid - norisk")
          </ToggleButton>
          <ToggleButton value="aiAnalysis" aria-label="AI analysis">
            AI Analysis (Filter "ai-invalid-norisk")
          </ToggleButton>
        </ToggleButtonGroup>
        
        <Button 
          variant="outlined" 
          onClick={resetFilters}
          size="small"
          sx={{ ml: 'auto' }}
        >
          Reset All Filters
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {searchFilteredVulnerabilities.length} of {totalCount} vulnerabilities
          {analysisMode !== 'none' && (
            <> • {analysisMode === 'analysis' ? 'Manual' : 'AI'} Analysis Filter Applied</>
          )}
          {searchTerm && (
            <> • Search: "{searchTerm}"</>
          )}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="vulnerabilities table">
          <TableHead>
            <TableRow>
              <TableCell>CVE ID</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>CVSS</TableCell>
              <TableCell>Vendor/Product</TableCell>
              <TableCell>KAI Status</TableCell>
              <TableCell>Published Date</TableCell>
              <TableCell>Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {searchFilteredVulnerabilities.map((vuln) => (
              <TableRow
                key={getUniqueId(vuln)}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  cursor: 'pointer' 
                }}
                hover
                onClick={() => handleRowClick(vuln)}
              >
                <TableCell component="th" scope="row">
                  {vuln.cveId}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={vuln.severity} 
                    size="small" 
                    sx={{ 
                      bgcolor: getSeverityColor(vuln.severity),
                      color: vuln.severity === 'LOW' || vuln.severity === 'NONE' ? 'black' : 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </TableCell>
                <TableCell>{vuln.cvss.toFixed(1)}</TableCell>
                <TableCell>{`${vuln.vendor} / ${vuln.product}`}</TableCell>
                <TableCell>{vuln.kaiStatus}</TableCell>
                <TableCell>{new Date(vuln.publishedDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {vuln.summary}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[10, 20, 50, 100]}
        component="div"
        count={totalCount}
        rowsPerPage={pageSize}
        page={page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Typography variant="h6">Filter Vulnerabilities</Typography>
          
          {/* Severity Filter */}
          <FormControl fullWidth>
            <InputLabel id="severity-label">Severity</InputLabel>
            <Select
              labelId="severity-label"
              id="severity-select"
              multiple
              value={filterOptions.severity}
              onChange={(e) => handleMultiSelectChange(e, 'severity')}
              input={<OutlinedInput label="Severity" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value} 
                      size="small" 
                      sx={{ 
                        bgcolor: getSeverityColor(value),
                        color: value === 'LOW' || value === 'NONE' ? 'black' : 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  ))}
                </Box>
              )}
            >
              {severities.map((severity) => (
                <MenuItem key={severity} value={severity}>
                  <Checkbox checked={filterOptions.severity.indexOf(severity) > -1} />
                  <ListItemText primary={severity} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* KAI Status Filter */}
          <FormControl fullWidth>
            <InputLabel id="kai-status-label">KAI Status</InputLabel>
            <Select
              labelId="kai-status-label"
              id="kai-status-select"
              multiple
              value={filterOptions.kaiStatus}
              onChange={(e) => handleMultiSelectChange(e, 'kaiStatus')}
              input={<OutlinedInput label="KAI Status" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {kaiStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  <Checkbox checked={filterOptions.kaiStatus.indexOf(status) > -1} />
                  <ListItemText primary={status} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Vendor Filter */}
          <FormControl fullWidth>
            <InputLabel id="vendor-label">Vendor</InputLabel>
            <Select
              labelId="vendor-label"
              id="vendor-select"
              multiple
              value={filterOptions.vendor}
              onChange={(e) => handleMultiSelectChange(e, 'vendor')}
              input={<OutlinedInput label="Vendor" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {vendors.map((vendor) => (
                <MenuItem key={vendor} value={vendor}>
                  <Checkbox checked={filterOptions.vendor.indexOf(vendor) > -1} />
                  <ListItemText primary={vendor} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* CVSS Score Range */}
          <Box>
            <Typography id="cvss-range-slider" gutterBottom>
              CVSS Score Range: {filterOptions.cvssRange.min.toFixed(1)} - {filterOptions.cvssRange.max.toFixed(1)}
            </Typography>
            <Slider
              value={[filterOptions.cvssRange.min, filterOptions.cvssRange.max]}
              onChange={handleCvssRangeChange}
              valueLabelDisplay="auto"
              min={0}
              max={10}
              step={0.1}
              aria-labelledby="cvss-range-slider"
            />
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={toggleDrawer(false)} 
              fullWidth
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Vulnerability Detail Drawer */}
      <VulnerabilityDetailDrawer
        vulnerability={selectedVulnerability}
        open={detailDrawerOpen}
        onClose={handleDetailDrawerClose}
      />
    </Box>
  );
};

export default VulnerabilitiesPage; 