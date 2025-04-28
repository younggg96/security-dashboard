# Security Vulnerability Dashboard

A React-based dashboard for visualizing and analyzing security vulnerabilities in software ecosystems with optimized data processing capabilities.

## Key Features

- **Local JSON Data Processing**: Upload and analyze your vulnerability data directly in the browser without sending to a server
- **Interactive Dashboard**: Overview of key vulnerability metrics with dynamic visualizations
- **Advanced Filtering**: Filter vulnerabilities by severity, vendor, product, CVSS score, and date ranges
- **Data Visualization**: Interactive charts and graphs to visualize vulnerability trends and distributions
- **Performance Testing**: Built-in tools to compare original and optimized data handling implementations
- **Vendor Analysis**: Detailed vendor-specific vulnerability analysis
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **High Performance**: Specialized data structures for efficient handling of large vulnerability datasets

## Getting Started

### Local JSON Data Upload

This dashboard is designed to work with your local vulnerability data:

1. **Prepare your JSON data**: The dashboard supports various JSON formats including:
   - Standard vulnerability data array format
   - Complex nested structures with `groups` > `repos` > `images` > `vulnerabilities`
   - Custom formats with CVE information

2. **Upload your data**: Use the prominent upload button on the Dashboard page
   - File processing happens entirely in your browser
   - No data is sent to any remote server
   - Large files (10,000+ records) are supported with the optimized implementation

3. **View and analyze**: Once uploaded, your data will be immediately available for visualization and analysis

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

## Technical Implementation

### Data Handling

- Browser-based processing of large JSON datasets (no server required)
- Smart data structure detection and parsing
- Efficient data transformation and normalization
- Pagination for handling large datasets
- Memory-efficient storage with specialized data structures

### Performance Optimization

- Advanced data structures for optimal lookup and filtering:
  - **VulnerabilityMap**: O(1) CVE ID lookups (vs O(n) in traditional implementations)
  - **VulnerabilityIndex**: Multi-dimensional attribute indexing
  - **RangeIndex**: Efficient numeric range queries (e.g., CVSS scores)
  - **DateIndex**: Optimized date range filtering
- Built-in performance testing tools for comparing implementations
- Up to 90% performance improvement for complex filtering operations
- Memory optimization for client-side processing

### Component Architecture

- React functional components with hooks
- Context API for global state management
- Material UI for consistent, responsive design
- Modular code organization for maintainability

### Data Visualization

- Interactive charts using Recharts library for:
  - Vulnerability severity distribution
  - Vendor-specific vulnerability counts
  - Timeline analysis of vulnerabilities
  - Filtering impact visualization

## Project Structure

```
security-dashboard/
├── public/               # Static files
├── src/                  # Source files
│   ├── components/       # Reusable components
│   │   ├── layout/       # Layout components
│   │   └── VulnerabilityTable/ # Table components
│   ├── contexts/         # Context providers
│   │   └── VulnerabilityContext.tsx # Global vulnerability data management
│   ├── interfaces/       # TypeScript interfaces
│   │   └── VulnerabilityData.ts # Core data models
│   ├── pages/            # Page components
│   │   ├── DashboardPage.tsx    # Main dashboard with upload functionality
│   │   ├── VulnerabilitiesPage.tsx # Detailed vulnerability listing
│   │   └── PerformanceTestPage.tsx # Performance comparison tools
│   ├── services/         # API and data services
│   │   ├── VulnerabilityService.ts          # Original service implementation
│   │   └── OptimizedVulnerabilityService.ts # Optimized implementation
│   └── utils/            # Utility functions
│       ├── VulnerabilityDataStructures.ts   # Optimized data structures
│       ├── FileBasedJsonLoader.ts           # JSON upload and parsing utilities
│       └── PerformanceTest.ts               # Performance testing framework
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

The dashboard includes specialized filtering modes:

1. **Analysis Mode**: Filters out CVEs with kaiStatus "invalid - norisk"
2. **AI Analysis Mode**: Filters out CVEs with kaiStatus "ai-invalid-norisk"

These features help security teams focus on relevant vulnerabilities by removing those determined to be irrelevant.

### Performance Test Suite

The built-in performance testing page allows you to:

- Compare original vs. optimized implementations with your actual data
- Measure execution time for common operations
- View detailed performance improvements by operation type
- Understand the technical approach behind the optimizations

### Smart JSON Detection

The dashboard includes intelligent JSON structure detection that:
- Automatically identifies various JSON formats
- Extracts vulnerability data from complex nested structures
- Normalizes data fields for consistent processing
- Handles different naming conventions and case sensitivity
