import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  CircularProgress,
  Divider,
  Link
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { 
  runPerformanceTest, 
  analyzePerformanceResults 
} from '../utils/PerformanceTest';
import { useVulnerability } from '../contexts/VulnerabilityContext';
import * as OptimizedService from '../services/OptimizedVulnerabilityService';
import { VulnerabilityStore } from '../utils/VulnerabilityDataStructures';

interface TestResult {
  name: string;
  operationName: string;
  executionTime: number;
  itemsProcessed: number;
  itemsPerSecond: number;
}

interface AnalysisDetail {
  operation: string;
  originalTime: number;
  optimizedTime: number;
  improvement: number;
}

const PerformanceTestPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [analysis, setAnalysis] = useState<{ summary: string; details: AnalysisDetail[] } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dataAvailable, setDataAvailable] = useState<boolean>(false);
  
  // 使用VulnerabilityContext
  const { allVulnerabilities } = useVulnerability();

  // 页面加载时检查数据
  useEffect(() => {
    if (allVulnerabilities.length > 0) {
      setDataAvailable(true);
      setError(null);
    } else {
      setDataAvailable(false);
      setError('No vulnerability data found. Please upload data first to run performance tests.');
    }
  }, [allVulnerabilities]);

  const handleRunTest = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);
      setAnalysis(null);
      
      // 首先确保数据已加载到优化服务中
      if (allVulnerabilities.length > 0) {
        // 如果有数据，先确保它被加载到OptimizedService中
        // 将数据导入到OptimizedService的dataStore中
        // 这里我们需要访问内部的数据，但是无法直接调用私有方法，所以先尝试通过他们已有的API
        await OptimizedService.loadFromLocalFile(
          new File(
            [JSON.stringify(allVulnerabilities)], 
            'context-data.json', 
            { type: 'application/json' }
          )
        );
        
        const testResults = await runPerformanceTest();
        
        // 处理返回类型可能是字符串的情况
        if (typeof testResults === 'string') {
          // 如果返回字符串，显示为错误信息
          setError(testResults);
          setLoading(false);
          return;
        }
        
        // 如果是数组，正常处理结果
        setResults(testResults);
        const analysisResults = analyzePerformanceResults(testResults);
        setAnalysis(analysisResults);
      } else {
        // 没有数据的情况
        setError('No vulnerability data found. Please upload data first on the Dashboard page.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Performance test error:', err);
      setError('An error occurred while running the performance tests. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vulnerability Data Structure Performance Test
        </Typography>
        
        <Typography variant="body1" paragraph>
          This page compares the performance of the original vulnerability data handling implementation
          with the new optimized implementation using specialized data structures.
        </Typography>
        
        {!dataAvailable && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '1rem',
              backgroundColor: '#fff3e0',
              border: '1px solid #ffcc80',
              fontWeight: 'medium'
            }}
            icon={<UploadFileIcon fontSize="large" />}
          >
            <Box sx={{ ml: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No vulnerability data available!
              </Typography>
              <Typography variant="body1">
                Please upload JSON data on the 
                <Link 
                  component={RouterLink} 
                  to="/" 
                  sx={{ 
                    mx: 1, 
                    fontWeight: 'bold', 
                    color: '#2e7d32',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Dashboard
                </Link> 
                before running performance tests.
              </Typography>
              <Button
                component={RouterLink}
                to="/"
                variant="contained"
                color="primary"
                startIcon={<UploadFileIcon />}
                sx={{ mt: 2 }}
              >
                Go to Dashboard & Upload JSON
              </Button>
            </Box>
          </Alert>
        )}
        
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRunTest}
            disabled={loading || !dataAvailable}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
            sx={{ fontWeight: 'bold' }}
          >
            {loading ? 'Running Tests...' : 'Run Performance Tests'}
          </Button>
          
          {dataAvailable && (
            <Typography variant="body2" color="text.secondary">
              {allVulnerabilities.length} vulnerability records available for testing
            </Typography>
          )}
        </Box>
        
        {error && dataAvailable && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {analysis && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Test Results Analysis
            </Typography>
            
            <Box 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                bgcolor: '#f5f5f5', 
                p: 2, 
                borderRadius: 1,
                fontSize: '0.875rem'
              }}
            >
              {analysis.summary}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Performance Improvement By Operation
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Operation</TableCell>
                    <TableCell align="right">Original Time (ms)</TableCell>
                    <TableCell align="right">Optimized Time (ms)</TableCell>
                    <TableCell align="right">Improvement (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analysis.details.map((detail) => (
                    <TableRow key={detail.operation}>
                      <TableCell component="th" scope="row">
                        {detail.operation}
                      </TableCell>
                      <TableCell align="right">{detail.originalTime.toFixed(2)}</TableCell>
                      <TableCell align="right">{detail.optimizedTime.toFixed(2)}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: detail.improvement > 0 ? 'green' : 'red',
                          fontWeight: 'bold'
                        }}
                      >
                        {detail.improvement > 0 ? '+' : ''}{detail.improvement.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
        
        {results.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Raw Test Results
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Implementation</TableCell>
                    <TableCell>Operation</TableCell>
                    <TableCell align="right">Execution Time (ms)</TableCell>
                    <TableCell align="right">Items Processed</TableCell>
                    <TableCell align="right">Items/Second</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((result, index) => (
                    <TableRow 
                      key={index}
                      sx={{ 
                        bgcolor: result.name === 'Optimized' 
                          ? 'rgba(232, 245, 233, 0.5)' 
                          : 'inherit'
                      }}
                    >
                      <TableCell>{result.name}</TableCell>
                      <TableCell>{result.operationName}</TableCell>
                      <TableCell align="right">{result.executionTime.toFixed(2)}</TableCell>
                      <TableCell align="right">{result.itemsProcessed}</TableCell>
                      <TableCell align="right">{result.itemsPerSecond.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            How the Optimized Implementation Works
          </Typography>
          
          <Typography variant="body1" paragraph>
            The optimized implementation uses specialized data structures designed for efficient vulnerability data storage and querying:
          </Typography>
          
          <Typography component="div">
            <ul>
              <li>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Map-based Primary Storage:
                </Typography>
                <Typography variant="body2" paragraph>
                  A hash map provides O(1) lookup for CVEs by ID, dramatically improving individual vulnerability lookups.
                </Typography>
              </li>
              
              <li>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Multi-dimensional Indexing:
                </Typography>
                <Typography variant="body2" paragraph>
                  Specialized indexes for each searchable attribute (severity, vendor, product, etc.) enable 
                  fast filtering without needing to scan the entire dataset.
                </Typography>
              </li>
              
              <li>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Range-based Indexes:
                </Typography>
                <Typography variant="body2" paragraph>
                  Sorted data structures support efficient range queries for numerical (CVSS) and date-based filters.
                </Typography>
              </li>
              
              <li>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Set-based Operations:
                </Typography>
                <Typography variant="body2" paragraph>
                  Set intersections efficiently combine multiple filter criteria without repeated array scans.
                </Typography>
              </li>
            </ul>
          </Typography>
          
          <Typography variant="body1" paragraph>
            These optimizations are particularly effective for large vulnerability datasets (10,000+ items)
            and complex filtering scenarios commonly needed in security dashboards.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default PerformanceTestPage; 