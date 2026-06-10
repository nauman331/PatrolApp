import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows } from '../theme';

interface ShimmerBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function ShimmerBox({
  width = '100%',
  height = 16,
  borderRadius = Radii.sm,
  style,
}: ShimmerBoxProps) {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View
      style={[
        styles.base,
        { width, height, borderRadius },
        style,
      ]}
    >
      <Animated.View style={[styles.highlight, { opacity: pulse }]} />
    </View>
  );
}

export function ShiftCardShimmer() {
  return (
    <View style={[styles.shiftCard, styles.cardShadow]}>
      <View style={styles.shiftCardTop}>
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBox width="70%" height={14} />
          <ShimmerBox width="40%" height={10} />
        </View>
        <ShimmerBox width={72} height={22} borderRadius={7} />
      </View>
      <View style={styles.shiftCardMeta}>
        <ShimmerBox width={100} height={10} />
        <ShimmerBox width={80} height={10} />
        <ShimmerBox width={90} height={10} />
      </View>
      <ShimmerBox height={44} borderRadius={Radii.md} style={{ marginTop: 14 }} />
    </View>
  );
}

export function ShiftListShimmer({ count = 3 }: { count?: number }) {
  return (
    <>
      <ShimmerBox width={90} height={10} style={{ marginBottom: 10, marginTop: 4 }} />
      {Array.from({ length: count }).map((_, i) => (
        <ShiftCardShimmer key={i} />
      ))}
    </>
  );
}

export function PatrolListShimmer({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.patrolRow, styles.cardShadow]}>
          <ShimmerBox width={10} height={10} borderRadius={5} />
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBox width="75%" height={12} />
            <ShimmerBox width="35%" height={10} />
          </View>
        </View>
      ))}
    </>
  );
}

export function PatrolTimelineShimmer() {
  return (
    <View style={styles.patrolTimelineWrap}>
      <View style={[styles.patrolSummaryShimmer, styles.cardShadow]}>
        <View style={{ flex: 1, gap: 8 }}>
          <ShimmerBox width={110} height={10} />
          <ShimmerBox width="55%" height={16} />
          <ShimmerBox width="40%" height={12} />
        </View>
        <ShimmerBox width={58} height={58} borderRadius={29} />
      </View>
      <ShimmerBox height={6} borderRadius={3} style={{ marginBottom: 12 }} />
      <ShimmerBox width={120} height={10} style={{ marginBottom: 12 }} />
      <PatrolListShimmer count={4} />
    </View>
  );
}

export function DashboardShiftShimmer() {
  return (
    <View style={[styles.dashboardShift, styles.cardShadow]}>
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBox width={80} height={10} />
        <ShimmerBox width="65%" height={14} />
        <ShimmerBox width="50%" height={10} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: 8 }}>
        <ShimmerBox width={70} height={20} borderRadius={16} />
        <ShimmerBox width={80} height={30} borderRadius={10} />
      </View>
    </View>
  );
}

export function IncidentCardShimmer() {
  return (
    <View style={[styles.incidentCard, styles.cardShadow]}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, paddingLeft: 6 }}>
        <ShimmerBox width={36} height={36} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBox width="75%" height={14} />
          <ShimmerBox width="40%" height={10} />
        </View>
        <ShimmerBox width={52} height={22} borderRadius={Radii.sm} />
      </View>
      <ShimmerBox
        width={120}
        height={24}
        borderRadius={Radii.sm}
        style={{ marginBottom: 10, marginLeft: 6 }}
      />
      <ShimmerBox width="90%" height={12} style={{ marginBottom: 6, marginLeft: 6 }} />
      <ShimmerBox width="70%" height={12} style={{ marginBottom: 12, marginLeft: 6 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, paddingLeft: 6 }}>
        <ShimmerBox width={88} height={24} borderRadius={Radii.pill} />
        <ShimmerBox width={72} height={24} borderRadius={Radii.pill} />
      </View>
      <View style={styles.incidentFooterShimmer}>
        <ShimmerBox height={34} borderRadius={Radii.sm} style={{ flex: 1 }} />
        <ShimmerBox height={34} borderRadius={Radii.sm} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export function IncidentListShimmer({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <IncidentCardShimmer key={i} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#E4E4E8',
    overflow: 'hidden',
  },
  highlight: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F7F7FA',
  },
  cardShadow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    marginBottom: 12,
    ...Shadows.card,
  },
  shiftCard: {
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
  },
  shiftCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
  },
  shiftCardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingLeft: 8,
  },
  patrolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 8,
  },
  patrolTimelineWrap: {
    padding: 16,
    paddingTop: 14,
  },
  patrolSummaryShimmer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginBottom: 12,
    borderRadius: Radii.xl,
  },
  dashboardShift: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  incidentCard: {
    borderRadius: Radii.lg,
    padding: 14,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    marginBottom: 12,
  },
  incidentFooterShimmer: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginLeft: 6,
    marginRight: 2,
  },
});
