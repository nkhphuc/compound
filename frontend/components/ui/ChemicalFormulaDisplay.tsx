
import React from 'react';

interface ChemicalFormulaDisplayProps {
  formula?: string | null;
  className?: string;
}

export const ChemicalFormulaDisplay: React.FC<ChemicalFormulaDisplayProps> = ({ formula, className }) => {
  if (!formula) {
    return <span className={className}>-</span>; // Display a dash if formula is not provided
  }

  const parseFormula = (f: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let currentText = "";
    let keySuffix = 0; // To help generate unique keys for React elements

    for (let i = 0; i < f.length; i++) {
      const char = f[i];

      if (char === '_' || char === '^') {
        // If there's accumulated plain text, push it before handling sub/super script
        if (currentText) {
          elements.push(currentText);
          currentText = "";
        }

        const scriptType = char === '_' ? 'sub' : 'sup';
        let scriptContent = "";

        // Check if there's a character or group following '_' or '^'
        if (i + 1 < f.length) {
          if (f[i + 1] === '{') { // Check for group syntax e.g., _{group} or ^{group}
            const closingBraceIndex = f.indexOf('}', i + 2); // Find '}' starting after '{'
            if (closingBraceIndex !== -1) { // Found a closing brace
              scriptContent = f.substring(i + 2, closingBraceIndex);
              i = closingBraceIndex; // Advance loop index past the '}'
            } else { // Malformed group (no closing '}') - treat '_' or '^' and '{' as literal text
              currentText += char; // Add '_' or '^' itself
              currentText += f[i + 1]; // Add the '{'
              i++; // Advance past '{'
              continue; // Continue to next character in the outer loop
            }
          } else { // Single character script
            scriptContent = f[i + 1];
            i++; // Advance loop index past the script character
          }

          if (scriptContent) { // If content for sub/sup was successfully extracted
            elements.push(
              scriptType === 'sub'
                ? <sub key={`sub-${i}-${keySuffix++}`}>{scriptContent}</sub>
                : <sup key={`sup-${i}-${keySuffix++}`}>{scriptContent}</sup>
            );
          } else { 
            // Script content was empty (e.g., from H_{}O). Treat '_' or '^' as literal.
            currentText += char;
          }
        } else { // '_' or '^' is the last character in the formula string
          currentText += char;
        }
      } else { // Normal character, add to currentText
        currentText += char;
      }
    }

    // Add any remaining plain text
    if (currentText) {
      elements.push(currentText);
    }
    return elements;
  };

  return <span className={className}>{parseFormula(formula)}</span>;
};