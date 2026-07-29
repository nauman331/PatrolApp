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
import { MapPin, Map, Tag, Info, FileText, ChevronRight, ExternalLink, Globe } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import {
  ManagerStackHeader,
  ManagerStackListLayout,
  ManagerStackShell,
  ManagerCard,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { formatDateTimeFull } from '../../utils';
import { API_BASE_URL } from '../../config/env';
import {
  ManagerSiteDetailShimmer,
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

  const openDocument = (path: string | null) => {
    if (path) {
      const url = `${API_BASE_URL}/storage/${path}`;
      Linking.openURL(url);
    }
  };

  const showShimmer = loading && !data;

  const documents = [
    { label: 'Emergency Procedures', path: data?.emergency_procedures },
    { label: 'Patrol Checkpoints', path: data?.patrol_checkpoints },
    { label: 'Incident Reporting Guide', path: data?.incident_reporting_guide },
    { label: 'NFC Scan Protocol', path: data?.nfc_scan_protocol },
  ];

  const hasDocuments = documents.some(doc => !!doc.path);

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
          <ManagerSiteDetailShimmer />
        ) : data ? (
          <View style={{ marginTop: 10 }}>
            <SectionHeader title="Site Information" />
            <ManagerCard>
              <View style={styles.infoRow}>
                <Info size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Site Name</Text>
                  <Text style={styles.infoText}>{data.site_name}</Text>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 12 }]}>
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
                <Globe size={16} color={Colors.accent} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>State</Text>
                  <Text style={styles.infoText}>{data.state ? data.state.charAt(0).toUpperCase() + data.state.slice(1).toLowerCase() : ''}</Text>
                </View>
              </View>
            </ManagerCard>

            {hasDocuments && (
              <>
                <SectionHeader title="Site Documents" />
                <ManagerCard>
                  {documents.map((doc, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.docRow, index > 0 && styles.docRowBorder]}
                      onPress={() => openDocument(doc.path ?? null)}
                      disabled={!doc.path}
                    >
                      <View style={styles.docIconWrap}>
                        <FileText size={18} color={doc.path ? Colors.accent : Colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.docLabel, !doc.path && { color: Colors.textMuted }]}>
                          {doc.label}
                        </Text>
                        <Text style={styles.docStatus}>
                          {doc.path ? 'View Document' : 'Not Uploaded'}
                        </Text>
                      </View>
                      {doc.path ? (
                        <ExternalLink size={14} color={Colors.textMuted} />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </ManagerCard>
              </>
            )}

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
          </View>
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
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  docRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  docStatus: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
