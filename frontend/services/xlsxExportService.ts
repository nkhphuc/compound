import ExcelJS from 'exceljs';
import i18n from 'i18next'; // Import i18n instance
import { SPECTRAL_FIELDS_CONFIG } from '../constants';
import { CompoundData, CompoundStatus } from '../types';
// Removed SPECTRAL_FIELDS import, will use SPECTRAL_FIELDS_CONFIG from constants and i18n
import { getImageUrl } from './urlService'; // Import the URL helper

// Helper to convert base64 data URL to buffer for ExcelJS
function base64ToBuffer(base64String: string): ArrayBuffer | null {
  try {
    const parts = base64String.split(',');
    if (parts.length !== 2 || !parts[0].startsWith('data:image')) return null;
    const pureBase64 = parts[1];
    const byteString = atob(pureBase64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return ab;
  } catch (e) {
    console.error("Error converting base64 to Buffer:", e);
    return null;
  }
}

// Helper to fetch image from HTTP URL and convert to buffer for ExcelJS
async function urlToBuffer(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error("Failed to fetch image:", response.status, response.statusText);
      return null;
    }
    const blob = await response.blob();
    return await blob.arrayBuffer();
  } catch (e) {
    console.error("Error fetching image from URL:", e);
    return null;
  }
}

// Helper to get image extension from URL or data URL
function getImageExtension(imageUrl: string): 'png' | 'jpeg' | 'gif' {
  if (imageUrl.startsWith('data:image/')) {
    const match = imageUrl.match(/data:image\/([^;]+)/);
    if (match) {
      const ext = match[1].toLowerCase();
      if (ext === 'jpg') return 'jpeg';
      if (['png', 'jpeg', 'gif'].includes(ext)) return ext as 'png' | 'jpeg' | 'gif';
    }
    return 'png'; // default fallback
  }

  // For HTTP URLs, try to extract extension from URL
  const urlMatch = imageUrl.match(/\.([^.]+)$/);
  if (urlMatch) {
    const ext = urlMatch[1].toLowerCase();
    if (ext === 'jpg') return 'jpeg';
    if (['png', 'jpeg', 'gif'].includes(ext)) return ext as 'png' | 'jpeg' | 'gif';
  }

  return 'png'; // default fallback
}

// Helper to create rich text for chemical formulas
function formatFormulaRichText(formula?: string | null): ExcelJS.RichText[] {
  const t = i18n.t.bind(i18n); // Bind t function for use
  if (!formula || formula.trim() === "") return [{ text: t('excelExport.common.no', '-'), font: { name: 'Arial', size: 10, family: 2 } }];

  const richTextArray: ExcelJS.RichText[] = [];
  let currentTextSegment = "";

  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    let scriptType: 'subscript' | 'superscript' | null = null;
    let scriptContent = "";

    if (char === '_' || char === '^') {
      if (currentTextSegment) {
        richTextArray.push({ text: currentTextSegment, font: { name: 'Arial', size: 10, family: 2 } });
        currentTextSegment = "";
      }
      scriptType = char === '_' ? 'subscript' : 'superscript';

      if (formula[i+1] === '{') {
        const closingBraceIndex = formula.indexOf('}', i + 2);
        if (closingBraceIndex !== -1) {
          scriptContent = formula.substring(i + 2, closingBraceIndex);
          i = closingBraceIndex;
        } else {
          currentTextSegment += char + '{';
          i++;
          continue;
        }
      } else if (i + 1 < formula.length && !['{', '}', '_', '^'].includes(formula[i+1])) {
        scriptContent = formula[i+1];
        i++;
      } else {
        currentTextSegment += char;
        continue;
      }

      if (scriptContent) {
        richTextArray.push({
          text: scriptContent,
          font: { vertAlign: scriptType, size: 10, name: 'Arial', family: 2 }
        });
      } else {
          currentTextSegment += char;
      }

    } else {
      currentTextSegment += char;
    }
  }
  if (currentTextSegment) {
    richTextArray.push({ text: currentTextSegment, font: { name: 'Arial', size: 10, family: 2 } });
  }

  return richTextArray.length > 0 ? richTextArray : [{ text: t('excelExport.common.no', '-'), font: { name: 'Arial', size: 10, family: 2 } }];
}


