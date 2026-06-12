import { Platform } from 'react-native';

type NfcModule = typeof import('react-native-nfc-manager');
type NfcTechType = NfcModule['NfcTech'];
type NfcTechValue = NfcTechType[keyof NfcTechType];

export type NfcTagInfo = {
  uid: string;
  techTypes: string[];
  type?: string;
};

export class NfcUnsupportedError extends Error {
  constructor(message?: string) {
    super(
      message ??
        'This device does not have NFC hardware. Use an NFC-capable phone to scan checkpoint tags.',
    );
    this.name = 'NfcUnsupportedError';
  }
}

export class NfcDisabledError extends Error {
  constructor(message?: string) {
    super(
      message ?? 'NFC is turned off. Enable NFC in your phone settings, then try again.',
    );
    this.name = 'NfcDisabledError';
  }
}

let nfcModulePromise: Promise<NfcModule | null> | null = null;
let nfcStarted = false;

async function loadNfcModule(): Promise<NfcModule | null> {
  if (!nfcModulePromise) {
    nfcModulePromise = import('react-native-nfc-manager')
      .then(mod => mod)
      .catch(() => null);
  }
  return nfcModulePromise;
}

export async function initNfc(): Promise<void> {
  const mod = await loadNfcModule();
  if (!mod || nfcStarted) return;
  try {
    await mod.default.start();
    nfcStarted = true;
  } catch {
    // Retry on first scan
  }
}

export function formatNfcUid(id: string | number[] | Uint8Array): string {
  if (Array.isArray(id) || id instanceof Uint8Array) {
    return Array.from(id)
      .map(b => b.toString(16).padStart(2, '0').toUpperCase())
      .join(':');
  }

  const raw = String(id).trim().toUpperCase();
  if (raw.includes(':')) return raw;

  const hex = raw.replace(/[^A-F0-9]/g, '');
  if (!hex) return raw;

  const pairs = hex.match(/.{1,2}/g) ?? [];
  return pairs.join(':');
}

export function getNfcUidVariants(uid: string): string[] {
  const formatted = formatNfcUid(uid);
  const parts = formatted.split(':').filter(Boolean);
  const reversed = [...parts].reverse().join(':');
  const plain = parts.join('');
  const candidates = [
    uid.trim(),
    formatted,
    formatted.toLowerCase(),
    reversed,
    reversed.toLowerCase(),
    plain,
    plain.toLowerCase(),
  ];
  return [...new Set(candidates.filter(Boolean))];
}

export type NfcCapability =
  | 'ready'
  | 'disabled'
  | 'unsupported'
  | 'unavailable';

function isNoHardwareMessage(message: string): boolean {
  return /no nfc support|not.*support.*nfc|nfc.*not.*support/i.test(message);
}

export async function getNfcCapability(): Promise<{
  capability: NfcCapability;
  message?: string;
}> {
  const mod = await loadNfcModule();
  if (!mod) {
    return {
      capability: 'unavailable',
      message: 'NFC module is not available. Rebuild the app.',
    };
  }

  const NfcManager = mod.default;

  let supported = false;
  try {
    supported = await NfcManager.isSupported();
  } catch {
    supported = false;
  }

  if (!supported) {
    return {
      capability: 'unsupported',
      message:
        'This device does not have NFC hardware. Use an NFC-capable phone to scan checkpoint tags.',
    };
  }

  try {
    await NfcManager.start();
    nfcStarted = true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (isNoHardwareMessage(message)) {
      return {
        capability: 'unsupported',
        message:
          'This device does not have NFC hardware. Use an NFC-capable phone to scan checkpoint tags.',
      };
    }
    return {
      capability: 'unavailable',
      message: 'Could not initialize NFC. Enable NFC in settings.',
    };
  }

  if (Platform.OS === 'android') {
    let enabled = false;
    try {
      enabled = await NfcManager.isEnabled();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      if (isNoHardwareMessage(message)) {
        return {
          capability: 'unsupported',
          message:
            'This device does not have NFC hardware. Use an NFC-capable phone to scan checkpoint tags.',
        };
      }
      enabled = false;
    }

    if (!enabled) {
      return {
        capability: 'disabled',
        message: 'NFC is turned off. Enable it in your phone settings.',
      };
    }
  }

  return { capability: 'ready' };
}

export async function openNfcSettings(): Promise<void> {
  const mod = await loadNfcModule();
  if (!mod) return;
  try {
    await mod.default.goToNfcSetting();
  } catch {
    // no-op
  }
}

