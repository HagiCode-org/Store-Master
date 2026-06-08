import type { MsStoreFieldDefinition } from '../../shared/ms-store-data';

export type MsStoreInventoryGroupId =
  | 'listingMetadata'
  | 'legalAndPolicy'
  | 'storeArtwork'
  | 'features'
  | 'requirements'
  | 'searchAndDiscovery'
  | 'desktopScreenshots'
  | 'mobileScreenshots'
  | 'xboxScreenshots'
  | 'holographicScreenshots'
  | 'surfaceHubScreenshots'
  | 'trailers'
  | 'other';

export interface MsStoreInventoryGroupDefinition {
  id: MsStoreInventoryGroupId;
  fields: MsStoreFieldDefinition[];
}

const orderedGroupIds: readonly MsStoreInventoryGroupId[] = [
  'listingMetadata',
  'legalAndPolicy',
  'storeArtwork',
  'features',
  'requirements',
  'searchAndDiscovery',
  'desktopScreenshots',
  'mobileScreenshots',
  'xboxScreenshots',
  'holographicScreenshots',
  'surfaceHubScreenshots',
  'trailers',
  'other',
];

export function getMsStoreInventoryGroupId(fieldDefinition: MsStoreFieldDefinition): MsStoreInventoryGroupId {
  const field = fieldDefinition.field;

  if (/^DesktopScreenshot(Caption)?\d+$/i.test(field)) {
    return 'desktopScreenshots';
  }

  if (/^MobileScreenshot(Caption)?\d+$/i.test(field)) {
    return 'mobileScreenshots';
  }

  if (/^XboxScreenshot(Caption)?\d+$/i.test(field)) {
    return 'xboxScreenshots';
  }

  if (/^HolographicScreenshot(Caption)?\d+$/i.test(field)) {
    return 'holographicScreenshots';
  }

  if (/^SurfaceHubScreenshot(Caption)?\d+$/i.test(field)) {
    return 'surfaceHubScreenshots';
  }

  if (/^Feature\d+$/i.test(field)) {
    return 'features';
  }

  if (/^(Minimum|Recommended)HardwareReq\d+$/i.test(field)) {
    return 'requirements';
  }

  if (/^SearchTerm\d+$/i.test(field)) {
    return 'searchAndDiscovery';
  }

  if (/^Trailer(ToPlayAtTopOfListing|\d+|Title\d+|Thumbnail\d+|ClosedCaption\d+|AudioDescription\d+)$/i.test(field)) {
    return 'trailers';
  }

  if (/^(StoreLogo|OverrideLogosForWin10|StoreLogoOverride|PromoImage|XboxBrandedKeyArt|XboxTitledHero|XboxFeaturedPromo|OptionalPromo)/i.test(field)) {
    return 'storeArtwork';
  }

  if (/^(ReleaseNotes|DevStudio|SortTitle|VoiceTitle)$/i.test(field)) {
    return 'listingMetadata';
  }

  if (/^(CopyrightTrademarkInformation|AdditionalLicenseTerms)$/i.test(field)) {
    return 'legalAndPolicy';
  }

  return 'other';
}

export function groupMsStoreInventoryFields(fields: readonly MsStoreFieldDefinition[]): MsStoreInventoryGroupDefinition[] {
  const groups = new Map<MsStoreInventoryGroupId, MsStoreFieldDefinition[]>(
    orderedGroupIds.map((groupId) => [groupId, []]),
  );

  for (const fieldDefinition of fields) {
    groups.get(getMsStoreInventoryGroupId(fieldDefinition))?.push(fieldDefinition);
  }

  return orderedGroupIds
    .map((groupId) => ({
      id: groupId,
      fields: groups.get(groupId) ?? [],
    }))
    .filter((group) => group.fields.length > 0);
}
