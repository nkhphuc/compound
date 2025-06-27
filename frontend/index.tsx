import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import i18n from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- BEGIN EMBEDDED TRANSLATIONS ---
const enTranslations = {
  appName: "Compound Chemistry Data Manager",
  navbar: {
    title: "Compound Chemistry Data",
    addNew: "Add New Compound",
    language: "Language",
    vietnamese: "Vietnamese",
    english: "English"
  },
  buttons: {
    save: "Save",
    update: "Update",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    remove: "Remove",
    confirmDelete: "Confirm Delete",
    exportToXlsx: "Export to XLSX",
    exporting: "Exporting...",
    backToList: "Back to List",
    removeImage: "Remove Image"
  },
  status: {
    NEW: "New", // Key for CompoundStatus.NEW which is 'Mới'
    KNOWN: "Known" // Key for CompoundStatus.KNOWN which is 'Đã biết'
  },
  compoundStatus: { // Direct translation for enum values
    "Mới": "New",
    "Đã biết": "Known"
  },
  compoundForm: {
    generalInfo: { title: "General Information" },
    source: { title: "Source" },
    physicalProperties: { title: "Physical Properties" },
    structure: { title: "Structure" },
    smiles: { title: "SMILES" },
    spectra: { title: "Spectra" },
    nmrSolvent: { title: "NMR Solvent" },
    compChem: { title: "Computational Chemistry Data" },
    nmrData: { title: "NMR Data" },
    sttHC: "SttHC (ID)",
    sttHCPlaceholder: "Auto-assigned on save",
    tenHC: "Compound Name",
    tenHCKhac: "Other Name",
    loaiHC: "Compound Type",
    selectLoaiHC: "Select Compound Type",
    customLoaiHCPlaceholder: "Enter custom type",
    statusLabel: "Compound Status", // Changed from "status" to avoid conflict with "status" object
    selectStatus: "Select Status",
    selectTrangThai: "Select State/Phase",
    selectMau: "Select Color",
    structureImage: "Structure Image",
    uploadFile: "Upload File",
    enterURL: "Enter URL",
    browse: "Browse...",
    noFileSelected: "No file selected.",
    uploadedFilePlaceholder: "Uploaded file",
    preview: "Preview:"
  },
  compoundListPage: {
    title: "Compound List",
    searchPlaceholder: "Search compounds...",
    noCompoundsFound: "No compounds found",
    noCompoundsFoundWithSearch: "Try adjusting your search term.",
    noCompoundsFoundGeneral: "Use the 'Add New Compound' button in the navigation bar to get started."
  },
  compoundListItem: {
    sttHcPrefix: "SttHC: ",
    typePrefix: "Type: ",
    latinPrefix: "Latin: "
  },
  addCompoundPage: {
    title: "Add New Compound"
  },
  editCompoundPage: {
    title: "Edit Compound: {{compoundName}}"
  },
  viewCompoundPage: {
    deleteConfirmTitle: "Confirm Deletion",
    deleteConfirmMessage: "Are you sure you want to delete the compound \"{{compoundName}}\"? This action cannot be undone."
  },
  confirmModal: {
    defaultTitle: "Confirm Action",
    defaultMessage: "Are you sure?",
    cancelButton: "Cancel", // Added for confirm modal
    confirmDeleteButton: "Confirm Delete" // Added for confirm modal
  },
  boolean: {
    x: "X",
    dash: "-"
  },
  variousLabels: {
    other: "Other",
    spectraViewExternalUrl: "View {{label}} (External URL)",
    spectraDownloadPdf: "Download {{label}} (PDF)",
    spectraDownloadData: "Download {{label}} Data",
    spectraDataUnknownFormat: "Data present (unknown format)",
    notAvailable: "N/A"
  },
  spectralFields: {
    "1h": "1H NMR", "13c": "13C NMR", dept: "DEPT", hsqc: "HSQC",
    hmbc: "HMBC", cosy: "COSY", noesy: "NOESY", roesy: "ROESY",
    hrms: "HRMS", lrms: "LRMS", ir: "IR", "uv_pho": "UV", "cd": "CD"
  },
  excelExport: {
    sheetNames: {
        mainInfo: "Main Info",
        nmrDataTable: "NMR Data Table",
        nmrDetails: "NMR Details",
        spectraImages: "Spectra Images"
    },
    mainInfo: {
        untitledCompound: "Untitled Compound", otherName: "Other name:", type: "Type:",
        newMaterial: "New", knownMaterial: "Known", source: "Source:",
        latinName: "1. Latin Name:", englishName: "2. English Name:", vietnameseName: "3. Vietnamese Name:",
        researchPart: "4. Research Part:", physicalProperties: "Physical Properties:", state: "State:",
        color: "Color:", uvSklm: "UV TLC", uv254nm: "254nm", uv365nm: "365nm",
        meltingPoint: "Melting Point", solventTCVL: "Solvent (Physical Prop.):", opticalRotation: "[α]D",
        structure: "Structure:", molecularFormula: "Formula", molecularWeight: "MW",
        absoluteConfiguration: "Absolute Configuration:", smiles: "SMILES:", spectra: "Spectra:",
        nmrSolvent: "NMR Solvent:", compChemData: "Comp. Chem. Data:", cartCoords: "Cartesian coordinates",
        imaginaryFreq: "# of imaginary freq.", totalEnergy: "Total Energy"
    },
    nmrDataTableSheet: {
        title: "Table {{tableId}}: ¹H and ¹³C NMR Data of compound {{compoundSttHC}}",
        position: "Position", deltaC: "δC (ppm)", deltaH: "δH (ppm, J Hz)"
    },
    nmrDetailsSheet: {
        notesLabel: "Notes", headerA: "a", headerB: "b", headerC: "c", referencesLabel: "References"
    },
    spectraImagesSheet: {
        title: "Images of spectra referenced on page 1",
        noImagesOrUrls: "No spectra images or URLs provided."
    },
    common: { yes: "X", no: "-", notAvailable: "N/A" }
  },
  footer: {
    allRightsReserved: "All rights reserved.",
    bugReport: "Bug report to: "
  },
  formulaHelpText: "Use <code>_</code> for subscript, <code>^</code> for superscript. For groups: <code>_{group}</code> or <code>^{group}</code>.",
  nmrForm: {
    tableId: "Table ID (SttBang)",
    tableIdPlaceholder: "Auto-assigned on save",
    spectralDataTable: "Spectral Data Table",
    addSignal: "Add",
    notesTitle: "Notes",
    solvent: "Solvent",
    solventPlaceholder: "e.g., CDCl_3, DMSO-d_6",
    freq13c: "13C Frequency",
    freq13cPlaceholder: "e.g., 151MHz",
    freq1h: "1H Frequency",
    freq1hPlaceholder: "e.g., 600MHz",
    generalNotes: "General Notes about NMR data",
    generalNotesPlaceholder: "Additional notes about the NMR data...",
    references: "References",
    referencesPlaceholder: "Source reference, e.g., J. Nat. Prod. 2023, XX, YYY-ZZZ",
    position: "Position",
    positionPlaceholder: "e.g., 1",
    deltaC: "δC (ppm)",
    deltaCPlaceholder: "e.g., 34.1",
    deltaH: "δH (ppm, J Hz)",
    deltaHPlaceholder: "e.g., 1.83 m; 2.03 dd (2.4; 5.4)",
    removeSignalTooltip: "Remove Signal"
  },
  nmrView: {
    title: "Table {{tableId}}: ¹H and ¹³C NMR Data of compound {{compoundSttHC}}",
    spectralDataTable: "Spectral Data Table:",
    conditionsTable: "Notes:",
    notes: "General Notes:",
    references: "References:",
    noData: "No NMR data (Format Trang 2) available for this compound."
  },
  pagination: {
    previous: "Previous",
    next: "Next",
    showingResults: "Showing {{start}} to {{end}} of {{total}} results"
  }
};

