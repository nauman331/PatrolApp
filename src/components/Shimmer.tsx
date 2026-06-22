import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../theme';

interface ShimmerBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  tone?: 'light' | 'dark';
}

export function ShimmerBox({
  width = '100%',
  height = 16,
  borderRadius = Radii.sm,
  style,
  tone = 'light',
}: ShimmerBoxProps) {
  const pulse = useRef(new Animated.Value(0.35)).current;
  const baseColor = tone === 'dark' ? '#2A2A45' : '#E4E4E8';
  const highlightColor = tone === 'dark' ? '#3D3D5C' : '#F7F7FA';

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
        { width, height, borderRadius, backgroundColor: baseColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.highlight,
          { opacity: pulse, backgroundColor: highlightColor },
        ]}
      />
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
        <View key={i} style={styles.patrolRow}>
          <ShimmerBox width={9} height={9} borderRadius={9} />
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBox width="78%" height={12} />
            <ShimmerBox width="42%" height={10} />
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
    <View style={styles.dashboardShiftCard}>
      <View style={styles.dashboardShiftLeft}>
        <ShimmerBox width={80} height={10} />
        <ShimmerBox width="92%" height={14} />
        <ShimmerBox width="55%" height={10} />
      </View>
      <View style={styles.dashboardShiftRight}>
        <ShimmerBox width={72} height={20} borderRadius={16} />
        <ShimmerBox width={84} height={30} borderRadius={10} />
      </View>
    </View>
  );
}

function DashboardStatCardShimmer() {
  return (
    <View style={styles.dashboardStatCard}>
      <ShimmerBox width={30} height={30} borderRadius={9} />
      <ShimmerBox width={40} height={20} style={{ marginTop: 6 }} />
      <ShimmerBox width="72%" height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

export function DashboardStatsShimmer() {
  return (
    <View style={styles.dashboardStatsGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <DashboardStatCardShimmer key={i} />
      ))}
    </View>
  );
}

export function ManagerListRowShimmer({ withBadge = false }: { withBadge?: boolean }) {
  return (
    <View style={styles.managerListRow}>
      <ShimmerBox width={32} height={32} borderRadius={9} />
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBox width="68%" height={12} />
        <ShimmerBox width="82%" height={10} />
      </View>
      {withBadge ? (
        <ShimmerBox width={44} height={10} borderRadius={4} />
      ) : (
        <ShimmerBox width={16} height={16} borderRadius={4} />
      )}
    </View>
  );
}

export function ManagerDashboardShimmer({
  includeHeader = true,
}: {
  includeHeader?: boolean;
}) {
  return (
    <>
      {includeHeader ? (
        <View style={styles.managerHeaderShell}>
          <ShimmerBox width={72} height={18} borderRadius={7} tone="dark" />
          <ShimmerBox width="72%" height={22} tone="dark" style={{ marginTop: 18 }} />
          <ShimmerBox width="58%" height={12} style={{ marginTop: 10 }} tone="dark" />
        </View>
      ) : null}
      <View style={includeHeader ? styles.managerBodyShimmer : undefined}>
        <DashboardStatsShimmer />
        <ShimmerBox width={140} height={12} style={{ marginBottom: 10 }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <ManagerListRowShimmer key={`alert-${i}`} withBadge />
        ))}
        <ShimmerBox width={120} height={12} style={{ marginTop: 8, marginBottom: 10 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <ManagerListRowShimmer key={`inc-${i}`} />
        ))}
        <ShimmerBox width={100} height={12} style={{ marginTop: 8, marginBottom: 10 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <ManagerListRowShimmer key={`guard-${i}`} />
        ))}
      </View>
    </>
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

export function ManagerGuardRowShimmer() {
  return (
    <View style={styles.managerGuardRow}>
      <ShimmerBox width={40} height={40} borderRadius={12} />
      <View style={{ flex: 1, gap: 5 }}>
        <ShimmerBox width="52%" height={13} />
        <ShimmerBox width="68%" height={10} />
        <ShimmerBox width="42%" height={10} />
      </View>
      <View style={styles.managerGuardRowRight}>
        <ShimmerBox width={58} height={18} borderRadius={Radii.pill} />
        <ShimmerBox width={16} height={16} borderRadius={4} />
      </View>
    </View>
  );
}

