import { describe, expect, it } from 'vitest';
import type { MsStoreFieldDefinition } from '../../shared/ms-store-data';
import { getMsStoreInventoryGroupId, groupMsStoreInventoryFields } from './msStoreFieldGroups';

function createField(field: string, id: string, type = 'Text'): MsStoreFieldDefinition {
  return {
    field,
    id,
    type,
    storageKind: type === 'Text' ? 'markdown' : 'inline',
  };
}

describe('msStoreFieldGroups', () => {
  it('maps common field families into stable editor groups', () => {
    expect(getMsStoreInventoryGroupId(createField('ReleaseNotes', '3'))).toBe('listingMetadata');
    expect(getMsStoreInventoryGroupId(createField('AdditionalLicenseTerms', '13'))).toBe('legalAndPolicy');
    expect(getMsStoreInventoryGroupId(createField('StoreLogo720x1080', '600', 'Relative path'))).toBe('storeArtwork');
    expect(getMsStoreInventoryGroupId(createField('Feature7', '706'))).toBe('features');
    expect(getMsStoreInventoryGroupId(createField('MinimumHardwareReq2', '801'))).toBe('requirements');
    expect(getMsStoreInventoryGroupId(createField('SearchTerm3', '902'))).toBe('searchAndDiscovery');
    expect(getMsStoreInventoryGroupId(createField('DesktopScreenshotCaption4', '153'))).toBe('desktopScreenshots');
    expect(getMsStoreInventoryGroupId(createField('MobileScreenshot2', '201', 'Relative path'))).toBe('mobileScreenshots');
    expect(getMsStoreInventoryGroupId(createField('XboxScreenshot1', '300', 'Relative path'))).toBe('xboxScreenshots');
    expect(getMsStoreInventoryGroupId(createField('HolographicScreenshot5', '404', 'Relative path'))).toBe('holographicScreenshots');
    expect(getMsStoreInventoryGroupId(createField('SurfaceHubScreenshotCaption15', '564'))).toBe('surfaceHubScreenshots');
    expect(getMsStoreInventoryGroupId(createField('TrailerThumbnail2', '1041', 'Relative path'))).toBe('trailers');
  });

  it('preserves editor group order and excludes empty groups', () => {
    const groups = groupMsStoreInventoryFields([
      createField('Trailer1', '1000', 'Relative path'),
      createField('ReleaseNotes', '3'),
      createField('Feature1', '700'),
    ]);

    expect(groups.map((group) => group.id)).toEqual([
      'listingMetadata',
      'features',
      'trailers',
    ]);
  });
});
