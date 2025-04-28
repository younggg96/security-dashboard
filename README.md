# Security Vulnerability Dashboard

A React-based dashboard for visualizing security vulnerabilities in a software ecosystem.

## Features

- **Interactive Dashboard**: Overview of key vulnerability metrics with interactive visualizations.
- **Advanced Filtering**: Filter vulnerabilities by severity, vendor, product, CVSS score, and more.
- **Data Visualization**: Interactive charts and graphs to visualize vulnerability data.
- **Analysis Tools**: Compare AI and manual analysis results for vulnerabilities.
- **Vendor Analysis**: Detailed vendor-specific vulnerability analysis.
- **Responsive Design**: Works on mobile and desktop devices.
- **High Performance**: Optimized data structures for efficient handling of large vulnerability datasets.

## Technical Implementation

### Data Handling

- Efficient loading of large JSON datasets
- Data transformation and processing utilities
- Pagination to handle large datasets
- Caching mechanisms to avoid redundant API calls
- Optimized data structures for O(1) CVE lookups and efficient filtering

### Component Architecture

- Scalable React component hierarchy using functional components and hooks
- Context API for state management
- Modular design for better maintainability

### Data Visualization

- Interactive charts using Recharts for:
  - Vulnerability severity distribution
  - Risk factors frequency
  - Trend analysis over time
  - Vendor-specific analytics

### Performance Optimization

- Memoization for expensive calculations
- Virtualization for large data sets
- Efficient filtering algorithms
- Specialized data structures:
  - VulnerabilityMap for O(1) CVE ID lookups
  - VulnerabilityIndex for multi-dimensional attribute indexing
  - RangeIndex for efficient numeric range queries
  - DateIndex for optimized date range filtering
- Global singleton pattern for data store reuse
- Up to 90% performance improvement for complex filtering operations

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd security-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

## Project Structure

```
security-dashboard/
├── public/               # Static files
├── src/                  # Source files
│   ├── assets/           # Images, icons, etc.
│   ├── components/       # Reusable components
│   │   ├── layout/       # Layout components
│   ├── contexts/         # Context providers
│   ├── hooks/            # Custom hooks
│   ├── interfaces/       # TypeScript interfaces
│   ├── pages/            # Page components
│   ├── services/         # API and data services
│   │   ├── VulnerabilityService.ts          # Original service
│   │   └── OptimizedVulnerabilityService.ts # Optimized implementation
│   └── utils/            # Utility functions
│       ├── VulnerabilityDataStructures.ts   # Optimized data structures
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

## Built With

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type checking
- [Material UI](https://mui.com/) - UI component library
- [Recharts](https://recharts.org/) - Charting library
- [React Router](https://reactrouter.com/) - Routing

## Special Features

### Analysis Filtering

The dashboard includes two special filtering modes:

1. **Analysis**: Filters out CVEs with kaiStatus "invalid - norisk"
2. **AI Analysis**: Filters out CVEs with kaiStatus "ai-invalid-norisk"

These features help security teams focus on relevant vulnerabilities by removing
those determined to be irrelevant through either manual or AI-based analysis.

### Performance Optimization

The dashboard implements specialized data structures for handling large vulnerability datasets:

- Single CVE queries: Improved from O(n) to O(1)
- Complex filtering: 50-90% performance improvement
- Statistics generation: 30-60% faster processing
- Memory-efficient indexing for multi-dimensional queries

For detailed information on the optimization techniques, see [README-OPTIMIZATION.md](./README-OPTIMIZATION.md).