export function ManagerGuardsShimmer({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ManagerGuardRowShimmer key={i} />
      ))}
    </>
  );
}

export function ManagerReportRowShimmer({
  variant = 'patrol',
}: {
  variant?: 'patrol' | 'incident';
}) {
  return (
    <View style={styles.managerGuardRow}>
      <ShimmerBox width={36} height={36} borderRadius={10} />
      <View style={{ flex: 1, gap: 5 }}>
        <ShimmerBox
          width={variant === 'incident' ? '62%' : '48%'}
          height={12}
        />
        <ShimmerBox width="72%" height={10} />
        <ShimmerBox width={variant === 'incident' ? '68%' : '56%'} height={10} />
      </View>
      <ShimmerBox width={16} height={16} borderRadius={4} />
    </View>
  );
}

export function ManagerReportsShimmer({
  count = 5,
  variant = 'patrol',
}: {
  count?: number;
  variant?: 'patrol' | 'incident';
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ManagerReportRowShimmer key={i} variant={variant} />
      ))}
    </>
  );
}

export function ManagerShiftRowShimmer() {
  return (
    <View style={styles.managerGuardRow}>
      <ShimmerBox width={34} height={34} borderRadius={10} />
      <View style={{ flex: 1, gap: 5 }}>
        <ShimmerBox width="44%" height={12} />
        <ShimmerBox width="78%" height={10} />
        <ShimmerBox width="52%" height={10} />
      </View>
    </View>
  );
}

export function ManagerSiteRowShimmer() {
  return (
    <View style={styles.managerGuardRow}>
      <ShimmerBox width={36} height={36} borderRadius={10} />
      <View style={{ flex: 1, gap: 5 }}>
        <ShimmerBox width="58%" height={13} />
        <ShimmerBox width="40%" height={10} />
        <ShimmerBox width="46%" height={10} />
        <ShimmerBox width="50%" height={10} />
      </View>
    </View>
  );
}

export function ManagerRosterCalendarFixedShimmer() {
  return (
    <>
      <View style={[styles.calendarHeaderShimmer, styles.cardShadow]}>
        <ShimmerBox width={18} height={18} borderRadius={4} />
        <ShimmerBox width={120} height={14} />
        <ShimmerBox width={18} height={18} borderRadius={4} />
      </View>
      <View style={[styles.calendarShimmer, styles.cardShadow]}>
        <View style={styles.weekRowShimmer}>
          {Array.from({ length: 7 }).map((_, i) => (
            <ShimmerBox key={i} width={24} height={10} style={{ flex: 1 }} />
          ))}
        </View>
        <View style={styles.daysGridShimmer}>
          {Array.from({ length: 35 }).map((_, i) => (
            <View key={i} style={styles.dayCellShimmer}>
              <ShimmerBox width={20} height={12} borderRadius={10} />
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

export function ManagerRosterListShimmer({
  variant = 'shifts',
  count = 4,
}: {
  variant?: 'shifts' | 'sites' | 'calendar';
  count?: number;
}) {
  const Row =
    variant === 'sites' ? ManagerSiteRowShimmer : ManagerShiftRowShimmer;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Row key={i} />
      ))}
    </>
  );
}

/** @deprecated use ManagerRosterCalendarFixedShimmer + ManagerRosterListShimmer */
export function ManagerRosterShimmer({
  variant = 'calendar',
}: {
  variant?: 'calendar' | 'shifts' | 'sites';
}) {
  if (variant === 'shifts') {
    return (
      <>
        <View style={styles.sectionHdrShimmer}>
          <ShimmerBox width={130} height={12} />
          <ShimmerBox width={72} height={10} />
        </View>
        {Array.from({ length: 4 }).map((_, i) => (
          <ManagerShiftRowShimmer key={i} />
        ))}
      </>
    );
  }

  if (variant === 'sites') {
    return (
      <>
        <View style={styles.sectionHdrShimmer}>
          <ShimmerBox width={120} height={12} />
          <ShimmerBox width={56} height={10} />
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <ManagerSiteRowShimmer key={i} />
        ))}
      </>
    );
  }

  return (
    <>
      <View style={[styles.calendarHeaderShimmer, styles.cardShadow]}>
        <ShimmerBox width={18} height={18} borderRadius={4} />
        <ShimmerBox width={120} height={14} />
        <ShimmerBox width={18} height={18} borderRadius={4} />
      </View>
      <View style={[styles.calendarShimmer, styles.cardShadow]}>
        <View style={styles.weekRowShimmer}>
          {Array.from({ length: 7 }).map((_, i) => (
            <ShimmerBox key={i} width={24} height={10} style={{ flex: 1 }} />
          ))}
        </View>
        <View style={styles.daysGridShimmer}>
          {Array.from({ length: 35 }).map((_, i) => (
            <View key={i} style={styles.dayCellShimmer}>
              <ShimmerBox width={20} height={12} borderRadius={10} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.sectionHdrShimmer}>
        <ShimmerBox width={48} height={12} />
        <ShimmerBox width={72} height={10} />
      </View>
      {Array.from({ length: 2 }).map((_, i) => (
        <ManagerShiftRowShimmer key={i} />
      ))}
    </>
  );
}

export function ManagerGuardDetailFixedShimmer() {
  return (
    <>
      <View style={[styles.profileCardShimmer, styles.cardShadow]}>
        <ShimmerBox width={64} height={64} borderRadius={20} style={{ marginBottom: 10 }} />
        <ShimmerBox width={140} height={18} />
        <ShimmerBox width={100} height={10} style={{ marginTop: 6 }} />
        <ShimmerBox width={80} height={24} borderRadius={Radii.pill} style={{ marginTop: 10 }} />
      </View>
      <View style={[styles.infoGridShimmer, styles.cardShadow]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: '46%', gap: 6 }}>
            <ShimmerBox width={24} height={16} />
            <ShimmerBox width={50} height={10} />
            <ShimmerBox width="80%" height={12} />
          </View>
        ))}
      </View>
      <ShimmerBox width={80} height={12} style={{ marginBottom: 10 }} />
      {Array.from({ length: 2 }).map((_, i) => (
        <ManagerListRowShimmer key={i} />
      ))}
    </>
  );
}

