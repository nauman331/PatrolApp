import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  User,
} from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  ManagerIncidentDetailBodyShimmer,
  ManagerIncidentDetailHeaderShimmer,
} from '../../components/Shimmer';
import {
  getManagerIncidentDetail,
  mapSeverityColor,
  type ManagerIncidentDetailData,
} from '../../services/managerApi';

type Props = ManagerStackScreenProps<'ManagerIncidentDetail'>;

export default function ManagerIncidentDetailScreen({ route }: Props) {
  const { incidentId } = route.params;
  const [data, setData] = useState<ManagerIncidentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setError(null);
    const result = await getManagerIncidentDetail(incidentId);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load incident');
    }

    setLoading(false);
    setRefreshing(false);
  }, [incidentId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDetail();
    }, [fetchDetail]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const severityColor = data ? mapSeverityColor(data.severity) : Colors.textMuted;
  const showShimmer = loading && !data;

  return (
    <ManagerStackShell
      header={
        <ManagerStackHeader
          title="Incident Report"
          subtitle={data?.location_date ?? 'Loading...'}
        />
      }
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            {showShimmer ? (
              <ManagerIncidentDetailHeaderShimmer />
            ) : data ? (
              <View style={[styles.headerCard, Shadows.card]}>
                <View style={styles.headerTop}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: `${severityColor}18` },
                    ]}
                  >
                    <AlertTriangle size={18} color={severityColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{data.title}</Text>
                    <Text style={styles.subtitle}>{data.location_date}</Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: `${severityColor}18` },
                    ]}
                  >
                    <Text style={[styles.severityText, { color: severityColor }]}>
                      {data.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timeRow}>
                  <Clock size={12} color={Colors.textMuted} /> {data.time}
                </Text>
              </View>
            ) : null}
          </>
        }
      >
        {showShimmer ? (
          <ManagerIncidentDetailBodyShimmer />
        ) : data ? (
          <>
            <View style={[styles.detailCard, Shadows.card]}>
              <Text style={styles.sectionTitle}>Guard</Text>
              <View style={styles.detailRow}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{data.guard_name}</Text>
              </View>
              <TouchableOpacity
                style={styles.detailRow}
                onPress={() => Linking.openURL(`tel:${data.guard_phone}`)}
              >
                <Phone size={14} color={Colors.accent} />
                <Text style={[styles.detailText, { color: Colors.accent }]}>
                  {data.guard_phone}
                </Text>
              </TouchableOpacity>
              <View style={styles.detailRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{data.site_name}</Text>
              </View>
            </View>

            {(data.injury_type || data.injury_detail) ? (
              <View style={[styles.detailCard, Shadows.card]}>
                <Text style={styles.sectionTitle}>Details</Text>
                {data.injury_type ? (
                  <Text style={styles.detailText}>{data.injury_type}</Text>
                ) : null}
                {data.injury_detail ? (
                  <Text style={styles.detailSub}>{data.injury_detail}</Text>
                ) : null}
              </View>
            ) : null}

            {(data.photos ?? []).length > 0 ? (
              <View style={styles.photoSection}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <View style={styles.photoGrid}>
                  {data.photos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                      <Text style={styles.photoTs}>{photo.timestamp}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {data.signature ? (
              <View style={[styles.detailCard, Shadows.card]}>
                <Text style={styles.sectionTitle}>Signature</Text>
                <Image
                  source={{ uri: data.signature }}
                  style={styles.signature}
                  resizeMode="contain"
                />
              </View>
            ) : null}

            <Text style={styles.createdAt}>Reported {data.created_at}</Text>
          </>
        ) : null}
      </ManagerStackListLayout>
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  severityText: { fontSize: 9, fontWeight: '800' },
  timeRow: { fontSize: FontSizes.xs, color: Colors.textMuted },
  detailCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailText: { fontSize: 12, color: Colors.textPrimary },
  detailSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  photoSection: { marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photoItem: {
    width: '31%',
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photo: { width: '100%', height: '100%' },
  photoTs: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    fontSize: 7,
    color: Colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  signature: { width: '100%', height: 100 },
  createdAt: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
});
