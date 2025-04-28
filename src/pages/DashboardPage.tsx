import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Button,
  Grid,
  Divider,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StorageIcon from "@mui/icons-material/Storage";
import { useVulnerability } from "../contexts/VulnerabilityContext";
import { FileBasedJsonLoader } from "../utils/FileBasedJsonLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Vulnerability,
  JsonVulnerability,
} from "../interfaces/VulnerabilityData";

// Colors for the severity distribution pie chart
const SEVERITY_COLORS = {
  CRITICAL: "#d32f2f",
  HIGH: "#f44336",
  MEDIUM: "#ff9800",
  LOW: "#ffeb3b",
  NONE: "#4caf50",
};

// Function to convert JSON vulnerability data to Vulnerability format needed by the application
const convertJsonVulnerabilityToVulnerability = (
  jsonVuln: JsonVulnerability
): Vulnerability => {
  return {
    cveId: jsonVuln.cve,
    severity: jsonVuln.severity,
    kaiStatus: jsonVuln.status || "unknown",
    cvss: jsonVuln.cvss,
    summary: jsonVuln.description,
    publishedDate: jsonVuln.published,
    lastModifiedDate: jsonVuln.fixDate || jsonVuln.published,
    vulnerable_version: jsonVuln.packageVersion || "",
    patched_version: "",
    vendor: jsonVuln.packageName?.split("/")[0] || "",
    product: jsonVuln.packageName?.split("/")[1] || jsonVuln.packageName || "",
    exploitabilityScore: 0,
    impactScore: 0,
    vulnerabilityType: jsonVuln.type || "",
    cweId: "",
    references: jsonVuln.link ? [jsonVuln.link] : [],
  };
};