const viTranslations = {
  appName: "Quản lý Dữ liệu Hợp chất Hoá học",
  navbar: {
    title: "Dữ liệu Hợp chất Hoá học",
    addNew: "Thêm Hợp chất Mới",
    language: "Ngôn ngữ",
    vietnamese: "Tiếng Việt",
    english: "Tiếng Anh"
  },
  buttons: {
    save: "Lưu",
    update: "Cập nhật",
    cancel: "Hủy",
    edit: "Sửa",
    delete: "Xóa",
    add: "Thêm",
    remove: "Xóa",
    confirmDelete: "Xác nhận Xóa",
    exportToXlsx: "Xuất ra XLSX",
    exporting: "Đang xuất...",
    backToList: "Quay lại Danh sách",
    removeImage: "Xóa Ảnh"
  },
  status: {
    NEW: "Mới", // Key for CompoundStatus.NEW
    KNOWN: "Đã biết" // Key for CompoundStatus.KNOWN
  },
  compoundStatus: { // Direct translation for enum values
    "Mới": "Mới",
    "Đã biết": "Đã biết"
  },
  compoundForm: {
    generalInfo: { title: "Thông tin chung" },
    source: { title: "Nguồn" },
    physicalProperties: { title: "TCVL (Tính chất vật lý)" },
    structure: { title: "Cấu trúc" },
    smiles: { title: "SMILES" },
    spectra: { title: "Phổ" },
    nmrSolvent: { title: "Dung môi NMR" },
    compChem: { title: "Dữ liệu tính toán hóa học" },
    nmrData: { title: "Dữ liệu NMR" },
    sttHC: "SttHC (ID)",
    sttHCPlaceholder: "Tự động gán khi lưu",
    tenHC: "Tên HC",
    tenHCKhac: "Tên khác",
    loaiHC: "Loại HC",
    selectLoaiHC: "Chọn Loại HC",
    customLoaiHCPlaceholder: "Nhập loại tùy chỉnh",
    statusLabel: "Trạng thái chất",
    selectStatus: "Chọn Trạng thái",
    selectTrangThai: "Chọn Trạng thái",
    selectMau: "Chọn Màu",
    structureImage: "Hình cấu trúc",
    uploadFile: "Tải tệp lên",
    enterURL: "Nhập URL",
    browse: "Chọn tệp...",
    noFileSelected: "Chưa có tệp nào được chọn.",
    uploadedFilePlaceholder: "Tệp đã tải lên",
    preview: "Xem trước:"
  },
  compoundListPage: {
    title: "Danh sách Hợp chất",
    searchPlaceholder: "Tìm kiếm hợp chất...",
    noCompoundsFound: "Không tìm thấy hợp chất nào",
    noCompoundsFoundWithSearch: "Thử điều chỉnh từ khóa tìm kiếm của bạn.",
    noCompoundsFoundGeneral: "Sử dụng nút 'Thêm Hợp chất Mới' trên thanh điều hướng để bắt đầu."
  },
  compoundListItem: {
    sttHcPrefix: "SttHC: ",
    typePrefix: "Loại: ",
    latinPrefix: "Latin: "
  },
  addCompoundPage: {
    title: "Thêm Hợp chất Mới"
  },
  editCompoundPage: {
    title: "Sửa Hợp chất: {{compoundName}}"
  },
  viewCompoundPage: {
    deleteConfirmTitle: "Xác nhận Xóa",
    deleteConfirmMessage: "Bạn có chắc chắn muốn xóa hợp chất \"{{compoundName}}\"? Hành động này không thể hoàn tác."
  },
  confirmModal: {
    defaultTitle: "Xác nhận Hành động",
    defaultMessage: "Bạn có chắc chắn không?",
    cancelButton: "Hủy",
    confirmDeleteButton: "Xác nhận Xóa"
  },
  boolean: {
    x: "X",
    dash: "-"
  },
  variousLabels: {
    other: "Khác",
    spectraViewExternalUrl: "Xem {{label}} (URL ngoài)",
    spectraDownloadPdf: "Tải xuống {{label}} (PDF)",
    spectraDownloadData: "Tải xuống Dữ liệu {{label}}",
    spectraDataUnknownFormat: "Có dữ liệu (định dạng không rõ)",
    notAvailable: "Không có"
  },
  spectralFields: {
    "1h": "1H NMR", "13c": "13C NMR", dept: "DEPT", hsqc: "HSQC",
    hmbc: "HMBC", cosy: "COSY", noesy: "NOESY", roesy: "ROESY",
    hrms: "HRMS", lrms: "LRMS", ir: "IR", "uv_pho": "UV", "cd": "CD"
  },
  excelExport: {
    sheetNames: {
        mainInfo: "Thông tin chính",
        nmrDataTable: "Bảng dữ liệu NMR",
        nmrDetails: "Chi tiết NMR",
        spectraImages: "Ảnh phổ"
    },
    mainInfo: {
        untitledCompound: "Hợp chất không tên", otherName: "Tên khác:", type: "Loại:",
        newMaterial: "Chất mới", knownMaterial: "Đã biết", source: "Nguồn:",
        latinName: "1. Tên Latin:", englishName: "2. Tên tiếng Anh:", vietnameseName: "3. Tên tiếng Việt:",
        researchPart: "4. Bộ phận nghiên cứu:", physicalProperties: "TCVL:", state: "Trạng thái:",
        color: "Màu:", uvSklm: "UV SKLM", uv254nm: "254nm", uv365nm: "365nm",
        meltingPoint: "Điểm nóng chảy", solventTCVL: "Dung môi hòa tan:", opticalRotation: "[α]D",
        structure: "Cấu trúc:", molecularFormula: "CTPT", molecularWeight: "KLPT",
        absoluteConfiguration: "Cấu hình tuyệt đối:", smiles: "SMILES:", spectra: "Phổ:",
        nmrSolvent: "Dung môi NMR:", compChemData: "CC. Data:", cartCoords: "Tọa độ Descartes",
        imaginaryFreq: "Số tần số ảo", totalEnergy: "Tổng năng lượng"
    },
    nmrDataTableSheet: {
        title: "Bảng {{tableId}}: Dữ kiện phổ ¹H và ¹³C NMR của hợp chất {{compoundSttHC}}",
        position: "Vị trí", deltaC: "δC (ppm)", deltaH: "δH (ppm, J Hz)"
    },
    nmrDetailsSheet: {
        notesLabel: "Một số lưu ý", headerA: "a", headerB: "b", headerC: "c", referencesLabel: "TLTK"
    },
    spectraImagesSheet: {
        title: "Ảnh của các phổ đã tích ở trang 1",
        noImagesOrUrls: "Không có ảnh phổ nào được tải lên hoặc URL được cung cấp."
    },
    common: { yes: "X", no: "-", notAvailable: "N/A" }
  },
  footer: {
    allRightsReserved: "Đã đăng ký bản quyền.",
    bugReport: "Báo cáo lỗi đến: "
  },
  formulaHelpText: "Sử dụng <code>_</code> cho chỉ số dưới, <code>^</code> cho chỉ số trên. Cho nhóm: <code>_{nhóm}</code> hoặc <code>^{nhóm}</code>.",
  nmrForm: {
    tableId: "Stt Bảng (ID)",
    tableIdPlaceholder: "Tự động gán khi lưu",
    spectralDataTable: "Bảng dữ liệu phổ",
    addSignal: "Thêm",
    notesTitle: "Một số lưu ý",
    solvent: "Dung môi",
    solventPlaceholder: "Ví dụ: CDCl_3, DMSO-d_6",
    freq13c: "Tần số 13C",
    freq13cPlaceholder: "Ví dụ: 151MHz",
    freq1h: "Tần số 1H",
    freq1hPlaceholder: "Ví dụ: 600MHz",
    generalNotes: "Ghi chú thêm về dữ liệu NMR",
    generalNotesPlaceholder: "Ghi chú thêm về dữ liệu NMR...",
    references: "Tài liệu tham khảo",
    referencesPlaceholder: "Nguồn tham khảo, ví dụ: J. Nat. Prod. 2023, XX, YYY-ZZZ",
    position: "Vị trí",
    positionPlaceholder: "Ví dụ: 1",
    deltaC: "δC (ppm)",
    deltaCPlaceholder: "Ví dụ: 34.1",
    deltaH: "δH (ppm, J Hz)",
    deltaHPlaceholder: "Ví dụ: 1.83 m; 2.03 dd (2.4; 5.4)",
    removeSignalTooltip: "Xóa tín hiệu"
  },
  nmrView: {
    title: "Bảng {{tableId}}: Dữ kiện phổ ¹H và ¹³C NMR của hợp chất {{compoundSttHC}}",
    spectralDataTable: "Bảng dữ liệu phổ:",
    conditionsTable: "Một số lưu ý:",
    notes: "Ghi chú thêm về dữ liệu NMR:",
    references: "Tài liệu tham khảo:",
    noData: "Không có dữ liệu NMR (Định dạng Trang 2) cho hợp chất này."
  },
  pagination: {
    previous: "Trước",
    next: "Sau",
    showingResults: "Hiển thị từ {{start}} đến {{end}} trên tổng số {{total}} kết quả"
  }
};
// --- END EMBEDDED TRANSLATIONS ---

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      vi: { translation: viTranslations },
    },
    fallbackLng: 'en', // Fallback language if detection fails or language not available
    debug: false, // Set to true for development logging
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Suspense fallback="Loading...">
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </Suspense>
  </React.StrictMode>
);
