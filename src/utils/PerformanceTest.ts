import * as OriginalService from '../services/VulnerabilityService';
import * as OptimizedService from '../services/OptimizedVulnerabilityService';
import { FilterOptions, Vulnerability } from '../interfaces/VulnerabilityData';

interface PerformanceResult {
  name: string;
  operationName: string;
  executionTime: number;
  itemsProcessed: number;
  itemsPerSecond: number;
}

/**
 * Measure execution time of a function
 */
const measureExecutionTime = async <T>(
  fn: () => Promise<T>,
  name: string,
  operationName: string,
  itemCount: number = 1
): Promise<PerformanceResult> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  const executionTime = end - start;
  
  return {
    name,
    operationName,
    executionTime,
    itemsProcessed: itemCount,
    itemsPerSecond: itemCount / (executionTime / 1000)
  };
};

/**
 * Run performance tests comparing original and optimized implementations
 * Uses user-uploaded data or generated test data rather than fetching from URLs
 */
export const runPerformanceTest = async (): Promise<PerformanceResult[] | string> => {
  // Check if we have uploaded data
  const optimizedData = await OptimizedService.getAllVulnerabilities();
  
  // If no uploaded data exists, return a message to prompt user to upload data
  if (optimizedData.length === 0) {
    return "No vulnerability data found. Please upload data first to run performance tests.";
  }
  
  const results: PerformanceResult[] = [];
  const testData = optimizedData;
  const dataSize = testData.length;
  
  console.log(`Using uploaded data (${optimizedData.length} records) for performance testing`);
  
  // Test with the available data
  results.push(
    await measureExecutionTime(
      async () => Promise.resolve(testData),
      'Original',
      'Fetch All Data',
      dataSize
    )
  );
  
  results.push(
    await measureExecutionTime(
      async () => OptimizedService.getAllVulnerabilities(),
      'Optimized',
      'Fetch All Data',
      dataSize
    )
  );
  
  // Test 2: Filter data - high severity vulnerabilities
  const highSeverityFilter: FilterOptions = {
    severity: ['HIGH', 'high'], // Handle different case formats
    kaiStatus: [],
    vendor: [],
    product: [],
    vulnerabilityType: [],
    dateRange: { start: null, end: null },
    cvssRange: { min: 0, max: 10 }
  };
  
  results.push(
    await measureExecutionTime(
      async () => {
        return OriginalService.filterVulnerabilities(testData, highSeverityFilter);
      },
      'Original',
      'Filter High Severity',
      dataSize
    )
  );
  
  results.push(
    await measureExecutionTime(
      async () => OptimizedService.queryVulnerabilities(highSeverityFilter),
      'Optimized',
      'Filter High Severity',
      dataSize
    )
  );
  
  // Test 3: Complex filtering - multiple conditions
  const complexFilter: FilterOptions = {
    severity: ['HIGH', 'high', 'CRITICAL', 'critical'], // Handle different case formats
    kaiStatus: [],
    vendor: ['apache', 'Apache', 'APACHE'], // Try to match some possible vendor names
    product: [],
    vulnerabilityType: [],
    dateRange: { 
      start: '2020-01-01', 
      end: new Date().toISOString().split('T')[0] 
    },
    cvssRange: { min: 7, max: 10 }
  };
  
  results.push(
    await measureExecutionTime(
      async () => {
        return OriginalService.filterVulnerabilities(testData, complexFilter);
      },
      'Original',
      'Complex Filter',
      dataSize
    )
  );
  
  results.push(
    await measureExecutionTime(
      async () => OptimizedService.queryVulnerabilities(complexFilter),
      'Optimized',
      'Complex Filter',
      dataSize
    )
  );
  
  // Test 4: Generate statistics
  results.push(
    await measureExecutionTime(
      async () => {
        return OriginalService.generateVulnerabilityStats(testData);
      },
      'Original',
      'Generate Stats',
      dataSize
    )
  );
  
  results.push(
    await measureExecutionTime(
      async () => OptimizedService.generateVulnerabilityStats(),
      'Optimized',
      'Generate Stats',
      dataSize
    )
  );
  
  // Test 5: Multiple single CVE ID lookups
  const sampleSize = Math.min(100, dataSize);
  const sampleCveIds = testData.slice(0, sampleSize).map(v => v.cveId);
  
  results.push(
    await measureExecutionTime(
      async () => {
        // Simulate multiple lookups
        return Promise.all(
          sampleCveIds.map(cveId => 
            Promise.resolve(testData.find(v => v.cveId === cveId))
          )
        );
      },
      'Original',
      'Multiple CVE Lookups',
      sampleSize
    )
  );
  
  results.push(
    await measureExecutionTime(
      async () => {
        // Use optimized single lookups
        return Promise.all(
          sampleCveIds.map(async cveId => {
            const vulns = await OptimizedService.getVulnerabilityById(cveId);
            return vulns.length > 0 ? vulns[0] : undefined;
          })
        );
      },
      'Optimized',
      'Multiple CVE Lookups',
      sampleSize
    )
  );
  
  // Results summary
  results.forEach(result => {
    console.log(
      `${result.name} ${result.operationName}: ` +
      `${result.executionTime.toFixed(2)}ms, ` +
      `${result.itemsPerSecond.toFixed(2)} items/s`
    );
  });
  
  return results;
};

