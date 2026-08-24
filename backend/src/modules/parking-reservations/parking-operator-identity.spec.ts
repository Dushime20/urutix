import {
  operatorIdentityForCountry,
  validateOperatorIdentity,
} from './parking-operator-identity';

describe('parking operator identity', () => {
  it('keeps US FMCSA fields for United States companies', () => {
    const profile = operatorIdentityForCountry('US');
    expect(profile.primary.label).toBe('MC Number');
    expect(profile.secondary?.label).toBe('USDOT Number');
    expect(profile.secondary?.required).toBe(true);
    expect(validateOperatorIdentity('US', 'MC123456', '1234567')).toBeNull();
    expect(validateOperatorIdentity('US', 'AB', '1234567')).toMatch(/MC Number/);
  });

  it('shows EU community licence fields and allows a missing optional VAT number', () => {
    const profile = operatorIdentityForCountry('DE');
    expect(profile.primary.label).toMatch(/Community/);
    expect(profile.secondary?.required).toBe(false);
    expect(validateOperatorIdentity('DE', 'D/1234567/0', '')).toBeNull();
  });

  it('uses RURA licence fields for Rwanda', () => {
    const profile = operatorIdentityForCountry('rw');
    expect(profile.primary.label).toMatch(/RURA/);
    expect(validateOperatorIdentity('RW', 'RURA-12345')).toBeNull();
  });

  it('requires a country before accepting operator IDs', () => {
    expect(validateOperatorIdentity('', 'ABC123')).toMatch(/country/i);
  });
});
