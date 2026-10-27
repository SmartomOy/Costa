// ─────────────────────────────────────────────────────────────────────────────
// Trimmaamo Costa – kaikki sivuston tiedot yhdessä paikassa.
// Rivit, joissa on merkintä  // PAIKKATIETO  ovat esimerkkejä: vaihda oikeat tiedot.
// ─────────────────────────────────────────────────────────────────────────────

import type { ImageMetadata } from 'astro';

export const site = {
  name: 'Trimmaamo Costa',
  tagline: 'Hellävarainen koiratrimmaamo',
  description:
    'Trimmaamo Costa on rauhallinen ja yksilöllinen koiratrimmaamo. Pesut, trimmaukset, nyppimiset, kynsienleikkuut ja pentukäynnit – koirasi ehdoilla.',

  city: 'Paikkakunta', // PAIKKATIETO
  address: {
    street: 'Esimerkkikatu 1', // PAIKKATIETO
    postalCode: '00100', // PAIKKATIETO
    city: 'Paikkakunta', // PAIKKATIETO
  },

  phone: '+358401234567', // PAIKKATIETO (tel:-linkkiin, kansainvälinen muoto)
  phoneDisplay: '040 123 4567', // PAIKKATIETO
  email: 'info@trimmaamocosta.fi', // PAIKKATIETO

  // Avajaispäivä ISO-muodossa. Laskuri vaihtuu automaattisesti "Olemme auki" -tilaan.
  openingDate: '2026-12-01T10:00:00+02:00', // PAIKKATIETO

  hours: [
    { days: 'Maanantai – perjantai', time: '9.00 – 17.00' }, // PAIKKATIETO
    { days: 'Lauantai', time: 'Sopimuksen mukaan' }, // PAIKKATIETO
    { days: 'Sunnuntai', time: 'Suljettu' }, // PAIKKATIETO
  ],
  bookingNote:
    'Ajanvaraus puhelimitse tai sähköpostilla. Jos en pääse vastaamaan, soitan takaisin – voit myös laittaa tekstiviestin.',

  socials: [
    { label: 'Instagram', url: 'https://www.instagram.com/' }, // PAIKKATIETO
    { label: 'Facebook', url: 'https://www.facebook.com/' }, // PAIKKATIETO
  ],

  owner: 'Nimi Sukunimi', // PAIKKATIETO
  ownerFirstName: 'Nimi', // PAIKKATIETO
  businessId: '1234567-8', // PAIKKATIETO (Y-tunnus)
};

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.street}, ${site.address.postalCode} ${site.address.city}`,
)}`;

export const nav = [
  { label: 'Palvelut', href: '#palvelut' },
  { label: 'Hinnasto', href: '#hinnasto' },
  { label: 'Meistä', href: '#meista' },
  { label: 'Galleria', href: '#galleria' },
  { label: 'Yhteystiedot', href: '#yhteys' },
];

export type ServiceIcon = 'bath' | 'clipper' | 'scissors' | 'hand' | 'paw' | 'heart';

export const services: { title: string; text: string; duration: string; icon: ServiceIcon }[] = [
  {
    title: 'Pesu & föönaus',
    text: 'Hellävarainen pesu turkille sopivilla tuotteilla, huolellinen kuivaus ja harjaus. Pehmeä ja raikas lopputulos.',
    duration: 'n. 1–2 h',
    icon: 'bath',
  },
  {
    title: 'Trimmaus',
    text: 'Turkin muotoilu rodunomaisesti tai toiveidesi mukaan – siisti, kaunis ja arjessa helppohoitoinen.',
    duration: 'n. 2–3 h',
    icon: 'clipper',
  },
  {
    title: 'Saksitrimmaus',
    text: 'Viimeistelty, pehmeä ilme saksilla muotoillen. Sopii esimerkiksi villakoirille, bichoneille ja sekaroduille.',
    duration: 'n. 2–4 h',
    icon: 'scissors',
  },
  {
    title: 'Nyppiminen',
    text: 'Karkeakarvaisille roduille: kuollut karva poistetaan käsin, jolloin turkin rakenne ja väri säilyvät.',
    duration: 'n. 1,5–3 h',
    icon: 'hand',
  },
  {
    title: 'Kynnet & tassut',
    text: 'Kynsien leikkuu ja tassunpohjien siistiminen. Nopea käynti – myös erillisenä pikakäyntinä.',
    duration: 'n. 15–30 min',
    icon: 'paw',
  },
  {
    title: 'Pentukäynti',
    text: 'Rauhallinen tutustuminen trimmaamoon: leikkiä, harjausta ja palkkioita. Paras alku koko elämän turkinhoidolle.',
    duration: 'n. 45 min',
    icon: 'heart',
  },
];