export function ManagerGuardDetailListShimmer() {
  return (
    <>
      <ShimmerBox width={100} height={12} style={{ marginBottom: 10 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <ManagerListRowShimmer key={`log-${i}`} />
      ))}
      <ShimmerBox width={160} height={44} borderRadius={Radii.md} style={{ marginTop: 8 }} />
    </>
  );
}

export function ManagerGuardDetailShimmer() {
  return (
    <>
      <ManagerGuardDetailFixedShimmer />
      <ManagerGuardDetailListShimmer />
    </>
  );
}

export function ManagerAttendanceListShimmer({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.attendanceRowShimmer}>
          <View style={{ flex: 1, gap: 5 }}>
            <ShimmerBox width="38%" height={12} />
            <ShimmerBox width="52%" height={10} />
            <ShimmerBox width="44%" height={10} />
            <ShimmerBox width="72%" height={10} />
          </View>
          <ShimmerBox width={62} height={22} borderRadius={Radii.pill} />
        </View>
      ))}
    </>
  );
}

export function ManagerAttendanceSummaryShimmer() {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={[styles.sumCardShimmer, styles.cardShadow]}>
          <ShimmerBox width={28} height={22} />
          <ShimmerBox width={48} height={10} style={{ marginTop: 4 }} />
        </View>
      ))}
    </View>
  );
}

export function ManagerAttendanceShimmer() {
  return (
    <>
      <ManagerAttendanceSummaryShimmer />
      <ManagerAttendanceListShimmer />
    </>
  );
}

export function ManagerShiftReportFixedShimmer() {
  return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={[styles.sumCardShimmer, styles.cardShadow, { minWidth: 90 }]}>
            <ShimmerBox width={36} height={20} />
            <ShimmerBox width={52} height={10} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>
      <View style={[styles.managerGuardRow, styles.cardShadow, { marginBottom: 8 }]}>
        <ShimmerBox width={14} height={14} borderRadius={4} />
        <ShimmerBox width="70%" height={12} style={{ flex: 1 }} />
      </View>
    </>
  );
}

