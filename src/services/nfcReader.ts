import { Platform } from 'react-native';

type NfcModule = typeof import('react-native-nfc-manager');
type NfcTechType = NfcModule['NfcTech'];

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
  try {
    await NfcManager.start();
    nfcStarted = true;

    let supported = true;
    try {
      supported = await NfcManager.isSupported();
    } catch {
      supported = true;
    }

    let enabled = true;
    try {
      enabled = await NfcManager.isEnabled();
    } catch {
      enabled = true;
    }

    if (!enabled) {
      return {
        capability: 'disabled',
        message: 'NFC is turned off. Enable it in your phone settings.',
      };
    }

    if (!supported) {
      return {
        capability: 'unsupported',
        message:
          'NFC may be restricted on this device. Enable NFC in settings and try again.',
      };
    }

    return { capability: 'ready' };
  } catch {
    return {
      capability: 'unavailable',
      message: 'Could not initialize NFC. Enable NFC in settings.',
    };
  }
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

async function readTagWithTech(
  mod: NfcModule,
  tech: NfcTechType[keyof NfcTechType],
) {
  const NfcManager = mod.default;

  if (Platform.OS === 'android') {
    await NfcManager.requestTechnology(tech, {
      alertMessage: 'Hold your phone near the NFC tag',
    });
  } else {
    await NfcManager.requestTechnology(tech);
  }

  const tag = await NfcManager.getTag();
  if (!tag?.id) {
    throw new Error('Could not read NFC tag ID.');
  }

  return formatNfcUid(tag.id);
}

async function readNfcUidViaTechnologies(mod: NfcModule): Promise<string> {
  const NfcManager = mod.default;
  const { NfcTech } = mod;
  const techs = [
    NfcTech.NfcA,
    NfcTech.Ndef,
    NfcTech.MifareClassic,
    NfcTech.NfcB,
    NfcTech.NfcF,
    NfcTech.IsoDep,
    NfcTech.NdefFormatable,
  ];

  let lastError: Error | null = null;

  for (const tech of techs) {
    try {
      const uid = await withTimeout(
        readTagWithTech(mod, tech),
        35000,
        'NFC scan timed out. Hold the phone closer to the tag and try again.',
      );
      return uid;
    } catch (error: unknown) {
      lastError =
        error instanceof Error
          ? error
          : new Error(
              error &&
              typeof error === 'object' &&
              'message' in error &&
              typeof (error as { message?: unknown }).message === 'string'
                ? (error as { message: string }).message
                : 'NFC read failed',
            );
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {
        // no-op
      }
    }
  }

  throw lastError ?? new Error('Could not read NFC tag. Try again.');
}

async function readNfcUidViaTagEvent(
  mod: NfcModule,
  timeoutMs: number,
): Promise<string> {
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
          resolve(formatNfcUid(tag.id as string | number[] | Uint8Array));
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

export async function readNfcUid(): Promise<string> {
  const mod = await loadNfcModule();
  if (!mod) {
    throw new Error(
      'NFC module is not available. Rebuild the app with npm run android.',
    );
  }

  await ensureNfcStarted(mod);
  const NfcManager = mod.default;

  const errors: Error[] = [];

  if (Platform.OS === 'android') {
    try {
      return await readNfcUidViaTechnologies(mod);
    } catch (error: unknown) {
      errors.push(
        error instanceof Error ? error : new Error('Technology read failed'),
      );
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {
        // no-op
      }
    }

    try {
      return await readNfcUidViaTagEvent(mod, 45000);
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
  } else {
    try {
      return await readNfcUidViaTagEvent(mod, 45000);
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

    try {
      return await readNfcUidViaTechnologies(mod);
    } catch (error: unknown) {
      errors.push(
        error instanceof Error ? error : new Error('Technology read failed'),
      );
    }
  }

  const capability = await getNfcCapability();
  if (capability.capability === 'disabled') {
    throw new Error(
      'NFC is turned off. Enable NFC in your phone settings, then try again.',
    );
  }

  const lastError = errors[errors.length - 1];
  throw (
    lastError ??
    new Error(
      'Could not read NFC tag. Enable NFC in settings and hold the phone on the tag.',
    )
  );
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