// Hinnat koiran koon mukaan (€, sis. alv). Kaikki hinnat ovat esimerkkejä.  // PAIKKATIETO
export const sizes = [
  { id: 'pieni', label: 'Pieni', hint: 'alle 10 kg' },
  { id: 'keski', label: 'Keskikokoinen', hint: '10–25 kg' },
  { id: 'iso', label: 'Iso', hint: 'yli 25 kg' },
] as const;

export type SizeId = (typeof sizes)[number]['id'];

export const prices: { name: string; note?: string; from?: boolean; price: Record<SizeId, number> }[] = [
  { name: 'Pesu & föönaus', from: true, price: { pieni: 45, keski: 60, iso: 80 } },
  { name: 'Trimmaus', note: 'sis. pesun ja kynnet', from: true, price: { pieni: 65, keski: 85, iso: 110 } },
  { name: 'Saksitrimmaus', note: 'sis. pesun ja kynnet', from: true, price: { pieni: 80, keski: 100, iso: 130 } },
  { name: 'Nyppiminen', note: 'karkeakarvaiset rodut', from: true, price: { pieni: 70, keski: 90, iso: 120 } },
  { name: 'Kynsien leikkuu', price: { pieni: 15, keski: 15, iso: 20 } },
  { name: 'Pentukäynti', note: 'alle 6 kk', price: { pieni: 30, keski: 35, iso: 40 } },
];

export const extras = [
  { name: 'Tassujen siistiminen', price: 10 }, // PAIKKATIETO
  { name: 'Korvien puhdistus', price: 8 }, // PAIKKATIETO
  { name: 'Hampaiden pesu', price: 10 }, // PAIKKATIETO
  { name: 'Takkujen poisto', price: 15, unit: '/ 15 min' }, // PAIKKATIETO
];

export const priceNote =
  'Hinnat sisältävät arvonlisäveron. Lopullinen hinta määräytyy koiran koon, turkin kunnon ja käytetyn ajan mukaan – kerron hinnan aina etukäteen.';

// Meistä-osion teksti  // PAIKKATIETO – kirjoita oma esittely
export const about = [
  `Hei, olen ${site.ownerFirstName}! Trimmaamo Costa syntyi rakkaudesta koiriin ja halusta tarjota turkinhoitoa, jossa koira saa olla rauhassa oma itsensä.`,
  'Olen koulutettu koiratrimmari, ja jokainen käynti suunnitellaan koiran luonteen, turkin ja omistajan toiveiden mukaan. Kiirettä ei ole – hyvä kokemus on yhtä tärkeä kuin kaunis lopputulos.',
];

export const stats = [
  { value: 1, suffix: '', label: 'koira kerrallaan' },
  { value: 0, suffix: '', label: 'kiirettä' },
  { value: 100, suffix: ' %', label: 'sydämellä' },
];

export const values = [
  { title: 'Rauhallisuus', text: 'Vain yksi koira kerrallaan, ilman kiirettä ja häiriöitä.' },
  { title: 'Yksilöllisyys', text: 'Jokainen hoito suunnitellaan koiran luonteen ja turkin mukaan.' },
  { title: 'Laatu', text: 'Koiralle turvalliset, laadukkaat tuotteet ja huolellinen viimeistely.' },
];

export const steps = [
  { title: 'Varaa aika', text: 'Soita tai lähetä viesti – sovitaan sopiva aika ja käydään toiveet läpi.' },
  { title: 'Tutustuminen', text: 'Koira saa rauhassa tutustua paikkaan. Katsotaan yhdessä turkin kunto ja tavoite.' },
  { title: 'Hoito', text: 'Työskentelen koiran tahdissa ja pidän tarvittaessa taukoja. Hyvä mieli on tärkein.' },
  { title: 'Nouto', text: 'Saat raikkaan koiran takaisin sekä vinkit turkin hoitoon kotona.' },
];

// Galleriakuvat: lisää kuva src/assets/gallery/ -kansioon ja tuo se tähän, esim.
//   import bella from '../assets/gallery/bella.jpg';
//   { label: 'Saksitrimmaus', image: bella, alt: 'Juuri trimmattu villakoira' }
// Ilman kuvaa näytetään tyylitelty paikkakuva.

export const gallery: { label: string; image?: ImageMetadata; alt?: string }[] = [
  { label: 'Pesu & föönaus' },
  { label: 'Saksitrimmaus' },
  { label: 'Nyppiminen' },
  { label: 'Pentukäynti' },
  { label: 'Trimmaus' },
  { label: 'Kynnet & tassut' },
];

// Ennen/jälkeen-vertailu. Lisää kaksi samasta kulmasta otettua kuvaa.
export const beforeAfter: { before?: ImageMetadata; after?: ImageMetadata; alt: string } = {
  alt: 'Koira ennen ja jälkeen trimmauksen',
};
