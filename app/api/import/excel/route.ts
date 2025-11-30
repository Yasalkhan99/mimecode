import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'stores' or 'coupons'
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' 
      }, { status: 400 });
    }

    // Read Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (error: any) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to read Excel file. Please ensure it is a valid Excel file.' 
      }, { status: 400 });
    }
    
    const result: any[] = [];
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Add data from this sheet
      if (jsonData.length > 0) {
        result.push(...jsonData);
      }
    });

    // Validate data
    if (result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No data found in Excel file. Please check your file and try again.' 
      }, { status: 400 });
    }

    console.log(`📊 Excel import preview: ${result.length} rows found, type: ${type}`);

    return NextResponse.json({ 
      success: true, 
      data: result,
      type: type,
      count: result.length,
      sheets: workbook.SheetNames
    });
  } catch (error: any) {
    console.error('Excel import error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process Excel file. Please try again.' 
    }, { status: 500 });
  }
}

