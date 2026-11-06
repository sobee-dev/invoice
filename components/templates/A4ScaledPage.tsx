// components/receipt-templates/A4ScaledPage.tsx
//
// Same wrapper that Classic/Modern each define privately. Extracted here so
// ProfessionalTemplate doesn't add a third copy; Classic and Modern can swap
// to this import whenever convenient (no behavior change).
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

export const A4_WIDTH = 595;

export function A4ScaledPage({ children }: { children: React.ReactNode }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  const scale = containerWidth > 0 ? containerWidth / A4_WIDTH : 1;
  const ready = containerWidth > 0 && contentHeight > 0;

  const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setContainerWidth(prev => (Math.abs(prev - w) > 0.5 ? w : prev));
  }, []);

  const handleContentLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight(prev => (Math.abs(prev - h) > 0.5 ? h : prev));
  }, []);

  return (
    <View style={{ width: '100%' }} onLayout={handleContainerLayout}>
      <View
        style={{
          width: containerWidth || undefined,
          height: ready ? contentHeight * scale : undefined,
          overflow: 'hidden',
        }}
      >
        <View
          onLayout={handleContentLayout}
          style={{
            width: A4_WIDTH,
            opacity: ready ? 1 : 0,
            transform: [
              { translateX: -(A4_WIDTH * (1 - scale)) / 2 },
              { translateY: -(contentHeight * (1 - scale)) / 2 },
              { scale },
            ],
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}