
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { LucideIcon } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────

interface NavItem {
  icon: string | LucideIcon; // ✅ emoji OR lucide
  label: string;
  active?: boolean;
}

interface NavBarProps {
  items: NavItem[];
  variant?: 'light' | 'dark' | 'mgr';
  onPress?: (idx: number) => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  items,
  variant = 'light',
  onPress,
}) => {
  const bg =
    variant === 'dark'
      ? Colors.navBgDark
      : variant === 'mgr'
      ? Colors.navBgMgr
      : Colors.navBg;

  const inactive =
    variant === 'dark'
      ? '#AAAAAA'
      : Colors.navInactive;

  const active = Colors.navActive;

  return (
    <View
      style={[
        styles.nav,
        { backgroundColor: bg, borderTopColor: Colors.border },
      ]}
    >
      {items.map((item, i) => {
        const Icon = item.icon as any;

        return (
          <TouchableOpacity
            key={i}
            style={styles.navItem}
            onPress={() => onPress?.(i)}
          >
            {/* icon renderer */}
            {typeof Icon === 'string' ? (
              <Text style={styles.navIcon}>{Icon}</Text>
            ) : (
              <Icon
                size={22}
                color={item.active ? active : inactive}
              />
            )}

            <Text
              style={[
                styles.navLabel,
                { color: item.active ? active : inactive },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  action?: string;
  dark?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  action,
  dark,
}) => (
  <View style={styles.secHdr}>
    <Text
      style={[
        styles.secTitle,
        dark && { color: Colors.textOnDark },
      ]}
    >
      {title}
    </Text>
    {action && <Text style={styles.seeAll}>{action}</Text>}
  </View>
);

// ─────────────────────────────────────────────────────────────
// STAT CARD (UPDATED WITH LUCIDE SUPPORT)
// ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: string | LucideIcon;
  value: string;
  label: string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  bgColor,
  trend,
  trendUp = true,
}) => {
  const Icon = icon as any;

  return (
    <View style={[styles.statCard, Shadows.card]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        {typeof Icon === 'string' ? (
          <Text style={{ fontSize: 14 }}>{Icon}</Text>
        ) : (
          <Icon size={18} color="#000" />
        )}
      </View>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
      {trend ? (
        <Text
          style={[
            styles.statTrend,
            { color: trendUp ? Colors.success : Colors.danger },
          ]}
          numberOfLines={2}
        >
          {trend}
        </Text>
      ) : null}
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<BtnProps> = ({
  label,
  onPress,
  style,
  textStyle,
}) => (
  <TouchableOpacity
    style={[styles.primaryBtn, style]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.primaryBtnText, textStyle]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export const OutlineButton: React.FC<BtnProps> = ({
  label,
  onPress,
  style,
  textStyle,
}) => (
  <TouchableOpacity
    style={[styles.outlineBtn, style]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.outlineBtnText, textStyle]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────

const badgeConfigs: Record<
  string,
  { bg: string; color: string }
> = {
  active: { bg: '#fff3ed', color: Colors.accent },
  done: { bg: Colors.successLight, color: Colors.success },
  upcoming: { bg: Colors.infoLight, color: Colors.info },
  open: { bg: Colors.dangerLight, color: Colors.danger },
};

interface BadgeProps {
  status: string;
  label: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({
  status,
  label,
}) => {
  const cfg =
    badgeConfigs[status.toLowerCase()] || {
      bg: '#eee',
      color: '#666',
    };

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>
        {label}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────
// PATROL ITEM
// ─────────────────────────────────────────────────────────────

type PatrolStatus = 'done' | 'pending' | 'missed';

interface PatrolItemProps {
  location: string;
  time: string;
  status: PatrolStatus;
  isLast?: boolean;
}

const dotColor: Record<PatrolStatus, string> = {
  done: Colors.success,
  pending: Colors.accent,
  missed: Colors.danger,
};

export const PatrolItem: React.FC<PatrolItemProps> = ({
  location,
  time,
  status,
  isLast = false,
}) => (
  <View style={[styles.patrolItem, !isLast && styles.patrolItemSpaced, Shadows.card]}>
    <View
      style={[
        styles.patrolDot,
        { backgroundColor: dotColor[status] },
      ]}
    />
    <View style={{ flex: 1 }}>
      <Text style={styles.patrolLoc}>{location}</Text>
      <Text style={styles.patrolTime}>{time}</Text>
    </View>
  </View>
);

// ─────────────────────────────────────────────────────────────
// CHIP
// ─────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text
      style={[
        styles.chipText,
        active && styles.chipTextActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 9,
    paddingBottom: 13,
    borderTopWidth: 1,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navIcon: { fontSize: 16 },
  navLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },

  secHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  secTitle: {
    fontWeight: '800',
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  seeAll: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '700',
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLbl: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  statTrend: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginTop: 3,
    lineHeight: 13,
  },

  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '700',
  },

  outlineBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  badge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },

  patrolItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patrolItemSpaced: {
    marginBottom: 7,
  },
  patrolDot: { width: 9, height: 9, borderRadius: 9 },
  patrolLoc: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  patrolTime: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.textPrimary,
  },
  chipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
});