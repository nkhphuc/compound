import React from 'react';
import { useTranslation } from 'react-i18next';
import { SPECTRAL_FIELDS_CONFIG } from '../constants';
import { getImageUrl } from '../services/urlService';
import { CompoundData, SpectralRecord } from '../types';
import { SectionCard } from './SectionCard';
import { ChemicalFormulaDisplay } from './ui/ChemicalFormulaDisplay';
// NMRTableView is not directly used here anymore, it's in ViewCompoundPage

interface CompoundViewProps {
  compound: CompoundData;
}

const DataField: React.FC<{ label: string; value?: string | number | boolean | null; isUrl?: boolean; isRawHtml?: boolean }> = ({ label, value, isUrl, isRawHtml }) => {
  if (value === null || value === undefined || value === '') {
    if (typeof value !== 'boolean') return null;
  }

  let displayValue: React.ReactNode;

  if (typeof value === 'boolean') {
    displayValue = value ? 'X' : '-';
  } else if (isRawHtml && typeof value === 'string') {
    displayValue = <span dangerouslySetInnerHTML={{ __html: value }} />;
  } else if (isUrl && typeof value === 'string') {
    displayValue = (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline break-all">
        {value}
      </a>
    );
  } else {
    displayValue = <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
  }

  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-600">{label}:</dt>
      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {displayValue}
      </dd>
    </div>
  );
};