const DashboardPage: React.FC = () => {
  const {
    isLoading,
    error,
    stats,
    filteredVulnerabilities,
    allVulnerabilities,
    setAllVulnerabilities,
  } = useVulnerability();

  // File upload related states
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Check if we have data
  useEffect(() => {
    setHasData(allVulnerabilities.length > 0);
  }, [allVulnerabilities]);

  // Handle file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setFileUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // Check file type
      if (
        file.type &&
        !file.type.includes("json") &&
        !file.name.endsWith(".json")
      ) {
        throw new Error(
          `Unsupported file type: ${file.type || "unknown"}, please upload a JSON file`
        );
      }

      const loader = new FileBasedJsonLoader();
      // Load raw JSON data
      const rawData = await loader.loadFromFile(file, (progress) => {
        setUploadProgress(progress * 100);
      });
      
      if (Array.isArray(rawData)) {
        console.info("Array length:", rawData.length);
        if (rawData.length > 0) {
          console.info("First item data:", JSON.stringify(rawData[0]));
        }
      } else if (rawData && typeof rawData === "object") {
        console.info("Object properties:", Object.keys(rawData));
        // Check if groups property exists
        if (rawData.groups) {
          console.info("Groups property values:", Object.keys(rawData.groups));
        }
      }

      // Extract vulnerability data
      let vulnerabilities: JsonVulnerability[] = [];

      try {
        // Type assertion to any type
        const data = rawData as any;
        
        if (data && typeof data === "object" && data.groups) {
          console.info("Detected nested structure, starting to extract vulnerability data");
          // Iterate through groups object
          for (const groupKey in data.groups) {
            const group = data.groups[groupKey];
            console.info("Processing group:", groupKey);
            
            // Iterate through repos object
            for (const repoKey in group.repos) {
              const repo = group.repos[repoKey];
              console.info("Processing repo:", repoKey);
              
              // Iterate through images object
              for (const imageKey in repo.images) {
                const image = repo.images[imageKey];
                console.info("Processing image:", imageKey);
                
                // Get vulnerabilities array
                if (image.vulnerabilities && Array.isArray(image.vulnerabilities)) {
                  console.info(`Found ${image.vulnerabilities.length} vulnerability records`);
                  vulnerabilities.push(...image.vulnerabilities);
                }
              }
            }
          }
        } else if (Array.isArray(data)) {
          console.info("Detected array data, attempting to use directly");
          // Check if array elements match vulnerability structure
          if (data.length > 0 && (data[0].cve || data[0].cveId)) {
            vulnerabilities = data;
          } else {
            console.warn("Array elements don't match vulnerability data structure");
          }
        } else {
          throw new Error("Unrecognized data format, please ensure correct JSON structure is uploaded");
        }
      } catch (error) {
        console.error("Error while extracting vulnerability data:", error);
        throw new Error("Failed to parse vulnerability data, please check JSON format");
      }

      console.info(`Total extracted vulnerability records: ${vulnerabilities.length}`);
      
      if (vulnerabilities.length === 0) {
        throw new Error("No vulnerability data found, please check the uploaded JSON file format");
      }

      // Check first item data
      const firstItem = vulnerabilities[0];
      console.info("First vulnerability data:", JSON.stringify(firstItem));
      
      // Convert to application required data format
      const convertedVulnerabilities = vulnerabilities.map(vuln => {
        // Check if already matches Vulnerability format
        if ('cveId' in vuln) {
          return vuln as unknown as Vulnerability;
        }
        // Otherwise convert
        return convertJsonVulnerabilityToVulnerability(vuln as JsonVulnerability);
      });

      console.info(`Conversion completed, produced ${convertedVulnerabilities.length} standardized vulnerability records`);
      
      // Update global data
      setAllVulnerabilities(convertedVulnerabilities);
      setShowSuccessMessage(true);
    } catch (error) {
      console.error("Error loading file:", error);
      setUploadError(
        error instanceof Error ? error.message : "Failed to load JSON file"
      );
    } finally {
      setFileUploading(false);
    }

    // Clear input value to allow uploading the same file again
    event.target.value = "";
  };

  // Close success notification
  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
  };

  // Close error notification
  const handleCloseErrorMessage = () => {
    setUploadError(null);
  };

  if (isLoading && !fileUploading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !fileUploading) {
    return (
      <Alert severity="error">
        Error loading vulnerability data: {error.message}
      </Alert>
    );
  }

  // Calculate filter impact percentage
  const filterImpact =
    filteredVulnerabilities.length && allVulnerabilities.length
      ? ((allVulnerabilities.length - filteredVulnerabilities.length) /
          allVulnerabilities.length) *
        100
      : 0;

  return (
    <Box>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Security Vulnerability Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of security vulnerabilities in your software ecosystem
          </Typography>
        </Box>
      </Box>

      {/* 专门的上传卡片，在没有数据时显示 */}
      {!hasData && !fileUploading && (
        <Card 
          sx={{ 
            mb: 4, 
            border: '2px dashed #2e7d32', 
            bgcolor: 'rgba(46, 125, 50, 0.05)',
            boxShadow: 3,
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <CloudUploadIcon color="primary" sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              No Vulnerability Data Available
            </Typography>
            <Typography variant="body1" paragraph>
              Please upload a JSON file containing vulnerability data to get started.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The dashboard supports various JSON formats, including standard vulnerability exports and KAI-specific formats.
            </Typography>
            <input
              accept=".json"
              style={{ display: "none" }}
              id="upload-card-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="upload-card-file">
              <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<UploadFileIcon />}
                size="large"
                sx={{ 
                  mt: 2, 
                  fontWeight: 'bold',
                  minWidth: 200
                }}
              >
                Select JSON File
              </Button>
            </label>
          </CardContent>
        </Card>
      )}

      {/* File upload progress bar */}
      {fileUploading && (
        <Card sx={{ mb: 4, p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CloudUploadIcon color="primary" sx={{ mr: 2, fontSize: 30 }} />
            <Typography variant="h6">
              Uploading and Processing JSON Data...
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please wait while we upload and process your vulnerability data. This may take a few moments for large files.
          </Typography>
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Progress: {uploadProgress.toFixed(0)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Card>
      )}

      {/* File upload success notification */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={5000}
        onClose={handleCloseSuccessMessage}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success" sx={{ width: '100%' }}>
          <Typography variant="subtitle1">Success!</Typography>
          <Typography variant="body2">
            {allVulnerabilities.length} vulnerability records have been loaded successfully.
          </Typography>
        </Alert>
      </Snackbar>

      {/* File upload error notification */}
      <Snackbar
        open={!!uploadError}
        autoHideDuration={5000}
        onClose={handleCloseErrorMessage}
      >
        <Alert onClose={handleCloseErrorMessage} severity="error">
          {uploadError}
        </Alert>
      </Snackbar>

      {hasData && (
        <>
          {/* Summary Cards */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 4 }}>
            <Box sx={{ flex: "1 1 200px", minWidth: { xs: "100%", sm: "auto" } }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Vulnerabilities
                  </Typography>
                  <Typography variant="h4">
                    {stats ? stats.totalCount : 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: { xs: "100%", sm: "auto" } }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Critical Vulnerabilities
                  </Typography>
                  <Typography variant="h4" sx={{ color: SEVERITY_COLORS.CRITICAL }}>
                    {stats ? stats.severityDistribution["CRITICAL"] || 0 : 0}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: "1 1 200px", minWidth: { xs: "100%", sm: "auto" } }}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Filter Impact
                  </Typography>
                  <Typography variant="h4">{filterImpact.toFixed(1)}%</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Charts */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {/* Severity Distribution */}
              <Box sx={{ flex: "1 1 400px" }}>
                <Paper sx={{ p: 2, height: 300 }}>
                  <Typography variant="h6" gutterBottom>
                    Severity Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={stats ? Object.keys(stats.severityDistribution).map((key) => ({
                          name: key,
                          value: stats.severityDistribution[key],
                          color: SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS] || "#999",
                        })) : []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {stats ? Object.keys(stats.severityDistribution).map((key) => (
                          <Cell key={key} fill={SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS] || "#999"} />
                        )) : []}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Box>

              {/* Top Vendors by Vulnerabilities */}
              <Box sx={{ flex: "1 1 400px" }}>
                <Paper sx={{ p: 2, height: 300 }}>
                  <Typography variant="h6" gutterBottom>
                    Top Vendors by Vulnerabilities
                  </Typography>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart
                      data={stats ? Object.entries(stats.vendorDistribution).map(([name, value]) => ({ name, value })) : []}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="value" name="Vulnerabilities" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Box>
            </Box>

            {/* Vulnerability Timeline */}
            <Box>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="h6" gutterBottom>
                  Vulnerability Timeline
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart
                    data={stats ? stats.timelineData : []}
                    margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" name="Vulnerabilities" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
