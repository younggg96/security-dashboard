import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useVulnerability } from '../contexts/VulnerabilityContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Vulnerability } from '../interfaces/VulnerabilityData';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
};

// Colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d32f2f', '#7cb342'];

// Severity colors
const SEVERITY_COLORS = {
  'CRITICAL': '#d32f2f',
  'HIGH': '#f44336',
  'MEDIUM': '#ff9800',
  'LOW': '#ffeb3b',
  'NONE': '#4caf50'
};

const AnalyticsPage: React.FC = () => {
  const { 
    isLoading, 
    error, 
    stats, 
    filteredVulnerabilities,
    allVulnerabilities,
    applyAnalysisFilter,
    applyAIAnalysisFilter,
    analysisMode,
    toggleAnalysisMode
  } = useVulnerability();

  const [tabValue, setTabValue] = useState(0);
  const [timeGrouping, setTimeGrouping] = useState('month');
  const [selectedVendor, setSelectedVendor] = useState<string>('');

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle time grouping change
  const handleTimeGroupingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTimeGrouping(event.target.value);
  };

  // Handle vendor selection change
  const handleVendorChange = (event: SelectChangeEvent<string>) => {
    setSelectedVendor(event.target.value);
  };

  // Handle analysis mode change
  const handleAnalysisModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'none' | 'analysis' | 'aiAnalysis' | null
  ) => {
    if (newMode !== null) {
      toggleAnalysisMode(newMode);
    }
  };

  // Group vulnerabilities by date
  const getTimelineData = (vulnerabilities: Vulnerability[], groupBy: string) => {
    const timeMap = new Map<string, number>();
    
    vulnerabilities.forEach(vuln => {
      const date = new Date(vuln.publishedDate);
      let key = '';
      
      if (groupBy === 'day') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (groupBy === 'year') {
        key = `${date.getFullYear()}`;
      }
      
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });
    
    return Array.from(timeMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get CVSS distribution data
  const getCvssDistribution = (vulnerabilities: Vulnerability[]) => {
    const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0 to 10 CVSS scores
    
    vulnerabilities.forEach(vuln => {
      const score = Math.floor(vuln.cvss);
      if (score >= 0 && score <= 10) {
        distribution[score]++;
      }
    });
    
    return distribution.map((count, index) => ({
      score: index,
      count
    }));
  };

  // Get vendor-specific vulnerability data
  const getVendorData = (vulnerabilities: Vulnerability[], vendor: string) => {
    return vulnerabilities.filter(vuln => vuln.vendor === vendor);
  };

  // Get top vendors by vulnerability count
  const getTopVendors = (vulnerabilities: Vulnerability[], limit: number = 10) => {
    const vendorMap = new Map<string, number>();
    
    vulnerabilities.forEach(vuln => {
      vendorMap.set(vuln.vendor, (vendorMap.get(vuln.vendor) || 0) + 1);
    });
    
    return Array.from(vendorMap.entries())
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  // Get severity distribution data for a specific vendor
  const getVendorSeverityDistribution = (vulnerabilities: Vulnerability[], vendor: string) => {
    const vendorVulns = vulnerabilities.filter(vuln => vuln.vendor === vendor);
    const severityMap = new Map<string, number>();
    
    vendorVulns.forEach(vuln => {
      severityMap.set(vuln.severity, (severityMap.get(vuln.severity) || 0) + 1);
    });
    
    return Array.from(severityMap.entries())
      .map(([severity, count]) => ({ 
        severity, 
        count,
        color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#999'
      }));
  };

  // Get AI vs Manual Analysis Comparison
  const getAnalysisComparison = (vulnerabilities: Vulnerability[]) => {
    const manual = vulnerabilities.filter(v => v.kaiStatus !== 'invalid - norisk').length;
    const ai = vulnerabilities.filter(v => v.kaiStatus !== 'ai-invalid-norisk').length;
    const both = vulnerabilities.filter(v => 
      v.kaiStatus !== 'invalid - norisk' && 
      v.kaiStatus !== 'ai-invalid-norisk'
    ).length;
    
    return [
      { name: 'Manual Analysis', value: manual },
      { name: 'AI Analysis', value: ai },
      { name: 'Both Analyses', value: both }
    ];
  };

  // Calculate the impact of different analysis methods
  const getAnalysisImpact = () => {
    const totalVulns = allVulnerabilities.length;
    const manualFiltered = allVulnerabilities.filter(v => v.kaiStatus !== 'invalid - norisk').length;
    const aiFiltered = allVulnerabilities.filter(v => v.kaiStatus !== 'ai-invalid-norisk').length;
    
    const manualImpact = ((totalVulns - manualFiltered) / totalVulns) * 100;
    const aiImpact = ((totalVulns - aiFiltered) / totalVulns) * 100;
    
    return [
      { name: 'Manual Analysis', value: manualImpact },
      { name: 'AI Analysis', value: aiImpact }
    ];
  };

  // Get unique vendors for select input
  const getUniqueVendors = (vulnerabilities: Vulnerability[]) => {
    const vendors = new Set<string>();
    vulnerabilities.forEach(vuln => vendors.add(vuln.vendor));
    return Array.from(vendors).sort();
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

  if (!stats) {
    return (
      <Alert severity="warning">
        No vulnerability data available
      </Alert>
    );
  }

  const timelineData = getTimelineData(filteredVulnerabilities, timeGrouping);
  const cvssDistribution = getCvssDistribution(filteredVulnerabilities);
  const topVendors = getTopVendors(filteredVulnerabilities);
  const uniqueVendors = getUniqueVendors(filteredVulnerabilities);
  const vendorVulnerabilities = selectedVendor 
    ? getVendorData(filteredVulnerabilities, selectedVendor) 
    : [];
  const vendorSeverityData = selectedVendor 
    ? getVendorSeverityDistribution(filteredVulnerabilities, selectedVendor) 
    : [];
  const analysisComparison = getAnalysisComparison(allVulnerabilities);
  const analysisImpact = getAnalysisImpact();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vulnerability Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Advanced analytics and visualizations for security vulnerabilities
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Trends Analysis" {...a11yProps(0)} />
          <Tab label="Vendor Analysis" {...a11yProps(1)} />
          <Tab label="AI vs Manual Analysis" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Time Series Analysis */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Vulnerability Trend Analysis
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Time Grouping</FormLabel>
            <RadioGroup
              row
              aria-label="time grouping"
              name="time-group"
              value={timeGrouping}
              onChange={handleTimeGroupingChange}
            >
              <FormControlLabel value="day" control={<Radio />} label="Daily" />
              <FormControlLabel value="month" control={<Radio />} label="Monthly" />
              <FormControlLabel value="year" control={<Radio />} label="Yearly" />
            </RadioGroup>
          </FormControl>
          
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineData}
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  name="Vulnerabilities" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        {/* CVSS Distribution */}
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" gutterBottom>
            CVSS Score Distribution
          </Typography>
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cvssDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="score" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Vulnerabilities" fill="#82ca9d">
                  {cvssDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.score >= 9 ? '#d32f2f' : 
                        entry.score >= 7 ? '#f44336' :
                        entry.score >= 4 ? '#ff9800' :
                        entry.score >= 0 ? '#4caf50' : '#999'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Vendor Analysis */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Typography variant="h6" gutterBottom>
            Top Vendors by Vulnerability Count
          </Typography>
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topVendors}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="vendor" type="category" width={140} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Vulnerabilities" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vendor-Specific Analysis
            </Typography>
            <FormControl sx={{ width: 300, mb: 3 }}>
              <InputLabel id="vendor-select-label">Select Vendor</InputLabel>
              <Select
                labelId="vendor-select-label"
                id="vendor-select"
                value={selectedVendor}
                label="Select Vendor"
                onChange={handleVendorChange}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {uniqueVendors.map(vendor => (
                  <MenuItem key={vendor} value={vendor}>{vendor}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedVendor && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Card sx={{ flexGrow: 1, minWidth: 250 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Total Vulnerabilities
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ mt: 2 }}>
                      {vendorVulnerabilities.length}
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flexGrow: 1, minWidth: 250 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Critical Vulnerabilities
                    </Typography>
                    <Typography variant="h3" component="div" sx={{ mt: 2, color: '#d32f2f' }}>
                      {vendorVulnerabilities.filter(v => v.severity === 'CRITICAL').length}
                    </Typography>
                  </CardContent>
                </Card>

                <Box sx={{ width: '100%', mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Severity Distribution for {selectedVendor}
                  </Typography>
                  <Paper sx={{ p: 2, height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorSeverityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={130}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ severity, count, percent }) => 
                            `${severity}: ${count} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {vendorSeverityData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Paper>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* AI vs Manual Analysis Comparison */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                Manual Analysis Filter
              </ToggleButton>
              <ToggleButton value="aiAnalysis" aria-label="AI analysis">
                AI Analysis Filter
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Typography variant="h6" gutterBottom>
            Analysis Method Comparison
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Paper sx={{ p: 2, height: 400, flex: '1 1 400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysisComparison}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {analysisComparison.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>

            <Paper sx={{ p: 2, height: 400, flex: '1 1 400px' }}>
              <Typography variant="subtitle1" gutterBottom textAlign="center">
                Analysis Impact (% Vulnerabilities Filtered Out)
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={analysisImpact}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="value" name="Impact %" fill="#8884d8">
                    {analysisImpact.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Analysis Method Effectiveness by Severity
          </Typography>
          <Paper sx={{ p: 2, height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { 
                    name: 'CRITICAL', 
                    manual: allVulnerabilities.filter(v => v.severity === 'CRITICAL' && v.kaiStatus !== 'invalid - norisk').length,
                    ai: allVulnerabilities.filter(v => v.severity === 'CRITICAL' && v.kaiStatus !== 'ai-invalid-norisk').length
                  },
                  { 
                    name: 'HIGH', 
                    manual: allVulnerabilities.filter(v => v.severity === 'HIGH' && v.kaiStatus !== 'invalid - norisk').length,
                    ai: allVulnerabilities.filter(v => v.severity === 'HIGH' && v.kaiStatus !== 'ai-invalid-norisk').length
                  },
                  { 
                    name: 'MEDIUM', 
                    manual: allVulnerabilities.filter(v => v.severity === 'MEDIUM' && v.kaiStatus !== 'invalid - norisk').length,
                    ai: allVulnerabilities.filter(v => v.severity === 'MEDIUM' && v.kaiStatus !== 'ai-invalid-norisk').length
                  },
                  { 
                    name: 'LOW', 
                    manual: allVulnerabilities.filter(v => v.severity === 'LOW' && v.kaiStatus !== 'invalid - norisk').length,
                    ai: allVulnerabilities.filter(v => v.severity === 'LOW' && v.kaiStatus !== 'ai-invalid-norisk').length
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="manual" name="Manual Analysis" fill="#8884d8" />
                <Bar dataKey="ai" name="AI Analysis" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default AnalyticsPage; 