/**
 * Analyze performance test results, calculate improvement percentages
 */
export const analyzePerformanceResults = (results: PerformanceResult[]): { 
  summary: string; 
  details: Array<{ 
    operation: string;
    originalTime: number;
    optimizedTime: number; 
    improvement: number;
  }>;
} => {
  const pairs = new Map<string, { original: PerformanceResult; optimized: PerformanceResult }>();
  
  // Group by operation name
  results.forEach(result => {
    const key = result.operationName;
    if (!pairs.has(key)) {
      pairs.set(key, { original: {} as PerformanceResult, optimized: {} as PerformanceResult });
    }
    
    const pair = pairs.get(key)!;
    if (result.name === 'Original') {
      pair.original = result;
    } else {
      pair.optimized = result;
    }
  });
  
  // Calculate performance improvement for each operation
  const details = Array.from(pairs.entries()).map(([operation, pair]) => {
    const originalTime = pair.original.executionTime;
    const optimizedTime = pair.optimized.executionTime;
    const improvement = ((originalTime - optimizedTime) / originalTime) * 100;
    
    return {
      operation,
      originalTime,
      optimizedTime,
      improvement
    };
  });
  
  // Calculate average performance improvement
  const averageImprovement = details.reduce((sum, item) => sum + item.improvement, 0) / details.length;
  
  // Generate summary
  const summary = `
    Performance Test Analysis:
    - Average Performance Improvement: ${averageImprovement.toFixed(2)}%
    - Number of Test Operations: ${details.length}
    - Maximum Improvement: ${Math.max(...details.map(d => d.improvement)).toFixed(2)}% (${
      details.find(d => d.improvement === Math.max(...details.map(d => d.improvement)))?.operation
    })
  `;
  
  return { summary, details };
};

/**
 * Create benchmark test dataset
 */
export const createTestDataSet = (size: number): Vulnerability[] => {
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
  const vendors = ['apache', 'microsoft', 'oracle', 'google', 'ibm', 'redhat'];
  const products = ['httpd', 'windows', 'java', 'chrome', 'db2', 'linux'];
  const vulnTypes = ['overflow', 'xss', 'sql-injection', 'rce', 'dos', 'privilege-escalation'];
  const statuses = ['fixed', 'unfixed', 'in-progress', 'invalid - norisk', 'ai-invalid-norisk'];
  
  const getRandomElement = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
  };
  
  const getRandomDate = (start: Date, end: Date): string => {
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return randomDate.toISOString();
  };
  
  const now = new Date();
  const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
  
  return Array.from({ length: size }, (_, i) => {
    const severity = getRandomElement(severities);
    const cvss = severity === 'CRITICAL' ? 9 + Math.random() : 
                severity === 'HIGH' ? 7 + Math.random() * 2 : 
                severity === 'MEDIUM' ? 4 + Math.random() * 3 : 
                severity === 'LOW' ? 1 + Math.random() * 3 : 
                Math.random();
    
    return {
      cveId: `CVE-${2020 + Math.floor(Math.random() * 4)}-${10000 + i}`,
      severity,
      kaiStatus: getRandomElement(statuses),
      cvss,
      summary: `Test vulnerability ${i}`,
      publishedDate: getRandomDate(fiveYearsAgo, now),
      lastModifiedDate: getRandomDate(fiveYearsAgo, now),
      vulnerable_version: `< 1.${Math.floor(Math.random() * 10)}`,
      patched_version: `>= 1.${Math.floor(Math.random() * 10)}`,
      vendor: getRandomElement(vendors),
      product: getRandomElement(products),
      exploitabilityScore: Math.random() * 10,
      impactScore: Math.random() * 10,
      vulnerabilityType: getRandomElement(vulnTypes),
      cweId: `CWE-${100 + Math.floor(Math.random() * 900)}`,
      references: []
    };
  });
}; 