async function ensureNfcStarted(mod: NfcModule): Promise<void> {
  if (!nfcStarted) {
    await mod.default.start();
    nfcStarted = true;
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function shortTechName(tech: unknown): string {
  const raw = String(tech ?? '');
  return raw.split('.').pop() ?? raw;
}

function buildTagInfo(tag: {
  id?: unknown;
  techTypes?: unknown;
  type?: unknown;
}): NfcTagInfo {
  const uid = formatNfcUid(tag.id as string | number[] | Uint8Array);
  const techTypes = Array.isArray(tag.techTypes)
    ? [...new Set(tag.techTypes.map(shortTechName).filter(Boolean))]
    : [];

  return {
    uid,
    techTypes,
    type: tag.type ? String(tag.type) : undefined,
  };
}

function getPlatformTechLists(mod: NfcModule): NfcTechValue[][] {
  const { NfcTech } = mod;
  if (Platform.OS === 'ios') {
    return [
      [
        NfcTech.MifareIOS,
        NfcTech.Iso15693IOS,
        NfcTech.FelicaIOS,
        NfcTech.IsoDep,
      ],
      [NfcTech.Ndef],
    ];
  }
  return [
    [
      NfcTech.NfcA,
      NfcTech.NfcB,
      NfcTech.NfcF,
      NfcTech.NfcV,
      NfcTech.IsoDep,
      NfcTech.MifareClassic,
      NfcTech.MifareUltralight,
      NfcTech.Ndef,
    ],
  ];
}

async function readTagWithTechs(
  mod: NfcModule,
  techs: NfcTechValue[],
  timeoutMs: number,
): Promise<NfcTagInfo> {
  const NfcManager = mod.default;

  try {
    const request = NfcManager.requestTechnology(techs, {
      alertMessage: 'Hold your phone near the NFC tag',
    });

    if (Platform.OS === 'ios') {
      await request;
    } else {
      await withTimeout(
        request,
        timeoutMs,
        'NFC scan timed out. Hold the phone closer to the tag and try again.',
      );
    }

    const tag = await NfcManager.getTag();
    if (!tag?.id) {
      throw new Error('Could not read NFC tag ID. Try again.');
    }

    if (Platform.OS === 'ios') {
      try {
        await NfcManager.setAlertMessageIOS('NFC tag detected');
      } catch {
        // no-op
      }
    }

    return buildTagInfo(tag);
  } finally {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch {
      // no-op
    }
  }
}

async function readTagViaTagEvent(
  mod: NfcModule,
  timeoutMs: number,
): Promise<NfcTagInfo> {
  const NfcManager = mod.default;
  const { NfcEvents, NfcAdapter } = mod;

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      handler();
    };

    const cleanup = async () => {
      try {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        await NfcManager.unregisterTagEvent();
      } catch {
        // no-op
      }
    };

    const timer = setTimeout(() => {
      finish(() => {
        cleanup();
        reject(
          new Error(
            'NFC scan timed out. Hold the phone closer to the tag and try again.',
          ),
        );
      });
    }, timeoutMs);

    NfcManager.setEventListener(
      NfcEvents.DiscoverTag,
      (tag: { id?: unknown }) => {
        if (!tag?.id) return;
        finish(() => {
          clearTimeout(timer);
          cleanup();
          resolve(buildTagInfo(tag));
        });
      },
    );

    const registerOptions =
      Platform.OS === 'android' && NfcAdapter
        ? {
            invalidateAfterFirstRead: false,
            isReaderModeEnabled: true,
            readerModeFlags:
              NfcAdapter.FLAG_READER_NFC_A |
              NfcAdapter.FLAG_READER_NFC_B |
              NfcAdapter.FLAG_READER_NFC_F |
              NfcAdapter.FLAG_READER_NFC_V |
              NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
          }
        : { invalidateAfterFirstRead: false };

    NfcManager.registerTagEvent(registerOptions).catch((error: unknown) => {
      finish(() => {
        clearTimeout(timer);
        cleanup();
        reject(
          error instanceof Error
            ? error
            : new Error('Could not start NFC listener.'),
        );
      });
    });
  });
}

export function isNfcUserCancelledError(message: string): boolean {
  return /cancel|invalidated by user|session invalidated/i.test(message);
}

export async function readNfcTag(): Promise<NfcTagInfo> {
  const mod = await loadNfcModule();
  if (!mod) {
    throw new Error(
      'NFC module is not available. Rebuild the app and try again.',
    );
  }

  const capability = await getNfcCapability();
  if (capability.capability === 'unsupported') {
    throw new NfcUnsupportedError(capability.message);
  }
  if (capability.capability === 'disabled') {
    throw new NfcDisabledError(capability.message);
  }
  if (capability.capability !== 'ready') {
    throw new Error(capability.message ?? 'NFC is not available.');
  }

  await ensureNfcStarted(mod);
  const NfcManager = mod.default;
  const errors: Error[] = [];

  if (Platform.OS === 'android') {
    try {
      return await readTagViaTagEvent(mod, 45000);
    } catch (error: unknown) {
      errors.push(
        error instanceof Error ? error : new Error('Tag event read failed'),
      );
    } finally {
      try {
        await NfcManager.unregisterTagEvent();
      } catch {
        // no-op
      }
    }
  }

  for (const techs of getPlatformTechLists(mod)) {
    try {
      return await readTagWithTechs(mod, techs, 45000);
    } catch (error: unknown) {
      const err =
        error instanceof Error ? error : new Error('NFC read failed');
      errors.push(err);
      if (Platform.OS === 'ios' && isNfcUserCancelledError(err.message)) {
        throw err;
      }
    }
  }

  if (Platform.OS === 'android') {
    for (const techs of getPlatformTechLists(mod)) {
      try {
        return await readTagWithTechs(mod, techs, 45000);
      } catch (error: unknown) {
        errors.push(
          error instanceof Error ? error : new Error('Technology read failed'),
        );
      }
    }
  }

  const lastError = errors[errors.length - 1];
  throw (
    lastError ??
    new Error(
      'Could not read NFC tag. Hold the phone on the tag and try again.',
    )
  );
}

/** @deprecated Use readNfcTag() for tag info + confirm flow */
export async function readNfcUid(): Promise<string> {
  const tag = await readNfcTag();
  return tag.uid;
}

export async function stopNfc(): Promise<void> {
  const mod = await loadNfcModule();
  if (!mod) return;
  const NfcManager = mod.default;
  try {
    NfcManager.setEventListener(mod.NfcEvents.DiscoverTag, null);
    await NfcManager.unregisterTagEvent();
  } catch {
    // no-op
  }
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // no-op
  }
}
