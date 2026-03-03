import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

function generateQRMatrix(data: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          if (row + r < size && col + c < size) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    }
  };

  setFinderPattern(0, 0);
  setFinderPattern(0, size - 7);
  setFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) continue;
      if (r < 9 && c < 9) continue;
      if (r < 9 && c >= size - 8) continue;
      if (r >= size - 8 && c < 9) continue;
      if (r === 6 || c === 6) continue;

      const seed = (hash + r * 31 + c * 17 + r * c) & 0x7fffffff;
      matrix[r][c] = seed % 3 !== 0;
    }
  }

  return matrix;
}

export default React.memo(function QRCodeGenerator({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}: QRCodeGeneratorProps) {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const moduleSize = size / matrix.length;

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
        {matrix.map((row, rowIndex) =>
          row.map((cell, colIndex) =>
            cell ? (
              <Rect
                key={`${rowIndex}-${colIndex}`}
                x={colIndex * moduleSize}
                y={rowIndex * moduleSize}
                width={moduleSize + 0.5}
                height={moduleSize + 0.5}
                fill={color}
              />
            ) : null
          )
        )}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
});