export function ManagerShiftReportListShimmer() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={[styles.patrolCardShimmer, styles.cardShadow]}>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            <ShimmerBox width={14} height={14} borderRadius={4} />
            <ShimmerBox width="62%" height={12} />
          </View>
          <ShimmerBox width="48%" height={10} style={{ marginBottom: 6 }} />
          <ShimmerBox width="55%" height={10} style={{ marginBottom: 10 }} />
          {Array.from({ length: 2 }).map((_, j) => (
            <View key={j} style={styles.scannerRowShimmer}>
              <ShimmerBox width={6} height={6} borderRadius={3} />
              <View style={{ flex: 1, gap: 4 }}>
                <ShimmerBox width="40%" height={11} />
                <ShimmerBox width="30%" height={10} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

export function ManagerShiftReportShimmer() {
  return (
    <>
      <ManagerShiftReportFixedShimmer />
      <View style={styles.sectionHdrShimmer}>
        <ShimmerBox width={56} height={12} />
      </View>
      <ManagerShiftReportListShimmer />
    </>
  );
}

export function ManagerIncidentDetailHeaderShimmer() {
  return (
    <View style={[styles.incidentCard, styles.cardShadow]}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <ShimmerBox width={36} height={36} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBox width="75%" height={14} />
          <ShimmerBox width="50%" height={10} />
        </View>
        <ShimmerBox width={52} height={22} borderRadius={Radii.sm} />
      </View>
      <ShimmerBox width="90%" height={12} style={{ marginBottom: 6 }} />
      <ShimmerBox width="70%" height={12} />
    </View>
  );
}

export function ManagerIncidentDetailBodyShimmer() {
  return (
    <View style={[styles.profileCard, styles.cardShadow]}>
      <ShimmerBox width={110} height={12} style={{ marginBottom: 14 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <ShimmerBox width={80} height={10} style={{ marginBottom: 6 }} />
          <ShimmerBox width="85%" height={14} />
        </View>
      ))}
    </View>
  );
}

export function ManagerIncidentDetailShimmer() {
  return (
    <>
      <ManagerIncidentDetailHeaderShimmer />
      <ManagerIncidentDetailBodyShimmer />
    </>
  );
}

export function ProfileShimmer() {
  return (
    <>
      <View style={styles.profileAvatarWrap}>
        <ShimmerBox width={110} height={110} borderRadius={60} />
      </View>
      <View style={[styles.profileCard, styles.cardShadow]}>
        <ShimmerBox width={100} height={12} style={{ marginBottom: 16 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <ShimmerBox width={80} height={10} style={{ marginBottom: 6 }} />
            <ShimmerBox width="85%" height={14} />
          </View>
        ))}
      </View>
      <View style={[styles.profileCard, styles.cardShadow]}>
        <ShimmerBox width={110} height={12} style={{ marginBottom: 14 }} />
        {Array.from({ length: 2 }).map((_, i) => (
          <View key={i} style={styles.profileActionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <ShimmerBox width={35} height={35} borderRadius={10} />
              <ShimmerBox width="50%" height={14} />
            </View>
            <ShimmerBox width={18} height={18} borderRadius={4} />
          </View>
        ))}
      </View>
      <ShimmerBox height={52} borderRadius={Radii.md} />
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
    padding: Spacing.md,
    marginBottom: 7,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    ...Shadows.card,
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
  dashboardShiftCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
  dashboardShiftLeft: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  dashboardShiftRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  dashboardStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dashboardStatCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    ...Shadows.card,
  },
  managerHeaderShimmer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  managerHeaderShell: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  managerBodyShimmer: {
    padding: 14,
    marginTop: -10,
  },
  managerListRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
  managerGuardRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...Shadows.card,
  },
  managerGuardRowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  sectionHdrShimmer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  calendarHeaderShimmer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 10,
  },
  weekRowShimmer: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  daysGridShimmer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellShimmer: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patrolCardShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scannerRowShimmer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attendanceRowShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.card,
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
  profileAvatarWrap: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileCard: {
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileCardShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  infoGridShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  sumCardShimmer: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
  },
  chartShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 14,
  },
  calendarShimmer: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 14,
  },
});
