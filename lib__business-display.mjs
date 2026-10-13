const INSTAGRAM_URL = /^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/i;

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * The caller must supply the published business record returned by getBusinessSettings.
 * Empty/missing details stay absent; this helper deliberately does not invent contact data.
 */
export function getVerifiedBusinessContact(item) {
  const instagramCandidate = nonEmptyString(item?.instagram_url);
  return {
    name: nonEmptyString(item?.name) || 'Royalty Barber Studio',
    address: nonEmptyString(item?.address),
    phone: nonEmptyString(item?.phone),
    instagramUrl: instagramCandidate && INSTAGRAM_URL.test(instagramCandidate)
      ? instagramCandidate
      : null,
  };
}
