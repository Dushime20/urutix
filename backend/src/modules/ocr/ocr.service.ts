import { Injectable } from '@nestjs/common';
import * as Tesseract from 'tesseract.js';
import * as pdfParse from 'pdf-parse';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  async extractText(url: string): Promise<{ text: string }> {
    if (url.endsWith('.pdf')) {
      // Download PDF and extract text from all pages
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);
      if (data.text && data.text.trim().length > 0) {
        return { text: data.text };
      } else {
        // Fallback: render each page as image and OCR
        const loadingTask = pdfjsLib.getDocument({ data: response.data });
        const pdf = await loadingTask.promise;
        let fullText = '';
        const worker = await createWorker('eng');
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext('2d') as any;
          await page.render({ canvasContext: context, viewport }).promise;
          const imageDataUrl = canvas.toDataURL();
          const {
            data: { text },
          } = await worker.recognize(imageDataUrl);
          fullText += `\n--- Page ${pageNum} ---\n` + text;
        }
        await worker.terminate();
        return { text: fullText };
      }
    } else {
      // For images, use Tesseract
      const worker = await createWorker('eng');
      const {
        data: { text },
      } = await worker.recognize(url);
      await worker.terminate();
      return { text };
    }
  }

  async extractFromFile(
    file: Express.Multer.File,
  ): Promise<{ text: string; confidence: number }> {
    const tempPath = path.join(process.cwd(), 'temp', file.filename);

    try {
      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        if (data.text && data.text.trim().length > 0) {
          return { text: data.text, confidence: 0.9 };
        } else {
          // Fallback: render PDF as images and OCR
          const loadingTask = pdfjsLib.getDocument({ data: file.buffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          let totalConfidence = 0;
          let pageCount = 0;

          const worker = await createWorker('eng');
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });
            const canvas = createCanvas(viewport.width, viewport.height);
            const context = canvas.getContext('2d') as any;
            await page.render({ canvasContext: context, viewport }).promise;
            const imageDataUrl = canvas.toDataURL();
            const {
              data: { text, confidence },
            } = await worker.recognize(imageDataUrl);
            fullText += `\n--- Page ${pageNum} ---\n` + text;
            totalConfidence += confidence;
            pageCount++;
          }
          await worker.terminate();
          return { text: fullText, confidence: totalConfidence / pageCount };
        }
      } else {
        // For images, use Tesseract
        const worker = await createWorker('eng');
        const {
          data: { text, confidence },
        } = await worker.recognize(file.buffer);
        await worker.terminate();
        return { text, confidence };
      }
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  }

  async extractDocumentData(url: string, documentType: string): Promise<any> {
    const { text } = await this.extractText(url);

    switch (documentType) {
      case 'vehicle_registration':
        return this.extractVehicleRegistrationData(text);
      case 'insurance_policy':
        return this.extractInsurancePolicyData(text);
      case 'driver_license':
        return this.extractDriverLicenseData(text);
      case 'maintenance_record':
        return this.extractMaintenanceRecordData(text);
      case 'inspection_report':
        return this.extractInspectionReportData(text);
      default:
        return { text, extractedData: null };
    }
  }

  private extractVehicleRegistrationData(text: string): any {
    const data: any = {};

    // Extract license plate
    const plateMatch = text.match(
      /(?:LICENSE PLATE|PLATE|REGISTRATION)[:\s]*([A-Z0-9-]{3,10})/i,
    );
    if (plateMatch) data.licensePlate = plateMatch[1];

    // Extract VIN
    const vinMatch = text.match(/(?:VIN|VIN NUMBER)[:\s]*([A-Z0-9]{17})/i);
    if (vinMatch) data.vin = vinMatch[1];

    // Extract make/model
    const makeModelMatch = text.match(/(?:MAKE|MODEL)[:\s]*([A-Za-z\s]+)/i);
    if (makeModelMatch) data.makeModel = makeModelMatch[1].trim();

    // Extract year
    const yearMatch = text.match(/(?:YEAR|MODEL YEAR)[:\s]*(\d{4})/i);
    if (yearMatch) data.year = parseInt(yearMatch[1]);

    // Extract expiry date
    const expiryMatch = text.match(
      /(?:EXPIRES|EXPIRY|VALID UNTIL)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (expiryMatch) data.expiryDate = expiryMatch[1];

    return {
      text,
      extractedData: data,
      documentType: 'vehicle_registration',
    };
  }

  private extractInsurancePolicyData(text: string): any {
    const data: any = {};

    // Extract policy number
    const policyMatch = text.match(
      /(?:POLICY|POLICY NUMBER)[:\s]*([A-Z0-9-]{5,15})/i,
    );
    if (policyMatch) data.policyNumber = policyMatch[1];

    // Extract insurance company
    const companyMatch = text.match(
      /(?:INSURANCE COMPANY|CARRIER)[:\s]*([A-Za-z\s]+)/i,
    );
    if (companyMatch) data.insuranceCompany = companyMatch[1].trim();

    // Extract coverage amount
    const coverageMatch = text.match(/(?:COVERAGE|LIMIT)[:\s]*\$?([0-9,]+)/i);
    if (coverageMatch)
      data.coverageAmount = parseInt(coverageMatch[1].replace(/,/g, ''));

    // Extract premium
    const premiumMatch = text.match(/(?:PREMIUM|COST)[:\s]*\$?([0-9,]+)/i);
    if (premiumMatch)
      data.premium = parseInt(premiumMatch[1].replace(/,/g, ''));

    // Extract dates
    const startDateMatch = text.match(
      /(?:EFFECTIVE|START)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (startDateMatch) data.startDate = startDateMatch[1];

    const endDateMatch = text.match(
      /(?:EXPIRES|END)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (endDateMatch) data.endDate = endDateMatch[1];

    return {
      text,
      extractedData: data,
      documentType: 'insurance_policy',
    };
  }

  private extractDriverLicenseData(text: string): any {
    const data: any = {};

    // Extract license number
    const licenseMatch = text.match(
      /(?:LICENSE|LICENSE NUMBER)[:\s]*([A-Z0-9-]{5,15})/i,
    );
    if (licenseMatch) data.licenseNumber = licenseMatch[1];

    // Extract name
    const nameMatch = text.match(/(?:NAME|LICENSEE)[:\s]*([A-Za-z\s]+)/i);
    if (nameMatch) data.name = nameMatch[1].trim();

    // Extract state
    const stateMatch = text.match(/(?:STATE|ISSUING STATE)[:\s]*([A-Z]{2})/i);
    if (stateMatch) data.state = stateMatch[1];

    // Extract expiry date
    const expiryMatch = text.match(
      /(?:EXPIRES|EXPIRY)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (expiryMatch) data.expiryDate = expiryMatch[1];

    // Extract license class
    const classMatch = text.match(/(?:CLASS|LICENSE CLASS)[:\s]*([A-Z0-9]+)/i);
    if (classMatch) data.licenseClass = classMatch[1];

    return {
      text,
      extractedData: data,
      documentType: 'driver_license',
    };
  }

  private extractMaintenanceRecordData(text: string): any {
    const data: any = {};

    // Extract service type
    const serviceMatch = text.match(
      /(?:SERVICE|MAINTENANCE TYPE)[:\s]*([A-Za-z\s]+)/i,
    );
    if (serviceMatch) data.serviceType = serviceMatch[1].trim();

    // Extract cost
    const costMatch = text.match(/(?:COST|TOTAL|AMOUNT)[:\s]*\$?([0-9,]+)/i);
    if (costMatch) data.cost = parseInt(costMatch[1].replace(/,/g, ''));

    // Extract date
    const dateMatch = text.match(
      /(?:DATE|SERVICE DATE)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (dateMatch) data.serviceDate = dateMatch[1];

    // Extract mileage
    const mileageMatch = text.match(/(?:MILEAGE|ODOMETER)[:\s]*([0-9,]+)/i);
    if (mileageMatch)
      data.mileage = parseInt(mileageMatch[1].replace(/,/g, ''));

    // Extract technician
    const techMatch = text.match(/(?:TECHNICIAN|MECHANIC)[:\s]*([A-Za-z\s]+)/i);
    if (techMatch) data.technician = techMatch[1].trim();

    return {
      text,
      extractedData: data,
      documentType: 'maintenance_record',
    };
  }

  private extractInspectionReportData(text: string): any {
    const data: any = {};

    // Extract inspection type
    const typeMatch = text.match(
      /(?:INSPECTION TYPE|TYPE)[:\s]*([A-Za-z\s]+)/i,
    );
    if (typeMatch) data.inspectionType = typeMatch[1].trim();

    // Extract result
    const resultMatch = text.match(
      /(?:RESULT|STATUS)[:\s]*(PASS|FAIL|PENDING)/i,
    );
    if (resultMatch) data.result = resultMatch[1];

    // Extract score
    const scoreMatch = text.match(/(?:SCORE|RATING)[:\s]*(\d+)/i);
    if (scoreMatch) data.score = parseInt(scoreMatch[1]);

    // Extract date
    const dateMatch = text.match(
      /(?:INSPECTION DATE|DATE)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    );
    if (dateMatch) data.inspectionDate = dateMatch[1];

    // Extract inspector
    const inspectorMatch = text.match(
      /(?:INSPECTOR|INSPECTED BY)[:\s]*([A-Za-z\s]+)/i,
    );
    if (inspectorMatch) data.inspector = inspectorMatch[1].trim();

    return {
      text,
      extractedData: data,
      documentType: 'inspection_report',
    };
  }
}