const renderSpectrumLinkOrPreview = (data: string[] | undefined, label: string, t: (key: string, options?: Record<string, unknown>) => string): React.ReactNode => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return <span className="text-gray-500 italic">{t('variousLabels.noData')}</span>;
  }

  // Handle multiple files
  if (data.length === 1) {
    // Single file - use existing logic
    const spectrumData = data[0];
    if (!spectrumData) return <span className="text-gray-500 italic">{t('variousLabels.noData')}</span>;

    const imageUrl = getImageUrl(spectrumData);
    if (spectrumData.startsWith('data:image') ||
        (spectrumData.toLowerCase().includes('.jpg') || spectrumData.toLowerCase().includes('.jpeg') ||
         spectrumData.toLowerCase().includes('.png') || spectrumData.toLowerCase().includes('.gif') ||
         spectrumData.toLowerCase().includes('.webp') || spectrumData.toLowerCase().includes('.svg'))) {
    return (
      <div>
        <img
          src={imageUrl}
            alt={`${label} spectrum`}
            className="max-w-xs max-h-32 border rounded shadow-sm"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.alt = "Image not found or invalid URL";
            target.src = '';
            target.style.display = 'none';
            const fallbackLink = document.createElement('a');
            fallbackLink.href = imageUrl;
            fallbackLink.target = '_blank';
            fallbackLink.rel = 'noopener noreferrer';
            fallbackLink.className = 'text-indigo-600 hover:text-indigo-800 underline break-all';
            fallbackLink.textContent = t('variousLabels.spectraViewExternalUrl', { label });
            target.parentNode?.appendChild(fallbackLink);
          }}
        />
        <div className="mt-1">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
            {t('variousLabels.openInNewTab')}
          </a>
          </div>
        </div>
      );
    } else if (spectrumData.startsWith('data:application/pdf') || spectrumData.toLowerCase().includes('.pdf')) {
      return (
        <div>
          <a href={imageUrl} download={`${label}.pdf`} className="text-indigo-600 hover:text-indigo-800 underline">
            {t('variousLabels.spectraDownloadPdf', { label })}
          </a>
          <div className="mt-1">
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
              {t('variousLabels.openInNewTab')}
            </a>
          </div>
        </div>
      );
    } else if (spectrumData.startsWith('http') || spectrumData.startsWith('/compound-uploads/')) {
      return (
        <div>
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline break-all">
            {t('variousLabels.spectraViewExternalUrl', { label })}
          </a>
          <div className="mt-1">
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
              {t('variousLabels.openInNewTab')}
            </a>
          </div>
        </div>
      );
    }
  } else {
    // Multiple files - show count and handle each file individually
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          {t('variousLabels.multipleFiles', { count: data.length })}
        </div>
        <div className="space-y-3">
          {data.map((fileUrl, index) => {
            if (!fileUrl) return null;

            const imageUrl = getImageUrl(fileUrl);
            const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
            const isImage = fileUrl.startsWith('data:image') ||
                           (fileUrl.toLowerCase().includes('.jpg') || fileUrl.toLowerCase().includes('.jpeg') ||
                            fileUrl.toLowerCase().includes('.png') || fileUrl.toLowerCase().includes('.gif') ||
                            fileUrl.toLowerCase().includes('.webp') || fileUrl.toLowerCase().includes('.svg'));
            const isPdf = fileUrl.startsWith('data:application/pdf') || fileUrl.toLowerCase().includes('.pdf');

            return (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-end mb-2">
                  <span className="text-xs text-gray-400">({index + 1}/{data.length})</span>
                </div>

                {isImage ? (
                  <div>
                    <img
                      src={imageUrl}
                      alt={`${label} spectrum ${index + 1}`}
                      className="max-w-xs max-h-32 border rounded shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.alt = "Image not found or invalid URL";
                        target.src = '';
                        target.style.display = 'none';
                        const fallbackLink = document.createElement('a');
                        fallbackLink.href = imageUrl;
                        fallbackLink.target = '_blank';
                        fallbackLink.rel = 'noopener noreferrer';
                        fallbackLink.className = 'text-indigo-600 hover:text-indigo-800 underline break-all';
                        fallbackLink.textContent = t('variousLabels.spectraViewExternalUrl', { label });
                        target.parentNode?.appendChild(fallbackLink);
                      }}
                    />
                    <div className="mt-1">
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
                        {t('variousLabels.openInNewTab')}
                      </a>
                    </div>
                  </div>
                ) : isPdf ? (
                  <div>
                    <a href={imageUrl} download={`${label}-${index + 1}.pdf`} className="text-indigo-600 hover:text-indigo-800 underline">
                      {t('variousLabels.spectraDownloadPdf', { label })}
                    </a>
                    <div className="mt-1">
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
                        {t('variousLabels.openInNewTab')}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div>
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline break-all">
                      {t('variousLabels.spectraViewExternalUrl', { label })}
                    </a>
                    <div className="mt-1">
                      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700 underline">
                        {t('variousLabels.openInNewTab')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <span className="text-gray-500 italic">{t('variousLabels.spectraDataUnknownFormat')}</span>;
};


export const CompoundView: React.FC<CompoundViewProps> = ({ compound }) => {
  const { t } = useTranslation();

  if (!compound) return <p className="text-center text-red-500">Compound data not found.</p>;

  // Conditions for showing sections
  const hasGeneralInfo = !!(compound.sttRC || compound.sttHC || compound.codeHC || compound.tenHC || compound.tenHCKhac || compound.loaiHC || compound.status);
  const hasSourceData = !!(compound.tenLatin || compound.tenTA || compound.tenTV || compound.bpnc || compound.nguonKhac);

  const uvSklmHasTrueValue = compound.uvSklm && (compound.uvSklm.nm254 === true || compound.uvSklm.nm365 === true);
  const hasPhysicalPropertiesData = !!(
      compound.trangThai ||
      compound.mau ||
      compound.diemNongChay ||
      compound.alphaD ||
      (compound.dungMoiHoaTanTCVL && compound.dungMoiHoaTanTCVL !== '') ||
      uvSklmHasTrueValue
  );

  const hasStructureData = !!(
      (compound.ctpt && compound.ctpt !== '') ||
      compound.klpt ||
      compound.hinhCauTruc ||
      compound.cauHinhTuyetDoi === true // Only true contributes to showing the section
  );

  const hasSmilesData = !!(compound.smiles && compound.smiles.trim() !== '');
  const hasSpectralData = compound.pho && SPECTRAL_FIELDS_CONFIG.some(field => !!compound.pho[field.key]);
  const hasNmrSolventData = !!(compound.dmNMRGeneral && compound.dmNMRGeneral !== '');
  const hasComputationalData = !!(compound.cartCoor || compound.imgFreq || compound.te);

  return (
    <div className="space-y-6">
      {hasGeneralInfo && (
        <SectionCard title={t('compoundForm.generalInfo.title')}>
          <dl className="divide-y divide-gray-200">
            <DataField label={t('compoundForm.sttRC')} value={compound.sttRC} />
            <DataField label={t('compoundForm.sttHC')} value={compound.sttHC} />
            <DataField label={t('compoundForm.codeHC')} value={compound.codeHC} />
            <DataField label={t('compoundForm.tenHC')} value={compound.tenHC} />
            <DataField label={t('compoundForm.tenHCKhac')} value={compound.tenHCKhac} />
            <DataField label={t('compoundForm.loaiHC')} value={compound.loaiHC} />
            <DataField label={t('compoundForm.statusLabel')} value={compound.status ? t(`compoundStatus.${compound.status}`, compound.status) : ''} />
          </dl>
        </SectionCard>
      )}

      {hasSourceData && (
        <SectionCard title={t('compoundForm.source.title')}>
          <dl className="divide-y divide-gray-200">
            <DataField label={t('excelExport.mainInfo.latinName').replace(':', '')} value={compound.tenLatin} />
            <DataField label={t('excelExport.mainInfo.englishName').replace(':', '')} value={compound.tenTA} />
            <DataField label={t('excelExport.mainInfo.vietnameseName').replace(':', '')} value={compound.tenTV} />
            <DataField label={t('excelExport.mainInfo.researchPart').replace(':', '')} value={compound.bpnc} />
            <DataField label={t('compoundForm.otherSources')} value={compound.nguonKhac} />
          </dl>
        </SectionCard>
      )}

      {hasPhysicalPropertiesData && (
        <SectionCard title={t('compoundForm.physicalProperties.title')}>
          <dl className="divide-y divide-gray-200">
            <DataField label={t('excelExport.mainInfo.state').replace(':', '')} value={compound.trangThai} />
            <DataField label={t('excelExport.mainInfo.color').replace(':', '')} value={compound.mau} />
          </dl>
          {uvSklmHasTrueValue && compound.uvSklm && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">{t('excelExport.mainInfo.uvSklm')}:</h4>
              <dl className="divide-y divide-gray-200">
                  <DataField label={t('excelExport.mainInfo.uv254nm')} value={compound.uvSklm.nm254} />
                  <DataField label={t('excelExport.mainInfo.uv365nm')} value={compound.uvSklm.nm365} />
              </dl>
            </div>
          )}
          <dl className="divide-y divide-gray-200 mt-2">
            <DataField label={t('excelExport.mainInfo.meltingPoint')} value={compound.diemNongChay} />
            <DataField label={t('excelExport.mainInfo.opticalRotation')} value={compound.alphaD} />
            {(compound.dungMoiHoaTanTCVL !== undefined && compound.dungMoiHoaTanTCVL !== '') && (
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-600">{t('excelExport.mainInfo.solventTCVL')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ChemicalFormulaDisplay formula={compound.dungMoiHoaTanTCVL} />
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>
      )}

      {hasStructureData && (
        <SectionCard title={t('compoundForm.structure.title')}>
          <dl className="divide-y divide-gray-200">
            {(compound.ctpt !== undefined && compound.ctpt !== '') && (
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-600">{t('excelExport.mainInfo.molecularFormula')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ChemicalFormulaDisplay formula={compound.ctpt} />
                </dd>
              </div>
            )}
            <DataField label={t('excelExport.mainInfo.molecularWeight')} value={compound.klpt} />
            {compound.cauHinhTuyetDoi === true && (
                <DataField label={t('excelExport.mainInfo.absoluteConfiguration').replace(':', '')} value={compound.cauHinhTuyetDoi} />
            )}
          </dl>
          {compound.hinhCauTruc && (
              <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">{t('compoundForm.structureImage')}:</h4>
                  <img
                      src={getImageUrl(compound.hinhCauTruc)}
                      alt="Structure"
                      className="max-w-md w-full h-auto rounded-md shadow-md border"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.alt = "Image not found or invalid URL";
                        target.src = '';
                        target.style.display = 'none';
                      }}
                  />
              </div>
          )}
        </SectionCard>
      )}

      {hasSmilesData && (
        <SectionCard title={t('compoundForm.smiles.title')}>
          {compound.smiles && <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{compound.smiles}</p>}
        </SectionCard>
      )}

      {hasSpectralData && (
        <SectionCard title={t('compoundForm.spectra.title')}>
          <dl className="divide-y divide-gray-200">
            {SPECTRAL_FIELDS_CONFIG.map(fieldConfig => {
                const spectrumData = (compound.pho as SpectralRecord)?.[fieldConfig.key];
                if (!spectrumData) return null;

                const label = t(fieldConfig.labelKey);

                return (
                    <div key={fieldConfig.key} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-gray-600">{label}:</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {renderSpectrumLinkOrPreview(spectrumData, label, t)}
                        </dd>
                    </div>
                );
            })}
          </dl>
        </SectionCard>
      )}

      {hasNmrSolventData && (
        <SectionCard title={t('compoundForm.nmrSolvent.title')}>
          <dl className="divide-y divide-gray-200">
          {(compound.dmNMRGeneral !== undefined && compound.dmNMRGeneral !== '') && (
              <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="text-sm font-medium text-gray-600">{t('excelExport.mainInfo.nmrSolvent')}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ChemicalFormulaDisplay formula={compound.dmNMRGeneral} />
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>
      )}

      {hasComputationalData && (
        <SectionCard title={t('compoundForm.compChem.title')}>
          <dl className="divide-y divide-gray-200">
            <DataField label={t('excelExport.mainInfo.cartCoords')} value={compound.cartCoor} />
            <DataField label={t('excelExport.mainInfo.imaginaryFreq')} value={compound.imgFreq} />
            <DataField label={t('excelExport.mainInfo.totalEnergy')} value={compound.te} />
          </dl>
        </SectionCard>
      )}

      {/* NMR Data is handled in ViewCompoundPage.tsx as it's not in a SectionCard within CompoundView */}
    </div>
  );
};
