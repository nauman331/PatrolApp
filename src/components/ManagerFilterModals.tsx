import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Radii } from '../theme';
import { Search, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FilterItem {
  id: number;
  name: string;
}

interface SearchableFilterModalProps {
  visible: boolean;
  title: string;
  data: FilterItem[];
  selectedIds: number[];
  onClose: () => void;
  onApply: (ids: number[]) => void;
  onClear: () => void;
}

export function ManagerSearchableFilterModal({
  visible,
  title,
  data,
  selectedIds,
  onClose,
  onApply,
  onClear,
}: SearchableFilterModalProps) {
  const [search, setSearch] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedIds);
      setSearch('');
    }
  }, [visible, selectedIds]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(item => item.name.toLowerCase().includes(s));
  }, [data, search]);

  const toggleId = (id: number) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.overlay}
      >
        <View style={[modalStyles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title} Filter</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView
            style={modalStyles.content}
            contentContainerStyle={modalStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={modalStyles.chipRow}>
              {filteredData.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    modalStyles.chip,
                    tempSelectedIds.includes(item.id) && modalStyles.chipActive,
                  ]}
                  onPress={() => toggleId(item.id)}
                >
                  <Text
                    style={[
                      modalStyles.chipText,
                      tempSelectedIds.includes(item.id) && modalStyles.chipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {tempSelectedIds.includes(item.id) && (
                    <Check size={12} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
              {filteredData.length === 0 && (
                <Text style={modalStyles.emptyText}>No results found.</Text>
              )}
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.resetBtn} onPress={onClear}>
              <Text style={modalStyles.resetBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.applyBtn}
              onPress={() => onApply(tempSelectedIds)}
            >
              <Text style={modalStyles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface MultiFilterModalProps {
  visible: boolean;
  guards: FilterItem[];
  sites: FilterItem[];
  selectedGuardIds: number[];
  selectedSiteIds: number[];
  onClose: () => void;
  onApply: (guardIds: number[], siteIds: number[]) => void;
  onClear: () => void;
}

export function ManagerMultiFilterModal({
  visible,
  guards,
  sites,
  selectedGuardIds,
  selectedSiteIds,
  onClose,
  onApply,
  onClear,
}: MultiFilterModalProps) {
  const [search, setSearch] = useState('');
  const [tempGuardIds, setTempGuardIds] = useState<number[]>(selectedGuardIds);
  const [tempSiteIds, setTempSiteIds] = useState<number[]>(selectedSiteIds);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setTempGuardIds(selectedGuardIds);
      setTempSiteIds(selectedSiteIds);
      setSearch('');
    }
  }, [visible, selectedGuardIds, selectedSiteIds]);

  const filteredGuards = useMemo(() => {
    if (!search) return guards;
    const s = search.toLowerCase();
    return guards.filter(g => g.name.toLowerCase().includes(s));
  }, [guards, search]);

  const filteredSites = useMemo(() => {
    if (!search) return sites;
    const s = search.toLowerCase();
    return sites.filter(s_item => s_item.name.toLowerCase().includes(s));
  }, [sites, search]);

  const toggleGuard = (id: number) => {
    setTempGuardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const toggleSite = (id: number) => {
    setTempSiteIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalStyles.overlay}
      >
        <View style={[modalStyles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Search guards or sites..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView
            style={modalStyles.content}
            contentContainerStyle={modalStyles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredGuards.length > 0 && (
              <>
                <Text style={modalStyles.sectionTitle}>Guards</Text>
                <View style={modalStyles.chipRow}>
                  {filteredGuards.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        modalStyles.chip,
                        tempGuardIds.includes(g.id) && modalStyles.chipActive,
                      ]}
                      onPress={() => toggleGuard(g.id)}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          tempGuardIds.includes(g.id) && modalStyles.chipTextActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                      {tempGuardIds.includes(g.id) && (
                        <Check size={12} color={Colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filteredSites.length > 0 && (
              <>
                <Text
                  style={[
                    modalStyles.sectionTitle,
                    { marginTop: filteredGuards.length > 0 ? 24 : 0 },
                  ]}
                >
                  Sites
                </Text>
                <View style={modalStyles.chipRow}>
                  {filteredSites.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        modalStyles.chip,
                        tempSiteIds.includes(s.id) && modalStyles.chipActive,
                      ]}
                      onPress={() => toggleSite(s.id)}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          tempSiteIds.includes(s.id) && modalStyles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                      {tempSiteIds.includes(s.id) && (
                        <Check size={12} color={Colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filteredGuards.length === 0 && filteredSites.length === 0 && (
              <Text style={modalStyles.emptyText}>No results found.</Text>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.resetBtn} onPress={onClear}>
              <Text style={modalStyles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.applyBtn}
              onPress={() => onApply(tempGuardIds, tempSiteIds)}
            >
              <Text style={modalStyles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '85%', // Slightly more room
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: Radii.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    padding: 0,
  },
  content: {
    flexGrow: 1,
    maxHeight: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40, // Ensure items aren't cut off
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  chipText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: Colors.accent, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  applyBtnText: { color: Colors.white, fontWeight: '700' },
});
