import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import { MapPin, Map, Tag, Info, User, Phone, Mail } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import {
  ManagerStackHeader,
  ManagerStackListLayout,
  ManagerStackShell,
  ManagerCard,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { formatDateTimeFull } from '../../utils';
import {
  ManagerShiftReportFixedShimmer,
} from '../../components/Shimmer';
import {
  getManagerSiteDetail,
  type ManagerSiteDetailData,
} from '../../services/managerApi';

type Props = ManagerStackScreenProps<'ManagerSiteDetail'>;

export default function ManagerSiteDetailScreen({ route }: Props) {
  const { siteId } = route.params;

  const [data, setData] = useState<ManagerSiteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setError(null);
    const result = await getManagerSiteDetail(siteId);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.message ?? 'Failed to load site details');
    }

    setLoading(false);
    setRefreshing(false);
  }, [siteId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const openMap = () => {
    if (data?.latitude && data?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
      Linking.openURL(url);
    }
  };

  const showShimmer = loading && !data;

  return (
    <ManagerStackShell
      header={
        <ManagerStackHeader
          title={data?.site_name ?? 'Site Details'}
          subtitle={data?.address}
        />
      }
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        {error ? <AuthErrorBanner message={error} /> : null}

        {showShimmer ? (
          <ManagerShiftReportFixedShimmer />
        ) : data ? (
          <>
            <SectionHeader title="Site Information" />
            <ManagerCard>
              <View style={styles.infoRow}>
                <MapPin size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoText}>{data.address}</Text>
                </View>
              </View>

              {data.latitude && data.longitude && (
                <TouchableOpacity style={[styles.infoRow, { marginTop: 12 }]} onPress={openMap}>
                  <Map size={16} color={Colors.accent} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Coordinates</Text>
                    <Text style={styles.infoText}>{data.latitude}, {data.longitude}</Text>
                    <Text style={styles.linkText}>View on Maps</Text>
                  </View>
                </TouchableOpacity>
              )}

              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Info size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoText}>{data.site_description || 'No description provided'}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>State</Text>
                      <Text style={styles.infoText}>{data.state?.toUpperCase()}</Text>
                   </View>
                   <View style={{ flex: 1 }}>
                      <Text style={styles.infoLabel}>Radius</Text>
                      <Text style={styles.infoText}>{data.signin_radius}m</Text>
                   </View>
                </View>
              </View>
            </ManagerCard>

            <SectionHeader title="Owner Information" />
            <ManagerCard>
              <View style={styles.infoRow}>
                <User size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoText}>{data.user.name}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Mail size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoText}>{data.user.email}</Text>
                </View>
              </View>
              {data.user.phone && (
                <View style={[styles.infoRow, { marginTop: 12 }]}>
                  <Phone size={16} color={Colors.accent} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoText}>{data.user.phone}</Text>
                  </View>
                </View>
              )}
            </ManagerCard>

            <SectionHeader title={`NFC Tags (${data.nfc_tags.length})`} />
            {data.nfc_tags.length > 0 ? (
              data.nfc_tags.map((tag) => (
                <ManagerCard key={tag.id}>
                  <View style={styles.infoRow}>
                    <Tag size={16} color={Colors.accent} />
                    <View style={styles.infoContent}>
                      <Text style={styles.tagTitle}>{tag.name}</Text>
                      <Text style={styles.tagSub}>{tag.nfc_uid}</Text>
                      <Text style={styles.tagDate}>Created: {formatDateTimeFull(tag.created_at)}</Text>
                    </View>
                  </View>
                </ManagerCard>
              ))
            ) : (
              <Text style={styles.emptyText}>No NFC tags assigned to this site.</Text>
            )}

            <View style={styles.footer}>
                <Text style={styles.footerText}>Created: {formatDateTimeFull(data.created_at)}</Text>
                <Text style={styles.footerText}>Updated: {formatDateTimeFull(data.updated_at)}</Text>
            </View>
          </>
        ) : null}
      </ManagerStackListLayout>
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  linkText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 4,
  },
  tagTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  tagSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  tagDate: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    marginTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
