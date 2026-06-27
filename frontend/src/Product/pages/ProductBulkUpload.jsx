import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import productService from '../services/productService';
import { useBranch } from '../../context/BranchContext';

const ProductBulkUpload = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
  const [file, setFile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setUploadResult(null);
      parseExcelFile(selectedFile);
    }
  };

  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedProducts = jsonData.map((row) => ({
          product_name: row.product_name || row['Product Name'] || '',
          category_name: row.category_name || row['Category Name'] || '',
          subcategory_name: row.subcategory_name || row['Subcategory Name'] || '',
          branch_name: row.branch_name || row['Branch Name'] || '',
          branch_code: row.branch_code || row['Branch Code'] || '',
          brand: row.brand || row['Brand'] || '',
          size: row.size || row['Size'] || '',
          color: row.color || row['Color'] || '',
          material: row.material || row['Material'] || '',
          style: row.style || row['Style'] || '',
          pattern: row.pattern || row['Pattern'] || '',
          sleeve_type: row.sleeve_type || row['Sleeve Type'] || '',
          length: row.length || row['Length'] || '',
          occasion: row.occasion || row['Occasion'] || '',
          season: row.season || row['Season'] || '',
          gender: row.gender || row['Gender'] || 'Women',
          unit: row.unit || row['Unit'] || 'piece',
          purchase_price: parseFloat(row.purchase_price || row['Purchase Price'] || 0),
          selling_price: parseFloat(row.selling_price || row['Selling Price'] || 0),
          mrp: parseFloat(row.mrp || row['MRP'] || 0) || null,
          discount_percentage: parseFloat(row.discount_percentage || row['Discount %'] || 0),
          tax_percentage: parseFloat(row.tax_percentage || row['Tax %'] || 0),
          description: row.description || row['Description'] || '',
          care_instructions: row.care_instructions || row['Care Instructions'] || '',
          barcode: row.barcode || row['Barcode'] || '',
          sku: row.sku || row['SKU'] || '',
          stock_quantity: parseInt(row.stock_quantity || row['Stock Quantity'] || 0),
          status: row.status || row['Status'] || 'active',
        }));

        setProducts(parsedProducts);
      } catch (err) {
        setError('Error parsing Excel file. Please check the format.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (products.length === 0) {
      setError('No products to upload');
      return;
    }

    // Check if products have branch info or if global branch is selected
    const hasBranchInData = products.some(p => p.branch_name || p.branch_code);
    if (!hasBranchInData && !selectedBranch) {
      setError('Please select a branch or include branch_name/branch_code in Excel file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await productService.bulkUpload({
        products,
        branch_id: selectedBranch?.id // Optional fallback branch
      });

      setUploadResult(response.data);
      setProducts([]);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        product_name: 'Sample Dress',
        category_name: 'Women Wear',
        subcategory_name: 'Casual Dresses',
        branch_code: 'BR001',
        brand: 'Fashion Brand',
        size: 'M',
        color: 'Red',
        material: 'Cotton',
        style: 'Casual',
        pattern: 'Solid',
        sleeve_type: 'Half Sleeve',
        length: 'Knee Length',
        occasion: 'Casual',
        season: 'Summer',
        gender: 'Women',
        unit: 'piece',
        purchase_price: 500,
        selling_price: 800,
        mrp: 1000,
        discount_percentage: 20,
        tax_percentage: 5,
        description: 'Beautiful casual dress',
        care_instructions: 'Machine wash cold',
        barcode: '',
        sku: '',
        stock_quantity: 10,
        status: 'active',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product_bulk_upload_template.xlsx');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bulk Product Upload</h1>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-gray-500 !text-white rounded hover:bg-gray-600"
        >
          Back to Products
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-500 !text-white rounded hover:bg-blue-600"
          >
            Download Excel Template
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Upload Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {selectedBranch && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">
              <span className="font-medium">Selected Branch (Fallback):</span> {selectedBranch.branch_name}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              This branch will be used for products without branch_name or branch_code in Excel
            </p>
          </div>
        )}

        {!selectedBranch && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Note:</span> Make sure to include branch_name or branch_code in your Excel file, or select a branch above as fallback
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        {products.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {products.length} products ready to upload
            </p>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-6 py-2 bg-green-500 !text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Uploading...' : 'Upload Products'}
            </button>
          </div>
        )}
      </div>

      {uploadResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Upload Results</h2>
          
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-medium">{uploadResult.message}</p>
            <div className="mt-2 text-sm">
              <p>Total: {uploadResult.summary.total}</p>
              <p className="text-green-600">Success: {uploadResult.summary.success}</p>
              <p className="text-red-600">Failed: {uploadResult.summary.failed}</p>
            </div>
          </div>

          {uploadResult.products.filter(p => !p.success && p.skipped).length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-yellow-600">Skipped Products (Already Exist):</h3>
              <div className="max-h-60 overflow-y-auto">
                {uploadResult.products
                  .filter(p => !p.success && p.skipped)
                  .map((result, index) => (
                    <div key={index} className="p-2 mb-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="font-medium">{result.product_name}</p>
                      <p className="text-yellow-700">{result.error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {uploadResult.products.filter(p => !p.success && !p.skipped).length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2 text-red-600">Failed Products:</h3>
              <div className="max-h-60 overflow-y-auto">
                {uploadResult.products
                  .filter(p => !p.success && !p.skipped)
                  .map((result, index) => (
                    <div key={index} className="p-2 mb-2 bg-red-50 border border-red-200 rounded text-sm">
                      <p className="font-medium">{result.product_name}</p>
                      <p className="text-red-600">{result.error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {uploadResult.stock && uploadResult.stock.filter(s => !s.success).length > 0 && (
            <div>
              <h3 className="font-medium mb-2 text-orange-600">Stock Issues:</h3>
              <div className="max-h-60 overflow-y-auto">
                {uploadResult.stock
                  .filter(s => !s.success)
                  .map((result, index) => (
                    <div key={index} className="p-2 mb-2 bg-orange-50 border border-orange-200 rounded text-sm">
                      <p className="font-medium">{result.product_name}</p>
                      <p className="text-orange-600">{result.error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductBulkUpload;