const applyCellStyle = (cell: ExcelJS.Cell, bold?: boolean, alignment?: Partial<ExcelJS.Alignment>, border?: Partial<ExcelJS.Borders>) => {
  cell.font = { name: 'Arial', size: 10, bold: bold || false, family: 2 };
  cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, ...alignment };
  cell.border = {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' },
    ...border
  };
};

export const exportCompoundToXlsx = async (compound: CompoundData, options?: { returnBuffer?: boolean }): Promise<void | ArrayBuffer> => {
  const t = i18n.t.bind(i18n); // Get the t function from i18n instance

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CompoundChemistryDataManager";
  workbook.lastModifiedBy = "CompoundChemistryDataManager";
  workbook.created = new Date();
  workbook.modified = new Date();

  const mainInfoSheet = workbook.addWorksheet(t('excelExport.sheetNames.mainInfo'));
  mainInfoSheet.properties.defaultRowHeight = 20;
  mainInfoSheet.columns = [
    { width: 25 }, { width: 20 }, { width: 12 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 },
    { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }, { width: 8 }
  ];

  mainInfoSheet.getRow(1).height = 15; // Set top row height

  let rowNum = 1;
  const notAvailable = t('excelExport.common.notAvailable', 'N/A');
  const yes = t('excelExport.common.yes', 'X');
  const no = t('excelExport.common.no', '-');

  mainInfoSheet.getCell(rowNum, 1).value = compound.sttRC || notAvailable;
  applyCellStyle(mainInfoSheet.getCell(rowNum, 1), false, {horizontal: 'left', vertical: 'middle'});
  mainInfoSheet.getCell(rowNum, 2).value = { richText: [{text: compound.tenHC || t('excelExport.mainInfo.untitledCompound', 'Untitled Compound'), font: {bold: true, size: 11, name: 'Arial', family:2}}] };
  mainInfoSheet.mergeCells(rowNum, 2, rowNum, 14);
  applyCellStyle(mainInfoSheet.getCell(rowNum, 2), false, {horizontal: 'left', vertical: 'middle'});
  mainInfoSheet.getRow(rowNum).height = 22;
  rowNum++;

  mainInfoSheet.getCell(rowNum, 1).value = t('excelExport.mainInfo.otherName', 'Tên khác:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 1), true);
  mainInfoSheet.getCell(rowNum, 2).value = compound.tenHCKhac || no; mainInfoSheet.mergeCells(rowNum, 2, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 2));
  rowNum++;

  mainInfoSheet.getCell(rowNum, 1).value = t('excelExport.mainInfo.type', 'Loại:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 1), true);
  mainInfoSheet.getCell(rowNum, 2).value = compound.loaiHC || no; mainInfoSheet.mergeCells(rowNum, 2, rowNum, 10); applyCellStyle(mainInfoSheet.getCell(rowNum, 2));
  mainInfoSheet.getCell(rowNum, 11).value = t('excelExport.mainInfo.newMaterial', 'Chất mới'); applyCellStyle(mainInfoSheet.getCell(rowNum, 11), true);
  mainInfoSheet.getCell(rowNum, 12).value = compound.status === CompoundStatus.NEW ? yes : no; applyCellStyle(mainInfoSheet.getCell(rowNum, 12), false, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 13).value = t('excelExport.mainInfo.knownMaterial', 'Đã biết'); applyCellStyle(mainInfoSheet.getCell(rowNum, 13), true);
  mainInfoSheet.getCell(rowNum, 14).value = compound.status === CompoundStatus.KNOWN ? yes : no; applyCellStyle(mainInfoSheet.getCell(rowNum, 14), false, {horizontal: 'center'});
  rowNum++;

  const nguonStartRow = rowNum;
  mainInfoSheet.getCell(nguonStartRow, 1).value = t('excelExport.mainInfo.source', 'Nguồn:');
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.latinName', '1. Tên Latin:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.tenLatin || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.englishName', '2. Tên tiếng Anh:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.tenTA || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.vietnameseName', '3. Tên tiếng Việt:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.tenTV || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.researchPart', '4. Bộ phận nghiên cứu:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.bpnc || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.otherSources', '5. Nguồn khác:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.nguonKhac || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  mainInfoSheet.mergeCells(nguonStartRow, 1, rowNum, 1);
  applyCellStyle(mainInfoSheet.getCell(nguonStartRow, 1), true, {vertical: 'middle', horizontal: 'left'});
  rowNum++;

  const tcvlStartRow = rowNum;
  mainInfoSheet.getCell(tcvlStartRow, 1).value = t('excelExport.mainInfo.physicalProperties', 'TCVL:');
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.state', 'Trạng thái:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.trangThai || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.color', 'Màu:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.mau || no; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  rowNum++;

  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.uvSklm', 'UV SKLM'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = t('excelExport.mainInfo.uv254nm', '254nm'); applyCellStyle(mainInfoSheet.getCell(rowNum, 3), false, {horizontal: 'left'});
  mainInfoSheet.getCell(rowNum, 4).value = compound.uvSklm?.nm254 ? yes : no; applyCellStyle(mainInfoSheet.getCell(rowNum, 4), false, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 5).value = t('excelExport.mainInfo.uv365nm', '365nm'); applyCellStyle(mainInfoSheet.getCell(rowNum, 5), false, {horizontal: 'left'});
  mainInfoSheet.getCell(rowNum, 6).value = compound.uvSklm?.nm365 ? yes : no; applyCellStyle(mainInfoSheet.getCell(rowNum, 6), false, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 7).value = t('excelExport.mainInfo.meltingPoint', 'Điểm nóng chảy'); mainInfoSheet.mergeCells(rowNum, 7, rowNum, 9); applyCellStyle(mainInfoSheet.getCell(rowNum, 7), true, {horizontal: 'center', vertical: 'middle'});
  mainInfoSheet.getCell(rowNum, 10).value = compound.diemNongChay || no; mainInfoSheet.mergeCells(rowNum, 10, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 10), false, {horizontal: 'center', vertical: 'middle'});
  rowNum++;

  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.solventTCVL', 'Dung môi hòa tan:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = {richText: formatFormulaRichText(compound.dungMoiHoaTanTCVL)}; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 6); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  mainInfoSheet.getCell(rowNum, 7).value = t('excelExport.mainInfo.opticalRotation', '[α]D'); mainInfoSheet.mergeCells(rowNum, 7, rowNum, 9); applyCellStyle(mainInfoSheet.getCell(rowNum, 7), true, {horizontal: 'center', vertical: 'middle'});
  mainInfoSheet.getCell(rowNum, 10).value = compound.alphaD || no; mainInfoSheet.mergeCells(rowNum, 10, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 10), false, {horizontal: 'center', vertical: 'middle'});
  mainInfoSheet.mergeCells(tcvlStartRow, 1, rowNum, 1);
  applyCellStyle(mainInfoSheet.getCell(tcvlStartRow, 1), true, {vertical: 'middle', horizontal: 'left'});
  rowNum++;

  const cauTrucStartRow = rowNum;
  mainInfoSheet.getCell(cauTrucStartRow, 1).value = t('excelExport.mainInfo.structure', 'Cấu trúc:');
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.molecularFormula', 'CTPT'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = {richText: formatFormulaRichText(compound.ctpt)}; mainInfoSheet.mergeCells(rowNum, 3, rowNum, 7); applyCellStyle(mainInfoSheet.getCell(rowNum, 3));
  mainInfoSheet.getCell(rowNum, 8).value = t('excelExport.mainInfo.molecularWeight', 'KLPT'); applyCellStyle(mainInfoSheet.getCell(rowNum, 8), true);
  mainInfoSheet.getCell(rowNum, 9).value = compound.klpt || no; mainInfoSheet.mergeCells(rowNum, 9, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 9));
  rowNum++;

  const imageDisplayStartRow = rowNum;
  let imageRowsToSpan = 10;
  if (compound.hinhCauTruc) {
    let imageBuffer: ArrayBuffer | null = null;

    if (compound.hinhCauTruc.startsWith('data:image')) {
      imageBuffer = base64ToBuffer(compound.hinhCauTruc);
    } else if (compound.hinhCauTruc.startsWith('http') || compound.hinhCauTruc.startsWith('/compound-uploads/')) {
      // Use getImageUrl to build proper URL for S3 paths
      const fullImageUrl = getImageUrl(compound.hinhCauTruc);
      imageBuffer = await urlToBuffer(fullImageUrl);
    }

    if (imageBuffer) {
      const extension = getImageExtension(compound.hinhCauTruc);
      const imageId = workbook.addImage({ buffer: imageBuffer, extension });
      const imgTargetHeightPx = 250; // Increased image height
      const imgTargetWidthPx = 250; // 250px = 10 rows × 15pt × 1.33
      imageRowsToSpan = 10; // Fixed to exactly 10 rows (B13 to B22)
      mainInfoSheet.addImage(imageId, { tl: { col: 1.1, row: imageDisplayStartRow - 1 + 0.1 }, ext: { width: imgTargetWidthPx, height: imgTargetHeightPx } });
      for(let i = 0; i < imageRowsToSpan; i++) {
        mainInfoSheet.getRow(imageDisplayStartRow + i).height = 15; // 15 points per row
        for(let j=2; j<=14; j++) { applyCellStyle(mainInfoSheet.getCell(imageDisplayStartRow + i, j), false, undefined, { top: i === 0 ? {style: 'thin'} : undefined, bottom: i === imageRowsToSpan -1 ? {style:'thin'} : undefined, left: j === 2 ? {style:'thin'} : undefined, right: j === 14 ? {style: 'thin'} : undefined }); }
      }
    }
  } else { for(let i = 0; i < imageRowsToSpan; i++) { for(let j=2; j<=14; j++) { applyCellStyle(mainInfoSheet.getCell(imageDisplayStartRow + i, j)); } } }
  rowNum += imageRowsToSpan;

  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.absoluteConfiguration', 'Cấu hình tuyệt đối:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true);
  mainInfoSheet.getCell(rowNum, 3).value = compound.cauHinhTuyetDoi ? yes : no; mainInfoSheet.mergeCells(rowNum,3,rowNum,14); applyCellStyle(mainInfoSheet.getCell(rowNum, 3), false, {horizontal: 'center'});
  mainInfoSheet.mergeCells(cauTrucStartRow, 1, rowNum, 1);
  applyCellStyle(mainInfoSheet.getCell(cauTrucStartRow, 1), true, {vertical: 'middle', horizontal: 'left'});
  mainInfoSheet.getRow(cauTrucStartRow).height = 15; // Structure label row
  rowNum++;

  mainInfoSheet.getCell(rowNum, 1).value = t('excelExport.mainInfo.smiles', 'SMILES:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 1), true);
  mainInfoSheet.getCell(rowNum, 2).value = compound.smiles || no; mainInfoSheet.mergeCells(rowNum, 2, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 2));
  rowNum++;

  const phoStartRow = rowNum;
  mainInfoSheet.getCell(phoStartRow, 1).value = t('excelExport.mainInfo.spectra', 'Phổ:');
  SPECTRAL_FIELDS_CONFIG.forEach((fieldConfig, index) => { // Use SPECTRAL_FIELDS_CONFIG
    if (index < 13) {
      const cell = mainInfoSheet.getCell(rowNum, index + 2);
      cell.value = t(fieldConfig.labelKey, fieldConfig.key); // Translate label
      applyCellStyle(cell, true, {horizontal: 'center'});
    }
  });
  rowNum++;
  SPECTRAL_FIELDS_CONFIG.forEach((fieldConfig, index) => { // Use SPECTRAL_FIELDS_CONFIG
    if (index < 13) {
      const cell = mainInfoSheet.getCell(rowNum, index + 2);
      const phoValue = compound.pho[fieldConfig.key];
      cell.value = phoValue && Array.isArray(phoValue) && phoValue.length > 0 ? yes : no;
      applyCellStyle(cell, false, {horizontal: 'center'});
    }
  });
  mainInfoSheet.mergeCells(phoStartRow, 1, rowNum, 1);
  applyCellStyle(mainInfoSheet.getCell(phoStartRow, 1), true, {vertical: 'middle', horizontal: 'left'});
  rowNum++;

  mainInfoSheet.getCell(rowNum, 1).value = t('excelExport.mainInfo.nmrSolvent', 'Dung môi NMR:'); applyCellStyle(mainInfoSheet.getCell(rowNum, 1), true);
  mainInfoSheet.getCell(rowNum, 2).value = {richText: formatFormulaRichText(compound.dmNMRGeneral)}; mainInfoSheet.mergeCells(rowNum, 2, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 2));
  rowNum++;

  const ccStartRow = rowNum;
  mainInfoSheet.getCell(ccStartRow, 1).value = t('excelExport.mainInfo.compChemData', 'CC. Data:');
  mainInfoSheet.getCell(rowNum, 2).value = t('excelExport.mainInfo.cartCoords', 'Cartesian coordinates'); mainInfoSheet.mergeCells(rowNum, 2, rowNum, 5); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), true, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 6).value = t('excelExport.mainInfo.imaginaryFreq', '# of imaginary freq.'); mainInfoSheet.mergeCells(rowNum, 6, rowNum, 9); applyCellStyle(mainInfoSheet.getCell(rowNum, 6), true, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 10).value = t('excelExport.mainInfo.totalEnergy', 'Total Energy'); mainInfoSheet.mergeCells(rowNum, 10, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 10), true, {horizontal: 'center'});
  rowNum++;
  mainInfoSheet.getCell(rowNum, 2).value = compound.cartCoor || no; mainInfoSheet.mergeCells(rowNum, 2, rowNum, 5); applyCellStyle(mainInfoSheet.getCell(rowNum, 2), false, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 6).value = compound.imgFreq || no; mainInfoSheet.mergeCells(rowNum, 6, rowNum, 9); applyCellStyle(mainInfoSheet.getCell(rowNum, 6), false, {horizontal: 'center'});
  mainInfoSheet.getCell(rowNum, 10).value = compound.te || no; mainInfoSheet.mergeCells(rowNum, 10, rowNum, 14); applyCellStyle(mainInfoSheet.getCell(rowNum, 10), false, {horizontal: 'center'});
  mainInfoSheet.mergeCells(ccStartRow, 1, rowNum, 1);
  applyCellStyle(mainInfoSheet.getCell(ccStartRow, 1), true, {vertical: 'middle', horizontal: 'left'});

  // --- NMR Table Sheets for each NMRDataBlock ---
  const nmrTableSheets: ExcelJS.Worksheet[] = [];
  const nmrDetailsSheets: ExcelJS.Worksheet[] = [];
  (compound.nmrData || []).forEach((nmrBlock, nmrIdx) => {
    // NMR Table Sheet
    const tableNumber = nmrBlock.sttBang || (nmrIdx + 1);
    const nmrTableSheet = workbook.addWorksheet(
      `${t('excelExport.sheetNames.nmrDataTable')}_${tableNumber}`
    );
    nmrTableSheets.push(nmrTableSheet);
    nmrTableSheet.properties.defaultRowHeight = 20;
    nmrTableSheet.columns = [{ width: 15 }, { width: 20 }, { width: 40 }];
    let nmrTableRowNum = 1;
    const nmrTitleCell = nmrTableSheet.getCell(nmrTableRowNum, 1);
    nmrTitleCell.value = t('excelExport.nmrDataTableSheet.title', { tableId: nmrBlock.sttBang || notAvailable, compoundsttRC: compound.sttRC || notAvailable });
    nmrTableSheet.mergeCells(nmrTableRowNum, 1, nmrTableRowNum, 3);
    applyCellStyle(nmrTitleCell, true, {horizontal: 'center', vertical: 'middle'});
    nmrTitleCell.font = { name: 'Arial', size: 11, bold: true, family: 2 };
    nmrTableSheet.getRow(nmrTableRowNum).height = 20;
    nmrTableRowNum++;
    nmrTableSheet.getCell(nmrTableRowNum, 1).value = t('excelExport.nmrDataTableSheet.position', 'Vị trí'); applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 1), true, {horizontal: 'center', vertical: 'middle'});
    nmrTableSheet.getCell(nmrTableRowNum, 2).value = t('excelExport.nmrDataTableSheet.deltaC', 'δC (ppm)'); applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 2), true, {horizontal: 'center', vertical: 'middle'});
    nmrTableSheet.getCell(nmrTableRowNum, 3).value = t('excelExport.nmrDataTableSheet.deltaH', 'δH (ppm, J Hz)'); applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 3), true, {horizontal: 'center', vertical: 'middle'});
    nmrTableSheet.getRow(nmrTableRowNum).height = 20;
    nmrTableRowNum++;
    (nmrBlock.signals || []).forEach(signal => {
      nmrTableSheet.getCell(nmrTableRowNum, 1).value = signal.viTri || no; applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 1));
      nmrTableSheet.getCell(nmrTableRowNum, 2).value = signal.scab || no; applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 2));
      nmrTableSheet.getCell(nmrTableRowNum, 3).value = signal.shacJHz || no; applyCellStyle(nmrTableSheet.getCell(nmrTableRowNum, 3));
      nmrTableRowNum++;
    });

    // NMR Details Sheet
    const nmrDetailsSheet = workbook.addWorksheet(
      `${t('excelExport.sheetNames.nmrDetails')}_${tableNumber}`
    );
    nmrDetailsSheets.push(nmrDetailsSheet);
    nmrDetailsSheet.properties.defaultRowHeight = 20;
    nmrDetailsSheet.columns = [{ width: 25 }, { width: 25 }, { width: 20 }, { width: 20 }];
    let nmrDetailsRowNum = 1;
    const luuYLabelCell = nmrDetailsSheet.getCell(nmrDetailsRowNum, 1);
    luuYLabelCell.value = t('excelExport.nmrDetailsSheet.notesLabel', 'Một số lưu ý');
    applyCellStyle(luuYLabelCell, true, { vertical: 'middle', horizontal: 'left' });
    nmrDetailsSheet.mergeCells(nmrDetailsRowNum, 1, nmrDetailsRowNum + 2, 1);
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 2).value = t('excelExport.nmrDetailsSheet.headerA', 'a'); applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 2), true, {horizontal: 'center', vertical: 'middle'});
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 3).value = t('excelExport.nmrDetailsSheet.headerB', 'b'); applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 3), true, {horizontal: 'center', vertical: 'middle'});
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 4).value = t('excelExport.nmrDetailsSheet.headerC', 'c'); applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 4), true, {horizontal: 'center', vertical: 'middle'});
    nmrDetailsSheet.getRow(nmrDetailsRowNum).height = 20;
    nmrDetailsRowNum++;
    const condition = nmrBlock.nmrConditions;
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 2).value = {richText: formatFormulaRichText(condition.dmNMR)}; applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 2));
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 3).value = condition.tanSo13C || no; applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 3));
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 4).value = condition.tanSo1H || no; applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 4));
    nmrDetailsSheet.getRow(nmrDetailsRowNum).height = 20;
    nmrDetailsRowNum++;
    const notesCell = nmrDetailsSheet.getCell(nmrDetailsRowNum, 2);
    notesCell.value = nmrBlock.luuYNMR && nmrBlock.luuYNMR.trim() !== "" ? nmrBlock.luuYNMR : no;
    nmrDetailsSheet.mergeCells(nmrDetailsRowNum, 2, nmrDetailsRowNum, 4);
    applyCellStyle(notesCell);
    nmrDetailsSheet.getRow(nmrDetailsRowNum).height = 20;
    nmrDetailsRowNum++;
    nmrDetailsSheet.getCell(nmrDetailsRowNum, 1).value = t('excelExport.nmrDetailsSheet.referencesLabel', 'TLTK'); applyCellStyle(nmrDetailsSheet.getCell(nmrDetailsRowNum, 1), true);
    const tltkCell = nmrDetailsSheet.getCell(nmrDetailsRowNum, 2);
    tltkCell.value = nmrBlock.tltkNMR || no;
    nmrDetailsSheet.mergeCells(nmrDetailsRowNum, 2, nmrDetailsRowNum, 4);
    applyCellStyle(tltkCell);
    nmrDetailsSheet.getRow(nmrDetailsRowNum).height = 20;
  });

  const spectraImagesSheet = workbook.addWorksheet(t('excelExport.sheetNames.spectraImages'));
  spectraImagesSheet.properties.defaultRowHeight = 20;
  let spectraRowNum = 1;
  spectraImagesSheet.getCell(spectraRowNum, 1).value = t('excelExport.spectraImagesSheet.title', 'Ảnh của các phổ đã tích ở trang 1');
  applyCellStyle(spectraImagesSheet.getCell(spectraRowNum,1), true, {horizontal: 'center', vertical: 'middle'});
  spectraImagesSheet.mergeCells(spectraRowNum,1,spectraRowNum,6);
  spectraImagesSheet.getRow(spectraRowNum).height = 20;
  spectraRowNum+=2;
  let imageCount = 0;
  const imagePixelHeight = 300;
  const imagePixelWidth = 400;
  // For cell fitting, convert pixels to Excel units
  const colIndex = 3; // Column C
  const colWidth = imagePixelWidth / 7; // Excel column width unit ≈ 7px
  const rowHeight = imagePixelHeight / 1.33; // Excel row height unit ≈ 1.33px
  spectraImagesSheet.getColumn(colIndex).width = colWidth;
  // --- Begin horizontal single-row layout for spectra images ---
  // Merge A1:A13 for the title (do this only once, before the loop)
  spectraImagesSheet.unMergeCells('A1:A13'); // Ensure no previous merge
  spectraImagesSheet.mergeCells('A1:A13');
  spectraImagesSheet.getCell('A1').value = t('excelExport.spectraImagesSheet.title', 'Ảnh của các phổ đã tích ở trang 1');
  applyCellStyle(spectraImagesSheet.getCell('A1'), true, {horizontal: 'center', vertical: 'middle'});
  for (let i = 2; i <= 13; i++) {
    spectraImagesSheet.getRow(i).height = 20;
  }
  let colPointer = 2; // Start from column B
  for (const fieldConfig of SPECTRAL_FIELDS_CONFIG) {
    const spectrumData = compound.pho[fieldConfig.key];
    if (spectrumData && Array.isArray(spectrumData) && spectrumData.length > 0) {
      // Place the spectrum label in row 1, colPointer
      const labelCell = spectraImagesSheet.getCell(1, colPointer);
      labelCell.value = t(fieldConfig.labelKey, fieldConfig.key) + ":";
      applyCellStyle(labelCell, true, {horizontal: 'center', vertical: 'middle'});
      spectraImagesSheet.getColumn(colPointer).width = 16; // Explicitly set label column width
      colPointer++;
      // Place all images for this spectrum horizontally in row 1
      for (let i = 0; i < spectrumData.length; i++) {
        const fileUrl = spectrumData[i];
        const fileName = fileUrl.split('/').pop() || `File ${i + 1}`;
        // Only set width for image columns
        spectraImagesSheet.getColumn(colPointer).width = imagePixelWidth / 7;
        spectraImagesSheet.getRow(1).height = rowHeight;
        if (fileUrl.startsWith('data:image')) {
          const imageBuffer = base64ToBuffer(fileUrl);
          if (imageBuffer) {
            const extension = getImageExtension(fileUrl);
            const imageId = workbook.addImage({ buffer: imageBuffer, extension });
            spectraImagesSheet.addImage(imageId, {
              tl: { col: colPointer - 1, row: 0 },
              ext: { width: imagePixelWidth, height: imagePixelHeight }
            });
            imageCount++;
          }
        } else if (fileUrl.startsWith('http') || fileUrl.startsWith('/compound-uploads/')) {
          const fullImageUrl = getImageUrl(fileUrl);
          const imageBuffer = await urlToBuffer(fullImageUrl);
          if (imageBuffer) {
            const extension = getImageExtension(fileUrl);
            const imageId = workbook.addImage({ buffer: imageBuffer, extension });
            spectraImagesSheet.addImage(imageId, {
              tl: { col: colPointer - 1, row: 0 },
              ext: { width: imagePixelWidth, height: imagePixelHeight }
            });
            imageCount++;
          } else {
            const urlCell = spectraImagesSheet.getCell(1, colPointer);
            urlCell.value = {text: `${t('variousLabels.spectraViewExternalUrl', {label: t(fieldConfig.labelKey, fieldConfig.key)})} - ${fileName}`, hyperlink: fullImageUrl};
            urlCell.font = {color: {argb: 'FF0000FF'}, underline: true, name: 'Arial', size: 10, family: 2};
            applyCellStyle(urlCell, false, undefined, {bottom: {style: 'thin'}, right: {style: 'thin'}});
          }
        } else {
          const dataCell = spectraImagesSheet.getCell(1, colPointer);
          dataCell.value = `${t('variousLabels.spectraDataUnknownFormat', "Data present (unknown format)")} - ${fileName}`;
          applyCellStyle(dataCell);
        }
        colPointer++;
      }
    }
  }
  // --- End horizontal single-row layout for spectra images ---
  if (imageCount === 0 && !SPECTRAL_FIELDS_CONFIG.some(f => {
    const phoValue = compound.pho[f.key];
    return phoValue && Array.isArray(phoValue) && phoValue.length > 0 &&
           (phoValue[0]?.startsWith('http') || phoValue[0]?.startsWith('data:image'));
  })) { // Use SPECTRAL_FIELDS_CONFIG
    spectraImagesSheet.getCell(spectraRowNum, 1).value = t('excelExport.spectraImagesSheet.noImagesOrUrls', "No spectra images uploaded or URLs provided.");
    applyCellStyle(spectraImagesSheet.getCell(spectraRowNum,1));
    spectraRowNum++;
  }

  // After all content and images are added to mainInfoSheet
  for (let i = 1; i <= mainInfoSheet.rowCount; i++) {
    mainInfoSheet.getRow(i).height = 15;
  }
  // Apply to all other sheets
  [...nmrTableSheets, ...nmrDetailsSheets, spectraImagesSheet].forEach(sheet => {
    for (let i = 1; i <= sheet.rowCount; i++) {
      sheet.getRow(i).height = 15;
    }
  });

  // Set page setup for all sheets
  [mainInfoSheet, ...nmrTableSheets, ...nmrDetailsSheets, spectraImagesSheet].forEach(sheet => {
    sheet.pageSetup = {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.787,
        right: 0.787,
        top: 0.787,
        bottom: 0.787,
        header: 0.0,
        footer: 0.0
      }
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  if (options?.returnBuffer) {
    return buffer;
  }
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${compound.sttRC || 'ID'}_${(compound.tenHC || t('excelExport.mainInfo.untitledCompound', 'compound')).replace(/[:*?"<>|/\\]/g, '_')}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
