export type BusinessContactSource = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  instagram_url?: string | null;
} | null | undefined;

export type VerifiedBusinessContact = {
  name: string;
  address: string | null;
  phone: string | null;
  instagramUrl: string | null;
};

export function getVerifiedBusinessContact(item: BusinessContactSource): VerifiedBusinessContact;
